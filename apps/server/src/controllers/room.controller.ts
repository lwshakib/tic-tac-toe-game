import { type Request, type Response, type RequestHandler } from "express"
import * as db from "../lib/db.js"
import { games } from "../lib/game.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"

async function getRoomList() {
  const rooms = await db.getAllRooms()
  return rooms.map((row) => {
    const activeGame = games.get(row.id)
    return {
      id: row.id,
      name: row.name,
      players: activeGame ? activeGame.getRoomData().players.length : 0,
      isPrivate: row.is_private,
      status: row.status,
    }
  })
}

export const getAllRooms: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const rooms = await getRoomList()
    return res.json(new ApiResponse(200, rooms))
  }
)

export const createRoom: RequestHandler = asyncHandler(
  async (req: any, res: Response) => {
    const { roomName, isPrivate, password, isAi } = req.body
    const user = req.user

    const { games, generateRoomId, TicTacToeGame } =
      await import("../lib/game.js")

    let roomId = generateRoomId()
    while (games.has(roomId)) {
      roomId = generateRoomId()
    }

    const game = await TicTacToeGame.create(
      roomId,
      roomName,
      user.name,
      "", // No socket ID yet
      user.id,
      isPrivate,
      password,
      isAi
    )
    games.set(roomId, game)

    return res.status(201).json(new ApiResponse(201, game.getRoomData()))
  }
)

export const joinRoom: RequestHandler = asyncHandler(
  async (req: any, res: Response) => {
    const { id } = req.params
    const { password } = req.body
    const normalizedId = id.toUpperCase()

    const { games, TicTacToeGame } = await import("../lib/game.js")

    let game = games.get(normalizedId)
    if (!game) {
      game = await TicTacToeGame.fromDb(normalizedId)
      if (game) games.set(normalizedId, game)
    }

    if (!game) {
      throw new ApiError(404, "Room not found")
    }

    const roomData = game.getRoomData()
    if (roomData.isPrivate && game.getPassword() !== password) {
      const isAlreadyIn = roomData.players.some(
        (p) => p.playerId === req.user.id
      )
      if (!isAlreadyIn) {
        throw new ApiError(401, "Incorrect password")
      }
    }

    return res.json(new ApiResponse(200, roomData))
  }
)
