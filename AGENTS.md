# Office Expenses

`PROJECT_SPEC.md` is the source of truth. Arabic, RTL React frontend on a PocketBase backend, both on the VPS at `office.ahmadjz.tech`; infra lives in `ahmadjz/vps-infra`. Mid-migration from the GitHub-issue + JSON-files design — §14 of the spec lists what goes.

- Use immutable updates, strict TypeScript, small focused files, and explicit error handling. User-facing copy is Arabic.
- Members are PocketBase records referenced by id; never accept member names as data. `position` is the split tiebreak and is immutable — renumbering silently changes historical splits. Members are deactivated, never deleted.
- Schema changes go in `pocketbase/pb_migrations/`, never the dashboard. Server-side checks field options can't express go in `pocketbase/pb_hooks/`.
- Parse every API response and form with the Zod schemas in `src/lib/schema.ts`. A record that fails parsing is skipped with a banner, never allowed to break the whole feed. Money is positive integer SYP and split with the largest-remainder rule by `position`.
- `date` is `YYYY-MM-DD` text, not a PocketBase date field — a timezone shift moves records into the wrong week.
- Balances are per week. Anything that creates or dates a payback must keep it inside the week it settles, or it silently fails to cancel that debt.
- Access: signed in to view and create; `isAdmin` to edit, delete, or manage members. The API rules are the enforcement — hiding UI is not.
- Tailwind styles must use logical directional utilities only; retain visible focus rings and semantic design tokens.
- Run `npm test` and `npm run build` after changes. Do not commit or push unless the user explicitly asks.

The resolved design system is in §10 of `PROJECT_SPEC.md`. For a narrowly scoped UI question, query the local `ui-ux-pro-max` skill with:

```bash
python3 /home/ahmadjz/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux -n 10
```
