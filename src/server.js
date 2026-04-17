import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { testDbConnection } from "./config/db.js";
import env from "./config/env.js";

async function startServer() {
  try {
    await testDbConnection();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: env.corsOrigin,
        credentials: true,
      },
    });

    app.set("io", io);

    io.on("connection", (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      socket.on("join:plant", ({ plantId }) => {
        if (plantId) {
          socket.join(`plant:${plantId}`);
        }
      });

      socket.on("join:user", ({ userId }) => {
        if (userId) {
          socket.join(`user:${userId}`);
        }
      });

      socket.on("leave:plant", ({ plantId }) => {
        if (plantId) {
          socket.leave(`plant:${plantId}`);
        }
      });

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    server.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      console.log(`⚡ Socket.IO enabled`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();