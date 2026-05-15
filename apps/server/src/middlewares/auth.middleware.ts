import {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express"
import * as db from "../lib/db.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * Middleware to authenticate requests using a session token.
 * Attaches the user object to the request.
 */
export const authenticate: RequestHandler = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token

    if (!token) {
      throw new ApiError(401, "Authentication required")
    }

    const user = await db.validateSession(token)
    if (!user) {
      throw new ApiError(401, "Invalid or expired session")
    }

    req.user = user
    req.sessionToken = token
    next()
  }
)
