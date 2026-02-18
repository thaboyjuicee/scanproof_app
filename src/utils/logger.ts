export const logger = {
  info: (message: string, details?: unknown): void => {
    console.log(`[INFO] ${message}`, details ?? '');
  },
  warn: (message: string, details?: unknown): void => {
    console.warn(`[WARN] ${message}`, details ?? '');
  },
  error: (message: string, details?: unknown): void => {
    console.error(`[ERROR] ${message}`, details ?? '');
  },
};
