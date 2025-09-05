# Repository Guidelines

## 必ず守ること
- 何か新しい実装や修正を加えたらdocs配下に`yyyymmdd_hhmm.md`というファイルを作成し、何を実装したかをまとめた日報を作成すること。
- タスクリストは.kiro/specs/配下のtask.mdを正とすること。

## Project Structure & Module Organization
- Source: `src/app` (Next.js App Router). Pages/layout live here: `page.tsx`, `layout.tsx`.
- Styles: `src/app/globals.css` (Tailwind CSS v4, CSS variables via `@theme inline`).
- Public assets: `public/` (SVGs, icons, PWA assets later).
- Config: `next.config.ts`, `tsconfig.json` (path alias `@/* -> src/*`), `eslint.config.mjs`.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server with Turbopack at `http://localhost:3000`.
- `npm run build`: Production build (Next.js 15, App Router).
- `npm start`: Serve the production build locally.
- `npm run lint`: ESLint over the project. Use `--fix` to auto‑format where possible.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Prefer explicit types on public APIs.
- Indentation: 2 spaces; semicolons required; single quotes OK but follow ESLint.
- React/Next: Server Components by default; colocate UI in `src/app` routes.
- Naming: components `PascalCase` (e.g., `NoteList.tsx`), utilities `camelCase` (e.g., `formatDate.ts`).
- Imports: use `@/` alias for internal modules; absolute over deep relative paths.
- Tailwind: prefer utility classes in JSX; keep global tokens in `globals.css`.

## Testing Guidelines
- No test runner is configured yet. When adding tests:
  - Unit: co‑locate as `*.test.ts`/`*.test.tsx` next to source.
  - E2E (optional): `playwright` under `e2e/`.
  - Aim for smoke coverage of key flows (input → save → list).
  - Example run (once added): `npm test`.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits where possible: `feat:`, `fix:`, `chore:`, `docs:`.
  - Example: `feat: add tag filters and today counter`.
- PRs: include summary, linked issue, before/after screenshot for UI, and notes on tradeoffs.
- Checks: ensure `npm run lint` and `npm run build` pass before requesting review.

## Security & Configuration Tips
- No secrets required for local dev; do not commit real tokens. Use `.env.local` for future keys.
- Data currently uses `localStorage` (see README). If adding network calls, handle failures and offline.

