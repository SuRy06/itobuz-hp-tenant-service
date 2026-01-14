/* istanbul ignore file */
import { createLogger, format, transports } from "winston";
import { CONFIG } from "../config/config";
import api from "@opentelemetry/api";

const logger = createLogger({
  level: CONFIG.LOG_LEVEL,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: CONFIG.SERVICE_NAME },
  transports: [new transports.File({ filename: `${CONFIG.SERVICE_NAME}-logs.log` })],
});

const consoleFormat = format.combine(
  format.printf(({ level, message, timestamp, ...meta }) => {
    // Format as key-value pairs inside {}
    const logObj = {
      timestamp,
      level,
      message,
      ...meta,
    };
    return JSON.stringify(logObj);
  })
);

logger.add(
  new transports.Console({
    format: consoleFormat,
  })
);

const addSpanEvent = <T>(message: T) => {
  const activeSpan = api.trace.getSpan(api.context.active());
  if (activeSpan) {
    activeSpan.addEvent(JSON.stringify(message));
  }
};

export const log = <T>(message: T) => {
  addSpanEvent(message);
  logger.info(message);
};

export const error = (message: string, err?: unknown) => {
  addSpanEvent(message);
  if (err instanceof Error) {
    logger.error(`${message} ${err.stack}`);
  } else if (err) {
    logger.error(`${message} ${JSON.stringify(err)}`);
  } else {
    logger.error(message);
  }
};

export const warn = <T>(message: T) => {
  addSpanEvent(message);
  logger.warn(message);
};

export const debug = <T>(message: T) => {
  addSpanEvent(message);
  logger.debug(message);
};

export const verbose = <T>(message: T) => {
  addSpanEvent(message);
  logger.verbose(message);
};

export default logger;
