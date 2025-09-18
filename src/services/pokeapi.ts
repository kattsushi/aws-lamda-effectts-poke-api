import { Effect, Context, Layer, pipe } from "effect"
import { HttpClient, HttpClientRequest } from "@effect/platform"
import {
  type Pokemon,
  type PokemonList,
  type SimplePokemon
} from "../schemas/index.js"
import {
  PokeApiError,
  PokemonNotFoundError,
  ValidationError
} from "../errors/index.js"

// Define service using Context.Tag (best practice)
export class PokeApiService extends Context.Tag("PokeApiService")<
  PokeApiService,
  {
    readonly getPokemon: (nameOrId: string | number) => Effect.Effect<Pokemon, PokeApiError | PokemonNotFoundError | ValidationError>
    readonly listPokemons: (limit?: number, offset?: number) => Effect.Effect<PokemonList, PokeApiError | ValidationError>
    readonly getAllPokemons: () => Effect.Effect<SimplePokemon[], PokeApiError | ValidationError>
  }
>() {}

// Service implementation using Effect.gen for better composability
const makePokeApiService = Effect.gen(function* () {
  const httpClient = yield* HttpClient.HttpClient
  const baseUrl = "https://pokeapi.co/api/v2"

  // Helper function to make HTTP requests with error handling
  const fetchJson = (url: string) => Effect.gen(function* () {
    const response = yield* pipe(
      HttpClientRequest.get(url),
      httpClient.execute
    )

    if (response.status === 404) {
      const pokemonName = url.split('/').pop() || 'unknown'
      return yield* Effect.fail(new PokemonNotFoundError({ pokemon: pokemonName }))
    }

    if (response.status !== 200) {
      return yield* Effect.fail(
        new PokeApiError({
          message: `HTTP ${response.status}`,
          status: response.status
        })
      )
    }

    return yield* response.json
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof PokemonNotFoundError || error instanceof PokeApiError) {
        return Effect.fail(error)
      }
      return Effect.fail(new PokeApiError({ message: "Network error", status: 500, cause: error }))
    })
  )

  const getPokemon = (nameOrId: string | number) => Effect.gen(function* () {
    const identifier = typeof nameOrId === 'string'
      ? nameOrId.toLowerCase().trim()
      : nameOrId.toString()

    if (!identifier) {
      return yield* Effect.fail(new ValidationError({ message: "Pokemon name or ID cannot be empty" }))
    }

    const data = yield* fetchJson(`${baseUrl}/pokemon/${identifier}`)
    return data as Pokemon
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof PokemonNotFoundError || error instanceof PokeApiError || error instanceof ValidationError) {
        return Effect.fail(error)
      }
      return Effect.fail(new ValidationError({ message: "Failed to parse Pokemon data", cause: error }))
    })
  )

  const listPokemons = (limit: number = 20, offset: number = 0) => Effect.gen(function* () {
    // Validar parámetros
    if (limit < 1 || limit > 100) {
      return yield* Effect.fail(new ValidationError({ message: "Limit must be between 1 and 100" }))
    }

    if (offset < 0) {
      return yield* Effect.fail(new ValidationError({ message: "Offset must be non-negative" }))
    }

    const data = yield* fetchJson(`${baseUrl}/pokemon?limit=${limit}&offset=${offset}`)
    return data as PokemonList
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof PokeApiError || error instanceof ValidationError) {
        return Effect.fail(error)
      }
      return Effect.fail(new ValidationError({ message: "Failed to parse Pokemon list data", cause: error }))
    })
  )

  // Get all Pokemon with name and types (required format)
  const getAllPokemons = (): Effect.Effect<SimplePokemon[], PokeApiError | ValidationError> => Effect.gen(function* () {
    // First, get the list of all Pokemon names
    const pokemonList = yield* fetchJson(`${baseUrl}/pokemon?limit=1302&offset=0`)
    const allPokemonList = pokemonList as PokemonList

    // Extract Pokemon names from the list
    const pokemonNames = allPokemonList.results.map(p => p.name)

    // Fetch all Pokemon details concurrently with batching for performance
    // Using Effect.forEach with concurrency control to avoid overwhelming the API
    const allPokemonDetails = yield* Effect.forEach(
      pokemonNames,
      (name) => Effect.gen(function* () {
        const pokemon = yield* fetchJson(`${baseUrl}/pokemon/${name}`)
        const pokemonData = pokemon as Pokemon

        // Transform to required format: only name and types
        const simplePokemon: SimplePokemon = {
          name: pokemonData.name,
          types: pokemonData.types.map(t => t.type.name)
        }

        return simplePokemon
      }).pipe(
        Effect.catchAll((error) => {
          // If individual Pokemon fails, log and continue with others
          console.warn(`Failed to fetch Pokemon ${name}:`, error)
          return Effect.succeed(null as SimplePokemon | null)
        })
      ),
      {
        concurrency: 50, // Process 50 Pokemon at a time to balance speed vs API limits
        batching: true
      }
    )

    // Filter out any null results from failed requests
    const validPokemon = allPokemonDetails.filter((p): p is SimplePokemon => p !== null)

    return validPokemon
  }).pipe(
    Effect.catchAll((error) => {
      return Effect.fail(new ValidationError({ message: "Failed to fetch all Pokemon", cause: error }))
    })
  )

  return PokeApiService.of({
    getPokemon,
    listPokemons,
    getAllPokemons
  })
})

// Layer del servicio
export const PokeApiServiceLive = Layer.effect(PokeApiService, makePokeApiService)
