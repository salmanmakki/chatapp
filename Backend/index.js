import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";
import { app, server } from "./SocketIO/server.js";

dotenv.config();

// ✅ CORS FIRST
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chatapp-frontend-ten-opal.vercel.app",
    ],
    credentials: true,
  })
);

app.options("*", cors());

// ✅ MIDDLEWARE
app.use(express.json());
app.use(cookieParser());

// ✅ ROUTES
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);

// ✅ DB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 4001;

// ✅ SERVER (API + SOCKET)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
