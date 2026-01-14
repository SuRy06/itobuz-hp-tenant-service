import "reflect-metadata";
import "./infrastructure/container";
import { CONFIG } from "./config/config";
import LOG from "./library/logging";
import { banner } from "./library/banner";
import createServer from "./bootstrap/server";
import { container } from "./infrastructure/container";
import { MongoDBConnectionManager } from "./infrastructure/database/mongodbmanager.service";

const app = createServer();

/** Start Server */
const StartServer = async () => {
  const mongoManager = container.resolve(MongoDBConnectionManager);
  try {
    LOG.info("Server is starting");
    banner();
    await mongoManager.connect();

    app.listen(CONFIG.SERVER.PORT, () => LOG.info(`Server is running on port ${CONFIG.SERVER.PORT}`));
  } catch (error) {
    LOG.error("Error starting server:", error);
    // Clean up resources before exit
    try {
      await mongoManager.disconnect();
    } catch (disconnectError) {
      LOG.error("Error disconnecting MongoDB:", disconnectError);
    }
    process.exit(1);
  }
};

/** Start the server */
StartServer();
