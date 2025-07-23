import winston from 'winston';
import 'winston-daily-rotate-file';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define which transports to use based on environment
const transports = [];

// Console transport for all environments (silenced in test)
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  );
} else {
  // Silent transport for tests to prevent Winston warnings
  transports.push(
    new winston.transports.Console({
      silent: true
    })
  );
}

// File transports for non-test environments
if (process.env.NODE_ENV !== 'test') {
  // Error log file
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: join(__dirname, '../../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error'
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: join(__dirname, '../../logs/combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// Helper functions for specific use cases
export const logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  });
};

export const logPaymentEvent = (event, data) => {
  logger.info({
    message: `Payment event: ${event}`,
    category: 'payment',
    ...data
  });
};

export const logAuthEvent = (event, userId, details = {}) => {
  logger.info({
    message: `Auth event: ${event}`,
    category: 'auth',
    userId,
    ...details
  });
};

export const logSecurityEvent = (event, details) => {
  logger.warn({
    message: `Security event: ${event}`,
    category: 'security',
    ...details
  });
};

export default logger;