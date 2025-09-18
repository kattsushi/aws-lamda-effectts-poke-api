import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import * as LogLevel from "effect/LogLevel"

import { LambdaHandler, EffectHandler } from "@effect-aws/lambda"
import { NodeHttpClient } from "@effect/platform-node"
import type { APIGatewayProxyEvent } from "aws-lambda"
import {
  PokeApiService
} from "../services/index.js"
import { ValidationError } from "../errors/index.js"
import {
  PokemonResponse
} from "../schemas/index.js"
import {
  createSuccessResponse,
  withErrorHandling
} from "../utils/index.js"

// Main application layer
const AppLayer = Layer.mergeAll(
  Logger.pretty.pipe(
    Layer.provideMerge(Logger.minimumLogLevel(LogLevel.Debug)),
    Layer.tapErrorCause(Effect.logError),
  ),
  PokeApiService.Default,
  NodeHttpClient.layer
)

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

// Handler to get a specific Pokemon using .pipe(withErrorHandling)
const getPokemonEffect: EffectHandler<APIGatewayProxyEvent, PokeApiService> = (event, _context) =>
  Effect.gen(function* () {
    const pokeApiService = yield* PokeApiService

    const pokemonName = event.pathParameters?.name || event.pathParameters?.id
    if (!pokemonName) {
      return yield* Effect.fail(new ValidationError({ message: "Pokemon name or ID is required" }))
    }

    yield* Effect.logInfo("Fetching Pokemon", { pokemon: pokemonName })

    const pokemon = yield* pokeApiService.getPokemon(pokemonName)
    const response = transformPokemonToResponse(pokemon)

    return yield* createSuccessResponse(200, response, "Pokemon fetched successfully")
  }).pipe(withErrorHandling)

export const getPokemonHandler = LambdaHandler.make({
  handler: getPokemonEffect,
  layer: AppLayer
})



// Handler to get ALL Pokemon in the required format using .pipe(withErrorHandling)
const listPokemonsEffect: EffectHandler<APIGatewayProxyEvent, PokeApiService> = (_event, _context) =>
  Effect.gen(function* () {
    const pokeApiService = yield* PokeApiService

    yield* Effect.logInfo("Fetching all Pokemon", {
      message: "Starting to fetch all 1302 Pokemon with name and types"
    })

    const startTime = Date.now()
    const allPokemon = yield* pokeApiService.getAllPokemons()
    const endTime = Date.now()

    yield* Effect.logInfo("All Pokemon fetched successfully", {
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

export const listPokemonsHandler = LambdaHandler.make({
  handler: listPokemonsEffect,
  layer: AppLayer
})
