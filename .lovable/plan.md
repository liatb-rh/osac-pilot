# VM Instance Types (Flavors)

Introduce predefined VM instance types (t-shirt sizes) as the standard way to size VMs. Catalog Items reference an instance type instead of raw CPU/RAM/disk fields, and the tenant VM wizard picks an instance type instead of editing individual numbers. Scope is VM only — clusters and bare metal are untouched.

## Data model (`src/lib/instance-types-data.ts` — new)

```ts
type InstanceTypeCategory = "general" | "compute" | "memory";

interface InstanceType {
  id: string;            // "it-small"
  name: string;          // "small"
  displayName: string;   // "Small"
  description?: string;
  category: InstanceTypeCategory;
  cpu: number;
  memoryGib: number;
  bootDiskGib: number;
  builtIn: boolean;      // seeded t-shirt sizes can't be deleted
}
```

Seed: `small` (2/8/64), `medium` (4/16/128), `large` (8/32/256), `xlarge` (16/64/512), `compute-l` (16/32/128, compute), `memory-l` (8/64/256, memory). Helpers: `listInstanceTypes()`, `findInstanceType(id)`.

## Catalog data changes (`src/lib/catalog-data.ts`)

- Add optional `instanceTypeId?: string` to `CatalogItem.fixedDefaults` (only meaningful for `type: "vm"`).
- Migrate seeded VM items to reference an instance type (e.g. `vm-rhel9-small` → `it-small`). Keep `cpu`/`memoryGib`/`bootDiskSizeGib` as resolved/fallback values so non-VM views and existing summaries stay intact.
- `allowUserResize` is retired for VMs — replaced by "pick another instance type". Keep the field tolerated but unused.

## Provider Catalog Items wizard (`src/routes/app.provider.catalog-items.tsx`)

Step 3 ("Defaults") for VM-type items:
- Replace CPU / RAM / disk inputs with a single **Instance type** `Select` listing all instance types, grouped by category, showing `name — N vCPU · N GiB · N GiB disk`.
- "Create new instance type…" inline action opens a small modal (name, displayName, description, category, cpu, memoryGib, bootDiskGib). Saving appends to the in-memory list and selects it. Built-in types are not editable; custom ones can be edited/removed from the same modal's list view.
- Cluster and Bare Metal items keep their existing Step 3 unchanged.
- Card rendering: for VM items show the resolved instance type chip (e.g. `medium · 4 vCPU · 16 GiB`) instead of separate CPU/RAM stats.

## Tenant VM wizard (`src/routes/app.vms.index.tsx`)

- Remove the CPU / RAM / Boot disk `NumberInput` fields.
- Add a single **Instance type** select pre-seeded from the chosen catalog item's `instanceTypeId`; user can switch to any other instance type.
- Derived `cpu`, `ram`, `disk` come from the selected instance type and are shown read-only in the Resources summary and Review step (`small · 2 vCPU · 8 GiB · 64 GiB`).
- VM table rows continue to show resolved cpu/ram, sourced from the instance type at creation time.

## Catalog detail / picker (`src/components/osac/CatalogItemPicker.tsx`, `src/routes/app.catalog.tsx`)

For VM items, render the instance type label + resolved specs in the spec row instead of separate CPU/GiB chips. Cluster and BM rendering unchanged.

## RBAC (`src/lib/rbac.ts`)

No new roles required. Instance type CRUD lives inside the existing Provider Catalog Items wizard, which is already gated by `manage_catalog_items`.

## Out of scope

Dedicated `/app/provider/instance-types` admin page, tenant-defined instance types, GPU flavors, placement / scheduling policies, persistence beyond the in-memory seed.

## Files

```text
src/lib/instance-types-data.ts                (new)
src/lib/catalog-data.ts                       (extend fixedDefaults, migrate VM seeds)
src/routes/app.provider.catalog-items.tsx     (Step 3 instance-type selector + create modal)
src/routes/app.vms.index.tsx                  (wizard: replace cpu/ram/disk with instance type)
src/components/osac/CatalogItemPicker.tsx     (VM spec rendering)
src/routes/app.catalog.tsx                    (VM spec rendering in detail drawer)
```
