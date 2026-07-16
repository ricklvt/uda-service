// Bootstraps OpenTelemetry before any Logger/Winston usage.
// Preloaded ahead of the entrypoint via `node --import ./dist/bootstrap.js`
// (dev: `node --import ./src/bootstrap.ts`). telemetryStart() must run before
// the first Logger is constructed, so this cannot be a normal in-graph import.
import 'dotenv/config';

import {
  InstrumentType,
  Instrumentation,
  TelemetryOptions,
  Temporality,
  telemetryStart
} from '@lvt/telemetry/start';
 

process.env.APP_NAME ??= 'uda-service-dev';
process.env.LOG_LEVEL ??= 'debug';

telemetryStart(TelemetryOptions.create()
  .metricsTemporality(Temporality.DELTA)
  .metrics((m) =>
    m
      .view({
        instrumentType: InstrumentType.GAUGE,
        aggregationCardinalityLimit: 15000,
      })
      .view({
        instrumentType: InstrumentType.COUNTER,
        aggregationCardinalityLimit: 15000,
      }),)
  .instrumentations((i) =>
    i
      .disable(Instrumentation.FS) // Original explicitly disabled
      .disable(Instrumentation.KNEX) // Original explicitly disabled
      .withConfig(Instrumentation.HTTP, {
        ignoreIncomingRequestHook: (request: { url?: string }) => request.url === '/health',
      })
      .disable(Instrumentation.EXPRESS) // Original explicitly disabled
      .disable(Instrumentation.UNDICI) // Original explicitly disabled
      .disable(Instrumentation.NET) // Original explicitly disabled
      .disable(Instrumentation.DNS) // Original explicitly disabled
      .withConfig(Instrumentation.GRAPHQL, {
        depth: 0,
        ignoreTrivialResolveSpans: true,
      })
      .disable(Instrumentation.IOREDIS), // Original explicitly disabled
  ));
