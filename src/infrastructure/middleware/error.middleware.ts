import { Request, Response, NextFunction } from "express";
import logger from "../../library/logging";

// 404 middleware (minimal)
export const notFoundMiddleware = (req: Request, res: Response, _next: NextFunction) => {
  logger.warn("not_found", { path: req.originalUrl });
  res.status(404).json({ message: "Not found" });
};

// Global error middleware
export const globalErrorMiddleware = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = err?.message || "Internal server error";

  // Sanitize the error object for logging
  const errorForLog = {
    message: err?.message,
    name: err?.name,
    // Include any other relevant properties from the original error, if they exist
    ...(err?.response?.data && { responseData: err.response.data }),
  };

  if (status >= 500) {
    const logMetadata = {
      method: req.method,
      url: req.originalUrl,
      status,
      error: errorForLog,
      stack: err?.stack,
    };
    logger.error("server_error", logMetadata);
  } else {
    const logMetadata = {
      method: req.method,
      url: req.originalUrl,
      status,
      error: errorForLog,
    };
    logger.warn("client_error", logMetadata);
  }

  res.status(status).json({ message });
};
