# Pokémon API con AWS Lambda y Effect-TS

Una API moderna de Pokémon construida con AWS Lambda, Effect-TS y Serverless Framework que consume la [PokéAPI](https://pokeapi.co/).

## 🚀 Características

- **Effect-TS**: Programación funcional type-safe con manejo robusto de errores
- **AWS Lambda**: Serverless, escalable y cost-effective
- **TypeScript**: Tipado estático completo
- **Serverless Framework**: Deployment y gestión de infraestructura simplificada
- **Validación de Schemas**: Validación automática de datos con @effect/schema
- **Logging Estructurado**: Sistema de logging JSON para CloudWatch
- **Tests Unitarios**: Suite de tests con Vitest
- **CORS Habilitado**: Listo para aplicaciones web

## 📋 Prerequisitos

- Node.js 18+
- pnpm (recomendado) o npm
- AWS CLI configurado
- Serverless Framework CLI

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd poke-api

# Instalar dependencias
pnpm install

# Configurar AWS CLI (si no está configurado)
aws configure
```

## 🏗️ Desarrollo Local

```bash
# Compilar TypeScript
pnpm run build

# Ejecutar en modo desarrollo (con hot reload)
pnpm run dev

# La API estará disponible en http://localhost:4000
```

## 🧪 Testing

```bash
# Ejecutar tests
pnpm test

# Ejecutar tests en modo watch
pnpm run test:watch

# Ejecutar tests con UI
pnpm run test:ui

# Generar reporte de cobertura
pnpm run test:coverage
```

## 📚 Endpoints de la API

### GET /pokemon/{name}

Obtiene información detallada de un Pokémon específico.

**Parámetros:**
- `name` (string): Nombre o ID del Pokémon

**Ejemplo:**
```bash
curl https://your-api-url/pokemon/pikachu
```

**Respuesta:**
```json
{
  "id": 25,
  "name": "pikachu",
  "height": 4,
  "weight": 60,
  "base_experience": 112,
  "types": ["electric"],
  "abilities": ["static", "lightning-rod"],
  "stats": {
    "hp": 35,
    "attack": 55,
    "defense": 40,
    "special-attack": 50,
    "special-defense": 50,
    "speed": 90
  },
  "sprites": {
    "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    "front_shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png"
  }
}
```

### GET /pokemon

Lista Pokémon con paginación.

**Parámetros de consulta:**
- `limit` (number, opcional): Número de resultados (1-100, default: 20)
- `offset` (number, opcional): Número de resultados a saltar (default: 0)

**Ejemplo:**
```bash
curl "https://your-api-url/pokemon?limit=5&offset=0"
```

**Respuesta:**
```json
{
  "count": 1302,
  "next": "https://your-api-url/pokemon?offset=5&limit=5",
  "previous": null,
  "results": [
    {
      "name": "bulbasaur",
      "id": 1,
      "url": "https://pokeapi.co/api/v2/pokemon/1/"
    },
    {
      "name": "ivysaur",
      "id": 2,
      "url": "https://pokeapi.co/api/v2/pokemon/2/"
    }
  ]
}
```

## 🚀 Deployment

### Desarrollo
```bash
pnpm run deploy:dev
```

### Producción
```bash
pnpm run deploy:prod
```

### Deployment manual
```bash
# Compilar y deployar
pnpm run build
serverless deploy --stage prod --region us-east-1
```

## 🏗️ Arquitectura

```
src/
├── handlers/          # Lambda handlers
│   ├── pokemon.ts     # Handlers de Pokemon
│   └── index.ts       # Re-exports
├── services/          # Servicios de negocio
│   ├── pokeapi.ts     # Cliente de PokeAPI
│   └── index.ts       # Re-exports
├── schemas/           # Schemas de validación
│   ├── pokemon.ts     # Schemas de Pokemon
│   ├── pokemon-list.ts # Schemas de listas
│   ├── errors.ts      # Schemas de errores
│   └── index.ts       # Re-exports
├── utils/             # Utilidades
│   ├── logger.ts      # Sistema de logging
│   ├── error-handler.ts # Manejo de errores
│   └── index.ts       # Re-exports
└── handler.ts         # Entry point principal
```

## 🔧 Configuración

### Variables de Entorno

- `NODE_ENV`: Entorno de ejecución (development/production)
- `STAGE`: Stage de deployment (dev/prod)
- `LOG_LEVEL`: Nivel de logging (debug/info/warn/error)
- `FUNCTION_NAME`: Nombre de la función Lambda

### Serverless Configuration

El archivo `serverless.yml` contiene la configuración de infraestructura:

- **Runtime**: Node.js 18.x
- **Memory**: 512MB
- **Timeout**: 30 segundos
- **CORS**: Habilitado para todos los orígenes
- **CloudWatch Logs**: Retención de 14 días

## 🛡️ Manejo de Errores

La API maneja diferentes tipos de errores:

- **400 Bad Request**: Parámetros inválidos
- **404 Not Found**: Pokémon no encontrado
- **500 Internal Server Error**: Errores del servidor

Todos los errores incluyen:
```json
{
  "error": "ErrorType",
  "message": "Descripción del error",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📊 Monitoring y Logs

Los logs se envían automáticamente a CloudWatch en formato JSON estructurado:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Pokemon fetched successfully",
  "stage": "prod",
  "functionName": "getPokemon",
  "meta": {
    "pokemon": "pikachu"
  }
}
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [PokéAPI](https://pokeapi.co/) por proporcionar los datos de Pokémon
- [Effect-TS](https://effect.website/) por el excelente framework funcional
- [Serverless Framework](https://www.serverless.com/) por simplificar el deployment
