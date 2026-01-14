export class BaseError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}
