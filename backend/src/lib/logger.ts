/**
 * Minimal console-based logger. Intentionally not a logging library — no
 * dependency is introduced (a library choice would need explicit sign-off).
 * Swap the internals here later if structured logging is wanted.
 */
type LogMeta = Record<string, unknown> | unknown;

function emit(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: LogMeta): void {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  if (meta === undefined) {
    console[level](line);
  } else {
    console[level](line, meta);
  }
}

export const logger = {
  info: (message: string, meta?: LogMeta) => emit('info', message, meta),
  warn: (message: string, meta?: LogMeta) => emit('warn', message, meta),
  error: (message: string, meta?: LogMeta) => emit('error', message, meta),
  debug: (message: string, meta?: LogMeta) => emit('debug', message, meta),
};
