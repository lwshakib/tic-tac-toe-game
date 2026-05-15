import morgan, { type StreamOptions } from "morgan"
import logger from "./winston.logger.js"
import { NODE_ENV } from "../env.js"

// Winston-compatible stream for Morgan
const stream: StreamOptions = {
  // Use the HTTP severity level
  write: (message: string): void => {
    logger.http(message.trim())
  },
}

const skip = (): boolean => {
  const env = NODE_ENV ?? "development"
  return env !== "development"
}

// Fully-typed Morgan middleware
const morganMiddleware = morgan(
  ":remote-addr :method :url :status - :response-time ms",
  {
    stream,
    skip,
  }
)

export default morganMiddleware
