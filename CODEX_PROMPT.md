# Codex prompt

## How to run it

```bash
cd /home/ahmadjz/Documents/office_expenses
codex
```

Then `/model` → **`gpt-5.1-codex-max`**, reasoning effort **`high`**.

| phase | model | effort | why |
|---|---|---|---|
| Initial full build (everything below) | `gpt-5.1-codex-max` | **high** | Cross-cutting: React + Tailwind v4 + two coupled workflows + RTL + split math. `xhigh` is for algorithmic depth, not breadth — it burns budget here without buying much. |
| Follow-up tweaks (styling, copy, one more test) | `gpt-5.1-codex` | **medium** | Localized edits. Don't pay max rates for a colour change. |
| If a workflow misbehaves on GitHub | `gpt-5.1-codex-max` | **high** | Debugging CI you can't run locally needs the reasoning. |

Check your actual list with `/model` — names shift between Codex releases. Pick the
strongest `-codex-max` variant offered.

**One caveat:** Codex can't create the GitHub repo, push, or enable Pages — those need
your `gh`/git credentials. It will build everything and stop; §Deploy at the end has the
three commands you run yourself.

---

## Paste everything below this line

---

Build a complete, working project in this directory. Read `PROJECT_SPEC.md` in this
directory **first and in full** — it is the authoritative specification and this prompt does
not repeat its details. Where this prompt and the spec disagree, the spec wins.

## Context you can't infer

**The design skill is a Claude Code skill, not a Codex one.** You cannot invoke it as a slash
command. Its database is plain files on disk and you query it with bash:

```bash
python3 /home/ahmadjz/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux -n 10
python3 /home/ahmadjz/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack react -n 10
python3 /home/ahmadjz/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack html-tailwind -n 10
```

Valid `--domain` values: `product style typography color landing chart ux gsap react web prompt`.
Full usage: `/home/ahmadjz/.claude/skills/ui-ux-pro-max/SKILL.md`.

**The design system is already resolved** — §10 of the spec has the final tokens, fonts, and
rules. Do not re-derive it or run `--design-system` again. Query the skill only for extra
detail on a specific problem (e.g. `--domain ux "bottom sheet form validation"` while building
the sheet, or `--stack react "list keys memo"` while building the feed).

**Coding conventions to follow** (from the user's global rules; you have no access to them):

- **Immutability.** Never mutate. Return new objects/arrays. No `push`/`splice`/in-place sort
  on anything you didn't just create — use `toSorted`, spread, `map`.
- KISS · DRY · YAGNI. Build what the spec asks for and nothing speculative.
- Many small focused files over few large ones. 200–400 lines typical, 800 hard max.
  Functions under 50 lines. Nesting under 4 levels — prefer early returns.
- Named constants, never magic numbers.
- `camelCase` functions/vars, `PascalCase` types/components, `UPPER_SNAKE_CASE` constants,
  booleans prefixed `is`/`has`/`should`/`can`.
- Handle every error explicitly. Never silently swallow. User-facing messages in Arabic;
  detailed context in workflow logs.
- Validate at every boundary — the issue body is untrusted input.

## Build order

Work in this order and **run the tests after each step**, not all at the end.

1. **Scaffold** — Vite + React 19 + TypeScript (strict) + Tailwind CSS v4 + Vitest.
   `base: '/office-expenses/'` in `vite.config.ts`. `<html lang="ar" dir="rtl">`.
   Self-host Noto Naskh Arabic + Noto Sans Arabic via `@fontsource` — no Google CDN.

2. **Pure logic first, test-driven.** `src/data/members.ts`, then `src/lib/schema.ts`,
   `split.ts`, `week.ts`, `summary.ts`. Write the test before the implementation for
   `split.ts` and `week.ts` — they're where a bug costs real money. Spec §11 lists exactly
   what must be covered. The sum invariant in §4 is the single most important test in the
   project.

3. **Seed data.** Write the canonical example from spec §1 as a real file in
   `data/entries/`, plus 6–8 more across three different weeks so the weekly grouping and
   summary table are actually visible when you run it. Include at least one entry whose
   amount does *not* divide evenly, and one where the payer is not among the sharers.

4. **UI.** Feed with weekly groups (spec §5.1), then the bottom sheet form (§5.2).
   Mobile-first — design at 375px, then scale up. Tailwind **logical properties only**
   (`ps-*`, `me-*`, `start-*`) — an `pl-4` anywhere is a bug in an RTL app.

5. **`issue-url.ts`** — the prefilled URL builder from spec §6. Properly `encodeURIComponent`
   the title and body.

6. **Workflows + `scripts/process-issue.mjs`** — spec §6. The `process-issue.mjs` script must
   import the *same* Zod schema the app uses; do not write a second copy of the validation.

7. **`AGENTS.md`** — short. Point at `PROJECT_SPEC.md` as the source of truth, list the
   conventions above, and record the ui-ux-pro-max bash invocation so a future session finds it.

8. **`README.md`** — how to run, how to add an entry, how to fix a wrong entry by editing
   `data/entries/*.json` on github.com.

## Things that will bite you

- **The workflow-chaining trap in spec §6.** A push made with the default `GITHUB_TOKEN` does
  not trigger `on: push` workflows. If you write `entry.yml` and `deploy.yml` as two
  independent push-triggered workflows, entries will commit and the site will never rebuild,
  with no error anywhere. Use the `workflow_call` pattern the spec specifies.
- **Tailwind v4 is not v3.** Config is CSS-first via `@theme` in your stylesheet, not
  `tailwind.config.js`. If you're unsure of the v4 API, check the installed package's docs
  rather than writing v3 syntax from memory.
- `import.meta.glob` on `data/entries/` reaches outside `src/`. Verify it actually resolves —
  build and check the entries appear, don't assume.
- Arabic-Indic vs Latin digits: pick one and use it everywhere. Recommend Latin digits with
  `ar` locale thousands separators via `Intl.NumberFormat`, since amounts are read fast.
  Whatever you pick, `tabular-nums` on every number.
- Don't animate `width`/`height`/`top`/`left`. `transform` and `opacity` only.

## Definition of done

- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] `npm test` passes, including every case in spec §11
- [ ] `npm run dev` shows the seeded entries grouped into three weeks, each with a correct
      total and per-member summary
- [ ] The canonical example renders as **٢٥ للشخص** across 4 people
- [ ] Filling the form and tapping **إرسال عبر GitHub** opens a real github.com issue URL with
      title and body fully prefilled and correctly encoded
- [ ] No horizontal scroll at 375px; no `pl-*`/`pr-*`/`left-*`/`right-*` anywhere
- [ ] Both dark and light themes checked for 4.5:1 text contrast — separately, not inferred
- [ ] Every interactive element is keyboard-reachable with a visible focus ring
- [ ] No emoji used as an icon anywhere

When done, report: what you built, anything in the spec you had to interpret, and anything you
deliberately left out. Do not commit or push — the user handles git.

---

## Deploy (you run these, after Codex finishes)

```bash
cd /home/ahmadjz/Documents/office_expenses
git init -b main && git add -A && git commit -m "feat: office expenses tracker"
gh repo create office-expenses --public --source=. --push
```

Then: **Settings → Pages → Source: GitHub Actions**, and create the `entry` label:

```bash
gh label create entry --description "New expense entry" --color 1E40AF
```

Site goes live at `https://ahmadjz.github.io/office-expenses/`.
