import { Schema } from "effect"

// Schema para el tipo de Pokémon
export const PokemonTypeSchema = Schema.Struct({
  slot: Schema.Number,
  type: Schema.Struct({
    name: Schema.String,
    url: Schema.String
  })
})

// Schema para las estadísticas de Pokémon
export const PokemonStatSchema = Schema.Struct({
  base_stat: Schema.Number,
  effort: Schema.Number,
  stat: Schema.Struct({
    name: Schema.String,
    url: Schema.String
  })
})

// Schema para las habilidades de Pokémon
export const PokemonAbilitySchema = Schema.Struct({
  is_hidden: Schema.Boolean,
  slot: Schema.Number,
  ability: Schema.Struct({
    name: Schema.String,
    url: Schema.String
  })
})

// Schema para los sprites de Pokémon
export const PokemonSpritesSchema = Schema.Struct({
  front_default: Schema.NullOr(Schema.String),
  front_shiny: Schema.NullOr(Schema.String),
  front_female: Schema.NullOr(Schema.String),
  front_shiny_female: Schema.NullOr(Schema.String),
  back_default: Schema.NullOr(Schema.String),
  back_shiny: Schema.NullOr(Schema.String),
  back_female: Schema.NullOr(Schema.String),
  back_shiny_female: Schema.NullOr(Schema.String)
})

// Schema principal para un Pokémon completo
export const PokemonSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  base_experience: Schema.NullOr(Schema.Number),
  height: Schema.Number,
  is_default: Schema.Boolean,
  order: Schema.Number,
  weight: Schema.Number,
  abilities: Schema.Array(PokemonAbilitySchema),
  forms: Schema.Array(Schema.Struct({
    name: Schema.String,
    url: Schema.String
  })),
  game_indices: Schema.Array(Schema.Struct({
    game_index: Schema.Number,
    version: Schema.Struct({
      name: Schema.String,
      url: Schema.String
    })
  })),
  held_items: Schema.Array(Schema.Any),
  location_area_encounters: Schema.String,
  moves: Schema.Array(Schema.Any),
  species: Schema.Struct({
    name: Schema.String,
    url: Schema.String
  }),
  sprites: PokemonSpritesSchema,
  stats: Schema.Array(PokemonStatSchema),
  types: Schema.Array(PokemonTypeSchema),
  past_types: Schema.Array(Schema.Any)
})

// Schema simplificado para respuestas de la API
export const PokemonResponseSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  height: Schema.Number,
  weight: Schema.Number,
  base_experience: Schema.NullOr(Schema.Number),
  types: Schema.Array(Schema.String),
  abilities: Schema.Array(Schema.String),
  stats: Schema.Record({ key: Schema.String, value: Schema.Number }),
  sprites: Schema.Struct({
    front_default: Schema.NullOr(Schema.String),
    front_shiny: Schema.NullOr(Schema.String)
  })
})

// Tipos derivados de los schemas
export type Pokemon = Schema.Schema.Type<typeof PokemonSchema>
export type PokemonResponse = Schema.Schema.Type<typeof PokemonResponseSchema>
export type PokemonType = Schema.Schema.Type<typeof PokemonTypeSchema>
export type PokemonStat = Schema.Schema.Type<typeof PokemonStatSchema>
export type PokemonAbility = Schema.Schema.Type<typeof PokemonAbilitySchema>
export type PokemonSprites = Schema.Schema.Type<typeof PokemonSpritesSchema>
