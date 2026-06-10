# Add Bare Metal (BMaaS) Support to OSAC

Bare metal becomes a first-class workload type alongside VMs and Clusters: tenants can request and operate physical servers; provider admins manage the physical inventory, discovery, and allocation.

## New data layer

Extend `src/lib/osac-api.ts` with two resource families:

- **BareMetalHost** (provider-managed inventory): `id`, `hostname`, `serial`, `manufacturer/model`, `bmcAddress`, `cpuModel`, `cores`, `memoryGiB`, `disks[]`, `nics[]`, `gpu?`, `rack/zone`, `powerState`, `discoveryState` (discovered/inspecting/available/allocated/maintenance/failed), `tenantAllocation?`.
- **BareMetalInstance** (tenant-facing provisioned server): `id`, `name`, `tenant`, `hostRef`, `flavor` (e.g. `bm.gp1.large`, `bm.gpu.h100x4`), `image` (RHEL 9 / Ubuntu 22 / OpenShift node / custom ISO), `network` (vnet + subnet + VLAN), `provisioningState` (queued/inspecting/installing/configuring/active/failed), `bootMode` (UEFI/BIOS), `secureBoot`, `ipmiUrl`, `createdAt`.

Seed ~6 hosts across 2 racks and ~3 instances across tenants so listing screens look real. Add `bmSimpleStatus()` helper mirroring `vmSimpleStatus`.

## RBAC

In `src/lib/rbac.ts` add permissions and grants:

- Tenant user: `view_my_bare_metal`, `request_bare_metal`, `operate_bare_metal_power`, `launch_bare_metal_console`.
- Tenant admin: inherits view + `view_bare_metal_quota`.
- Provider admin: `view_bare_metal_inventory`, `manage_bare_metal_hosts`, `manage_bare_metal_discovery`, `manage_bare_metal_allocation`, `view_all_bare_metal`.

## New routes

Tenant-scoped:
- `src/routes/app.bare-metal.tsx` — layout (Outlet).
- `src/routes/app.bare-metal.index.tsx` — list of my bare metal instances with filter/search, "Request bare metal" wizard (flavor → image → network → review), row actions (power on/off, reboot, console, release).
- `src/routes/app.bare-metal.$name.tsx` — details: Overview, Hardware (CPU/RAM/disks/NICs/GPU), Network, Power & Console (BMC URL, power state, soft/hard actions), Activity timeline.

Provider-scoped:
- `src/routes/app.provider.bare-metal.tsx` — layout.
- `src/routes/app.provider.bare-metal.index.tsx` — tabs: **Hosts** (inventory table: serial, model, rack, CPU/RAM, GPU, discovery state, allocation), **Instances** (cross-tenant list), **Discovery** (recently discovered hardware awaiting inspection, "Inspect" / "Make available" actions).
- `src/routes/app.provider.bare-metal.$id.tsx` — host detail: hardware inventory, BMC settings, lifecycle actions (inspect, maintenance mode, decommission), current allocation.

## Navigation

In `src/routes/app.tsx`, append to `ALL_LINKS`:
- Workloads group: `Bare Metal` → `/app/bare-metal` (perm `view_my_bare_metal`, icon `ServerIcon` styled as physical — use `HddIcon` or `ServerIcon`).
- Platform group: `Bare Metal Inventory` → `/app/provider/bare-metal` (perm `view_bare_metal_inventory`).

## Provider Overview tile

In `src/routes/app.provider.index.tsx`, add a Bare Metal KPI card (total hosts, available, allocated, in maintenance).

## Visual + status conventions

Reuse existing `osac-status-dot`, `osac-panel`, `Table`, `PageHeader`, and PatternFly `Wizard`/`Modal` patterns from `app.vms.index.tsx` so bare metal UIs feel native. Map BMaaS provisioning states to the same dot tones (`ready`/`progressing`/`stopped`/`failed`).

## Out of scope

No backend wiring; this is mock data and UI flows only, matching the rest of the project.

## Files to add/modify

```text
src/lib/osac-api.ts                              (extend)
src/lib/rbac.ts                                  (extend)
src/routes/app.tsx                               (nav links)
src/routes/app.provider.index.tsx                (KPI tile)
src/routes/app.bare-metal.tsx                    (new)
src/routes/app.bare-metal.index.tsx              (new)
src/routes/app.bare-metal.$name.tsx              (new)
src/routes/app.provider.bare-metal.tsx           (new)
src/routes/app.provider.bare-metal.index.tsx     (new)
src/routes/app.provider.bare-metal.$id.tsx      (new)
```
