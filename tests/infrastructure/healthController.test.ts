import "reflect-metadata";
import supertest from "supertest";
import createServer from "../../src/bootstrap/server";
import LOG from "../../src/library/logging";
import { container } from "tsyringe";
import { HealthController } from "../../src/infrastructure/health/healthController";
import { Request, Response, NextFunction } from "express";

jest.mock("../../src/library/logging");

describe("health", () => {
  let app: any;
  let originalHealthController: any;

  beforeEach(() => {
    // Store the original controller
    originalHealthController = container.resolve(HealthController);
    app = createServer();
  });

  afterEach(() => {
    // Restore the original controller
    container.registerInstance(HealthController, originalHealthController);
  });

  describe("health route", () => {
    it("should report the app as healthy", async () => {
      const { body, statusCode } = await supertest(app).get("/health");
      expect(statusCode).toBe(200);
      expect(body).toStrictEqual({
        status: "UP",
        /**
         * since the timestamp on the process and the running of the unit test are different
         * we can't use the process.uptime() method and instead we expect any string to be in property
         *
         * expect string as the toFixed(0) method returns a string
         */
        uptime: expect.any(Number),
      });
    });
  });

  describe("readiness route", () => {
    it("should return a 200 with the up response", async () => {
      const { body, statusCode } = await supertest(app).get("/health/readiness");

      expect(statusCode).toBe(200);
      expect(body).toStrictEqual({
        status: "UP",
        reasons: ["Service is ready"],
      });
    });
  });

  describe("HealthController direct calls", () => {
    it("should return uptime in healthCheck", () => {
      const healthController = new HealthController();
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      healthController.healthCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "UP",
        uptime: expect.any(Number),
      });
    });

    it("should return ready status in readinessCheck", async () => {
      const healthController = new HealthController();
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      await healthController.readinessCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "UP",
        reasons: ["Service is ready"],
      });
    });

    it("should handle errors in readinessCheck", async () => {
      const healthController = new HealthController();
      const req = {} as Request;
      const mockError = new Error("Service unavailable");

      let statusCallCount = 0;
      // Mock the response to throw an error on first json call, then work normally
      const res = {
        status: jest.fn().mockImplementation((statusCode) => {
          statusCallCount++;
          if (statusCallCount === 1) {
            return {
              json: jest.fn().mockImplementation(() => {
                throw mockError;
              }),
            };
          } else {
            return {
              json: jest.fn(),
            };
          }
        }),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      await healthController.readinessCheck(req, res, next);

      expect(LOG.error).toHaveBeenCalledWith(mockError);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
