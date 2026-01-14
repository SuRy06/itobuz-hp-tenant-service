import type { Config } from "@jest/types";
import "reflect-metadata";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/**/*.test.ts"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFiles: ["<rootDir>/.jest/setEnvVars.ts"],
  collectCoverage: true,
  coverageReporters: ["text", "lcov", "clover"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coveragePathIgnorePatterns: [
    "src/infrastructure/services/api.service.ts",
    "src/generated/",
    "opaque-ke/",
    "src/infrastructure/database/mongodbmanager.service.ts",
  ],
  testPathIgnorePatterns: ["<rootDir>/opaque-ke/", "opaque-ke/"],
  modulePathIgnorePatterns: ["<rootDir>/opaque-ke/", "opaque-ke/"],
};

export default config;
