import app from "./app.js";
import { testDbConnection } from "./config/db.js";
import env from "./config/env.js";

async function startServer() {
  try {
    await testDbConnection();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();