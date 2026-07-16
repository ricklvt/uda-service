# uda-service

TypeScript service. Node 24, pnpm, CommonJS, TypeScript run via `tsx` (dev) and
compiled with `tsc` (prod).

## Requirements

- Node.js >= 24
- pnpm (via corepack)

## Setup

```sh
corepack enable
pnpm install
cp .env.sample .env   # fill in MQTT_* and OPENAI_API_KEY
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Type-check the whole project (`tsc --noEmit`), then run `src/main.ts` via `tsx` with the telemetry bootstrap preloaded. Fails to start on any type error. |
| `pnpm build` | Compile `src/` to `dist/` with `tsc`. |
| `pnpm start` | Run the compiled `dist/main.js` with the bootstrap preloaded (`node -r`). |
| `pnpm typecheck` | Type-check only. |
| `pnpm test` | Run tests with vitest. |
| `pnpm lint` | Lint with eslint (type-checked ruleset). |

## Module setup

CommonJS (`"type": "commonjs"`), but `tsconfig` uses `module`/`moduleResolution:
nodenext` so TypeScript honors dependencies' `exports` maps while still emitting
CJS. This is required because the `@lvt` backend libraries (`@lvt/mqtt`,
`@lvt/logger`) are CommonJS/NestJS-oriented and do not work under pure ESM.

## Telemetry bootstrap

`src/bootstrap.ts` calls `@lvt/telemetry`'s `telemetryStart()`, which **must run
before any `Logger` is constructed and before instrumented libraries load**. It
is preloaded ahead of the entrypoint — `tsx --require ./src/bootstrap.ts` in dev,
`node -r ./dist/bootstrap.js` in prod (see the `dev`/`start` scripts and the
Dockerfile `CMD`) — not imported in-graph.

## AI Audio MQTT listener

`src/aiaudio/aiaudio.listener.ts` (`AIAudioRequestListener`) listens over MQTT for
the same requests the mediator service handles —
`GenerateAlertAudioCloudService.generateAudio`, one per liveunit
(`{ liveunitUuid: '+' }`). `@lvt/mqtt` decodes the protobuf and hands back a typed
`GenerateAudioRequest`; for now the handler just logs the decoded contents
(binary `cameraSnapshot` summarized as a byte count).

Connecting requires a reachable broker. Outside a local broker, `@lvt/mqtt`
requires TLS: set `MQTT_PROTO=mqtts` and `MQTTS_CA_PATH` / `MQTTS_KEY_PATH` /
`MQTTS_CERT_PATH` (plus `MQTT_HOST`, `MQTT_PORT`, `MQTT_USER`, `MQTT_PASSWORD`).
