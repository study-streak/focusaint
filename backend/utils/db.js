import mongoose from "mongoose"

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectToMongo() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    mongoose.set("bufferCommands", false)

    cached.promise = mongoose.connect(process.env.MONGODB_URI).then((mongoose) => {
      console.log("✓ MongoDB connected")
      return mongoose
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}