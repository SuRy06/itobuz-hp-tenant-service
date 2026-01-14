import { HttpError } from "../../../../src/domains/common/errors/http.error";

describe("HttpError", () => {
  it("should create an HttpError with statusCode and message", () => {
    const error = new HttpError(404, "Not Found");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not Found");
  });

  it("should handle 400 Bad Request error", () => {
    const error = new HttpError(400, "Bad Request");

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Bad Request");
  });

  it("should handle 401 Unauthorized error", () => {
    const error = new HttpError(401, "Unauthorized");

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Unauthorized");
  });

  it("should handle 403 Forbidden error", () => {
    const error = new HttpError(403, "Forbidden");

    expect(error.statusCode).toBe(403);
    expect(error.message).toBe("Forbidden");
  });

  it("should handle 500 Internal Server Error", () => {
    const error = new HttpError(500, "Internal Server Error");

    expect(error.statusCode).toBe(500);
    expect(error.message).toBe("Internal Server Error");
  });

  it("should maintain proper prototype chain", () => {
    const error = new HttpError(404, "Not Found");

    expect(Object.getPrototypeOf(error)).toBe(HttpError.prototype);
  });

  it("should be throwable and catchable", () => {
    expect(() => {
      throw new HttpError(400, "Bad Request");
    }).toThrow(HttpError);
  });

  it("should preserve error name", () => {
    const error = new HttpError(404, "Not Found");

    expect(error.name).toBe("Error");
  });
});
