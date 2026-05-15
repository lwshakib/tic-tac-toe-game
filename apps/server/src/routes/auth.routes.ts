import { Router } from "express"
import * as authController from "../controllers/auth.controller.js"
import { authenticate } from "../middlewares/auth.middleware.js"

const router: Router = Router()

router.post("/register", authController.register)
router.post("/login", authController.login)
router.get("/me", authenticate, authController.getMe)
router.post("/logout", authenticate, authController.logout)
router.post("/validate-accounts", authController.validateAccounts)

export default router
