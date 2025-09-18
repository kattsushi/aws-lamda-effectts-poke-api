
import * as Effect from "effect/Effect"
import {
  PokeApiError,
  PokemonNotFoundError,
  ValidationError
} from "../errors/index.js"

// HTTP error response
export interface ErrorResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

// Common headers for all responses
const commonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
}

// Helper function to create error response
const createErrorResponseBody = (
  error: string,
  message: string,
  statusCode: number,
  extra?: Record<string, unknown>
) => ({
  statusCode,
  headers: commonHeaders,
  body: JSON.stringify({
    error,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    ...extra
  })
})

// Function to handle errors using Effect.catchTags (better ergonomics with pipe)
export const withErrorHandling = <A, R>(
  effect: Effect.Effect<A, PokeApiError | PokemonNotFoundError | ValidationError, R>
) =>
  effect.pipe(
    Effect.catchTags({
      PokemonNotFoundError: (error) =>
        Effect.gen(function* () {
          yield* Effect.log("Pokemon not found", { pokemon: error.pokemon })

          return createErrorResponseBody(
            "PokemonNotFound",
            `Pokemon '${error.pokemon}' not found`,
            404,
            { pokemon: error.pokemon }
          )
        }),

      ValidationError: (error) =>
        Effect.gen(function* () {
          yield* Effect.log("Validation error", { message: error.message })

          return createErrorResponseBody(
            "ValidationError",
            error.message,
            400
          )
        }),

      PokeApiError: (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("PokeAPI error", error, {
            status: error.status,
            message: error.message
          })

          return createErrorResponseBody(
            "PokeApiError",
            error.message,
            error.status || 500
          )
        })
    }),
    // Handle unexpected errors
    Effect.catchAll((unknownError) =>
      Effect.gen(function* () {
        yield* Effect.logError("Unknown error occurred", unknownError)

        return createErrorResponseBody(
          "InternalServerError",
          "An unexpected error occurred",
          500
        )
      })
    )
  )



// Create successful response with logging
export const createSuccessResponse = <T>(
  statusCode: number,
  data: T,
  message?: string
): Effect.Effect<{ statusCode: number; headers: Record<string, string>; body: string }, never, never> =>
  Effect.gen(function* () {
    
    if (message) {
      yield* Effect.logInfo(message, { statusCode })
    }
    
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
      },
      body: JSON.stringify(data)
    }
  })
