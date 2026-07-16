import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  } : undefined,
});

/**
 * Standardiseret fejlhåndtering til hele applikationen.
 * Her kan vi integrere Sentry ved at kalde Sentry.captureException(error).
 */
export function logError(message: string, error: any, context?: Record<string, any>) {
  logger.error({ err: error, context }, message);
}
