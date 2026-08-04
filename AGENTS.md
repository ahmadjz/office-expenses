# Office Expenses

`PROJECT_SPEC.md` is the source of truth. Keep the app static, Arabic and RTL; ledger data is one JSON entry per file under `data/entries/`.

- Use immutable updates, strict TypeScript, small focused files, and explicit error handling. User-facing copy is Arabic.
- Member ids are fixed in `src/data/members.ts`; never accept member names as data.
- Use the shared Zod schema in `src/lib/schema.ts` at every input boundary. Money is positive integer SYP and split with the canonical largest-remainder rule.
- Tailwind styles must use logical directional utilities only; retain visible focus rings and semantic design tokens.
- Run `npm test` and `npm run build` after changes. Do not commit or push unless the user explicitly asks.

The resolved design system is in §10 of `PROJECT_SPEC.md`. For a narrowly scoped UI question, query the local `ui-ux-pro-max` skill with:

```bash
python3 /home/ahmadjz/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux -n 10
```
