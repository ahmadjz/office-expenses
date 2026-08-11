# مصاريف المكتب — Office Expenses

A static Arabic (RTL) web app for tracking shared office purchases, hosted on GitHub Pages.
Data lives as JSON files in this repo. New entries arrive via a **prefilled GitHub issue**,
which a GitHub Action validates, commits, and then rebuilds + redeploys the site.

**Status:** built and deployed. Purchases, per-person shares, weekly summaries, and paybacks
with settle-up suggestions are all live.

---

## 1. The problem

Someone in the office buys something (cheese, bread, tea) and a subset of people share it.
We need a record of who paid, what they bought, when, who ate it, and how much each person owes.

**Worked example (the canonical test case):**

> أحمد اشترى نص كيلو جبنة بـ 100
> وأكل من الجبنة: أحمد، أبو عبيدة، كاسم، أبو عدنان
> ⟹ 4 أشخاص ⟹ **25 للشخص**

Debts also get **paid back**, and that has to be recorded or the ledger only ever grows:

> أبو عبيدة سدّد لأحمد 25
> ⟹ أبو عبيدة صار صفر، وصافي أحمد نزل من +75 إلى +50

---

## 2. Members (static, hardcoded)

Seven fixed members. Never entered free-form — always selected from this list.
Stable `id`s are what get stored in JSON; the Arabic `name` is display-only, so renaming
someone later never rewrites historical data.

| id | name |
|---|---|
| `ahmad` | أحمد |
| `abu-obaida` | أبو عبيدة |
| `kasem` | كاسم |
| `abu-khaled` | أبو خالد |
| `abu-tareq` | أبو طارق |
| `abu-adnan` | أبو عدنان |
| `abu-mohsen` | أبو محسن |

Order in this table is **canonical** and load-bearing — it's the deterministic tiebreak order
for remainder distribution (§4).

---

## 3. Data model

### 3.1 One file per entry

`data/entries/<id>.json` — one JSON file per entry. One file per entry (not one big array)
means hand-editing and git history stay clean, and two entries can never collide.

```json
{
  "id": "2026-08-03-a3f9c1",
  "date": "2026-08-03",
  "payer": "ahmad",
  "item": "نص كيلو جبنة",
  "amount": 100,
  "sharers": ["ahmad", "abu-obaida", "kasem", "abu-adnan"],
  "createdAt": "2026-08-03T09:12:00.000Z",
  "issue": 12
}
```

| field | type | rules |
|---|---|---|
| `id` | string | `<date>-<6 hex>`. Unique. Also the filename. |
| `date` | string | `YYYY-MM-DD`. The purchase date. Not more than 1 day in the future. |
| `payer` | member id | Must exist in §2. |
| `item` | string | Trimmed, 1–80 chars. |
| `amount` | integer | `> 0`, `<= 100000000`. Total cost in SYP. Never a float. |
| `sharers` | member id[] | 1–7 entries, unique, all must exist in §2. |
| `createdAt` | ISO 8601 | Set by the Action, not the client. |
| `issue` | integer | Source issue number, for traceability. |

**`payer` need not be in `sharers`.** Someone can buy something they don't eat.
In the canonical example أحمد *is* in `sharers`, but that's incidental.

### 3.2 One file per payback

`data/payments/<id>.json` — a payback (تسديد) from one member to another. Same one-file-per-record
rule, same id format, a **separate directory** so the two record types never need a discriminator
field on disk and each keeps a strict schema.

```json
{
  "id": "2026-08-05-b71d20",
  "date": "2026-08-05",
  "from": "abu-obaida",
  "to": "ahmad",
  "amount": 25,
  "createdAt": "2026-08-05T10:00:00.000Z",
  "issue": 17
}
```

| field | type | rules |
|---|---|---|
| `from` | member id | Who handed over the money. |
| `to` | member id | Who received it. **Must differ from `from`.** |
| `amount` | integer | Same rules as an entry's `amount`. |

`date`, `id`, `createdAt`, `issue` follow §3.1 exactly.

**A payback is not validated against what's actually owed.** Over- and under-payment are both
recordable — the ledger's job is to record what happened, not to referee it. A 30 payback against a
25 debt simply leaves the payer 5 in credit.

### 3.3 Build-time baking

The app does **not** fetch data at runtime. Vite imports every entry at build time:

```ts
import.meta.glob('../../data/entries/*.json', { eager: true, import: 'default' })
```

Everything ships in the bundle. No API, no fetch, no loading state, no CORS. The site is
literally a folder of static files. The consequence is stated plainly in §7.

---

## 4. The split math

Equal split among `sharers`. Currency is **SYP, integers only** — no decimals ever appear
anywhere in the app.

### Largest-remainder distribution

Naive `amount / n` produces floats that don't sum back to the total (`100 / 3` → three ×33.33
= 99.99). Instead:

```
base      = floor(amount / n)
remainder = amount - (base * n)
```

The first `remainder` sharers — **ordered by the canonical member order in §2**, not by the
order they were clicked — each get `base + 1`. Everyone else gets `base`.

| input | shares | sum |
|---|---|---|
| 100 ÷ 4 | 25 · 25 · 25 · 25 | 100 ✓ |
| 100 ÷ 3 | 34 · 33 · 33 | 100 ✓ |
| 60 ÷ 7 | 9 · 9 · 9 · 9 · 8 · 8 · 8 | 60 ✓ |

**Invariant: the shares always sum to exactly `amount`.** This must have a unit test.
Sorting by canonical order (rather than click order) makes the result reproducible — the same
entry always yields the same per-person numbers.

### Display

The per-entry card shows the plain figure `amount ÷ n` when it divides evenly, and the exact
per-person breakdown when it doesn't (so nobody wonders why they owe 34 and their neighbour 33).

### Settle-up — minimal transfers

Balances are a **pot**, not a web of pairwise debts: each member carries one number,
`دفع − عليه + سدّد`. A payback moves `amount` from the payer's side of the pot to the receiver's.

`suggestSettlements` turns those balances into the **fewest transfers that zero everyone out**:
sort debtors and creditors by size, repeatedly match the largest of each, and move the smaller of
the two amounts. Ties break on the §2 canonical order, so the same balances always produce the same
suggestions.

**Invariant: every net sums to zero, so the greedy match always terminates with nothing left over.**
Both halves have unit tests — that the nets sum to zero, and that applying every suggested transfer
leaves all balances at zero.

---

## 5. Screens

Single page. No router. One bottom sheet for the form.

### 5.1 Feed — grouped by week

Weeks run **Saturday → Friday** (Levant work week). This is a single exported constant
`WEEK_START_DAY = 6` (JS `getDay()` for Saturday) so it's a one-line change if wrong.

Weeks are ordered newest-first; entries within a week are newest-first.

```
┌──────────────────────────────────────────┐
│  أسبوع ١ – ٧ آب            المجموع ١٢٬٤٠٠ │
│  ┌────────────────────────────────────┐  │
│  │ المبالغ بالليرة السورية            │  │
│  │ الاسم      دفع    عليه  سدّد الصافي│  │
│  │ أحمد     ٨٬٠٠٠  ٣٬١٠٠  −٤٠٠ +٤٬٥٠٠│  │
│  │ أبو عبيدة    ٠  ٢٬٢٠٠  +٤٠٠ −١٬٨٠٠│  │
│  │ كاسم     ٤٬٤٠٠  ٢٬٩٠٠     ٠ +١٬٥٠٠│  │
│  │ …                                  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ التسوية المقترحة                   │  │
│  │ أبو عبيدة ← أحمد   ١٬٨٠٠    تسجيل │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ٥ آب   أبو عبيدة ← أحمد                 │
│         تسديد ٤٠٠                        │
│                                          │
│  ٣ آب   أحمد — نص كيلو جبنة              │
│         ١٠٠ ÷ ٤ =  ٢٥ للشخص              │
│         أحمد · أبو عبيدة · كاسم · أبو عدنان│
│                                          │
│  ٢ آب   كاسم — خبز                       │
│         ٦٠ ÷ ٦ = ١٠ للشخص                │
│         …                                │
└──────────────────────────────────────────┘
```

Paybacks and purchases share one chronological list inside the week, newest first, `createdAt`
breaking same-day ties.

**Week summary table** — one row per member who appears in that week (paid, shared, or settled):

- **دفع** — sum of `amount` for entries where they are `payer`
- **عليه** — sum of their individual share across every entry in the week
- **سدّد** — paybacks they *made* minus paybacks they *received*, signed
- **الصافي** — `دفع − عليه + سدّد`. Positive = the office owes them. Negative = they owe the office.

Colour-code the net with green/red **plus** a `+`/`−` sign and an arrow icon — never colour
alone (WCAG: don't encode meaning in colour only).

Table cells carry bare numbers with the currency stated once in a `<caption>`; repeating `ل.س` in
every cell wrapped each figure onto two lines. Signed figures sit in a `dir="ltr"` span so the sign
stays on the same side of the digits regardless of what neighbours it in the RTL flow.

Under each table, **التسوية المقترحة** lists the minimal transfers (§4) for that week. Each row is a
button that opens the payback sheet already filled in.

### 5.2 The settlement window

The summary is still **per week only** — there is no cross-week running balance. That makes *when* a
payback is dated load-bearing: one dated outside the week of the debt it settles lands in a different
table and never cancels it.

So a suggestion rendered under week X prefills its date as `min(weekEnd(X), today)` — inside week X
by construction, and never past the schema's "not beyond tomorrow" rule. Recording a suggested
transfer therefore zeroes the week it came from.

A payback typed manually gets today's date, which is only correct if it settles *this* week's debts.
Fix by editing the date in the sheet before sending, or the JSON file afterwards.

### 5.3 Add-entry sheet

Bottom sheet, drag-to-dismiss, opened by the primary half of the sticky CTA pair at the bottom of
the feed.

| field | control |
|---|---|
| من دفع؟ | 7 selectable chips, single-select |
| ماذا اشترى؟ | text input, visible label, 80 char limit |
| المبلغ | numeric input, `inputMode="numeric"`, integer only, thousands separator on display |
| التاريخ | date input, defaults to today |
| من شارك؟ | 7 toggle chips, multi-select, plus a **الكل** toggle |

**Live preview strip**, updating on every change:

```
٤ أشخاص  ·  ٢٥ ل.س للشخص
```

Two actions:

- **إرسال عبر GitHub** (primary) — opens the prefilled issue in a new tab (§6)
- **نسخ** (secondary) — copies the payload to clipboard, so a member without a GitHub
  account can WhatsApp it to whoever does

Validation is inline, on blur, with the error message directly under its field.
The submit button is disabled until the form is valid, and states *why* it's disabled.

### 5.4 Record-payback sheet

Same chrome (`Sheet`), same two actions (`IssueActions`), opened either by the secondary
**تسجيل دفعة** CTA or by tapping a suggested transfer.

| field | control |
|---|---|
| من دفع؟ | 7 selectable chips, single-select |
| لمن دفع؟ | chips, single-select, **excluding whoever is selected as payer** |
| المبلغ | numeric input, `inputMode="numeric"`, integer only |
| التاريخ | date input (§5.2 for what it defaults to) |

Filtering the payer out of the recipient chips makes `from === to` unreachable through the UI —
the schema still rejects it, because the issue path accepts hand-written JSON too. Picking a payer
who is already the recipient clears the recipient rather than leaving an invalid pair selected.

The sheet mounts with its draft as initial state and unmounts on close, so each open starts from
whatever prefill it was given.

### 5.5 No edit, no delete

Deliberately out of scope. A wrong record is fixed by editing `data/entries/<id>.json` or
`data/payments/<id>.json` directly on github.com — the push rebuilds the site.
Since one person enters all data, a UI for this would be pure cost.

---

## 6. The write path

GitHub Pages is static and cannot write files. **Any** write to the repo needs a GitHub
credential, and a static page has nowhere safe to keep one. So the credential is *the human*:
whoever submits is already logged into GitHub, and their click is the authentication.
No token exists anywhere in the app.

```
  phone: fill form
        │
        │  tap "إرسال عبر GitHub"
        ▼
  github.com/ahmadjz/office-expenses/issues/new
        ?labels=entry&title=…&body=…       ← every field prefilled
        │
        │  tap "Submit new issue"
        ▼
  Action  on: issues.opened
        │  ├─ author ∈ ALLOWLIST?            else: comment + close (not_planned)
        │  ├─ parse ```json block from body
        │  ├─ read `kind` → expense | payment
        │  ├─ validate against that schema   else: comment the error + close
        │  ├─ write data/{entries,payments}/<id>.json
        │  ├─ commit
        │  └─ comment ✅ with the breakdown + close
        ▼
  Deploy job → build → GitHub Pages          (~1–2 min total)
```

### Prefilled URL

```
https://github.com/ahmadjz/office-expenses/issues/new
  ?labels=entry
  &title=<urlencoded>إدخال: أحمد — نص كيلو جبنة — 100</>
  &body=<urlencoded fenced ```json block</>
```

Plain `title` + `body` params, **not** an issue-form template — a fenced JSON block is far
easier to parse reliably than form-field markdown, and prefilling a `.yml` issue form requires
matching field ids that break whenever the template changes.

### Routing expenses vs paybacks

One workflow handles both. The JSON block carries a `kind` discriminator:

```json
{ "kind": "payment", "date": "2026-08-05", "from": "abu-obaida", "to": "ahmad", "amount": 25 }
```

**`kind` is stripped before validation and never stored** — the directory already says which
type a file is, so putting it on disk would be a second source of truth that could disagree.

**A missing `kind` means `expense`.** Every issue link built before this feature existed omits it,
and those links live in people's WhatsApp history; defaulting keeps them working. An unrecognised
`kind` is rejected rather than defaulted, so a typo fails loudly instead of silently booking a
payback as a purchase.

Routing by `kind` rather than by issue label is deliberate: the workflow already ignores labels
(an unknown label in an `issues/new` URL is silently dropped, which would make label-based routing
fail invisibly), and the label is not available to a hand-written submission relayed over WhatsApp.

### Authorization

`ALLOWLIST` is a checked-in array of GitHub usernames — currently just `["ahmadjz"]`.
This matters because the repo is public, so *anyone* on GitHub can open an issue.
Any issue from an author outside the allowlist is closed without touching the repo.

### ⚠️ The one thing that will silently break

A push made by a workflow using the default `GITHUB_TOKEN` **does not trigger other workflows.**
So the commit from the entry workflow will *not* fire a separate `on: push` deploy workflow,
and the site will never update — with no error anywhere.

Fix: make `deploy.yml` a reusable workflow (`on: { push: { branches: [main] }, workflow_call: {} }`)
and have `entry.yml` call it directly as a dependent job:

```yaml
deploy:
  needs: commit
  uses: ./.github/workflows/deploy.yml
```

---

## 7. Freshness — the accepted tradeoff

An entry takes **~1–2 minutes** to appear: commit → build → Pages deploy.

This was chosen deliberately over an optimistic-UI + live-fetch design, in exchange for a much
simpler app (no runtime fetch, no pending state, no reconciliation).

The UI must be honest about it. After tapping submit, show a persistent note:

> تم إرسال الإدخال. سيظهر على الموقع خلال دقيقة تقريبًا بعد اكتمال البناء.

with a link to the Actions run. Do not fake the entry into the list — showing an entry that
isn't really saved yet is worse than a one-minute wait.

---

## 8. Hosting

| | |
|---|---|
| Repo | `ahmadjz/office-expenses` — **public** |
| Site | `https://ahmadjz.github.io/office-expenses/` |
| Vite `base` | `/office-expenses/` |
| Cost | $0 |

Public is required: the free GitHub plan cannot serve Pages from a private repo.
(Verified — all four existing Pages repos on this account are public.) The consequence is that
member names and amounts are world-readable. Accepted: it's office snack money.

The free alternative, if this ever changes: private repo + Cloudflare Pages, which serves a
public site from a private repo at no cost, and additionally restricts issue-opening to
invited collaborators. That swap touches only the deploy workflow, not the app.

---

## 9. Stack

| | |
|---|---|
| Build | Vite |
| UI | React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Validation | Zod — one schema shared by the app and the Action |
| Icons | `lucide-react` |
| Tests | Vitest |
| Runtime deps | none beyond the above — no router, no state library, no date library |

No router (single page). No date library (week bucketing is ~20 lines of `Date` math).
No state manager (`useState` is sufficient).

---

## 10. Design system

Resolved via the `ui-ux-pro-max` skill: *Enterprise SaaS (mobile)* — professional,
trustworthy, clean. Dials: variance 4/10, motion 4/10, density 6/10.

### Tokens

Dark is the default (`--color-background: #0F172A`), with a light-mode inversion via
`prefers-color-scheme`. Both must be verified independently for contrast.

| role | dark | light |
|---|---|---|
| primary | `#1E40AF` | `#1E40AF` |
| on-primary | `#FFFFFF` | `#FFFFFF` |
| secondary | `#3B82F6` | `#3B82F6` |
| accent / positive | `#059669` | `#047857` |
| destructive / negative | `#DC2626` | `#B91C1C` |
| background | `#0F172A` | `#FFFFFF` |
| foreground | `#FFFFFF` | `#0F172A` |
| muted surface | `#101A34` | `#F1F5F9` |
| border | `rgba(255,255,255,.08)` | `rgba(15,23,42,.10)` |

Semantic CSS variables only. No raw hex inside components.

### Typography

```
Noto Naskh Arabic  →  headings
Noto Sans Arabic   →  body, numbers, UI
```

Self-host both via `@fontsource` — do **not** hit the Google Fonts CDN (privacy, and it's a
render-blocking third-party request). `font-display: swap`.

**All amounts use `font-variant-numeric: tabular-nums`** so columns don't jitter as digits change.

### RTL

`<html lang="ar" dir="rtl">`. Use Tailwind logical properties throughout — `ps-*`/`pe-*`,
`ms-*`/`me-*`, `start-*`/`end-*` — never `pl-*`/`pr-*`/`left-*`/`right-*`. Icons that imply
direction (chevrons, arrows) must mirror.

### Non-negotiables

- Touch targets ≥ 44×44px, ≥ 8px apart
- Body text ≥ 16px (below that, iOS auto-zooms on focus)
- Visible focus rings — never `outline: none` without a replacement
- `prefers-reduced-motion` respected; transitions 150–300ms
- SVG icons only (`lucide-react`) — **no emoji as icons**
- Contrast ≥ 4.5:1 for text, verified in *both* themes
- No horizontal scroll at 375px

### Explicitly avoid

Playful styling · AI-slop purple/pink gradients · colour as the only signal.

---

## 11. Testing

Tests where a bug would cost real money or silently corrupt data.

**Must have:**

- `splitAmount` — the invariant that shares always sum to `amount`, across many
  `(amount, n)` pairs including all seven `n` values and awkward remainders
- `splitAmount` — canonical-order tiebreak is deterministic and stable
- The canonical example: `100 / [ahmad, abu-obaida, kasem, abu-adnan]` → `25` each
- Week bucketing — Saturday boundary, month boundary, year boundary
- Week summary — `دفع`, `عليه`, `الصافي` on a fixture with a payer who isn't a sharer
- Week summary — a payback zeroes the payer and reduces the receiver by the same amount; a member
  who appears *only* through a payback still gets a row; every net sums to zero
- `suggestSettlements` — applying every suggested transfer leaves all balances at zero, and moves
  exactly the outstanding total; canonical-order tiebreak is deterministic
- Zod schema — rejects unknown member ids, empty `sharers`, zero/negative/float `amount`,
  duplicate sharers, and a payback whose `from` equals its `to`
- Issue-body parser — extracts the JSON block; rejects malformed input without throwing; routes on
  `kind`; **still parses a payload with no `kind` as an expense**; rejects an unknown `kind`
- Feed grouping — purchases and paybacks land in the same Saturday week and interleave newest-first

**Skip:** component render smoke tests, presentational-prop assertions, mock-call-only tests.

---

## 12. Repo layout

```
office-expenses/
├── data/
│   ├── entries/*.json             ← purchases; Action writes here, hand-editable
│   └── payments/*.json            ← paybacks; same rules
├── .github/workflows/
│   ├── entry.yml                  ← issues.opened → validate → commit → call deploy
│   └── deploy.yml                 ← on: push + workflow_call → build → Pages
├── scripts/process-issue.mjs      ← parse + validate + write (used by entry.yml)
├── src/
│   ├── data/members.ts            ← the 7, canonical order
│   ├── lib/
│   │   ├── schema.ts              ← Zod for both types, shared with the Action
│   │   ├── split.ts               ← largest-remainder
│   │   ├── settle.ts              ← minimal transfers to zero every balance
│   │   ├── week.ts                ← Saturday bucketing
│   │   ├── summary.ts             ← per-week per-member paid/owed/settled/net
│   │   ├── feed.ts                ← week grouping + expense/payback interleave
│   │   ├── records.ts             ← shared glob-validate-sort loader
│   │   ├── entries.ts             ← import.meta.glob + parseRecords
│   │   ├── payments.ts            ← same, for paybacks
│   │   └── issue-url.ts           ← prefilled URL builders (both kinds)
│   ├── components/                ← small, one concern each
│   │   ├── Sheet.tsx              ← shared bottom-sheet chrome
│   │   ├── IssueActions.tsx       ← shared إرسال/نسخ pair + build notice
│   │   └── SettleSuggestions.tsx  ← التسوية المقترحة, each row prefills the sheet
│   └── styles/tokens.css
├── AGENTS.md
└── PROJECT_SPEC.md                ← this file
```

---

## 13. Decisions log

| decision | choice | why |
|---|---|---|
| Write path | Prefilled GitHub issue → Action | No credential anywhere in a static app; the human's GitHub login *is* the auth |
| Scope | Log + per-entry share + weekly summary | Cross-week running balances stay out; a week is the unit that gets settled |
| Paybacks | Recorded as their own record type | "What's left to pay" is unanswerable if only debts are recorded and never repayments |
| Debt model | Pot (one net per member) | 7 members would otherwise mean up to 21 pairwise lines; the office settles as a pot |
| Payback routing | `kind` in the JSON block | Labels are silently dropped from `issues/new` URLs and absent on relayed submissions |
| Payback storage | Separate `data/payments/` | Keeps both Zod schemas strict with no on-disk discriminator to disagree with the path |
| Settle-up | Minimal-transfer suggestions | Makes the weekly table actionable, and one tap prefills the payback that zeroes it |
| Payback date | Prefilled inside the settled week | Weekly-only tables mean a payback dated elsewhere never cancels the debt it settles |
| Over/under payment | Allowed | The ledger records what happened; refereeing it is a person's job |
| Currency | SYP, integer, largest-remainder | Shares must sum to the exact total; no float drift |
| Freshness | Wait for rebuild (~1–2 min), stated honestly | Buys a far simpler app; no optimistic UI or reconciliation |
| Visibility | Public repo | Free plan can't serve Pages from private; data is snack money |
| Edit/delete | None in app; edit JSON on github.com | One data-entry person makes a UI for this pure cost |
| Week start | Saturday | Levant work week; one constant to change |
| Submitters | `ahmadjz` only | Everyone else views; **نسخ** button covers WhatsApp relay |
| Grouping | By week | Matches how office money actually gets settled |
