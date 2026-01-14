export class APIError extends Error {
  constructor(
    message: string,
    public readonly data?: any,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "APIError";
  }
}
