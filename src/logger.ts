import { Logger, LogLevel, isLogLevel } from '@lvt/telemetry';
import type { LogMeta, LvtLogger } from '@lvt/telemetry';

export { Logger, LogLevel, isLogLevel };
export type { LogMeta, LvtLogger };

export function getLogger(context: string): Logger {
  return new Logger(context);
}
