import winston, { Logger, LoggerOptions } from "winston";

// 1. Define custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    httpreq: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    httpreq: "magenta",
    debug: "blue",
  },
};

// 2. Extend logger types
export interface AppLogger extends Logger {
  httpreq: winston.LeveledLogMethod;
  logAPIRequest(req: Request, res: Response, duration: number): void;
  logAPIStart(req: Request): void;
}

// 3. Register colors
winston.addColors(customLevels.colors);

// 4. Logger options with new layout
const loggerOptions: LoggerOptions = {
  levels: customLevels.levels,
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const color = winston.format.colorize().colorize;

      const metaString =
        Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";

      // ✔ Format exactly as requested:
      // INFO 2025-11-22T10:20:01.719Z : message
      return `${color(level, level.toUpperCase())} ${timestamp} : ${message} ${metaString}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
};

// 5. Create l0ogger
const baseLogger = winston.createLogger(loggerOptions) as AppLogger;

export const logger = baseLogger;
