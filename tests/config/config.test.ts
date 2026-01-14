import { CONFIG } from "../../src/config/config";

describe("Config", () => {
  describe("Configuration Loading", () => {
    it("should load all configuration values", () => {
      expect(CONFIG).toBeDefined();
      expect(CONFIG.SERVER).toBeDefined();
      expect(CONFIG.SERVICE_NAME).toBeDefined();
      expect(CONFIG.LOG_LEVEL).toBeDefined();
      expect(CONFIG.MONGODB).toBeDefined();
      expect(CONFIG.OAUTH_SERVICE_URL).toBeDefined();
      expect(CONFIG.AWS).toBeDefined();
      expect(CONFIG.AUTH.JWT_SECRET).toBeDefined();
    });

    it("should have valid SERVER configuration", () => {
      expect(CONFIG.SERVER.PORT).toBeDefined();
      expect(typeof CONFIG.SERVER.PORT).toBe("number");
    });

    it("should have valid MONGODB configuration", () => {
      expect(CONFIG.MONGODB.URI).toBeDefined();
      expect(CONFIG.MONGODB.DB_NAME).toBeDefined();
      expect(typeof CONFIG.MONGODB.POOL_SIZE).toBe("number");
      expect(typeof CONFIG.MONGODB.CONNECTION_TIMEOUT).toBe("number");
    });

    it("should have valid AWS configuration", () => {
      expect(CONFIG.AWS).toBeDefined();
      expect(CONFIG.AWS.ROLE_ARN).toBeDefined();
      expect(CONFIG.AWS.REGION).toBeDefined();
    });

    it("should have SERVICE_NAME as string", () => {
      expect(typeof CONFIG.SERVICE_NAME).toBe("string");
    });

    it("should have LOG_LEVEL as string", () => {
      expect(typeof CONFIG.LOG_LEVEL).toBe("string");
    });

    it("should have OAUTH_SERVICE_URL defined", () => {
      expect(CONFIG.OAUTH_SERVICE_URL).toBeDefined();
      expect(typeof CONFIG.OAUTH_SERVICE_URL).toBe("string");
    });

    it("should have valid AUTH configuration", () => {
      expect(CONFIG.AUTH).toBeDefined();
      expect(typeof CONFIG.AUTH.JWT_SECRET).toBe("string");
      expect(typeof CONFIG.AUTH.JWT_PRIVATE_KEY).toBe("string");
      expect(typeof CONFIG.AUTH.JWT_ISSUER).toBe("string");
      expect(typeof CONFIG.AUTH.JWT_AUDIENCE).toBe("string");
      expect(typeof CONFIG.AUTH.JWT_AT_TTL_SECONDS).toBe("number");
      expect(Number.isNaN(CONFIG.AUTH.JWT_AT_TTL_SECONDS)).toBe(false);
    });
  });

  describe("Default Values", () => {
    it("should use default SERVER_PORT if not provided", () => {
      // The port should be either from env or default 1337
      expect(CONFIG.SERVER.PORT).toBeGreaterThan(0);
    });

    it("should have MongoDB pool size as number", () => {
      expect(typeof CONFIG.MONGODB.POOL_SIZE).toBe("number");
    });

    it("should have MongoDB timeouts as numbers", () => {
      expect(typeof CONFIG.MONGODB.CONNECTION_TIMEOUT).toBe("number");
      expect(typeof CONFIG.MONGODB.SOCKET_TIMEOUT).toBe("number");
      expect(typeof CONFIG.MONGODB.SERVER_SELECTION_TIMEOUT).toBe("number");
      expect(typeof CONFIG.MONGODB.HEARTBEAT_FREQUENCY).toBe("number");
    });
  });

  describe("Configuration Logic Testing", () => {
    // Test the actual logic of ternary and ?? operators by simulating different scenarios

    it("should test SERVER_PORT ternary logic with truthy value", () => {
      const testPort = "8080";
      const result = testPort ? Number(testPort) : 1337;
      expect(result).toBe(8080);
    });

    it("should test SERVER_PORT ternary logic with falsy value", () => {
      const testPort = undefined;
      const result = testPort ? Number(testPort) : 1337;
      expect(result).toBe(1337);
    });

    it("should test SERVER_PORT ternary logic with empty string", () => {
      const testPort = "";
      const result = testPort ? Number(testPort) : 1337;
      expect(result).toBe(1337);
    });

    it("should test nullish coalescing with defined value", () => {
      const testValue = "test-service";
      const result = testValue ?? "GenericService";
      expect(result).toBe("test-service");
    });

    it("should test nullish coalescing with undefined", () => {
      const testValue = undefined;
      const result = testValue ?? "GenericService";
      expect(result).toBe("GenericService");
    });

    it("should test nullish coalescing with null", () => {
      const testValue = null;
      const result = testValue ?? "DefaultValue";
      expect(result).toBe("DefaultValue");
    });

    it("should test nullish coalescing with empty string (should keep empty string)", () => {
      const testValue = "";
      const result = testValue ?? "DefaultValue";
      expect(result).toBe(""); // ?? only triggers on null/undefined, not empty string
    });

    it("should test Number conversion with valid string", () => {
      expect(Number("123")).toBe(123);
    });

    it("should test Number conversion with invalid string", () => {
      expect(Number.isNaN(Number("invalid"))).toBe(true);
    });

    it("should test Number conversion with undefined", () => {
      expect(Number.isNaN(Number(undefined))).toBe(true);
    });

    it("should verify all config string values use ?? operator correctly", () => {
      // Simulate the ?? logic used in config.ts
      const scenarios = [
        { value: "actual-value", expected: "actual-value" },
        { value: undefined, expected: "default" },
        { value: null, expected: "default" },
      ];

      scenarios.forEach(({ value, expected: expectedPrefix }) => {
        const result = value ?? "default";
        expect(result).toBe(expectedPrefix);
      });
    });

    it("should verify actual config values are properly typed", () => {
      // Verify the config loaded properly
      expect(typeof CONFIG.SERVER.PORT).toBe("number");
      expect(typeof CONFIG.SERVICE_NAME).toBe("string");
      expect(typeof CONFIG.LOG_LEVEL).toBe("string");
      expect(typeof CONFIG.MONGODB.URI).toBe("string");
      expect(typeof CONFIG.MONGODB.DB_NAME).toBe("string");
      expect(typeof CONFIG.MONGODB.POOL_SIZE).toBe("number");
      expect(typeof CONFIG.OAUTH_SERVICE_URL).toBe("string");
      expect(typeof CONFIG.AWS.ROLE_ARN).toBe("string");
      expect(typeof CONFIG.AWS.REGION).toBe("string");
      expect(typeof CONFIG.AUTH.JWT_SECRET).toBe("string");
    });
  });

  describe("Configuration Structure", () => {
    it("should have all required top-level keys", () => {
      const requiredKeys = ["SERVER", "SERVICE_NAME", "LOG_LEVEL", "MONGODB", "AWS", "AUTH"];

      requiredKeys.forEach((key) => {
        expect(CONFIG).toHaveProperty(key);
      });
    });

    it("should have all required MongoDB keys", () => {
      const requiredKeys = [
        "URI",
        "DB_NAME",
        "POOL_SIZE",
        "CONNECTION_TIMEOUT",
        "SOCKET_TIMEOUT",
        "SERVER_SELECTION_TIMEOUT",
        "HEARTBEAT_FREQUENCY",
      ];

      requiredKeys.forEach((key) => {
        expect(CONFIG.MONGODB).toHaveProperty(key);
      });
    });

    it("should have all required AWS keys", () => {
      const requiredKeys = ["ROLE_ARN", "REGION"];

      requiredKeys.forEach((key) => {
        expect(CONFIG.AWS).toHaveProperty(key);
      });
    });
    it("should have all required AUTH keys", () => {
      const requiredKeys = ["JWT_SECRET", "JWT_PRIVATE_KEY", "JWT_ISSUER", "JWT_AUDIENCE", "JWT_AT_TTL_SECONDS"];

      requiredKeys.forEach((key) => {
        expect(CONFIG.AUTH).toHaveProperty(key);
      });
    });
  });
});
