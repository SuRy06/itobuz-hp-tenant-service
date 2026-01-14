import dotenv from "dotenv-safe";
import { ProjectConfiguration } from "../types/config";

dotenv.config({ allowEmptyValues: true });

const SERVER_PORT = process.env.SERVER_PORT
  ? Number(process.env.SERVER_PORT)
  : 1337;

const SERVICE_NAME = process.env.SERVICE_NAME ?? "GenericService";
const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";

const SESSION_REQUEST_TOKEN_TTL_SECONDS =
  Number(process.env.SESSION_REQUEST_TOKEN_TTL_SECONDS) || 60;

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI ?? "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "";
const MONGODB_POOL_SIZE = Number(process.env.MONGODB_POOL_SIZE);
const MONGODB_CONNECTION_TIMEOUT = Number(
  process.env.MONGODB_CONNECTION_TIMEOUT
);
const MONGODB_SOCKET_TIMEOUT = Number(process.env.MONGODB_SOCKET_TIMEOUT);
const MONGODB_SERVER_SELECTION_TIMEOUT = Number(
  process.env.MONGODB_SERVER_SELECTION_TIMEOUT
);
const MONGODB_HEARTBEAT_FREQUENCY = Number(
  process.env.MONGODB_HEARTBEAT_FREQUENCY
);

// OAUTH configuration
const OAUTH_SERVICE_URL = process.env.OAUTH_SERVICE_URL ?? "";

// AWS configuration
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN ?? "";
const AWS_REGION = process.env.AWS_REGION ?? "";

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY ?? "";
const JWT_ISSUER = process.env.JWT_ISSUER ?? "";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? "";
const JWT_AT_TTL_SECONDS = Number(process.env.JWT_AT_TTL_SECONDS) ?? "";

const MAX_SESSION_TTL_DAYS = 30; // 30-day maximum session lifetime

// this will contain global configs for the project
export const CONFIG: ProjectConfiguration = {
  SERVER: {
    PORT: SERVER_PORT,
  },
  SERVICE_NAME,
  LOG_LEVEL,
  MAX_SESSION_TTL_DAYS,
  MONGODB: {
    URI: MONGODB_URI,
    DB_NAME: MONGODB_DB_NAME,
    POOL_SIZE: MONGODB_POOL_SIZE,
    CONNECTION_TIMEOUT: MONGODB_CONNECTION_TIMEOUT,
    SOCKET_TIMEOUT: MONGODB_SOCKET_TIMEOUT,
    SERVER_SELECTION_TIMEOUT: MONGODB_SERVER_SELECTION_TIMEOUT,
    HEARTBEAT_FREQUENCY: MONGODB_HEARTBEAT_FREQUENCY,
  },
  OAUTH_SERVICE_URL: OAUTH_SERVICE_URL,
  AWS: {
    ROLE_ARN: AWS_ROLE_ARN,
    REGION: AWS_REGION,
  },
};
