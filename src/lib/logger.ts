type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, use colorful console output with proper log levels
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';

      const formattedMessage = `${colors[level]}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`;

      // Use appropriate console method for each level
      switch (level) {
        case 'error':
          console.error(formattedMessage, context || '');
          break;
        case 'warn':
          console.warn(formattedMessage, context || '');
          break;
        default:
      }
    } else {
      // In production, use structured JSON logging
      // This can be parsed by log aggregation tools like Datadog, CloudWatch, etc.
      const logLine = JSON.stringify(logData);

      switch (level) {
        case 'error':
          console.error(logLine);
          break;
        case 'warn':
          console.warn(logLine);
          break;
        default:
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.formatMessage('debug', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.formatMessage('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.formatMessage('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };

    this.formatMessage('error', message, errorContext);
  }
}

export const logger = new Logger();
