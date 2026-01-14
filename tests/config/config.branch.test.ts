/**
 * Test config.ts branch coverage by loading config with different environment states
 * This test must run in isolation to properly test default values
 */

// Store original env values
const originalEnv = { ...process.env };

describe("Config Branch Coverage", () => {
  beforeAll(() => {
    // Clear specific env variables before loading config
    delete process.env.SERVER_PORT;
    delete process.env.SERVICE_NAME;
    delete process.env.LOG_LEVEL;
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_DB_NAME;
    delete process.env.OAUTH_SERVICE_URL;
    delete process.env.AWS_ROLE_ARN;
    delete process.env.AWS_REGION;
    delete process.env.JWT_SECRET;
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it("should load config with default values when env vars are missing", () => {
    // Clear module cache and mock dotenv to prevent loading .env file
    jest.isolateModules(() => {
      // Mock dotenv-safe to do nothing
      jest.doMock("dotenv-safe", () => ({
        config: jest.fn(),
      }));

      // Now require the config module
      const { CONFIG } = require("../../src/config/config");

      // Test default values (the right side of ?? and ternary operators)
      expect(CONFIG.SERVER.PORT).toBe(1337);
      expect(CONFIG.SERVICE_NAME).toBe("GenericService");
      expect(CONFIG.LOG_LEVEL).toBe("info");
      expect(CONFIG.MONGODB.URI).toBe("");
      expect(CONFIG.MONGODB.DB_NAME).toBe("");
      expect(CONFIG.OAUTH_SERVICE_URL).toBe("");
      expect(CONFIG.AWS.ROLE_ARN).toBe("");
      expect(CONFIG.AWS.REGION).toBe("");
      expect(CONFIG.AUTH.JWT_SECRET).toBe("");
    });
  });

  it("should load config with env values when they are provided", () => {
    jest.isolateModules(() => {
      // Set env values
      process.env.SERVER_PORT = "3000";
      process.env.SERVICE_NAME = "test-service";
      process.env.LOG_LEVEL = "debug";
      process.env.MONGODB_URI = "mongodb://test";
      process.env.MONGODB_DB_NAME = "testdb";
      process.env.OAUTH_SERVICE_URL = "https://oauth.test";
      process.env.AWS_ROLE_ARN = "arn:aws:test";
      process.env.AWS_REGION = "us-east-1";
      process.env.JWT_SECRET = "test-secret";

      // Mock dotenv-safe
      jest.doMock("dotenv-safe", () => ({
        config: jest.fn(),
      }));

      const { CONFIG } = require("../../src/config/config");

      // Test that env values are used (left side of ?? and ternary)
      expect(CONFIG.SERVER.PORT).toBe(3000);
      expect(CONFIG.SERVICE_NAME).toBe("test-service");
      expect(CONFIG.LOG_LEVEL).toBe("debug");
      expect(CONFIG.MONGODB.URI).toBe("mongodb://test");
      expect(CONFIG.MONGODB.DB_NAME).toBe("testdb");
      expect(CONFIG.OAUTH_SERVICE_URL).toBe("https://oauth.test");
      expect(CONFIG.AWS.ROLE_ARN).toBe("arn:aws:test");
      expect(CONFIG.AWS.REGION).toBe("us-east-1");
      expect(CONFIG.AUTH.JWT_SECRET).toBe("test-secret");

      // Clean up for next test
      delete process.env.SERVER_PORT;
      delete process.env.SERVICE_NAME;
      delete process.env.LOG_LEVEL;
      delete process.env.MONGODB_URI;
      delete process.env.MONGODB_DB_NAME;
      delete process.env.OAUTH_SERVICE_URL;
      delete process.env.AWS_ROLE_ARN;
      delete process.env.AWS_REGION;
      delete process.env.JWT_SECRET;
    });
  });
});
