import { Data } from "effect"

// Definir errores usando Data.TaggedError para mejor type safety
export class PokeApiError extends Data.TaggedError("PokeApiError")<{
  readonly message: string
  readonly status?: number
  readonly cause?: unknown
}> {}

export class PokemonNotFoundError extends Data.TaggedError("PokemonNotFoundError")<{
  readonly pokemon: string
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string
  readonly cause?: unknown
}> {}
