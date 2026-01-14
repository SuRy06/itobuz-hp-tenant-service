export class AuthorizationError extends Error {
  public readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 401;
  }
}
