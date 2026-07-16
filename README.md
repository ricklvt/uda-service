# uda-service

TypeScript service. Node 24 (native TypeScript type-stripping), pnpm, ESM.

## Requirements

- Node.js >= 24 (native `.ts` execution; no ts-node/tsx)
- pnpm (via corepack)

## Setup

```sh
corepack enable
pnpm install
cp .env.sample .env   # fill in OPENAI_API_KEY
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Type-check the whole project (`tsc --noEmit`), then run `src/main.ts` natively. Fails to start on any type error. |
| `pnpm build` | Compile `src/` to `dist/` with `tsc`. |
| `pnpm start` | Run the compiled `dist/main.js`. |
| `pnpm typecheck` | Type-check only. |
| `pnpm test` | Run tests with vitest. |
| `pnpm lint` | Lint with eslint (type-checked ruleset). |

## Telemetry bootstrap

`src/bootstrap.ts` calls `@lvt/telemetry`'s `telemetryStart()`, which **must run
before the first `Logger` is constructed**. It is therefore preloaded ahead of
the entrypoint via `node --import` (see the `dev`/`start` scripts and the
Dockerfile `CMD`) rather than imported normally. Set `OTEL_DISABLED=1` to skip
OpenTelemetry init (console logging still works; vitest is auto-detected and
needs no bootstrap).

## Imports

Internal modules use relative imports with explicit `.ts` extensions:

```ts
import { getLogger } from './logger.ts';
```

Node runs the `.ts` directly; `tsc` rewrites the extension to `.js` in the
`dist/` output (`rewriteRelativeImportExtensions`). A `#/*` path alias was
evaluated and dropped: it resolves in node/vitest but **not** in `tsc`, which
rejects `.ts`-target `imports` maps.
