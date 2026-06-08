## Goal

Redesign the **Storage Tiers** page (`/app/provider/storage-tiers`) and its detail view to follow the recommended UX practices for tiered storage: temperature-based classification, transparent pricing/penalties, lifecycle automation, rehydration status, and bulk visual asset management.

Scope is **frontend only**. The existing `StorageTier` data model is preserved and extended with a few presentation/mock fields — no backend or API changes.

## Data model additions (frontend mock)

Extend `src/lib/storage-tiers-data.ts` with non-breaking optional fields, populated for the four existing tiers (Platinum/Gold/Silver/Bronze mapped to Hot/Warm/Cool/Cold respectively), plus a new **Archive** tier:

- `temperature: "hot" | "warm" | "cool" | "cold" | "archive"`
- `cost_storage_per_tib_month: number` (e.g. 220, 95, 38, 12, 4)
- `cost_retrieval_per_tib: number` (0, 0, 5, 18, 60)
- `min_retention_days: number` (0, 0, 30, 90, 180)
- `early_delete_fee_per_tib: number`
- `rehydration_eta: string` ("instant", "minutes", "1–4 hours", "up to 12 hours")
- `icon_tone`: hot=red, warm=amber, cool=blue, cold=indigo, archive=slate

Add a small mock lifecycle-rule list and a mock "rehydration jobs" list (in-memory) used by the new sections.

## New page layout (`storage-tiers.index.tsx`)

```text
PageHeader  [New tier] [New lifecycle rule]

┌─ Tier temperature strip ──────────────────────────────────────┐
│  Hot · Warm · Cool · Cold · Archive                           │
│  segmented filter; click filters the grid below               │
└───────────────────────────────────────────────────────────────┘

┌─ Tier cards grid (replaces dense table) ──────────────────────┐
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐       │
│  │ HOT       │ │ WARM      │ │ COOL      │ │ ARCHIVE  │  ...  │
│  │ Platinum  │ │ Gold      │ │ Silver    │ │ Bronze   │       │
│  │ flame ico │ │ sun ico   │ │ snowflake │ │ cube ico │       │
│  │           │ │           │ │           │ │          │       │
│  │ $220/TiB  │ │ $95/TiB   │ │ $38/TiB   │ │ $12/TiB  │       │
│  │ retrieval │ │ retrieval │ │ +$5/TiB   │ │ +$18/TiB │       │
│  │ instant   │ │ instant   │ │ minutes   │ │ 1–4 hrs  │       │
│  │           │ │           │ │           │ │          │       │
│  │ Used bar  │ │ Used bar  │ │ Used bar  │ │ Used bar │       │
│  │ 38/120TiB │ │ 211/480   │ │ 312/960   │ │ 0/2400   │       │
│  │           │ │           │ │           │ │          │       │
│  │ [Details] │ │ [Details] │ │ [Details] │ │ [Details]│       │
│  └───────────┘ └───────────┘ └───────────┘ └──────────┘       │
└───────────────────────────────────────────────────────────────┘

┌─ Cost & penalty comparison table ─────────────────────────────┐
│ Tier | Storage $/TiB·mo | Retrieval $/TiB | Min retention |   │
│       | Early delete fee | Latency        | Replication   |   │
│  (hover any cell → tooltip explaining the trade-off)          │
└───────────────────────────────────────────────────────────────┘

┌─ Lifecycle rules (automation) ────────────────────────────────┐
│  List of rules:                                               │
│   • "Move VM snapshots older than 30d → Cool"   [edit][off]   │
│   • "Archive logs older than 1y → Archive"      [edit][off]   │
│  [+ New rule]   opens a small wizard:                         │
│    1. Source tier  2. Age / size / tag filter                 │
│    3. Target tier  4. What-if savings preview                 │
└───────────────────────────────────────────────────────────────┘

┌─ Rehydration jobs ────────────────────────────────────────────┐
│  job-id  | source archive → cool | 1.2 TiB |  ▓▓▓▓░░ 62% ETA 38m │
│  job-id  | source cold → hot     | 80 GiB  |  ✓ Ready          │
└───────────────────────────────────────────────────────────────┘
```

### Tier card details (per card)
- Big temperature pill (color-coded by `icon_tone`) + Lucide icon (Flame/Sun/Snowflake/Database/Archive).
- Two-row cost block: **storage cost** and **retrieval cost**, with `?` icon → Tooltip explaining trade-off.
- Latency + rehydration ETA chip.
- Used / capacity bar, color flips red at >80%.
- "Available" toggle (existing behavior preserved).
- "Details" link → existing `/app/provider/storage-tiers/$id` route.

### Cost & penalty comparison
- Plain table using existing PatternFly `Table` components.
- Tooltip on each penalty cell with a one-sentence explanation (e.g. "Files deleted before 90 days incur a $18/TiB early-delete fee").
- A small `<Alert variant="warning">` if a tier has a minimum retention period, surfaced near any action that would move data into it.

### Lifecycle rules
- New mock array `LIFECYCLE_RULES` with `{id, name, sourceTier, filter, targetTier, enabled, estMonthlySavingsUsd}`.
- "New rule" wizard reuses `Wizard`/`WizardStep` pattern from `NewTierWizard`. Final step shows a **What-if calculator**: enter data size → renders estimated monthly savings using the cost deltas from the data model. Pure client-side math.

### Rehydration jobs
- New mock array `REHYDRATION_JOBS` with `{id, sourceTier, targetTier, sizeTib, progressPct, etaText, status}`.
- Inline progress bars (PatternFly `Progress`).
- "Start rehydration" action on Cold/Archive tier cards opens a small modal that appends a mock job.

## Detail page (`storage-tiers.$id.tsx`) additions

Add three sections under existing content:
1. **Temperature & economics** card — temperature pill, storage/retrieval cost, min retention, early-delete fee, ETA, with the same tooltip pattern.
2. **Lifecycle rules targeting this tier** — filtered slice of `LIFECYCLE_RULES`.
3. **Active rehydration jobs from this tier** — filtered slice of `REHYDRATION_JOBS`.

Existing consumers / Kubernetes / governance sections remain unchanged.

## Bulk actions (light touch)

On the tier cards grid, add a "Bulk move" affordance: checkboxes on each card → a sticky footer bar `[N tiers selected]  [Move data to ▼ tier]  [Cancel]` that opens a confirmation modal showing the cost delta and any retention-penalty warning. Mock-only — clicking confirm just shows a success toast.

## Design tokens

Add temperature color tokens to `src/styles.css` (light + dark variants) so cards stay consistent with the existing semantic-token rule:
- `--osac-temp-hot`, `--osac-temp-warm`, `--osac-temp-cool`, `--osac-temp-cold`, `--osac-temp-archive`
- Matching `*-soft` background variants for pill chips.

## Files changed

- **Modified**: `src/lib/storage-tiers-data.ts` — extend `StorageTier`, add `LIFECYCLE_RULES`, `REHYDRATION_JOBS`, Archive tier.
- **Modified**: `src/routes/app.provider.storage-tiers.index.tsx` — full redesign (cards, comparison table, lifecycle rules, rehydration jobs, bulk bar).
- **Modified**: `src/routes/app.provider.storage-tiers.$id.tsx` — add temperature/economics, rules, rehydration sections.
- **Modified**: `src/styles.css` — temperature tokens (light + dark).
- **New**: `src/components/osac/StorageTierCard.tsx`, `LifecycleRuleList.tsx`, `RehydrationJobList.tsx`, `CostComparisonTable.tsx` — small focused components to keep the route file readable.

## Out of scope

- No backend/API changes, no real lifecycle execution, no real rehydration.
- The provisioning wizard (`NewTierWizard`) keeps its current 6 steps; only a single new "Temperature & economics" step is added so newly created tiers populate the new fields.
