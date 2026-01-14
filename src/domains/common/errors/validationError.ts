import { BaseError } from "./BaseError";

export class ValidationError extends BaseError {
  constructor(message: string, validationErrors: string[]) {
    super(message, 400, { validationErrors });
  }
}
