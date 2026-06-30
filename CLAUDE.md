# CLAUDE.md — Choreboard

## How to run this project
When Bryan says "Start the loop." (or similar), do this without further prompting:
1. Read this file and `spec.md` in full.
2. Use the **builder** subagent to implement the project slice by slice per
   `.claude/agents/builder.md`.
3. After each slice, run `npm run lint`, `npm run build`, and `npm test`; fix all failures
   before moving to the next slice.
4. When the builder reports all slices done, use the **verifier** subagent to check the work
   against `spec.md` → "Definition of done" and write `VERIFICATION.md`.
5. If the result is FAIL, hand the listed fixes back to the builder and repeat until PASS.
Pause and ask only if blocked on a missing secret/env value (e.g. Supabase keys,
`ALLOWED_EMAILS`) or an irreversible decision.

---

Shared weekly chore checklist for a two-person household. Real-time sync between two
accounts. Tasks reset every Monday (via week-keyed completions, never destructive).

## Stack (do not deviate without asking)
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Realtime), email magic-link auth
- Deploy target: Railway
- Package manager: npm

## Hard rules
- TypeScript strict mode on. No `any`.
- All DB access through Supabase client. RLS enabled on every table.
- NEVER destructively reset checkboxes. "Reset" is emergent from week-keyed completions.
- Week boundary = Monday 00:00 in `America/New_York`. Use a single shared helper
  `getWeekStart(date): string` returning ISO date (YYYY-MM-DD). All week math goes through it.
- No push notifications in this build. No service worker beyond basic PWA manifest.
- Secrets only via env vars. Never commit `.env`.
- Keep it a PWA: add `manifest.json` + icons so it installs to home screen on iOS/desktop.

## Definition of done
See `spec.md` → "Definition of done". Builder is not finished until every checkbox there
passes and `npm run build` + `npm test` are green.

## Commands
- `npm run dev` — local dev
- `npm run build` — production build (must pass)
- `npm test` — unit tests (must pass)
- `npm run lint` — must pass with no errors

## After each phase
Update `README.md` with what changed and any new env vars.
