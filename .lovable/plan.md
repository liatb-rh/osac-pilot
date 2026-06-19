# OSAC Core — Foundation Layer

A new top-level navbar section, **"OSAC Core"**, gives each role a focused view of the platform's foundation: identity, access, onboarding, catalog, and the Ansible automation contract. Visuals stay in the current PatternFly idiom (PageHeader, KPI strip, panels, tables, status dots, tabs).

## Navigation (per role)

Add a new nav group **"OSAC Core"** in `src/routes/app.tsx`.

- **Provider Admin** — sees all 5 pillars + an Overview landing
  - Overview · Organizations & Auth · RBAC · Tenant Onboarding · Catalog & Templates · Ansible Collection
- **Tenant Admin** — sees an org-scoped subset
  - Overview · My Organization & IdP · Roles & Members · Onboarding Status · Catalog
- **Tenant User** — minimal
  - Overview · Catalog (existing) · My Roles (read-only)

Existing Organizations/RBAC/Onboarding/Catalog Items/Ansible routes are reused where possible; new routes are added only for the per-role overviews and the role-scoped subsets that don't exist yet.

## New routes

```text
src/routes/app.core.tsx                    (layout: Outlet)
src/routes/app.core.index.tsx              (Provider/Tenant Admin overview — role-aware)
src/routes/app.core.onboarding.tsx         (pipeline visualization — Provider Admin)
src/routes/app.core.ansible-contract.tsx   (role/role-contract docs — Provider Admin)
src/routes/app.core.my-org.tsx             (Tenant Admin — single-org IdP view)
src/routes/app.core.my-roles.tsx           (Tenant User — read-only role/group list)
```

Existing routes linked from the section: `app.provider.organizations`, `app.provider.rbac`, `app.provider.onboarding`, `app.provider.catalog-items`, `app.provider.ansible`, `app.admin.users`, `app.catalog`.

## Page designs (PatternFly look)

### 1. OSAC Core Overview (`app.core.index.tsx`)
Role-aware landing built from existing primitives.

- `PageHeader` — title "OSAC Core", subtitle "Identity, access, and onboarding backbone."
- KPI strip (`Kpi`): Organizations · Healthy IdPs · Roles defined · Tenants onboarded (30d) · Catalog items published · Ansible roles (version).
- 5 pillar cards in a 3+2 grid, each card:
  - Icon (KeyIcon / ShieldAltIcon / UsersIcon / CatalogIcon / CogsIcon)
  - One-line description
  - 2–3 mini stats + `StatusDot` health
  - Primary action button → deep links into the existing page
- Tenant Admin variant: same layout, scoped to their org (only their realm, their roles, their onboarding history, their catalog subscriptions).
- Tenant User variant: 2 cards — Catalog + My Roles.

### 2. Organizations & Authentication
Reuse existing `app.provider.organizations.tsx` as-is for Provider Admin.
New `app.core.my-org.tsx` for Tenant Admin: single-org detail (realm, IdP type/host, health, break-glass count, last IdP probe) with "Test connection" + "Rotate break-glass" actions. No org list, no create button.

### 3. RBAC
Reuse existing `app.provider.rbac.tsx` for Provider Admin (system + org roles matrix).
Tenant Admin uses existing `app.admin.users.tsx` (already scoped) plus a new compact Role Matrix panel embedded showing tenant-admin/tenant-reader/tenant-user × permissions.
Tenant User gets read-only `app.core.my-roles.tsx`: a panel listing their effective roles, source Keycloak groups, and what each role lets them do.

### 4. Tenant Onboarding (`app.core.onboarding.tsx`)
A pipeline-style page (still PatternFly, no new chart libs):

- `PageHeader` with "New onboarding" primary action.
- KPIs: In progress · Completed (30d) · Avg duration · Failures.
- **Pipeline visual**: horizontal step strip rendered with PatternFly chips + connectors (CSS only), 5 stages:
  `Create org → Configure IdP → Assign roles → Provision OpenShift project → Trigger storage`
  Each stage shows status dot, duration, and an expandable details row.
- Table below: recent onboardings (tenant, started, stage, duration, status, actions: Retry, View log).

### 5. Catalog & Templates
Reuse existing `app.provider.catalog-items.tsx` for Provider Admin (already has the wizard).
Tenant Admin/User keep existing `app.catalog.tsx`. Add a "Backed by Ansible role" chip on each catalog card to make the Ansible contract visible.

### 6. Modular Ansible Collection (`app.core.ansible-contract.tsx`)
Provider Admin only. Visualizes the "Contract" narrative.

- `PageHeader` "Ansible Collection — infra.osac.common", subtitle with version + last published.
- KPIs: Roles · Versions in use · Avg execution time · Failures (7d).
- Tabs (`Tabs`):
  - **Roles** — table of atomic roles (`vm_provision`, `network_configure`, `storage_attach`, …) with inputs/outputs count, version, status, "View spec".
  - **Contract** — read-only panel showing the standard Blueprint (Pre-hook → Core → Post-hook), with example override snippet.
  - **Execution feed** — recent runs with the granular `Provisioning (Network) / (Storage) / (DNS)` status chips described in the brief.
  - **Migration guide** — static markdown-style panel linking to docs.

## RBAC wiring (`src/lib/rbac.ts`)

No new permission IDs needed — gate the new routes with existing ones:

- Overview: `view_shell` (all roles)
- Onboarding page: `onboard_tenants` (Provider Admin)
- Ansible contract: `view_ansible_collection` (Provider Admin)
- My Org: `view_tenant_admin_dashboard` (Tenant Admin)
- My Roles: `view_shell` (Tenant User)

## Navbar filter changes (`src/routes/app.tsx`)

Add `"OSAC Core"` group entries to `ALL_LINKS`, then per-role `.map()` rules:

- Provider Admin: show all 6 OSAC Core links.
- Tenant Admin: include Overview + My Org + Roles & Members (alias to `/app/admin/users`) + Onboarding Status (read-only variant of the existing onboarding page, or filter to their tenant) + Catalog.
- Tenant User: Overview + Catalog + My Roles.

## Out of scope

- Quotas, billing, notifications (explicitly excluded by the brief).
- New backend/data layer — pages render from existing in-memory data (`organizations`, `agents-data`, `catalog-data`, etc.) plus small inline mocks for onboarding history and Ansible runs, matching how the rest of the app is wired.
- No new chart libraries; pipeline visual is CSS + PatternFly chips.

## Files

```text
src/routes/app.tsx                          (extend ALL_LINKS + per-role filters)
src/lib/rbac.ts                             (no changes; reuse existing perms)
src/routes/app.core.tsx                     (new — Outlet layout)
src/routes/app.core.index.tsx               (new — role-aware overview)
src/routes/app.core.onboarding.tsx          (new — pipeline + history)
src/routes/app.core.ansible-contract.tsx    (new — roles/contract/runs tabs)
src/routes/app.core.my-org.tsx              (new — tenant-admin org detail)
src/routes/app.core.my-roles.tsx            (new — tenant-user read-only roles)
src/routes/app.catalog.tsx                  (small edit — add "Backed by Ansible role" chip)
```
