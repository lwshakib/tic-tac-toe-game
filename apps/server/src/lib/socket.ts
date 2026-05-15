import { Server, Socket } from "socket.io"
import * as db from "./db.js"
import { TicTacToeGame, games, generateRoomId } from "./game.js"
import logger from "../logger/winston.logger.js"

export function setupSocketHandlers(io: Server) {
  // Socket.io Handshake Middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error("Authentication required"))
    }

    try {
      const user = await db.validateSession(token)
      if (!user) {
        return next(new Error("Invalid or expired session"))
      }

      // Attach user info to socket
      ;(socket as any).user = user
      next()
    } catch (err) {
      next(new Error("Internal server error during authentication"))
    }
  })

  io.on("connection", (socket) => {
    logger.debug(`Socket connected: ${socket.id}`)

    socket.on(
      "create-room",
      async ({ roomName, playerName, playerId, isPrivate, password }) => {
        let roomId = generateRoomId()
        while (games.has(roomId)) {
          roomId = generateRoomId()
        }

        const game = await TicTacToeGame.create(
          roomId,
          roomName,
          playerName,
          socket.id,
          playerId,
          isPrivate,
          password
        )
        games.set(roomId, game)

        await db.updateUserCurrentRoom(playerId, roomId)

        socket.join(roomId)
        socket.emit("room-created", game.getRoomData())
        io.emit("room-list-update")
        logger.info(`Room created: ${roomId} (${roomName}) by ${playerName}`)
      }
    )

    socket.on(
      "join-room",
      async ({ roomId, playerName, playerId, password, isLinkJoin }) => {
        const normalizedId = roomId.toUpperCase()
        let game = games.get(normalizedId)

        if (!game) {
          game = await TicTacToeGame.fromDb(normalizedId)
          if (game) games.set(normalizedId, game)
        }

        if (!game) {
          socket.emit("error", "Room ID not found")
          return
        }

        const joinResult = game.addPlayer(
          playerName,
          socket.id,
          playerId,
          password,
          isLinkJoin
        )
        if (typeof joinResult === "string") {
          socket.emit("error", joinResult)
          return
        }

        await db.updateUserCurrentRoom(playerId, normalizedId)

        socket.join(normalizedId)
        io.to(normalizedId).emit("room-updated", game.getRoomData())
        io.emit("room-list-update")
        logger.info(`${playerName} joined room: ${roomId}`)
      }
    )

    socket.on("leave-room", async (roomId) => {
      const normalizedId = roomId.toUpperCase()
      const game = games.get(normalizedId)
      if (!game) return

      const player = game.getRoomData().players.find((p) => p.id === socket.id)
      const playerName = player?.name || "Unknown player"

      if (player) {
        await db.updateUserCurrentRoom(player.playerId, null)
      }

      const shouldDelete = game.removePlayer(socket.id)
      socket.leave(normalizedId)

      if (shouldDelete) {
        io.to(normalizedId).emit(
          "room-closed",
          "The room has been closed by the creator."
        )
        games.delete(normalizedId)
        logger.info(`Room deleted: ${normalizedId} (Creator left)`)
      } else {
        io.to(normalizedId).emit("room-updated", game.getRoomData())
        logger.info(`${playerName} left room: ${normalizedId}`)
      }
      io.emit("room-list-update")
    })

    socket.on("make-move", async ({ roomId, index }) => {
      const normalizedId = roomId.toUpperCase()
      const game = games.get(normalizedId)
      if (!game) return

      if (game.makeMove(socket.id, index)) {
        io.to(normalizedId).emit("room-updated", game.getRoomData())

        // Check for AI turn
        const roomData = game.getRoomData()
        if (roomData.status === "playing" && roomData.isAiGame) {
          const currentPlayer = roomData.players[roomData.currentPlayerIndex]
          if (currentPlayer?.isAi) {
            // Add a small delay for natural feeling
            setTimeout(() => {
              game.makeAiMove()
              io.to(normalizedId).emit("room-updated", game.getRoomData())
            }, 600)
          }
        }
      }
    })

    socket.on("reset-game", async (roomId) => {
      const normalizedId = roomId.toUpperCase()
      const game = games.get(normalizedId)
      if (!game) return

      const player = game.getRoomData().players.find((p) => p.id === socket.id)
      if (!player) return

      const reset = game.voteReset(player.playerId)
      if (reset) {
        io.to(normalizedId).emit("room-updated", game.getRoomData())
        logger.info(`Game reset in room: ${normalizedId}`)
      }
    })

    socket.on("disconnect", () => {
      logger.debug(`Socket disconnected: ${socket.id}`)
    })
  })
}
