import { describe, it, expect } from 'vitest'
import { Effect, Layer, Exit } from 'effect'
import { HttpClient, HttpClientRequest, HttpClientResponse, HttpClientError } from '@effect/platform'
import { PokeApiService, PokeApiServiceLive } from '../pokeapi.js'
import { PokeApiError, PokemonNotFoundError, ValidationError } from '../../errors/index.js'
import { Logger, LoggerLive } from '../../utils/index.js'

// Mock HTTP Client for tests
const mockHttpClient = HttpClient.make((request, url, signal, fiber) => {
  const urlString = url.toString()

  // Mock for valid Pokemon
  if (urlString.includes('/pokemon/pikachu')) {
    const response = new Response(JSON.stringify({
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

    return Effect.succeed(HttpClientResponse.fromWeb(request, response))
  }

  // Mock for Pokemon not found
  if (urlString.includes('/pokemon/notfound')) {
    const response = new Response('Not Found', { status: 404 })
    return Effect.succeed(HttpClientResponse.fromWeb(request, response))
  }

  // Mock for Pokemon list
  if (urlString.includes('/pokemon?')) {
    const response = new Response(JSON.stringify({
      count: 1302,
      next: 'https://pokeapi.co/api/v2/pokemon?offset=20&limit=20',
      previous: null,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' }
      ]
    }), { status: 200 })

    return Effect.succeed(HttpClientResponse.fromWeb(request, response))
  }

  return Effect.fail(new HttpClientError.RequestError({
    request,
    reason: 'Transport',
    cause: new Error('Unexpected request')
  }))
})

const TestLayer = PokeApiServiceLive.pipe(
  Layer.provide(Layer.mergeAll(
    LoggerLive,
    Layer.succeed(HttpClient.HttpClient, mockHttpClient)
  ))
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
        // Handle both 'Fail' and 'Die' cases
        if (result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(PokemonNotFoundError)
        } else if (result.cause._tag === 'Die') {
          // Check if the defect contains our expected error
          expect(result.cause.defect).toBeInstanceOf(PokemonNotFoundError)
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
        // Handle both 'Fail' and 'Die' cases
        if (result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(ValidationError)
        } else if (result.cause._tag === 'Die') {
          // Check if the defect contains our expected error
          expect(result.cause.defect).toBeInstanceOf(ValidationError)
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
        // Handle both 'Fail' and 'Die' cases
        if (result.cause._tag === 'Fail') {
          expect(result.cause.error).toBeInstanceOf(ValidationError)
        } else if (result.cause._tag === 'Die') {
          // Check if the defect contains our expected error
          expect(result.cause.defect).toBeInstanceOf(ValidationError)
        }
      }
    })
  })

  describe('getAllPokemons', () => {
    it('should fetch all Pokemon with name and types', async () => {
      // Mock the list response
      const mockListResponse = {
        count: 3,
        next: null,
        previous: null,
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
          { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' }
        ]
      }

      // Mock individual Pokemon responses
      const mockBulbasaur = {
        id: 1,
        name: 'bulbasaur',
        types: [
          { slot: 1, type: { name: 'grass', url: 'https://pokeapi.co/api/v2/type/12/' } },
          { slot: 2, type: { name: 'poison', url: 'https://pokeapi.co/api/v2/type/4/' } }
        ]
      }

      const mockIvysaur = {
        id: 2,
        name: 'ivysaur',
        types: [
          { slot: 1, type: { name: 'grass', url: 'https://pokeapi.co/api/v2/type/12/' } },
          { slot: 2, type: { name: 'poison', url: 'https://pokeapi.co/api/v2/type/4/' } }
        ]
      }

      const mockVenusaur = {
        id: 3,
        name: 'venusaur',
        types: [
          { slot: 1, type: { name: 'grass', url: 'https://pokeapi.co/api/v2/type/12/' } },
          { slot: 2, type: { name: 'poison', url: 'https://pokeapi.co/api/v2/type/4/' } }
        ]
      }

      // Update mock to handle multiple requests
      const mockHttpClient = HttpClient.make((request, url, _signal, _fiber) => {
        const urlString = url.toString()
        if (urlString.includes('pokemon?limit=1302')) {
          return Effect.succeed(HttpClientResponse.fromWeb(request, new Response(JSON.stringify(mockListResponse))))
        } else if (urlString.includes('pokemon/bulbasaur')) {
          return Effect.succeed(HttpClientResponse.fromWeb(request, new Response(JSON.stringify(mockBulbasaur))))
        } else if (urlString.includes('pokemon/ivysaur')) {
          return Effect.succeed(HttpClientResponse.fromWeb(request, new Response(JSON.stringify(mockIvysaur))))
        } else if (urlString.includes('pokemon/venusaur')) {
          return Effect.succeed(HttpClientResponse.fromWeb(request, new Response(JSON.stringify(mockVenusaur))))
        }

        return Effect.fail(new HttpClientError.RequestError({
          request,
          reason: 'Transport',
          cause: new Error('Unexpected request')
        }))
      })

      const TestLayer = PokeApiServiceLive.pipe(
        Layer.provide(Layer.mergeAll(
          LoggerLive,
          Layer.succeed(HttpClient.HttpClient, mockHttpClient)
        ))
      )

      const program = Effect.gen(function* () {
        const service = yield* PokeApiService
        return yield* service.getAllPokemons()
      })

      const result = await Effect.runPromise(
        Effect.provide(program, TestLayer)
      )

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(3)

      // Check format: only name and types
      result.forEach(pokemon => {
        expect(pokemon).toHaveProperty('name')
        expect(pokemon).toHaveProperty('types')
        expect(Object.keys(pokemon)).toHaveLength(2)
        expect(Array.isArray(pokemon.types)).toBe(true)
      })

      // Check specific Pokemon
      const bulbasaur = result.find(p => p.name === 'bulbasaur')
      expect(bulbasaur).toBeDefined()
      expect(bulbasaur?.types).toEqual(['grass', 'poison'])
    })
  })
})
