Repository Guidelines
=====================

Project Structure & Module Organization
---------------------------------------
- Primary app lives in `src/app`; group new pages, components, services, and pipes under their existing folders to keep lazy-loaded modules tidy.
- Shared utilities go in `shared/` and should be re-exported through `shared/index.ts` so downstream imports stay centralized.
- Place static assets in `src/assets`, theme tokens in `src/theme`, and environment configs under `src/environments`; keep specs beside their features as `*.spec.ts`.

Build, Test, and Development Commands
-------------------------------------
- `npm install` — install local dependencies; rerun after `package.json` updates.
- `npm run start` (or `npm run start-max`) — launch Ionic/Angular dev server on port 4200 with live reload; the `-max` variant bumps Node memory.
- `npm run build-prod` — create the production bundle in `dist/Castor` for release verification.
- `npm run ng -- test --watch=false` — execute the full Jasmine/Karma suite once; prefer this before merging.
- `npx ng test --code-coverage` — generate coverage reports when shipping meaningful changes or touching core flows.

Coding Style & Naming Conventions
---------------------------------
- Use Angular defaults: TypeScript with two-space indentation, SCSS styling, and ESLint-compliant formatting (`npx eslint .` before commits).
- Follow kebab-case filenames (e.g., `link-editing-modal.component.ts`) and PascalCase class names; services end with `Service`, pipes with `Pipe`.
- Inject dependencies rather than newing singletons; share helpers via `shared/utilities`.

Testing Guidelines
------------------
- Keep specs deterministic and browser-friendly; stub network calls through Angular testing utilities.
- Name tests after the scenario and expectation (e.g., `should display scoped file list`).
- Address flaky tests immediately; aim for healthy coverage on new modules.

Commit & Pull Request Guidelines
--------------------------------
- Write imperative, concise commit subjects (~72 chars) such as “Add tenant summary widget”; tie in Jira/GitLab IDs when applicable.
- PRs must describe problem and solution, call out manual verification, and supply screenshots for UX updates.
- Confirm `npm run build-prod` and the full unit suite pass before requesting review.

Security & Configuration Tips
-----------------------------
- Keep secrets out of source control; use placeholders in `auth_config.json` and `src/environments/*.ts`.
- Store dev TLS certs (`cert.pem`, `key.pem`) locally; coordinate with ops before modifying `scripts/` deployment helpers or running AWS sync commands.
