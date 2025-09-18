import { Effect, Context, Layer, pipe } from "effect"
import { HttpClient, HttpClientRequest } from "@effect/platform"
import {
  type Pokemon,
  type PokemonList
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

  return PokeApiService.of({
    getPokemon,
    listPokemons
  })
})

// Layer del servicio
export const PokeApiServiceLive = Layer.effect(PokeApiService, makePokeApiService)
