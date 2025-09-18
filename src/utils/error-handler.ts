import { Effect } from "effect"
import { Logger } from "./logger.js"
import {
  PokeApiError,
  PokemonNotFoundError,
  ValidationError
} from "../errors/index.js"

// Respuesta de error HTTP
export interface ErrorResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

// Headers comunes para todas las respuestas
const commonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
}

// Función helper para crear respuesta de error
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

// Función para manejar errores usando Effect.catchTags (mejor ergonomía con pipe)
export const withErrorHandling = <A, R>(
  effect: Effect.Effect<A, PokeApiError | PokemonNotFoundError | ValidationError, R>
) =>
  effect.pipe(
    Effect.catchTags({
      PokemonNotFoundError: (error) =>
        Effect.gen(function* () {
          const logger = yield* Logger
          yield* logger.warn("Pokemon not found", { pokemon: error.pokemon })

          return createErrorResponseBody(
            "PokemonNotFound",
            `Pokemon '${error.pokemon}' not found`,
            404,
            { pokemon: error.pokemon }
          )
        }),

      ValidationError: (error) =>
        Effect.gen(function* () {
          const logger = yield* Logger
          yield* logger.warn("Validation error", { message: error.message })

          return createErrorResponseBody(
            "ValidationError",
            error.message,
            400
          )
        }),

      PokeApiError: (error) =>
        Effect.gen(function* () {
          const logger = yield* Logger
          yield* logger.error("PokeAPI error", error, {
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
    // Manejar errores no esperados
    Effect.catchAll((unknownError) =>
      Effect.gen(function* () {
        const logger = yield* Logger
        yield* logger.error("Unknown error occurred", unknownError)

        return createErrorResponseBody(
          "InternalServerError",
          "An unexpected error occurred",
          500
        )
      })
    )
  )



// Crear respuesta exitosa con logging
export const createSuccessResponse = <T>(
  statusCode: number,
  data: T,
  message?: string
): Effect.Effect<{ statusCode: number; headers: Record<string, string>; body: string }, never, Logger> =>
  Effect.gen(function* () {
    const logger = yield* Logger
    
    if (message) {
      yield* logger.info(message, { statusCode })
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
