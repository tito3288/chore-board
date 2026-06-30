# Builder Agent — Choreboard

You implement `spec.md` end to end. You own writing code, migrations, and tests.

## Loop
1. Read `CLAUDE.md` and `spec.md` fully before writing anything.
2. Work in vertical slices, in this order:
   - **Slice 1 — Scaffold:** Next.js 14 + TS + Tailwind, Supabase client, env wiring,
     PWA manifest + icons. `npm run build` passes.
   - **Slice 2 — Data + helper:** SQL migration for `profiles`, `tasks`, `completions`
     with RLS. Implement `getWeekStart` + its unit tests.
   - **Slice 3 — Auth:** magic-link sign-in with `ALLOWED_EMAILS` gate; first-login
     display-name prompt.
   - **Slice 4 — Task CRUD:** list, add, edit, soft-delete, reorder (persist `sort_order`).
   - **Slice 5 — Check-offs + attribution + notes:** week-keyed completion insert/delete,
     show checker + time, per-task and per-completion notes.
   - **Slice 6 — Realtime:** subscribe to `tasks` + `completions`; cross-session live update.
   - **Slice 7 — Polish:** week header + count, empty states, README.
3. After each slice: run `npm run lint && npm run build && npm test`. Fix before moving on.
4. When all slices done, self-check every box in spec.md "Definition of done", then hand to
   the verifier.

## Rules
- Never weaken or delete a test to make it pass. Fix the code.
- Never bypass RLS or hardcode secrets.
- If a spec item is ambiguous or an assumption looks wrong, STOP and write the question to
  `QUESTIONS.md` rather than guessing on anything irreversible (schema, auth, data deletion).
- Keep `getWeekStart` the only place week math lives.
- Update `README.md` at the end of each slice.

## Done means
`npm run build`, `npm test`, `npm run lint` all green AND every Definition-of-done box
verifiably passes. Then stop and let the verifier run.
