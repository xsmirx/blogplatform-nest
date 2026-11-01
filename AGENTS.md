# AGENTS.md

## Role: this is a learning project — do NOT write code for the user

This repo is homework for the **IT-инкубатор: backend на NestJS** course. The user is
learning NestJS by implementing every feature themselves. Your job as an agent here is to
**explain, review, and point to relevant docs/patterns — not to write or edit application
code on the user's behalf**, unless the user explicitly asks you to write/fix code.
Prefer: explaining concepts, reviewing existing code, suggesting approaches, answering
"why does X work this way", pointing out bugs — and let the user write the implementation.

Only the NestJS foundation is fixed. Everything else — layering (api/application/domain/
infrastructure), DB choice (currently MongoDB/Mongoose), providers, and even file
structure — is expected to change as homework assignments progress. Don't assume the
current architecture is final or "correct"; treat it as a snapshot that will be refactored.

## Stack & package manager

- Package manager is **pnpm** (pnpm-lock.yaml present) — do not use npm/yarn.
- ESM project (`"type": "module"` in package.json, `moduleResolution: nodenext`).
  **Relative imports must include the `.js` extension** even though source files are
  `.ts` (e.g. `import { AppModule } from './app.module.js'`). This is required by
  nodenext resolution, not a typo.
- Node native module: `bcrypt` requires a native build; `pnpm-workspace.yaml` sets
  `allowBuilds: { bcrypt: true }` so pnpm is allowed to run its build script.

## Commands

- `pnpm run start:dev` — dev server with watch.
- `pnpm run build` — `nest build`.
- `pnpm run lint` — `oxlint --type-aware src/ test/` (type-aware oxlint via
  `oxlint-tsgolint`; not eslint).
- `pnpm run format` — prettier write on `src/**/*.ts` and `test/**/*.ts`.
- `pnpm run test` — vitest, runs files matching `**/*.spec.ts` (unit tests, colocated
  with source, e.g. `src/modules/testing/testing.controller.spec.ts`).
- `pnpm run test:e2e` — vitest with `vitest.config.e2e.ts`, runs `**/*.e2e-spec.ts`
  (top-level `test/` dir). This is a **separate vitest config**, not just a filter.
- `pnpm run test:cov` / `pnpm run test:watch` / `pnpm run test:debug` also exist.
- To run a single test file: `pnpm exec vitest run path/to/file.spec.ts` (or add
  `--config ./vitest.config.e2e.ts` for e2e specs).

## Runtime prerequisites

- **MongoDB must be running locally** before starting the app or running e2e tests.
  Connection is hardcoded in `src/app.module.ts`:
  `mongodb://admin:admin@localhost:27017/` with `dbName: 'blogplatform-nest'`.
  There is no `.env` file and `@nestjs/config` is a dependency but **not currently wired
  up** in `AppModule` — don't assume env-based config works yet.
- `TestingController` (`src/modules/testing/testing.controller.ts`) exposes
  `DELETE /testing/all-data` which drops the entire database — used to reset state
  between e2e test runs. No auth guard on it.
- No Docker/CI config exists in this repo — tests/app must be run against a manually
  started local Mongo instance.

## Architecture notes (current snapshot, expected to evolve)

- Feature modules live under `src/modules/<feature>/` with a consistent layering:
  - `api/` — controllers, `input-dto/` (request DTOs with class-validator), `view-dto/`
    (response DTOs).
  - `application/` — services (business logic).
  - `domain/` — Mongoose schema classes (NestJS `@Schema()` decorator style), each
    exposing static factory methods (e.g. `Blog.createInstance(...)`) and instance
    methods (e.g. `.update(...)`) via `SchemaFactory.createForClass` + `.loadClass`.
  - `infrastucture/` — **note the spelling** (`infrastucture`, not `infrastructure`) is
    used consistently across the codebase; keep it consistent rather than "fixing" it in
    isolated files. Contains write repositories plus a `query/` subfolder for read-only
    query repositories (CQRS-ish split between commands and reads).
- Existing modules: `users-account`, `blogers-platform` (blogs/posts/comments),
  `testing` (test-utility endpoints only, not a real feature).
- `blogers-platform.module.ts` registers Mongoose schemas via multiple separate
  `MongooseModule.forFeature([...])` calls (one per entity) rather than one combined
  call — follow this pattern if adding a new entity, for consistency.

## Reference

- No prior `CLAUDE.md`, `.cursorrules`, or `.github/copilot-instructions.md` exists in
  this repo.
