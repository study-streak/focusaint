import express from "express"
import userController from "../controllers/user.controller.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Get user profile
router.get("/profile", authenticateToken, userController.getUserProfile)

// Update user profile
router.put("/profile", authenticateToken, userController.updateUserProfile)

// Get dashboard data
router.get("/dashboard", authenticateToken,userController.getUserDashboard)

export default router
