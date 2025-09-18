import { Effect, pipe, Layer } from "effect"
import { LambdaHandler, EffectHandler } from "@effect-aws/lambda"
import { NodeHttpClient } from "@effect/platform-node"
import type { APIGatewayProxyEvent } from "aws-lambda"
import {
  PokeApiService,
  PokeApiServiceLive
} from "../services/index.js"
import { ValidationError } from "../errors/index.js"
import {
  PokemonResponse,
  PokemonListResponse,
  PokemonListQuerySchema,
  SimplePokemon
} from "../schemas/index.js"
import { Schema } from "effect"
import {
  Logger,
  LoggerLive,
  createSuccessResponse,
  withErrorHandling
} from "../utils/index.js"

// Main application layer
const AppLayer = Layer.mergeAll(
  PokeApiServiceLive,
  LoggerLive
).pipe(Layer.provide(NodeHttpClient.layer))

// Transform complete Pokemon to simplified response
const transformPokemonToResponse = (pokemon: any): PokemonResponse => ({
  id: pokemon.id,
  name: pokemon.name,
  height: pokemon.height,
  weight: pokemon.weight,
  base_experience: pokemon.base_experience,
  types: pokemon.types.map((t: any) => t.type.name),
  abilities: pokemon.abilities.map((a: any) => a.ability.name),
  stats: pokemon.stats.reduce((acc: Record<string, number>, stat: any) => {
    acc[stat.stat.name] = stat.base_stat
    return acc
  }, {}),
  sprites: {
    front_default: pokemon.sprites.front_default,
    front_shiny: pokemon.sprites.front_shiny
  }
})

// Extract ID from Pokemon URL
const extractPokemonId = (url: string): number => {
  const matches = url.match(/\/pokemon\/(\d+)\//);
  return matches ? parseInt(matches[1], 10) : 0;
}

// Handler to get a specific Pokemon using .pipe(withErrorHandling)
const getPokemonEffect: EffectHandler<APIGatewayProxyEvent, PokeApiService | Logger> = (event, _context) =>
  Effect.gen(function* () {
    const pokeApiService = yield* PokeApiService
    const logger = yield* Logger

    const pokemonName = event.pathParameters?.name || event.pathParameters?.id
    if (!pokemonName) {
      return yield* Effect.fail(new ValidationError({ message: "Pokemon name or ID is required" }))
    }

    yield* logger.info("Fetching Pokemon", { pokemon: pokemonName })

    const pokemon = yield* pokeApiService.getPokemon(pokemonName)
    const response = transformPokemonToResponse(pokemon)

    return yield* createSuccessResponse(200, response, "Pokemon fetched successfully")
  }).pipe(withErrorHandling)

export const getPokemonHandler = LambdaHandler.make({
  handler: getPokemonEffect,
  layer: AppLayer
})

// Handler to list Pokemon using .pipe(withErrorHandling)
const listPokemonsEffect: EffectHandler<APIGatewayProxyEvent, PokeApiService | Logger> = (event, _context) =>
  Effect.gen(function* () {
    const pokeApiService = yield* PokeApiService
    const logger = yield* Logger

    // Validate and parse query parameters
    const queryParams = event.queryStringParameters || {}
    const parsedQuery = yield* pipe(
      Schema.decodeUnknown(PokemonListQuerySchema)(queryParams),
      Effect.mapError((error) =>
        new ValidationError({ message: "Invalid query parameters", cause: error })
      )
    )

    // Apply default values
    const limit = parsedQuery.limit ?? 20
    const offset = parsedQuery.offset ?? 0

    yield* logger.info("Listing Pokemon", {
      limit,
      offset
    })

    const pokemonList = yield* pokeApiService.listPokemons(
      limit,
      offset
    )

    // Transform response to include IDs
    const transformedResults = pokemonList.results.map(pokemon => ({
      name: pokemon.name,
      id: extractPokemonId(pokemon.url),
      url: pokemon.url
    }))

    const response: PokemonListResponse = {
      count: pokemonList.count,
      next: pokemonList.next,
      previous: pokemonList.previous,
      results: transformedResults
    }

    return yield* createSuccessResponse(200, response, "Pokemon list fetched successfully")
  }).pipe(withErrorHandling)

export const listPokemonsHandler = LambdaHandler.make({
  handler: listPokemonsEffect,
  layer: AppLayer
})

// Handler to get ALL Pokemon in the required format using .pipe(withErrorHandling)
const getAllPokemonsEffect: EffectHandler<APIGatewayProxyEvent, PokeApiService | Logger> = (event, _context) =>
  Effect.gen(function* () {
    const pokeApiService = yield* PokeApiService
    const logger = yield* Logger

    yield* logger.info("Fetching all Pokemon", {
      message: "Starting to fetch all 1302 Pokemon with name and types"
    })

    const startTime = Date.now()
    const allPokemon = yield* pokeApiService.getAllPokemons()
    const endTime = Date.now()

    yield* logger.info("All Pokemon fetched successfully", {
      count: allPokemon.length,
      duration: `${endTime - startTime}ms`
    })

    // Return the array directly (not wrapped in a success response object)
    // This matches the required format: [{"name": "charizard", "types": ["fire", "flying"]}, ...]
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify(allPokemon)
    }
  }).pipe(withErrorHandling)

export const getAllPokemonsHandler = LambdaHandler.make({
  handler: getAllPokemonsEffect,
  layer: AppLayer
})
