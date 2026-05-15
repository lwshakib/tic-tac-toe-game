import express, { type Express } from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"
import morganMiddleware from "./logger/morgan.logger.js"
import { errorHandler } from "./middlewares/error.middleware.js"

// Routes
import authRoutes from "./routes/auth.routes.js"
import roomRoutes from "./routes/room.routes.js"

const app: Express = express()

app.use(cors())
app.use(express.json())
app.use(morganMiddleware)

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/rooms", roomRoutes)

// Error Handler Middleware
app.use(errorHandler)

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
})

export { app, httpServer, io }
