# مصاريف المكتب — Office Expenses

An Arabic (RTL) web app for tracking shared office purchases. A static React frontend talks to a
**PocketBase** backend; both run on the VPS behind Caddy at `https://office.ahmadjz.tech`.
Every member has their own login. Viewing requires one; adding records needs one; editing,
deleting, and managing members is admin-only.

**Status:** live at `https://office.ahmadjz.tech` since 2026-10-02. The GitHub-issue + JSON-files
design it replaced is in git history; §14 records how the data moved.

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

## 2. Members

Members are rows in the `members` auth collection (§3.1) — each one is both a person in the ledger
and a login. They are always selected from the list, never typed free-form. Records store the
member's PocketBase record id; the Arabic `name` is display-only, so renaming someone never rewrites
history.

The initial seven, in canonical order:

| position | username | name |
|---|---|---|
| 1 | `ahmad` | أحمد |
| 2 | `abu-obaida` | أبو عبيدة |
| 3 | `kasem` | كاسم |
| 4 | `abu-khaled` | أبو خالد |
| 5 | `abu-tareq` | أبو طارق |
| 6 | `abu-adnan` | أبو عدنان |
| 7 | `abu-mohsen` | أبو محسن |

**`position` is canonical and load-bearing** — it is the deterministic tiebreak order for remainder
distribution (§4). It is set once on create (`max + 1`) and never changed: renumbering would change
the per-person split of every historical entry.

### Adding and removing people

- **Add:** the admin creates the member with a name, username, and initial password, and sends the
  credentials to them directly.
- **Remove = deactivate.** A member is never deleted — past records reference them. Setting
  `active = false` blocks their login, hides them from the payer/sharer/recipient chips, and leaves
  every historical record and summary row intact. Reactivating reverses it.
- **Passwords:** the admin sets the first one and can reset anyone else's. Every member changes
  their own from **حسابي**, which always requires the current password. An admin-set password is
  flagged (`mustChangePassword`), and the app asks the member to replace it after they log in (§5.1).

---

## 3. Data model

Three PocketBase collections. The schema lives in git as PocketBase JS migrations
(`pocketbase/pb_migrations/`) — never edit collections by hand in the dashboard, or the next
migration and the live schema disagree.

### 3.1 `members` (auth collection)

| field | type | rules |
|---|---|---|
| `username` | text | Required, unique, `^[a-z0-9-]{2,30}$`. The login identity. |
| `email` | email | Optional. Not used for login. |
| `name` | text | Required, trimmed, 1–40 chars. Arabic display name. |
| `position` | number | Integer, unique, ≥ 1. Immutable after create (§2). |
| `active` | bool | Defaults `true`. |
| `isAdmin` | bool | Defaults `false`. Only `ahmad` initially. |
| `mustChangePassword` | bool | Set by a hook: `true` on create and whenever someone else sets the password, `false` when the member sets their own. Clients can't write it. |

Password auth uses `username` as the identity field. The auth rule is `active = true`, so a
deactivated member's existing session also stops working.

### 3.2 `expenses`

| field | type | rules |
|---|---|---|
| `date` | text | `YYYY-MM-DD`. The purchase date. Not more than 1 day in the future. |
| `payer` | relation → members | Required, single. |
| `item` | text | Trimmed, 1–80 chars. |
| `amount` | number | Integer only, `> 0`, `<= 100000000`. Total cost in SYP. Never a float. |
| `sharers` | relation → members | Required, multiple, ≥ 1, unique. |
| `createdBy` | relation → members | Must equal the authenticated member on create. |
| `created` / `updated` | autodate | Set by PocketBase. |

**`payer` need not be in `sharers`.** Someone can buy something they don't eat.

`date` is plain text, not a PocketBase `date` field: a date field carries a time and a timezone, and
a purchase made on Saturday evening in Damascus must never slide into Friday's week.

### 3.3 `payments`

A payback (تسديد) from one member to another.

| field | type | rules |
|---|---|---|
| `date` | text | Same as §3.2. |
| `from` | relation → members | Who handed over the money. |
| `to` | relation → members | Who received it. **Must differ from `from`.** |
| `amount` | number | Same rules as an expense's `amount`. |
| `createdBy` | relation → members | Same as §3.2. |

**A payback is not validated against what's actually owed.** Over- and under-payment are both
recordable — the ledger records what happened, it doesn't referee it.

### 3.4 Validation — two layers

| layer | enforces |
|---|---|
| Zod (`src/lib/schema.ts`) | Every API response is parsed into domain types before the app uses it; every form is validated before it is sent. |
| PocketBase | Field options (integer-only, min/max, pattern, required), API rules (§6), and `pb_hooks/validate.pb.js` for what field options can't express: date not beyond tomorrow, `from ≠ to`, payer/sharers/recipient must be **active** members on create. |

The server is the authority — the client checks exist for inline error messages, not for safety.

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

The first `remainder` sharers — **ordered by member `position` (§2)**, not by the order they were
clicked — each get `base + 1`. Everyone else gets `base`.

| input | shares | sum |
|---|---|---|
| 100 ÷ 4 | 25 · 25 · 25 · 25 | 100 ✓ |
| 100 ÷ 3 | 34 · 33 · 33 | 100 ✓ |
| 60 ÷ 7 | 9 · 9 · 9 · 9 · 8 · 8 · 8 | 60 ✓ |

**Invariant: the shares always sum to exactly `amount`.** This must have a unit test.
Sorting by `position` makes the result reproducible — the same entry always yields the same
per-person numbers. Splits are computed in the client, never stored.

### Display

The per-entry card shows the plain figure `amount ÷ n` when it divides evenly, and the exact
per-person breakdown when it doesn't (so nobody wonders why they owe 34 and their neighbour 33).

### Settle-up — minimal transfers

Balances are a **pot**, not a web of pairwise debts: each member carries one number,
`دفع − عليه + سدّد`. A payback moves `amount` from the payer's side of the pot to the receiver's.

`suggestSettlements` turns those balances into the **fewest transfers that zero everyone out**:
sort debtors and creditors by size, repeatedly match the largest of each, and move the smaller of
the two amounts. Ties break on `position`, so the same balances always produce the same suggestions.

**Invariant: every net sums to zero, so the greedy match always terminates with nothing left over.**
Both halves have unit tests.

---

## 5. Screens

Single page. No router. View state (`login` | `feed` | `members`) lives in `useState`.

### 5.1 Login

Username + password, Arabic labels, one primary button **دخول**. Wrong credentials and a
deactivated account show the same message (`اسم المستخدم أو كلمة المرور غير صحيحة`) — don't reveal
which usernames exist. The session persists in the PocketBase SDK's auth store; a header menu has
**خروج**.

The app refreshes the session on load, whenever the tab becomes visible, and every 5 minutes. A
deactivated member's refresh fails, which signs them out. Without this, their open tab would keep
showing stale data: the API already rejects them, but realtime sends nothing to a member who can no
longer read.

**Change-password prompt.** While `mustChangePassword` is set, every login opens a sheet titled
**غيّر كلمة المرور** with the §5.8 form. **لاحقًا** dismisses it for that session, and the sheet says
the password can be changed any time from **حسابي**. The prompt keeps returning on each login until
they change it, since a shared or admin-known password lets anyone log in under their name.

### 5.2 Feed — grouped by week

Weeks run **Saturday → Friday** (Levant work week). This is a single exported constant
`WEEK_START_DAY = 6` (JS `getDay()` for Saturday) so it's a one-line change if wrong.

Weeks are ordered newest-first; records within a week are newest-first.

```
┌──────────────────────────────────────────┐
│  أسبوع ١ – ٧ آب            المجموع ١٢٬٤٠٠ │
│  ┌────────────────────────────────────┐  │
│  │ المبالغ بالليرة السورية            │  │
│  │ الاسم      دفع    عليه  سدّد الصافي│  │
│  │ أحمد     ٨٬٠٠٠  ٣٬١٠٠  −٤٠٠ +٤٬٥٠٠│  │
│  │ أبو عبيدة    ٠  ٢٬٢٠٠  +٤٠٠ −١٬٨٠٠│  │
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
│  ٣ آب   أحمد — نص كيلو جبنة        ✎  🗑 │  ← admin only
│         ١٠٠ ÷ ٤ =  ٢٥ للشخص              │
│         أحمد · أبو عبيدة · كاسم · أبو عدنان│
│         سجّله: كاسم                      │
└──────────────────────────────────────────┘
```

Paybacks and purchases share one chronological list inside the week, newest first, `created`
breaking same-day ties. Each card shows **سجّله: <name>** from `createdBy`, so a wrong entry can be
traced to whoever logged it.

**Week summary table** — one row per member who appears in that week (paid, shared, or settled),
including deactivated members:

- **دفع** — sum of `amount` for entries where they are `payer`
- **عليه** — sum of their individual share across every entry in the week
- **سدّد** — paybacks they *made* minus paybacks they *received*, signed
- **الصافي** — `دفع − عليه + سدّد`. Positive = the office owes them. Negative = they owe the office.

Colour-code the net with green/red **plus** a `+`/`−` sign and an arrow icon — never colour
alone.

Table cells carry bare numbers with the currency stated once in a `<caption>`. Signed figures sit in
a `dir="ltr"` span so the sign stays on the same side of the digits in the RTL flow.

Under each table, **التسوية المقترحة** lists the minimal transfers (§4) for that week. Each row is a
button that opens the payback sheet already filled in.

### 5.3 Archive

The feed shows the **current week and the two before it** (`RECENT_WEEKS = 3`, one exported
constant). Every older week folds into a collapsed **الأرشيف** section at the bottom, which expands
in place to the same week cards, newest-first.

**Exception: an older week that still has unsettled balances stays in the main feed**, marked
`غير مسوّى`. Balances are per week, so archiving an unsettled week would hide a real debt with
nothing anywhere else on screen to show it. A week counts as settled when every member's الصافي is 0.

Archiving is display-only — nothing is moved or flagged in the database, and the app still fetches
every record (a few hundred rows a year). If that stops being true, page the archive by `date`.

### 5.4 The settlement window

The summary is still **per week only** — there is no cross-week running balance. That makes *when* a
payback is dated load-bearing: one dated outside the week of the debt it settles lands in a different
table and never cancels it.

So a suggestion rendered under week X prefills its date as `min(weekEnd(X), today)` — inside week X
by construction, and never past the "not beyond tomorrow" rule. Recording a suggested transfer
therefore zeroes the week it came from. A payback typed manually gets today's date; the admin can fix
a wrong date by editing the record (§5.7).

### 5.5 Add-expense sheet

Bottom sheet, drag-to-dismiss, opened by the primary half of the sticky CTA pair. Any signed-in
member can use it.

| field | control |
|---|---|
| من دفع؟ | chips for every **active** member, single-select, defaults to the signed-in member |
| ماذا اشترى؟ | text input, visible label, 80 char limit |
| المبلغ | numeric input, `inputMode="numeric"`, integer only, thousands separator on display |
| التاريخ | date input, defaults to today |
| من شارك؟ | toggle chips for every active member, multi-select, plus a **الكل** toggle |

**Live preview strip**, updating on every change: `٤ أشخاص · ٢٥ ل.س للشخص`.

One action: **حفظ**. It is disabled while the form is invalid (stating why) and while the request is
in flight. On success the sheet closes and the record appears from the server response — never
insert it before the server confirms. On failure the sheet stays open with the Arabic error and the
draft intact.

Validation is inline, on blur, with the error message directly under its field.

### 5.6 Record-payback sheet

Same chrome (`Sheet`), opened by the secondary **تسجيل دفعة** CTA or by tapping a suggested transfer.

| field | control |
|---|---|
| من دفع؟ | active-member chips, single-select |
| لمن دفع؟ | chips, single-select, **excluding whoever is selected as payer** |
| المبلغ | numeric input, integer only |
| التاريخ | date input (§5.4 for what it defaults to) |

Filtering the payer out of the recipient chips makes `from === to` unreachable through the UI; the
server still rejects it. Picking a payer who is already the recipient clears the recipient.

The sheet mounts with its draft as initial state and unmounts on close, so each open starts from
whatever prefill it was given.

A suggestion involving a **deactivated** member prefills only the active side: the server rejects
inactive members on create, so offering them would only produce an error. To settle with someone who
has left, the admin reactivates them, records the payback, and deactivates them again.

### 5.7 Edit and delete — admin only

Admins see ✎ and 🗑 on every card. ✎ opens the same sheet (§5.5 / §5.6) prefilled with the record,
saving with an update instead of a create. When editing, chips also include any **inactive** member
already on the record, so editing an old entry never silently drops someone.

🗑 asks for confirmation (`حذف هذا السجل؟`) naming the item and amount, then deletes. There is no
undo — PocketBase's daily backups (§8) are the safety net.

Non-admins never see these controls, and the API rejects the calls regardless (§6).

### 5.8 Account — every member

**حسابي** in the header: name and username (read-only), and a change-password form with the current
password, the new one (≥ 8), and a confirmation. Changing it invalidates the session token, so the app
logs in again with the new password, and the member stays signed in.

### 5.9 Members screen — admin only

Reached from the header menu (**الأعضاء**). A list in `position` order: name, username, status.

- **إضافة عضو** — name, username, initial password (≥ 8 chars). `position` is assigned server-side.
- **تعديل** — name only. Username and `position` are fixed.
- **تعطيل / تفعيل** — toggles `active`. The admin cannot deactivate themselves.
- **إعادة تعيين كلمة المرور** — sets a new password for someone else. Not offered on the admin's
  own row; they use **حسابي** like everyone else.

---

## 6. Access and the write path

The browser talks to PocketBase directly through the official JS SDK, same origin
(`https://office.ahmadjz.tech/api/*`), so there is no CORS configuration and no token in the build.

```
  phone: login (username + password)
        │
        ▼
  PocketBase auth  ── authRule: active = true ──▶ JWT in SDK auth store
        │
        ▼
  list expenses + payments + members   (rules: signed in)
        │
        ▼
  create   (rules: signed in, createdBy = self, pb_hooks validation)
  update / delete / manage members     (rules: isAdmin)
        │
        ▼
  realtime subscription pushes the change to every open tab
```

### API rules

| collection | list / view | create | update | delete |
|---|---|---|---|---|
| `members` | signed in | admin | admin, or self changing only the password | nobody (§2) |
| `expenses` | signed in | signed in, `@request.body.createdBy = @request.auth.id` | admin | admin |
| `payments` | signed in | same as expenses | admin | admin |

"Signed in" is `@request.auth.id != "" && @request.auth.active = true` — the `authRule` only gates new
logins, so without the `active` check a deactivated member's existing session would keep working.
"Admin" is signed in plus `@request.auth.isAdmin = true`. The `members` manage rule is also admin-only, which is what
lets the admin set other members' passwords.

**Admin-on-the-app is not the PocketBase superuser.** The superuser (the dashboard at `/_/`) is for
infrastructure only — migrations, backups, emergencies. Day-to-day admin work happens in the app as
the `ahmad` member.

---

## 7. Freshness

Writes are visible immediately: the sheet waits for the server response, then the app refetches. The
app also subscribes to PocketBase realtime on `expenses`, `payments`, and `members`, so other open
tabs update without a reload.

Loading and error states are real now:

- First load shows a skeleton of the week cards, not a blank page.
- A failed fetch shows `تعذّر تحميل البيانات` with a **إعادة المحاولة** button.
- An expense or payment that fails Zod parsing is a bug, not user data — log it, skip that record,
  and show a single banner. One bad row must not take down the whole feed.
- A **member** that fails parsing is the exception: it fails the whole load. Skipping one would shift
  every split that member is part of (their `position` would vanish from the tiebreak).
- A refetch that fails after data is on screen keeps the data but shows `تعذّر تحديث البيانات` with a
  retry, so nobody records a settlement against balances they can't trust.
- The app reloads on every realtime (re)connect, closing the gap between the first fetch and the
  subscription, and any gap while offline.

---

## 8. Hosting

| | |
|---|---|
| Frontend | Static `dist/` served by Caddy from `/srv/office.ahmadjz.tech/web` |
| Backend | PocketBase in Docker, `127.0.0.1:8090`, proxied at `/api/*` and `/_/*` |
| Data | `/opt/pocketbase/pb_data` on the VPS — **not in git** |
| Infra config | `ahmadjz/vps-infra` (Caddyfile, PocketBase compose, setup script) |
| Vite `base` | `/` |
| Backups | PocketBase scheduled backups, daily, kept 7 |

### Deploy

`deploy.yml` on push to `main`: test → build → rsync three folders as the `deploy` user, whose key is
locked to `rrsync /srv/office.ahmadjz.tech`:

```
/srv/office.ahmadjz.tech/
├── web/              ← dist/
├── pb_migrations/    ← pocketbase/pb_migrations/   (mounted read-only into PocketBase)
└── pb_hooks/         ← pocketbase/pb_hooks/        (mounted read-only into PocketBase)
```

PocketBase applies migrations only on start, and the deploy key can't restart containers. A systemd
path unit on the host (in `vps-infra`) watches `pb_migrations/` and restarts the container when it
changes. Hooks reload on their own. When migrations changed, the workflow waits for PocketBase to come back healthy
before publishing `web/`, so a frontend never lands ahead of the schema it needs.

Repo secrets: `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.

Since the data no longer lives in the repo, the repo can be private. GitHub Pages is retired.

---

## 9. Stack

| | |
|---|---|
| Build | Vite |
| UI | React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Backend | PocketBase (Go + SQLite), schema as JS migrations |
| API client | `pocketbase` JS SDK |
| Validation | Zod on the client; PocketBase field options, rules, and hooks on the server |
| Icons | `lucide-react` |
| Tests | Vitest |

No router (one page, three views). No state manager (`useState` is sufficient). No date library.

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

Self-host both via `@fontsource` — do **not** hit the Google Fonts CDN. `font-display: swap`.

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
- SVG icons only (`lucide-react`) — **no emoji as icons** (the ✎/🗑 in §5.2 are diagram shorthand)
- Contrast ≥ 4.5:1 for text, verified in *both* themes
- No horizontal scroll at 375px
- Destructive actions (delete, deactivate) use the destructive token and always confirm

### Explicitly avoid

Playful styling · AI-slop purple/pink gradients · colour as the only signal.

---

## 11. Testing

Tests where a bug would cost real money or silently corrupt data.

**Must have:**

- `splitAmount` — shares always sum to `amount`, across many `(amount, n)` pairs and awkward
  remainders
- `splitAmount` — `position` tiebreak is deterministic, independent of click order, and stable when
  positions have gaps (a deactivated member in the middle)
- The canonical example: `100 / [ahmad, abu-obaida, kasem, abu-adnan]` → `25` each
- Week bucketing — Saturday boundary, month boundary, year boundary
- Week summary — `دفع`, `عليه`, `الصافي` on a fixture with a payer who isn't a sharer; a
  deactivated member still gets their row
- Week summary — a payback zeroes the payer and reduces the receiver by the same amount; a member
  who appears *only* through a payback still gets a row; every net sums to zero
- `suggestSettlements` — applying every suggested transfer leaves all balances at zero; tiebreak is
  deterministic
- Zod — rejects zero/negative/float `amount`, empty `sharers`, duplicate sharers, `from === to`,
  malformed `date`; response parsing skips a bad record without throwing
- Import script mapping — every legacy slug maps to a member, and record count in = record count out
- Feed grouping — purchases and paybacks land in the same Saturday week and interleave newest-first
- Archive split — exactly `RECENT_WEEKS` recent weeks stay visible; an older settled week is archived;
  an older week with any non-zero net stays in the main feed

**Server rules** are verified once per change by a script against a throwaway local PocketBase
(`npm run test:pb`): a non-admin cannot update/delete or create members, `createdBy` spoofing is
rejected, a deactivated member cannot log in, a future date is rejected.

**Skip:** component render smoke tests, presentational-prop assertions, mock-call-only tests.

---

## 12. Repo layout

```
office-expenses/
├── pocketbase/
│   ├── pb_migrations/*.js        ← collections, fields, rules, backups; seeds the 7 members
│   └── pb_hooks/                 ← validate.pb.js wires ledger.js: date window, from ≠ to,
│                                   active-member checks, next position
├── .github/workflows/
│   └── deploy.yml                ← test → test:pb → build → rsync pb_hooks, pb_migrations, web
├── scripts/
│   ├── test-pb.mjs               ← server-rule tests against a throwaway PocketBase
│   ├── pb-dev.mjs                ← local PocketBase for `npm run dev`
│   └── import-legacy.ts          ← one-off: data/**/*.json → PocketBase (§14)
├── src/
│   ├── hooks/
│   │   ├── useAuth.ts            ← session state + periodic refresh (§5.1)
│   │   └── useLedger.ts          ← load, error, realtime reload
│   ├── lib/
│   │   ├── pb.ts                 ← the one PocketBase client instance
│   │   ├── api.ts                ← typed fetch/create/update/delete, Zod-parsed
│   │   ├── schema.ts             ← Zod for members, expenses, payments, and the forms
│   │   ├── roster.ts             ← members by position, names, selectable chips
│   │   ├── split.ts              ← largest-remainder by position
│   │   ├── settle.ts             ← minimal transfers to zero every balance
│   │   ├── dates.ts              ← Damascus "today", calendar checks
│   │   ├── week.ts               ← Saturday bucketing
│   │   ├── summary.ts            ← per-week per-member paid/owed/settled/net
│   │   ├── feed.ts               ← week grouping + expense/payback interleave + summary
│   │   └── archive.ts            ← recent vs archived weeks (§5.3)
│   ├── components/               ← one concern each: views, sheets, cards
│   └── styles/tokens.css
├── AGENTS.md
└── PROJECT_SPEC.md               ← this file
```

---

## 13. Decisions log

| decision | choice | why |
|---|---|---|
| Backend | PocketBase on the VPS | Auth, API, rules, realtime, admin UI, and backups in one ~20MB binary; no backend code to own |
| Write path | Direct API calls, per-member login | Members need to add records themselves; the issue flow required a GitHub account per member |
| Who writes | Any member creates; admin edits/deletes | Members log what they bought; one person referees corrections |
| Visibility | Login to view | Data moved off a public repo; no reason to keep it world-readable |
| Member removal | Deactivate, never delete | History references them; deleting would orphan or rewrite past weeks |
| Canonical order | Immutable `position` | Renumbering would silently change historical splits |
| `date` type | Plain `YYYY-MM-DD` text | A timezone-bearing date can shift a purchase into the wrong week |
| Schema source | JS migrations in git | Dashboard edits drift silently from what the code expects |
| Accountability | `createdBy` on every record | With seven writers, a wrong entry needs an author |
| Scope | Log + per-entry share + weekly summary | A week is the unit that gets settled; no cross-week balance |
| Paybacks | Their own collection | "What's left to pay" is unanswerable if only debts are recorded |
| Debt model | Pot (one net per member) | Avoids a web of pairwise lines; the office settles as a pot |
| Settle-up | Minimal-transfer suggestions | One tap prefills the payback that zeroes the week |
| Payback date | Prefilled inside the settled week | A payback dated elsewhere never cancels the debt it settles |
| Over/under payment | Allowed | The ledger records what happened |
| Currency | SYP, integer, largest-remainder | Shares must sum to the exact total |
| Freshness | Immediate + realtime | The rebuild wait was the price of having no backend; that price is gone |
| Archive | Last 3 weeks shown; older folded, unless unsettled | Keeps the feed short without hiding a debt nobody has paid |
| Week start | Saturday | Levant work week; one constant to change |

---

## 14. Migration from the GitHub-issue design

Done on 2026-10-02: 38 expenses and 32 payments imported, every weekly summary identical. Kept for
the record.

1. Migrations create the collections and seed the seven members with positions 1–7 and their legacy
   slugs as usernames.
2. `scripts/import-legacy.ts` (run locally with superuser credentials from env, never committed)
   reads `data/entries/*.json` and `data/payments/*.json`, maps each slug to its member id by
   `username`, and creates records **in legacy `createdAt` order** so PocketBase's `created`
   preserves the same-day tiebreak. `createdBy` is `ahmad` for all imported records. It refuses to run
   if `expenses` or `payments` is non-empty.
3. Verify: record counts match, and every week's summary renders identical numbers before and after
   (the script prints both).
4. Then delete: `data/`, `entry.yml`, `scripts/process-issue.mjs`, `issue-url.ts`, `records.ts`,
   `entries.ts`, `payments.ts`, `members.ts`, `IssueActions.tsx`, and the Pages deploy.
