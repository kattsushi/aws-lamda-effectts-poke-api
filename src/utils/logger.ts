import { Effect, Context, Layer } from "effect"

// Log levels
export type LogLevel = "debug" | "info" | "warn" | "error"

// Logger interface
export interface Logger {
  readonly debug: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>
  readonly info: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>
  readonly warn: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>
  readonly error: (message: string, error?: unknown, meta?: Record<string, unknown>) => Effect.Effect<void>
}

// Logger service tag
export const Logger = Context.GenericTag<Logger>("Logger")

// Logger implementation for Lambda
const makeLogger = Effect.gen(function* () {
  const logLevel = process.env.LOG_LEVEL || "info"
  const stage = process.env.STAGE || "dev"
  const functionName = process.env.FUNCTION_NAME || "unknown"

  const shouldLog = (level: LogLevel): boolean => {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    return levels[level] >= levels[logLevel as LogLevel]
  }

  const formatLog = (
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
    error?: unknown
  ) => {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      stage,
      functionName,
      ...(meta ? { meta } : {}),
      ...(error ? {
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error
      } : {})
    }
    return JSON.stringify(logEntry)
  }

  const log = (level: LogLevel, message: string, error?: unknown, meta?: Record<string, unknown>) =>
    Effect.sync(() => {
      if (shouldLog(level)) {
        const logMessage = formatLog(level, message, meta, error)
        console.log(logMessage)
      }
    })

  return Logger.of({
    debug: (message: string, meta?: Record<string, unknown>) =>
      log("debug", message, undefined, meta),
    
    info: (message: string, meta?: Record<string, unknown>) =>
      log("info", message, undefined, meta),
    
    warn: (message: string, meta?: Record<string, unknown>) =>
      log("warn", message, undefined, meta),
    
    error: (message: string, error?: unknown, meta?: Record<string, unknown>) =>
      log("error", message, error, meta)
  })
})

// Layer del logger
export const LoggerLive = Layer.effect(Logger, makeLogger)
