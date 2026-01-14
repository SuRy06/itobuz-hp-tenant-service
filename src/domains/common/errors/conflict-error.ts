export class ConflictError extends Error {
  public readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
  }
}
