import * as Schema from "effect/Schema"

// Schema para errores de la API
export const ApiErrorSchema = Schema.Struct({
  error: Schema.String,
  message: Schema.String,
  statusCode: Schema.Number,
  timestamp: Schema.String
})

// Schema para errores de validación
export const ValidationErrorSchema = Schema.Struct({
  error: Schema.Literal("ValidationError"),
  message: Schema.String,
  details: Schema.Array(Schema.Struct({
    path: Schema.Array(Schema.Union(Schema.String, Schema.Number)),
    message: Schema.String
  })),
  statusCode: Schema.Literal(400),
  timestamp: Schema.String
})

// Schema para errores de Pokémon no encontrado
export const PokemonNotFoundErrorSchema = Schema.Struct({
  error: Schema.Literal("PokemonNotFound"),
  message: Schema.String,
  pokemon: Schema.String,
  statusCode: Schema.Literal(404),
  timestamp: Schema.String
})

// Schema para errores internos del servidor
export const InternalServerErrorSchema = Schema.Struct({
  error: Schema.Literal("InternalServerError"),
  message: Schema.String,
  statusCode: Schema.Literal(500),
  timestamp: Schema.String
})

// Tipos derivados
export type ApiError = Schema.Schema.Type<typeof ApiErrorSchema>
export type ValidationError = Schema.Schema.Type<typeof ValidationErrorSchema>
export type PokemonNotFoundError = Schema.Schema.Type<typeof PokemonNotFoundErrorSchema>
export type InternalServerError = Schema.Schema.Type<typeof InternalServerErrorSchema>
