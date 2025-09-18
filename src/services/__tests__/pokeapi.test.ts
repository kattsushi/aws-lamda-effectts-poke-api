import { describe, it, expect } from 'vitest'
import { Effect, Layer } from 'effect'
import { HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform'
import { PokeApiService, PokeApiServiceLive, PokemonNotFoundError, ValidationError } from '../pokeapi.js'

// Mock HTTP Client para tests
const mockHttpClient = HttpClient.make((request) => {
  const url = HttpClientRequest.getUrl(request)
  
  // Mock para Pokemon válido
  if (url.includes('/pokemon/pikachu')) {
    return Effect.succeed(
      HttpClientResponse.fromWeb(
        new Response(JSON.stringify({
          id: 25,
          name: 'pikachu',
          height: 4,
          weight: 60,
          base_experience: 112,
          is_default: true,
          order: 35,
          abilities: [
            {
              is_hidden: false,
              slot: 1,
              ability: { name: 'static', url: 'https://pokeapi.co/api/v2/ability/9/' }
            }
          ],
          forms: [
            { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-form/25/' }
          ],
          game_indices: [
            {
              game_index: 84,
              version: { name: 'red', url: 'https://pokeapi.co/api/v2/version/1/' }
            }
          ],
          held_items: [],
          location_area_encounters: 'https://pokeapi.co/api/v2/pokemon/25/encounters',
          moves: [],
          species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
          sprites: {
            front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
            front_shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png',
            front_female: null,
            front_shiny_female: null,
            back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png',
            back_shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/25.png',
            back_female: null,
            back_shiny_female: null
          },
          stats: [
            {
              base_stat: 35,
              effort: 0,
              stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' }
            },
            {
              base_stat: 55,
              effort: 0,
              stat: { name: 'attack', url: 'https://pokeapi.co/api/v2/stat/2/' }
            }
          ],
          types: [
            {
              slot: 1,
              type: { name: 'electric', url: 'https://pokeapi.co/api/v2/type/13/' }
            }
          ],
          past_types: []
        }), { status: 200 })
      )
    )
  }
  
  // Mock para Pokemon no encontrado
  if (url.includes('/pokemon/notfound')) {
    return Effect.succeed(
      HttpClientResponse.fromWeb(
        new Response('Not Found', { status: 404 })
      )
    )
  }
  
  // Mock para lista de Pokemon
  if (url.includes('/pokemon?')) {
    return Effect.succeed(
      HttpClientResponse.fromWeb(
        new Response(JSON.stringify({
          count: 1302,
          next: 'https://pokeapi.co/api/v2/pokemon?offset=20&limit=20',
          previous: null,
          results: [
            { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
            { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' }
          ]
        }), { status: 200 })
      )
    )
  }
  
  return Effect.fail(new Error('Unexpected request'))
})

const TestLayer = Layer.mergeAll(
  PokeApiServiceLive,
  Layer.succeed(HttpClient.HttpClient, mockHttpClient)
)

describe('PokeApiService', () => {
  describe('getPokemon', () => {
    it('should fetch a Pokemon successfully', async () => {
      const program = Effect.gen(function* () {
        const service = yield* PokeApiService
        const pokemon = yield* service.getPokemon('pikachu')
        
        expect(pokemon.id).toBe(25)
        expect(pokemon.name).toBe('pikachu')
        expect(pokemon.types).toHaveLength(1)
        expect(pokemon.types[0].type.name).toBe('electric')
        
        return pokemon
      })
      
      const result = await Effect.runPromise(
        Effect.provide(program, TestLayer)
      )
      
      expect(result).toBeDefined()
    })
    
    it('should fail with PokemonNotFoundError for non-existent Pokemon', async () => {
      const program = Effect.gen(function* () {
        const service = yield* PokeApiService
        return yield* service.getPokemon('notfound')
      })
      
      const result = await Effect.runPromiseExit(
        Effect.provide(program, TestLayer)
      )
      
      expect(result._tag).toBe('Failure')
      if (result._tag === 'Failure') {
        expect(result.cause._tag).toBe('Fail')
        if (result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(PokemonNotFoundError)
        }
      }
    })
    
    it('should fail with ValidationError for empty name', async () => {
      const program = Effect.gen(function* () {
        const service = yield* PokeApiService
        return yield* service.getPokemon('')
      })
      
      const result = await Effect.runPromiseExit(
        Effect.provide(program, TestLayer)
      )
      
      expect(result._tag).toBe('Failure')
      if (result._tag === 'Failure') {
        expect(result.cause._tag).toBe('Fail')
        if (result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(ValidationError)
        }
      }
    })
  })
  
  describe('listPokemons', () => {
    it('should list Pokemon successfully', async () => {
      const program = Effect.gen(function* () {
        const service = yield* PokeApiService
        const list = yield* service.listPokemons(20, 0)
        
        expect(list.count).toBe(1302)
        expect(list.results).toHaveLength(2)
        expect(list.results[0].name).toBe('bulbasaur')
        expect(list.next).toBe('https://pokeapi.co/api/v2/pokemon?offset=20&limit=20')
        
        return list
      })
      
      const result = await Effect.runPromise(
        Effect.provide(program, TestLayer)
      )
      
      expect(result).toBeDefined()
    })
    
    it('should fail with ValidationError for invalid limit', async () => {
      const program = Effect.gen(function* () {
        const service = yield* PokeApiService
        return yield* service.listPokemons(101, 0) // limit > 100
      })
      
      const result = await Effect.runPromiseExit(
        Effect.provide(program, TestLayer)
      )
      
      expect(result._tag).toBe('Failure')
      if (result._tag === 'Failure') {
        expect(result.cause._tag).toBe('Fail')
        if (result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(ValidationError)
        }
      }
    })
    
    it('should fail with ValidationError for negative offset', async () => {
      const program = Effect.gen(function* () {
        const service = yield* PokeApiService
        return yield* service.listPokemons(20, -1)
      })
      
      const result = await Effect.runPromiseExit(
        Effect.provide(program, TestLayer)
      )
      
      expect(result._tag).toBe('Failure')
      if (result._tag === 'Failure') {
        expect(result.cause._tag).toBe('Fail')
        if (result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(ValidationError)
        }
      }
    })
  })
})
