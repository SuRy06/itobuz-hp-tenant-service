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
  transports: [],
});

// Log in all environments with the colorized simple format.
logger.add(
  new transports.Console({
    format: format.combine(format.colorize()),
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

export const error = <T>(message: T) => {
  addSpanEvent(message);
  logger.error(message);
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
