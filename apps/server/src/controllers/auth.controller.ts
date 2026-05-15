import { type Request, type Response, type RequestHandler } from "express"
import crypto from "crypto"
import * as db from "../lib/db.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import logger from "../logger/winston.logger.js"

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, password } = req.body

    if (!name || !password) {
      throw new ApiError(400, "Username and password are required")
    }

    const existingUser = await db.getUserByName(name)
    if (existingUser) {
      throw new ApiError(400, "Username already taken")
    }

    const id = Math.random().toString(36).substring(2, 10)
    await db.createUser(id, name, password)

    const token = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    await db.createSession(id, token, expiresAt)

    logger.info(`Account created: ${name} (${id})`)
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { id, name, token },
          "Account created successfully"
        )
      )
  }
)

export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, password } = req.body

    if (!name || !password) {
      throw new ApiError(400, "Username and password are required")
    }

    const user = await db.getUserByName(name)
    if (!user || user.password !== password) {
      throw new ApiError(401, "Invalid username or password")
    }

    const token = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    await db.createSession(user.id, token, expiresAt)

    logger.info(`User logged in: ${name}`)
    return res.json(
      new ApiResponse(
        200,
        {
          id: user.id,
          name: user.name,
          token,
          currentRoomId: user.current_room_id,
        },
        "Login successful"
      )
    )
  }
)

export const getMe: RequestHandler = asyncHandler(
  async (req: any, res: Response) => {
    return res.json(
      new ApiResponse(200, {
        id: req.user.id,
        name: req.user.name,
        currentRoomId: req.user.current_room_id,
      })
    )
  }
)

export const logout: RequestHandler = asyncHandler(
  async (req: any, res: Response) => {
    await db.deleteSession(req.sessionToken)
    return res.json(new ApiResponse(200, null, "Logged out successfully"))
  }
)

export const validateAccounts: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { accounts } = req.body
    if (!Array.isArray(accounts)) {
      throw new ApiError(400, "Invalid accounts data")
    }

    const validAccounts = await db.validateAccounts(accounts)
    return res.json(new ApiResponse(200, validAccounts))
  }
)
