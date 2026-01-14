import mongoose from "mongoose";
import { injectable } from "tsyringe";
import LOG from "../../library/logging";
import { AWSCredentials } from "../aws/types";
import { AWSSTSService } from "../aws/AWSSTSService";
import { CONFIG } from "../../config/config";

@injectable()
export class MongoDBConnectionManager {
  private connection: mongoose.Connection | null = null;
  private credentials: AWSCredentials | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_MARGIN_MS = 4 * 60 * 1000; // 4 minutes
  private isConnecting = false;

  constructor(private readonly awsSTSService: AWSSTSService) {}

  async connect(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.connection) {
      LOG.warn("MongoDB connection already exists, skipping connect()");
      return;
    }

    if (this.isConnecting) {
      LOG.warn("MongoDB connection in progress, skipping duplicate connect()");
      return;
    }

    this.isConnecting = true;
    try {
      await this.initializeConnection();
      if (process.env.NODE_ENV === "production") {
        this.setupConnectionMonitoring();
        this.scheduleCredentialRefresh();
      }
    } catch (error) {
      LOG.error("Failed to connect to MongoDB:", error);
      this.isConnecting = false;
      throw error;
    }
    this.isConnecting = false;
  }

  private async initializeConnection(): Promise<void> {
    let uri: string;

    if (process.env.NODE_ENV === "production") {
      const credentials = await this.awsSTSService.getTemporaryCredentials();
      this.credentials = credentials;
      uri = this.buildMongoUri(credentials);
    } else {
      // Development: use full URI from config
      uri = CONFIG.MONGODB.URI + CONFIG.MONGODB.DB_NAME;
      if (!uri || (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))) {
        throw new Error(
          "MONGODB_URI must be a valid connection string starting with mongodb:// or mongodb+srv:// in non-production environments"
        );
      } else {
        LOG.info("MongoDB Database connected to URI: " + uri);
      }
    }

    this.connection = mongoose.createConnection(uri);
    await this.connection.asPromise();
    LOG.info("MongoDB connection established successfully");
  }

  private setupConnectionMonitoring(): void {
    if (!this.connection) return;

    this.connection.on("error", (error) => {
      LOG.error("MongoDB connection error:", error);
    });

    this.connection.on("disconnected", () => {
      LOG.warn("MongoDB disconnected");
    });

    this.connection.on("reconnected", () => {
      LOG.info("MongoDB reconnected");
    });

    this.connection.on("close", () => {
      LOG.info("MongoDB connection closed");
    });
  }

  private scheduleCredentialRefresh(): void {
    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
    }

    if (!this.credentials) {
      LOG.warn("No credentials available for MongoDB refresh, will retry in 1 minute.");
      this.refreshInterval = setTimeout(() => {
        this.scheduleCredentialRefresh();
      }, 60 * 1000); // retry in 1 minute
      return;
    }
    LOG.info(`Scheduling MongoDB credential refresh at ${this.credentials.expiration.getTime()}`);
    const timeUntilRefresh = this.credentials.expiration.getTime() - Date.now() - this.REFRESH_MARGIN_MS;

    const safeTime = Math.max(timeUntilRefresh, 30 * 1000); // minimum 30 seconds, prevent negative value

    this.refreshInterval = setTimeout(async () => {
      try {
        await this.refreshConnection();
      } catch (error) {
        LOG.error("Error refreshing MongoDB connection, will retry in 1 minute:", error);
        // if refresh fails, retry in 1 minute
        this.refreshInterval = setTimeout(() => {
          this.scheduleCredentialRefresh();
        }, 60 * 1000);
      }
    }, safeTime);
  }

  private async refreshConnection(): Promise<void> {
    LOG.info("MongoDB credentials expired, refreshing...");
    if (process.env.NODE_ENV !== "production") return;

    try {
      const newCredentials = await this.awsSTSService.getTemporaryCredentials();
      const newUri = this.buildMongoUri(newCredentials);

      const newConnection = mongoose.createConnection(newUri);
      await newConnection.asPromise();

      // Close old connection
      if (this.connection) {
        await this.connection.close();
      }

      this.connection = newConnection;
      this.credentials = newCredentials;

      LOG.info("MongoDB connection refreshed successfully");
      this.scheduleCredentialRefresh();
    } catch (error) {
      LOG.error("Error refreshing MongoDB connection:", error);
      throw error;
    }
  }

  private buildMongoUri(credentials: AWSCredentials): string {
    const username = encodeURIComponent(credentials.accessKeyId);
    const password = encodeURIComponent(credentials.secretAccessKey);
    const sessionToken = encodeURIComponent(credentials.sessionToken);

    const dbName = CONFIG.MONGODB.DB_NAME;

    const uri = `mongodb+srv://${username}:${password}@${CONFIG.MONGODB.URI}/${dbName}?authSource=%24external&authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN:${sessionToken}`;
    LOG.info(`MongoDB connect to database: ${dbName}`); // Do not log full URI
    return uri;
  }

  getConnection(): mongoose.Connection {
    if (!this.connection) {
      throw new Error("MongoDB connection not initialized");
    }
    return this.connection;
  }

  isConnected(): boolean {
    return this.connection?.readyState === 1; // 1 = connected
  }

  async disconnect(): Promise<void> {
    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
      this.refreshInterval = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    this.credentials = null;
    this.isConnecting = false;
    LOG.info("MongoDB disconnected successfully");
  }
}
