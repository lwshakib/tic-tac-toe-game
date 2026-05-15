import { httpServer, io } from "./app.js"
import { setupSocketHandlers } from "./lib/socket.js"
import { getAllRooms } from "./lib/db.js"
import { TicTacToeGame, games } from "./lib/game.js"
import logger from "./logger/winston.logger.js"
import { PORT } from "./env.js"

async function startServer(port: number) {
  // Initialize socket handlers
  setupSocketHandlers(io)

  // Load existing rooms from DB
  try {
    const rooms = await getAllRooms()
    for (const row of rooms) {
      const game = await TicTacToeGame.fromDb(row.id)
      if (game) {
        games.set(row.id, game)
      }
    }
    logger.info(`Loaded ${rooms.length} rooms from database.`)
  } catch (err) {
    logger.error("Failed to load rooms from database", err)
  }

  httpServer.listen(port, () => {
    logger.info(
      `Server running on port ${port} in ${process.env.NODE_ENV || "development"} mode`
    )
  })
}

startServer(Number(PORT))
