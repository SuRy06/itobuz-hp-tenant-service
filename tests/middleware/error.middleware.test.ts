import { Request, Response, NextFunction } from "express";
import { notFoundMiddleware, globalErrorMiddleware } from "../../src/infrastructure/middleware/error.middleware";
import LOG from "../../src/library/logging";

jest.mock("../../src/library/logging");

describe("Error Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();

    mockRequest = {
      originalUrl: "/test-path",
      method: "GET",
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe("notFoundMiddleware", () => {
    it("should return 404 status and not found message", () => {
      // Act
      notFoundMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(LOG.warn).toHaveBeenCalledWith("not_found", { path: "/test-path" });
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: "Not found" });
    });

    it("should handle requests with different URLs", () => {
      // Arrange
      mockRequest.originalUrl = "/api/invalid-endpoint";

      // Act
      notFoundMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(LOG.warn).toHaveBeenCalledWith("not_found", { path: "/api/invalid-endpoint" });
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: "Not found" });
    });
  });

  describe("globalErrorMiddleware", () => {
    it("should handle errors with statusCode and message", () => {
      // Arrange
      const error = {
        statusCode: 400,
        message: "Bad Request",
      };

      // Act
      globalErrorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(LOG.warn).toHaveBeenCalledWith("client_error", {
        method: "GET",
        url: "/test-path",
        status: 400,
        error: {
          message: "Bad Request",
          name: undefined,
        },
      });
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: "Bad Request" });
    });

    it("should handle errors without statusCode (default to 500)", () => {
      // Arrange
      const error = {
        message: "Custom error message",
      };

      // Act
      globalErrorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(LOG.error).toHaveBeenCalledWith(
        "server_error",
        expect.objectContaining({
          method: "GET",
          url: "/test-path",
          status: 500,
          error: {
            message: "Custom error message",
            name: undefined,
          },
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Custom error message" });
    });

    it("should handle errors without message (default to 'Internal server error')", () => {
      // Arrange
      const error = {
        statusCode: 422,
      };

      // Act
      globalErrorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(LOG.warn).toHaveBeenCalledWith("client_error", {
        method: "GET",
        url: "/test-path",
        status: 422,
        error: {
          message: undefined,
          name: undefined,
        },
      });
      expect(mockStatus).toHaveBeenCalledWith(422);
      expect(mockJson).toHaveBeenCalledWith({ message: "Internal server error" });
    });

    it("should handle errors with invalid statusCode (default to 500)", () => {
      // Arrange
      const error = {
        statusCode: "invalid",
        message: "Error with invalid status code",
      };

      // Act
      globalErrorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(LOG.error).toHaveBeenCalledWith(
        "server_error",
        expect.objectContaining({
          method: "GET",
          url: "/test-path",
          status: 500,
          error: {
            message: "Error with invalid status code",
            name: undefined,
          },
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Error with invalid status code" });
    });

    it("should handle null/undefined errors", () => {
      // Arrange
      const error = null;

      // Act
      globalErrorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(LOG.error).toHaveBeenCalledWith(
        "server_error",
        expect.objectContaining({
          method: "GET",
          url: "/test-path",
          status: 500,
          error: {
            message: undefined,
            name: undefined,
          },
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Internal server error" });

      // Test for undefined
      const undefinedError = undefined;
      globalErrorMiddleware(undefinedError, mockRequest as Request, mockResponse as Response, mockNext);
      expect(LOG.error).toHaveBeenCalledWith(
        "server_error",
        expect.objectContaining({
          status: 500,
          error: {
            message: undefined,
            name: undefined,
          },
        })
      );
    });

    it("should handle different HTTP methods and URLs", () => {
      // Arrange
      mockRequest.method = "POST";
      mockRequest.originalUrl = "/api/users";
      const error = {
        statusCode: 403,
        message: "Forbidden",
      };

      // Act
      globalErrorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(LOG.warn).toHaveBeenCalledWith("client_error", {
        method: "POST",
        url: "/api/users",
        status: 403,
        error: {
          message: "Forbidden",
          name: undefined,
        },
      });
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    it("should handle Error instances", () => {
      // Arrange
      const error = new Error("Standard Error instance");

      // Act
      globalErrorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(LOG.error).toHaveBeenCalledWith(
        "server_error",
        expect.objectContaining({
          method: "GET",
          url: "/test-path",
          status: 500,
          error: {
            message: "Standard Error instance",
            name: "Error",
          },
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Standard Error instance" });
    });
  });
});
