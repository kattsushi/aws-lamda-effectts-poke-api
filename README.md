# Pokémon API with AWS Lambda and Effect-TS

A modern Pokémon API built with AWS Lambda, Effect-TS and Serverless Framework that consumes the [PokéAPI](https://pokeapi.co/).

## 🚀 Features

- **Effect-TS**: Type-safe functional programming with robust error handling
- **AWS Lambda**: Serverless, scalable and cost-effective
- **TypeScript**: Complete static typing
- **Serverless Framework**: Simplified deployment and infrastructure management
- **Schema Validation**: Automatic data validation with effect/schema
- **Structured Logging**: JSON logging system for CloudWatch
- **Unit Tests**: Test suite with Vitest
- **CORS Enabled**: Ready for web applications

## 📋 Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- AWS CLI configured
- Serverless Framework CLI

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd poke-api

# Install dependencies
pnpm install

# Configure AWS CLI (if not configured)
aws configure
```

## 🏗️ Local Development

```bash
# Compile TypeScript
pnpm run build

# Run in development mode (with hot reload)
pnpm run dev

# API will be available at http://localhost:4000
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with UI
pnpm run test:ui

# Generate coverage report
pnpm run test:coverage
```

## 📚 API Endpoints

### GET /pokemon/{name}

Gets detailed information about a specific Pokémon.

**Parameters:**
- `name` (string): Pokémon name or ID

**Example:**
```bash
curl https://your-api-url/pokemon/pikachu
```

**Response:**
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

Lists Pokémon with pagination.

**Query parameters:**
- `limit` (number, optional): Number of results (1-100, default: 20)
- `offset` (number, optional): Number of results to skip (default: 0)

**Example:**
```bash
curl "https://your-api-url/pokemon?limit=5&offset=0"
```

**Response:**
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

### Development
```bash
pnpm run deploy:dev
```

### Production
```bash
pnpm run deploy:prod
```

### Manual deployment
```bash
# Build and deploy
pnpm run build
serverless deploy --stage prod --region us-east-1
```

## 🏗️ Architecture

```
src/
├── handlers/          # Lambda handlers
│   ├── pokemon.ts     # Pokemon handlers
│   └── index.ts       # Re-exports
├── services/          # Business services
│   ├── pokeapi.ts     # PokeAPI client
│   └── index.ts       # Re-exports
├── schemas/           # Validation schemas
│   ├── pokemon.ts     # Pokemon schemas
│   ├── pokemon-list.ts # List schemas
│   ├── errors.ts      # Error schemas
│   └── index.ts       # Re-exports
├── utils/             # Utilities
│   ├── logger.ts      # Logging system
│   ├── error-handler.ts # Error handling
│   └── index.ts       # Re-exports
└── handler.ts         # Main entry point
```

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Runtime environment (development/production)
- `STAGE`: Deployment stage (dev/prod)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `FUNCTION_NAME`: Lambda function name

### Serverless Configuration

The `serverless.yml` file contains the infrastructure configuration:

- **Runtime**: Node.js 18.x
- **Memory**: 512MB
- **Timeout**: 30 seconds
- **CORS**: Enabled for all origins
- **CloudWatch Logs**: 14-day retention

## 🛡️ Error Handling

The API handles different types of errors:

- **400 Bad Request**: Invalid parameters
- **404 Not Found**: Pokémon not found
- **500 Internal Server Error**: Server errors

All errors include:
```json
{
  "error": "ErrorType",
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📊 Monitoring and Logs

Logs are automatically sent to CloudWatch in structured JSON format:

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

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License. See the `LICENSE` file for more details.

## 🙏 Acknowledgments

- [PokéAPI](https://pokeapi.co/) for providing the Pokémon data
- [Effect-TS](https://effect.website/) for the excellent functional framework
- [Serverless Framework](https://www.serverless.com/) for simplifying deployment
