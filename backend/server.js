import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/user.js"
import habitRoutes from "./routes/habit.js"
import planRoutes from "./routes/plan.js"
import { errorHandler } from "./middleware/errorHandler.js"

dotenv.config()

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, "uploads")

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
)
app.use(express.json())
app.use("/uploads", express.static(uploadsDir))

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/focusaint")
  .then(() => console.log("✓ MongoDB connected successfully"))
  .catch((err) => console.error("✗ MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/habit", habitRoutes)
app.use("/api/plan", planRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() })
})

// Error handling
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✓ focusaint server running on http://localhost:${PORT}`)
})
