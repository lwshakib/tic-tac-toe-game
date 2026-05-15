import { Router } from "express"
import * as roomController from "../controllers/room.controller.js"
import { authenticate } from "../middlewares/auth.middleware.js"

const router: Router = Router()

router.get("/", roomController.getAllRooms)
router.post("/", authenticate, roomController.createRoom)
router.post("/:id/join", authenticate, roomController.joinRoom)

export default router
