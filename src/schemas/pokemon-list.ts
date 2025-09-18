import * as Schema from "effect/Schema"

// Schema para un elemento de la lista de Pokémon
export const PokemonListItemSchema = Schema.Struct({
  name: Schema.String,
  url: Schema.String
})

// Schema para la respuesta de la lista de Pokémon de la PokeAPI
export const PokemonListSchema = Schema.Struct({
  count: Schema.Number,
  next: Schema.NullOr(Schema.String),
  previous: Schema.NullOr(Schema.String),
  results: Schema.Array(PokemonListItemSchema)
})

// Schema para la respuesta simplificada de la lista
export const PokemonListResponseSchema = Schema.Struct({
  count: Schema.Number,
  next: Schema.NullOr(Schema.String),
  previous: Schema.NullOr(Schema.String),
  results: Schema.Array(Schema.Struct({
    name: Schema.String,
    id: Schema.Number,
    url: Schema.String
  }))
})

// Schema para parámetros de consulta
export const PokemonListQuerySchema = Schema.Struct({
  limit: Schema.optional(Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.between(1, 100)
  )),
  offset: Schema.optional(Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(0)
  ))
})

// Tipos derivados
export type PokemonList = Schema.Schema.Type<typeof PokemonListSchema>
export type PokemonListResponse = Schema.Schema.Type<typeof PokemonListResponseSchema>
export type PokemonListItem = Schema.Schema.Type<typeof PokemonListItemSchema>
export type PokemonListQuery = Schema.Schema.Type<typeof PokemonListQuerySchema>
