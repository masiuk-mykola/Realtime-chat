This repository is a Next.js (App Router) TypeScript app wired to Supabase (auth, Realtime, and Postgres).
Follow these concise, actionable rules when editing or generating code for this project.

1. Big picture

- App framework: Next.js 13+ using the App Router (see `app/layout.tsx`, `app/page.tsx`).
- Backend: Supabase used both in the browser and on the server via `@supabase/ssr`/`@supabase/supabase-js`.
- Pattern: client-side code uses `src/services/supabase/client.ts`; server-side code and server actions use `src/services/supabase/server.ts` and `createAdminClient()` for privileged operations.

2. Key files to inspect before changing behavior

- `src/services/supabase/client.ts` — browser client (use in client components/hooks).
- `src/services/supabase/server.ts` — createServerClient helpers (used in server components/actions). DO NOT make this global in Fluid compute; create per-request.
- `src/services/supabase/middleware.ts` — session middleware. Important: always return the `supabaseResponse` object and preserve cookies as described in comments.
- `src/services/supabase/actions/*.ts` — server actions (example: `actions/rooms.ts`) use `createAdminClient()` and `use server`.
- `src/services/supabase/hooks/useCurrentuser.ts` — example of client-side auth subscription and unsubscribe pattern.
- `src/services/supabase/components/login-form.tsx` and `logout-button.tsx` — canonical examples for OAuth flows and sign out.
- `src/services/supabase/types/database.ts` — generated DB types. Regenerate with `npm run gen-types` when schema changes.

3. Important conventions & gotchas (do not ignore)

- Always create server Supabase clients per-request. Avoid singletons/globals for server clients (`createServerClient` should be called inside each request handler). See `server.ts` comment.
- Never run code between `createServerClient(...)` and `await supabase.auth.getClaims()` in middleware — doing so can cause hard-to-debug session/log out issues.
- When updating middleware responses, preserve cookies: either return the provided `supabaseResponse` or copy its cookies into your new response. Breaking this will desync browser/server sessions.
- Use `createAdminClient()` (secret key) only in server-only code (server actions, API routes, or server components). Do not expose the secret key to the browser.
- Server actions that mutate DB should be marked `"use server"` (see `src/services/supabase/actions/rooms.ts`). Use `redirect()` from `next/navigation` for flow control after server actions.

4. Realtime patterns

- Realtime channel naming conventions (see `.github/prompts/use-realtime.prompt.md` for examples):
  - `room:{roomId}:messages` for per-room messages
  - `user:{userId}:notifications` for user-specific channels
- Always call `await supabase.realtime.setAuth()` on the server/client when establishing authenticated realtime connections (examples in prompts and components).

5. DB, migrations, and RLS

- DB types are generated to `src/services/supabase/types/database.ts` using `npm run gen-types`.
- This repo includes prompt templates for SQL and RLS under `.github/prompts/`. Use them as authoritative source for RLS/migration style (for example, `.github/prompts/create-rls-policies.prompt.md`).

6. Scripts and common commands

- Dev: `npm run dev` — runs Next.js locally.
- Build: `npm run build` and `npm run start` — production build + start.
- Lint: `npm run lint`.
- Regenerate DB types: `npm run gen-types` (uses the Supabase CLI; project-id is in `package.json`).
- Environment variables (example `.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_SECRET_KEY` (server-only; used by `createAdminClient`).

7. How to make safe changes

- Prefer editing or adding server actions under `src/services/supabase/actions/` for DB writes.
- For UI/UX changes, follow existing component patterns in `src/components` and `src/components/ui/` (Button, Card, Input, etc.). Keep styling consistent.
- When adding DB queries: use typed table names and fields from `src/services/supabase/types/database.ts` where possible.

8. What an AI agent should do first

- Read `src/services/supabase/server.ts` and `middleware.ts` to understand session/cookie handling.
- Inspect `src/services/supabase/actions/rooms.ts` as the canonical server-action + admin-client example.
- Check `package.json` scripts for commands the user expects the Dev environment to run.

9. Where to find more guidance

- Supabase-related developer prompts and examples: `.github/prompts/*` (Realtime, Edge Functions, Migrations, RLS policies).
- Project README contains standard Next.js info but not Supabase specifics; prefer the files listed above for behavior guidance.

If anything here is unclear, tell me which area (auth middleware, server-client split, Realtime channels, or DB policies) you want expanded and I will iterate.
