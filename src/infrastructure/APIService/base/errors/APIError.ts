export class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly data?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}
