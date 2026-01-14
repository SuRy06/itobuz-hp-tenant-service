import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../src/infrastructure/middleware/validateRequest.middleware";
import Joi from "joi";

describe("validateRequest Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const schema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number().integer().min(0),
  });

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should call next() for valid requests", () => {
    mockRequest.body = { name: "John Doe", age: 30 };

    validateRequest(schema)(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid requests", () => {
    mockRequest.body = { name: "", age: -5 };

    validateRequest(schema)(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Validation error",
      details: expect.arrayContaining([
        expect.stringContaining('"name" is not allowed to be empty'),
        expect.stringContaining('"age" must be greater than or equal to 0'),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
