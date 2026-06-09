# OSAC Pilot — Backend API Specification

> **Audience:** Backend developers replacing the frontend mock data with real API endpoints.  
> **Source of truth:** `src/lib/osac-api.ts`, `src/lib/storage-tiers-data.ts`, `src/lib/agents-data.ts`, and `src/routes/`.  
> **Base URL convention:** `/api/v1` (to be confirmed)  
> **Last updated:** 2026-06-06 — full rewrite to align with `src/lib/` canonical data model.

---

## Table of Contents

1. [Global Envelope & Shared Types](#1-global-envelope--shared-types)
2. [Auth & Session](#2-auth--session)
3. [Virtual Machines (Compute Instances)](#3-virtual-machines-compute-instances)
4. [Clusters](#4-clusters)
5. [Virtual Networks & Subnets](#5-virtual-networks--subnets)
6. [Network Classes](#6-network-classes)
7. [Host Types](#7-host-types)
8. [Templates & Catalog](#8-templates--catalog)
9. [Tenant Admin — Users](#9-tenant-admin--users)
10. [Tenant Admin — Quota](#10-tenant-admin--quota)
11. [Tenant Admin — Networks](#11-tenant-admin--networks)
12. [Tenant Admin — Cluster Offerings](#12-tenant-admin--cluster-offerings)
13. [Provider — Tenants & Organizations](#13-provider--tenants--organizations)
14. [Provider — Infrastructure Agents](#14-provider--infrastructure-agents)
15. [Provider — Storage Tiers](#15-provider--storage-tiers)
16. [Provider — RBAC](#16-provider--rbac)
17. [Provider — Onboarding](#17-provider--onboarding)
18. [Provider — Ansible Collection](#18-provider--ansible-collection)
19. [Activity Log](#19-activity-log)
20. [Dashboard KPIs](#20-dashboard-kpis)

---

## 1. Global Envelope & Shared Types

### 1.1 Resource envelope

Every resource follows this four-field structure (mirrors `proto/public/osac/public/v1`):

```typescript
interface Resource<Spec, Status> {
  id: string;          // server-assigned UUID
  metadata: Metadata;
  spec: Spec;          // user-controlled desired state
  status: Status;      // system-controlled observed state (read-only)
}
```

### 1.2 Metadata

```typescript
interface Metadata {
  creation_timestamp?: string;         // ISO 8601
  deletion_timestamp?: string;         // ISO 8601; set when delete begins
  creator: string;                     // identity from auth context
  name: string;                        // DNS label: 1–63 chars, [a-z0-9-]
  tenant: string;                      // tenant slug, e.g. "northstar"
  labels: Record<string, string>;
  annotations: Record<string, string>; // "osac.openshift.io/owner-reference" used for parent VNet refs
  version: number;                     // auto-incremented; use for optimistic locking
}
```

### 1.3 Conditions

All status objects carry a `conditions` array for fine-grained lifecycle detail:

```typescript
type ConditionStatus =
  | "CONDITION_STATUS_UNSPECIFIED"
  | "CONDITION_STATUS_TRUE"
  | "CONDITION_STATUS_FALSE";

interface Condition {
  type: string;                    // resource-specific enum string
  status: ConditionStatus;
  last_transition_time: string;    // ISO 8601
  reason?: string;                 // machine-readable
  message?: string;                // human-readable debug detail
}
```

### 1.4 Roles

Two scopes: **system** (provider-wide) and **org** (per-tenant).

| Role ID | Scope | UI label |
|---|---|---|
| `cloud-provider-admin` | system | Cloud Provider Admin |
| `cloud-provider-reader` | system | Cloud Provider Reader |
| `tenant-admin` | org | Tenant Admin |
| `tenant-reader` | org | Tenant Reader |
| `tenant-user` | org | Tenant User |

Frontend session uses shorthand aliases (`providerAdmin`, `tenantAdmin`, `tenantUser`) for routing guards — the backend must return the full Keycloak-compatible role IDs listed above.

### 1.5 State enums summary

| Resource | States |
|---|---|
| ComputeInstance | `STARTING \| RUNNING \| STOPPING \| STOPPED \| PAUSED \| FAILED \| DELETING` |
| Cluster | `PROGRESSING \| READY \| FAILED` |
| VirtualNetwork | `PENDING \| READY \| FAILED` |
| Subnet | `PENDING \| READY \| FAILED \| DELETING \| DELETE_FAILED` |
| Agent | `healthy \| drift \| unreachable \| provisioning` |
| StorageTier | `enabled` boolean + condition set |
| IdP | `running \| progressing \| failed` |

---

## 2. Auth & Session

### 2.1 Session object

Stored client-side under `osac.session` in `localStorage`.

```typescript
interface Session {
  role: string;          // Keycloak role ID, e.g. "tenant-admin"
  tenant: string;        // tenant slug, e.g. "northstar"
  user: {
    name: string;
    email: string;
  };
  signedIn: boolean;
}
```

### 2.2 Endpoints

```
POST /auth/sign-in
```

**Request body:** `{ credential: string }` — opaque IdP token / OIDC code for Keycloak exchange.  
**Response:** `Session`

---

```
POST /auth/logout
```

No body. Invalidates server-side session / Keycloak refresh token.

---

```
GET /auth/session
```

Returns current `Session` for authenticated user. Used on page load.

**Auth model:** Keycloak OIDC. Issuer: `https://auth.osac.internal/realms/<tenant-realm>`. JWT RS256. Every API route is guarded by an Authorino `AuthPolicy` (deny-by-default). The `groups` claim in the JWT maps to an OSAC role.

---

## 3. Virtual Machines (Compute Instances)

The data model now fully mirrors the fulfillment service proto — see `src/lib/osac-api.ts`.

### 3.1 Types

```typescript
interface ComputeInstance extends Resource<ComputeInstanceSpec, ComputeInstanceStatus> {}

interface ComputeInstanceSpec {
  // Exactly one of template or catalog_item on create (mutually exclusive; immutable after create):
  template?: string;                            // ComputeInstanceTemplate.id
  template_parameters?: Record<string, unknown>;
  catalog_item?: string;                        // ComputeInstanceCatalogItem.id

  // Restart signal: set to current ISO timestamp to request restart.
  // Controller restarts if this value > status.last_restarted_at.
  restart_requested_at?: string;

  image?: { source_type: string; source_ref: string }; // e.g. "registry" / OCI URL
  cores: number;                                // vCPU count
  memory_gib: number;                           // GiB
  ssh_key?: string;
  boot_disk: { size_gib: number };
  additional_disks?: { size_gib: number }[];
  run_strategy: "Always" | "Halted";            // "Always" = running; "Halted" = stopped
  user_data?: string;                           // cloud-init / ignition
  network_attachments: NetworkAttachment[];
}

interface NetworkAttachment {
  subnet: string;              // Subnet.id — must be READY
  security_groups: string[];   // SecurityGroup.id[] — must be READY, same VNet as subnet
}

interface ComputeInstanceStatus {
  state: ComputeInstanceState;
  conditions: Condition[];
  internal_ip_address: string;    // empty when not running
  public_ip_address: string;      // empty when no PublicIPAttachment
  last_restarted_at?: string;     // ISO timestamp of last controller restart
}

type ComputeInstanceState =
  | "COMPUTE_INSTANCE_STATE_UNSPECIFIED"
  | "COMPUTE_INSTANCE_STATE_STARTING"
  | "COMPUTE_INSTANCE_STATE_RUNNING"
  | "COMPUTE_INSTANCE_STATE_STOPPING"
  | "COMPUTE_INSTANCE_STATE_STOPPED"
  | "COMPUTE_INSTANCE_STATE_PAUSED"
  | "COMPUTE_INSTANCE_STATE_FAILED"
  | "COMPUTE_INSTANCE_STATE_DELETING";
```

### 3.2 Condition types

```typescript
type ComputeInstanceConditionType =
  | "COMPUTE_INSTANCE_CONDITION_TYPE_PROVISIONED"         // infrastructure allocated
  | "COMPUTE_INSTANCE_CONDITION_TYPE_CONFIGURATION_APPLIED"
  | "COMPUTE_INSTANCE_CONDITION_TYPE_READY"               // reachable; internal IP populated
  | "COMPUTE_INSTANCE_CONDITION_TYPE_RESTART_IN_PROGRESS"
  | "COMPUTE_INSTANCE_CONDITION_TYPE_RESTART_FAILED"
  | "COMPUTE_INSTANCE_CONDITION_TYPE_RESTART_REQUIRED";
```

**Known `reason` values:**
- `BootInProgress` — READY is FALSE while VM is starting
- `NoGPUCapacity` — PROVISIONED is FALSE when no GPU host available in zone

### 3.3 Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/vms` | List VMs; query params: `status`, `search`, `offset`, `limit` |
| `GET` | `/vms/{name}` | VM detail (all tabs) |
| `POST` | `/vms` | Create VM |
| `PATCH` | `/vms/{name}` | Update VM — triggers restart when `restart_requested_at` changes |
| `DELETE` | `/vms/{name}` | Delete; volumes detached, snapshots retained |
| `POST` | `/vms/{name}/start` | Sets `run_strategy = "Always"` |
| `POST` | `/vms/{name}/stop` | Sets `run_strategy = "Halted"` |
| `POST` | `/vms/{name}/restart` | Sets `restart_requested_at` to now |
| `POST` | `/vms/{name}/clone` | Body: `{ newName: string }` |
| `GET` | `/vms/{name}/interfaces` | Network interfaces |
| `GET` | `/vms/{name}/disks` | Disk list |
| `GET` | `/vms/{name}/snapshots` | Snapshot list |
| `POST` | `/vms/{name}/snapshots` | Create snapshot; body: `{ disk: string }` |
| `GET` | `/vms/{name}/metrics` | CPU / memory / disk / network timeseries |
| `GET` | `/vms/{name}/activity` | Per-VM audit log |
| `GET` | `/vms/{name}/console` | Console access (serial/VNC stream URL) |

### 3.4 Create payload

```typescript
// POST /vms — body
{
  metadata: { name: string; labels?: Record<string, string> };
  spec: {
    template?: string;        // or catalog_item
    catalog_item?: string;
    template_parameters?: Record<string, unknown>;
    cores?: number;           // may be preset by catalog_item
    memory_gib?: number;
    boot_disk?: { size_gib: number };
    run_strategy?: "Always" | "Halted";  // default: "Always"
    user_data?: string;
    network_attachments: NetworkAttachment[];
  };
}
```

---

## 4. Clusters

The data model mirrors the fulfillment service proto — see `src/lib/osac-api.ts`.

### 4.1 Types

```typescript
interface Cluster extends Resource<ClusterSpec, ClusterStatus> {}

interface ClusterSpec {
  template?: string;                               // ClusterTemplate.id; immutable after create
  template_parameters?: Record<string, unknown>;   // immutable after create
  catalog_item?: string;

  // Node sets: key = logical set name (e.g. "compute", "gpu"), value = definition.
  // host_type is immutable per set. User can update size, add sets, remove sets (min 1 must remain).
  node_sets: Record<string, ClusterNodeSet>;

  pull_secret?: string;     // Write-only: returned as "***" in GET responses
  ssh_public_key?: string;
  release_image?: string;   // OCP release image URL, e.g. "quay.io/openshift-release-dev/ocp-release:4.17.3-multi"
  network?: {
    pod_cidr?: string;      // default: "10.128.0.0/14"
    service_cidr?: string;  // default: "172.30.0.0/16"
  };
}

interface ClusterNodeSet {
  host_type: string;    // HostType.id; immutable per node set
  size: number;         // worker count; user-updatable
}

interface ClusterStatus {
  state: ClusterState;
  conditions: Condition[];
  api_url: string;       // e.g. "https://api.prod-ocp.northstar.osac:6443"; empty until READY
  console_url: string;   // e.g. "https://console.prod-ocp.northstar.osac"; empty until READY
  node_sets: Record<string, ClusterNodeSet>; // current observed node sets
}

type ClusterState =
  | "CLUSTER_STATE_UNSPECIFIED"
  | "CLUSTER_STATE_PROGRESSING"
  | "CLUSTER_STATE_READY"
  | "CLUSTER_STATE_FAILED";
```

### 4.2 Condition types

```typescript
type ClusterConditionType =
  | "CLUSTER_CONDITION_TYPE_PROGRESSING"
  | "CLUSTER_CONDITION_TYPE_READY"
  | "CLUSTER_CONDITION_TYPE_FAILED"
  | "CLUSTER_CONDITION_TYPE_DEGRADED";
```

**Known `reason` values:**
- `Upgrading` — PROGRESSING is TRUE during OCP version upgrade; `message` contains "Upgrading from X → Y"

### 4.3 Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/clusters` | List clusters |
| `GET` | `/clusters/{name}` | Cluster detail (overview, nodes, storage, network, addons, activity) |
| `POST` | `/clusters` | Create cluster |
| `PATCH` | `/clusters/{name}` | Update (scale node sets, upgrade release_image, etc.) |
| `DELETE` | `/clusters/{name}` | Destroy cluster; VAST tenant resources retained |
| `GET` | `/clusters/{name}/kubeconfig` | Returns `application/yaml` kubeconfig |
| `GET` | `/clusters/{name}/password` | Returns `text/plain` admin password |
| `GET` | `/clusters/{name}/nodes` | Node list |
| `GET` | `/clusters/{name}/storage` | CSI driver, StorageClasses, VolumeSnapshotClasses |
| `GET` | `/clusters/{name}/network` | VNet config, load balancers, egress policies |
| `GET` | `/clusters/{name}/addons` | Installed + available add-ons |
| `GET` | `/clusters/{name}/health` | etcd quorum, API server, ingress, operators |
| `GET` | `/clusters/{name}/activity` | Per-cluster audit log |
| `POST` | `/clusters/{name}/scale` | Body: `{ node_sets: Record<string, { size: number }> }` |
| `POST` | `/clusters/{name}/upgrade` | Body: `{ release_image: string }` |

---

## 5. Virtual Networks & Subnets

The data model is fully typed in `src/lib/osac-api.ts`.

### 5.1 VirtualNetwork

```typescript
interface VirtualNetwork extends Resource<VirtualNetworkSpec, { state: VirtualNetworkState; message?: string }> {}

interface VirtualNetworkSpec {
  network_class?: string;   // NetworkClass.id; immutable; defaults to provider default ("ovn-kubernetes")
  ipv4_cidr?: string;       // immutable; e.g. "10.10.0.0/16"
  ipv6_cidr?: string;       // immutable; omit for IPv4-only
  capabilities: {
    enable_ipv4: boolean;
    enable_ipv6: boolean;
    enable_dual_stack: boolean;
  };
}

type VirtualNetworkState =
  | "VIRTUAL_NETWORK_STATE_UNSPECIFIED"
  | "VIRTUAL_NETWORK_STATE_PENDING"
  | "VIRTUAL_NETWORK_STATE_READY"
  | "VIRTUAL_NETWORK_STATE_FAILED";
```

**Endpoints:** `GET /virtual_networks`, `GET /virtual_networks/{id}`,  
`POST /virtual_networks`, `PATCH /virtual_networks/{id}`, `DELETE /virtual_networks/{id}`

### 5.2 Subnet

Link to parent VNet via `metadata.annotations["osac.openshift.io/owner-reference"] = VirtualNetwork.id`.

```typescript
interface Subnet extends Resource<SubnetSpec, { state: SubnetState; message?: string }> {}

interface SubnetSpec {
  virtual_network: string;  // VirtualNetwork.id; required; immutable
  ipv4_cidr?: string;       // immutable; must be subset of parent VNet ipv4_cidr; no overlaps
  ipv6_cidr?: string;       // immutable
}

type SubnetState =
  | "SUBNET_STATE_PENDING"
  | "SUBNET_STATE_READY"
  | "SUBNET_STATE_FAILED"
  | "SUBNET_STATE_DELETING"
  | "SUBNET_STATE_DELETE_FAILED";
```

**Sample subnets in `northstar` tenant:**

| Subnet ID | VNet | CIDR | Zone purpose |
|---|---|---|---|
| `sn-app` | `vn-prod` | `10.10.4.0/24` | Application tier |
| `sn-db` | `vn-prod` | `10.10.5.0/24` | Database tier |
| `sn-edge` | `vn-prod` | `10.10.6.0/24` | Edge / API gateway |
| `sn-mgmt` | `vn-prod` | `10.10.7.0/24` | Management |
| `sn-dev-app` | `vn-dev` | `10.20.1.0/24` | Dev app |
| `sn-dev-db` | `vn-dev` | `10.20.2.0/24` | Dev database |
| `sn-warehouse` | `vn-data` | `10.30.1.0/24` | Data warehouse (air-gapped) |

**Endpoints:** `GET /subnets`, `GET /subnets/{id}`,  
`POST /subnets`, `PATCH /subnets/{id}`, `DELETE /subnets/{id}`

---

## 6. Network Classes

Read-only for most users. Describes available network backend implementations.

```typescript
interface NetworkClass {
  id: string;
  metadata: Metadata;
  title: string;
  description: string;
  capabilities: {
    supports_ipv4: boolean;
    supports_ipv6: boolean;
    supports_dual_stack: boolean;
  };
  status: { state: "NETWORK_CLASS_STATE_PENDING" | "NETWORK_CLASS_STATE_READY" | "NETWORK_CLASS_STATE_FAILED"; message?: string };
  is_default?: boolean;
}
```

**Known network classes:**

| ID | Title | IPv4 | IPv6 | Dual-stack | Default |
|---|---|---|---|---|---|
| `ovn-kubernetes` | OVN-Kubernetes | ✓ | ✓ | ✓ | ✓ |
| `vpc-direct` | VPC Direct (BM) | ✓ | — | — | — |

**Endpoints:** `GET /network_classes`, `GET /network_classes/{id}`

---

## 7. Host Types

Read-only reference data for physical host hardware available for cluster node sets.

```typescript
interface HostType {
  id: string;
  metadata: Metadata;
  title: string;
  description: string; // Markdown; contains CPU, RAM, GPU, storage details
}
```

**Known host types:**

| ID | Title | Cores | RAM | Notes |
|---|---|---|---|---|
| `acme_256g` | Acme M5 · 256 GiB | 32 | 256 GiB | Control plane / small workers |
| `acme_512g` | Acme M5 · 512 GiB | 48 | 512 GiB | General-purpose workers |
| `acme_1tb` | Acme M5 · 1 TiB | 64 | 1 TiB | High-memory analytics |
| `acme_gpu_h100` | Acme G8 · 4× H100 | 96 | 1 TiB | ML training / inference |

**Endpoints:** `GET /host_types`, `GET /host_types/{id}`

---

## 8. Templates & Catalog

### 8.1 Provider (global) template — `VirtualMachineTemplate` CRD

```typescript
interface ProviderTemplate {
  id: string;
  name: string;
  scope: "global" | "preview";
  cpu: number;
  ram: number;                   // GiB
  os: string;                    // base image ID, e.g. "rhel-9", "ubuntu-22"
  version: string;               // semantic version, e.g. "1.4.0"
  publishedAt?: string;          // ISO date
}

interface BaseImage {
  id: string;   // e.g. "rhel-9"
  label: string; // e.g. "RHEL 9.4"
  ref: string;   // OCI image reference, e.g. "quay.io/osac/rhel-9:9.4"
}
```

**Known base images:**

| ID | Label | OCI ref |
|---|---|---|
| `rhel-9` | RHEL 9.4 | `quay.io/osac/rhel-9:9.4` |
| `ubuntu-22` | Ubuntu 22.04 LTS | `quay.io/osac/ubuntu:22.04` |
| `windows-2022` | Windows Server 2022 | `quay.io/osac/win:2022` |
| `rocky-9` | Rocky Linux 9 | `quay.io/osac/rocky:9` |

**Kubernetes CRD manifest shape** (`osac.io/v1 VirtualMachineTemplate`):

```yaml
apiVersion: osac.io/v1
kind: VirtualMachineTemplate
metadata:
  name: rhel-9-xlarge
  scope: global
  version: "1.0.0"
spec:
  image:
    sourceType: registry
    sourceRef: quay.io/osac/rhel-9:9.4
  shape:
    cores: 16
    memoryGiB: 128
    hostType: acme_1tb
  bootDisk:
    sizeGiB: 120
    storageTier: gold
  network:
    defaultSubnet: <subnet-id>
  cloudInit: true
```

**Publish template request body:**

```typescript
{
  name: string;
  description: string;
  version: string;
  scope: "global" | "preview";
  base_image_id: string;     // BaseImage.id
  cpu: number;
  ram_gib: number;
  boot_disk_gib: number;
  host_type: string;         // HostType.id
  storage_tier: string;      // StorageTier.id
  default_subnet: string;    // Subnet.id
  cloud_init_enabled: boolean;
}
```

**Endpoints:** `GET /provider/templates`, `POST /provider/templates`, `PATCH /provider/templates/{id}`

### 8.2 Tenant catalog template (read-only)

```typescript
interface CatalogTemplate {
  id: string;
  name: string;
  os: string;
  cpu: number;
  ram_gib: number;
  tags: string[];  // e.g. ["general", "linux", "gpu", "ai", "windows"]
}
```

**Endpoints:** `GET /catalog/templates`, `GET /catalog/templates/{id}`

### 8.3 Catalog items (ComputeInstance + Cluster)

```typescript
interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  template_id: string;
  variant: string;           // "S" | "M" | "L" | "XL" | "Edge" | custom
  cpu: number;
  ram_gib: number;
  presets: number;           // count of preset configurations
  allow_resize: boolean;     // tenants may override cpu/ram at order time
  published: boolean;
  field_definitions: FieldDefinition[];
}

interface FieldDefinition {
  path: string;              // dot-notation spec path, e.g. "spec.cores"
  display_name: string;
  editable: boolean;         // false = admin-locked preset
  default?: unknown;         // pre-fill value
  validation_schema?: string; // JSON Schema 2020-12
}
```

**Endpoints:** `GET /catalog/items`, `GET /catalog/items/{id}`,  
`POST /provider/catalog-items`, `PATCH /provider/catalog-items/{id}`

---

## 9. Tenant Admin — Users

```typescript
interface TenantUser {
  name: string;
  email: string;
  role: "tenant-admin" | "tenant-user" | "tenant-reader";
  mfa_enabled: boolean;
}
```

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/users` | List users |
| `POST` | `/admin/users/invite` | Invite: `{ email, role }` |
| `DELETE` | `/admin/users/{email}` | Remove user from tenant realm |

---

## 10. Tenant Admin — Quota

### 10.1 Type

```typescript
interface QuotaResource {
  label: string;    // human-readable: "vCPU", "Memory (GiB)", etc.
  resource: string; // machine key (see table below)
  used: number;
  total: number;
}
```

### 10.2 Quota resources

| `resource` | `label` |
|---|---|
| `vcpu` | vCPU |
| `memory_gib` | Memory (GiB) |
| `block_storage_tib` | Block storage (TiB) |
| `public_ips` | Public IPs |
| `vms` | VMs |
| `clusters` | Clusters |

### 10.3 Endpoints

```
GET  /admin/quota
POST /admin/quota/requests   — body: { resource, requestedTotal, justification? }
```

---

## 11. Tenant Admin — Networks

(Unchanged from previous spec; see §5 above for the fulfillment-aligned types.)

```typescript
interface VirtualNetworkCreateRequest {
  name: string;
  description?: string;
  cidr: string;
  initial_subnet_count: number;   // 1–16; backend auto-carves subnets
  egress: "restricted" | "open" | "none";
  dns_enabled: boolean;
  create_default_security_group: boolean;
}
```

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/networks` | List VNets |
| `POST` | `/admin/networks` | Create VNet (wizard payload above) |
| `PUT` | `/admin/networks/{name}` | Full update; CIDR change requires re-IP validation |
| `DELETE` | `/admin/networks/{name}` | Releases CIDR, removes subnets + security groups |
| `PUT` | `/admin/networks/{name}/subnets` | Full replace of subnet array |

---

## 12. Tenant Admin — Cluster Offerings

### 12.1 Types

```typescript
interface ClusterOffering {
  id: string;                     // e.g. "ocp-417"
  name: string;
  description: string;
  maturity: "stable" | "preview";
  ocp_version: string;            // e.g. "4.17.3"
  min_worker_nodes: number;
  gpu_enabled: boolean;
  csi_drivers: string[];          // e.g. ["vast-csi", "openshift-cns"]
  published_at?: string;
  last_revision?: string;
  support_end?: string;
}

interface ClusterOfferingUsage {
  tenant_project: string;
  cluster_count: number;
  first_provisioned_at: string;
}
```

**CRD manifest shape:**

```yaml
apiVersion: osac.io/v1
kind: ClusterOffering
metadata:
  name: ocp-417
spec:
  ocpVersion: "4.17.3"
  maturity: stable
  minWorkerNodes: 3
  gpu: false
  csi:
    - vast-csi
    - openshift-cns
```

### 12.2 Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/cluster-offerings` | List offerings |
| `GET` | `/admin/cluster-offerings/{id}` | Offering detail |
| `GET` | `/admin/cluster-offerings/{id}/usage` | Usage per tenant project |
| `POST` | `/provider/cluster-offerings` | Create (provider admin) |
| `PUT` | `/provider/cluster-offerings/{id}` | Update |
| `POST` | `/provider/cluster-offerings/{id}/disable` | Disable offering |
| `POST` | `/provider/cluster-offerings/{id}/enable` | Re-enable |

---

## 13. Provider — Tenants & Organizations

### 13.1 Tenant summary (list view)

```typescript
interface TenantRow {
  id: string;              // tenant slug, e.g. "northstar"
  name: string;            // display name, e.g. "Northstar Bank"
  users: number;
  vms: number;
  clusters: number;        // (field: "cl" in UI)
  status: "active" | "onboarding";
}
```

**Endpoint:** `GET /provider/tenants` → `TenantRow[]`

### 13.2 Tenant detail

Returns the full organizational profile for a single tenant. All fields shown on the detail page tabs: Overview, Quota, Clusters, VMs, Storage, Agents, Audit.

```typescript
interface TenantDetail {
  id: string;
  name: string;
  realm: string;           // Keycloak realm slug, e.g. "northstar.osac"
  idp: "LDAP" | "SAML" | "OIDC" | "AD";
  idp_host: string;        // e.g. "ldap.northstar.internal"
  idp_status: "running" | "progressing" | "failed";
  status: "active" | "onboarding";
  break_glass: number;     // number of emergency local accounts
  created_at: string;      // ISO date of onboarding
  quota: TenantQuotaLimits;
}

interface TenantQuotaLimits {
  cores: number;
  mem_gib: number;
  vm_max: number;
  cluster_max: number;
}
```

**Endpoint:** `GET /provider/tenants/{id}` → `TenantDetail`

**Additional endpoints for tenant detail tabs:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/provider/tenants/{id}/clusters` | Clusters belonging to this tenant |
| `GET` | `/provider/tenants/{id}/vms` | VMs belonging to this tenant |
| `GET` | `/provider/tenants/{id}/storage` | Storage tier consumption per tenant |
| `GET` | `/provider/tenants/{id}/agents` | Physical hosts running this tenant's clusters |
| `GET` | `/provider/tenants/{id}/audit` | Audit log scoped to tenant |
| `PUT` | `/provider/tenants/{id}/quota` | Update quota limits |
| `POST` | `/provider/tenants/{id}/suspend` | Suspend tenant |

### 13.3 Organization

```typescript
interface Organization {
  id: string;               // matches TenantId slug
  name: string;
  realm: string;
  idp_type: "LDAP" | "AD" | "OIDC" | "SAML";
  idp_host: string;
  idp_status: "running" | "progressing" | "failed";
  user_count: number;
  break_glass_count: number;
}
```

**Endpoints:** `GET /provider/organizations`, `POST /provider/organizations`,  
`POST /provider/organizations/{id}/test-idp`, `POST /provider/organizations/{id}/rotate-break-glass`,  
`POST /provider/organizations/{id}/disable`

### 13.4 Onboard tenant wizard request body

Full payload from the 5-step wizard in `app.provider.tenants.index.tsx`:

```typescript
interface OnboardTenantRequest {
  // Step 1 — Identity
  name: string;
  id: string;                  // tenant slug; DNS label format
  realm: string;               // Keycloak realm slug, e.g. "crestline.osac"
  description?: string;

  // Step 2 — Identity Provider
  idp_type: "OIDC" | "SAML" | "LDAP" | "AD";
  idp_host: string;
  idp_client_id?: string;      // OAuth client ID or SP entity ID
  group_claim: string;         // JWT claim used for group membership, default: "groups"

  // Step 3 — Quota & Resources
  quota: {
    cores: number;             // 8–512
    mem_gib: number;           // 32–2048
    vm_max: number;
    cluster_max: number;
    storage_tiers: Record<string, number>; // tier_id → quota_tib, e.g. { "gold": 20, "silver": 50 }
  };

  // Step 4 — RBAC & Access
  initial_admin_email: string;
  seed_default_roles: boolean;    // provision tenantAdmin / tenantUser role bindings
  provision_break_glass: boolean; // provision 2 break-glass accounts

  // Step 5 — Governance
  generate_auth_policies: boolean;  // generate Authorino AuthPolicies for the new realm
  audit_export_enabled: boolean;    // forward audit events to provider SIEM
  network_isolation: "strict" | "shared";
  // strict = dedicated VRF + NetworkPolicies deny-by-default
  // shared = provider VRF, tenant-scoped namespaces
}
```

**Response:** `TenantRow` with `status: "onboarding"`

---

## 14. Provider — Infrastructure Agents

### 14.1 Agent type

Full data model from `src/lib/agents-data.ts`:

```typescript
type AgentStatus = "healthy" | "drift" | "unreachable" | "provisioning";

interface Agent {
  hostname: string;            // unique; used as URL key
  az: string;                  // availability zone, e.g. "AZ-α"
  rack: string;                // rack ID, e.g. "R-α-01"
  host_type: string;           // FK → HostType.id
  serial: string;              // hardware serial, e.g. "ACM-9F1A-0001"
  version: string;             // agent build version, e.g. "1.12.4"
  channel: "stable" | "candidate" | "edge";
  status: AgentStatus;
  cluster?: string;            // FK → Cluster.metadata.name; null when unassigned
  virtual_network: string;     // FK → VirtualNetwork.id
  mgmt_ip: string;             // management interface IP
  data_ip: string;             // data plane IP
  last_heartbeat: string;      // ISO 8601 datetime
  enrolled_at: string;         // ISO 8601 datetime
  enrolled_by: string;         // email / identity
  cores: number;               // physical CPU cores
  memory_gib: number;          // installed RAM GiB
  disk_tib: number;            // local NVMe capacity TiB
  nics: AgentNic[];
}

interface AgentNic {
  name: string;       // e.g. "eno1"
  mac: string;        // e.g. "ac:1f:6b:00:01:01"
  speed_gbps: number;
  link: "up" | "down";
}
```

### 14.2 Agent conditions

```typescript
type AgentConditionType =
  | "AGENT_CONDITION_PROVISIONED"      // host enrolled and trusted
  | "AGENT_CONDITION_REACHABLE"        // heartbeat within threshold
  | "AGENT_CONDITION_VERSION_CURRENT"  // version matches channel pinned release; false = drift
  | "AGENT_CONDITION_CLUSTER_JOINED";  // cluster field is set and joined
```

`drift` status → `AGENT_CONDITION_VERSION_CURRENT = False`  
`unreachable` status → `AGENT_CONDITION_REACHABLE = False`

### 14.3 Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/provider/agents` | List all agents |
| `GET` | `/provider/agents/{hostname}` | Agent detail (overview, networking, storage, logs, danger zone) |
| `POST` | `/provider/agents` | Provision agent; body: `{ hostname, az, rack, host_type, serial }` |
| `POST` | `/provider/agents/{hostname}/upgrade` | Trigger version upgrade |
| `POST` | `/provider/agents/{hostname}/reboot` | Remote reboot |
| `POST` | `/provider/agents/{hostname}/relabel` | Update labels/metadata |
| `POST` | `/provider/agents/{hostname}/pin-channel` | Pin to specific channel/version |
| `DELETE` | `/provider/agents/{hostname}` | Deprovision: drain, revoke trust, remove from fleet |

---

## 15. Provider — Storage Tiers

### 15.1 StorageTier type

Full data model from `src/lib/storage-tiers-data.ts`:

```typescript
interface StorageTier {
  id: string;                  // unique slug, e.g. "gold"
  name: string;                // display name, e.g. "Gold"
  description: string;
  enabled: boolean;            // controls availability to tenants
  is_default: boolean;         // assigned to new tenant clusters automatically

  // Performance
  media: string;               // e.g. "NVMe SSD RAID-10", "SATA SSD", "HDD (SMR)"
  iops: string;                // e.g. "200k"
  throughput_gbps: number;
  latency_ms: string;          // e.g. "<0.2", "<2"
  capacity_tib: number;        // total provisioned capacity
  used_tib: number;            // currently allocated

  // VAST backend
  vast_cluster: string;        // e.g. "vast-prod-α"
  vast_view_prefix: string;    // path template: "/tenants/{tenant}/gold"
  protocol: "NFSv4.1" | "NFSv3" | "S3";

  // Kubernetes CSI
  csi_driver: string;                   // always "csi.vastdata.com"
  storage_class_template: string;       // e.g. "tenant-{tenant}-gold"
  snapshot_class_template: string;      // e.g. "tenant-{tenant}-gold-snap"
  reclaim_policy: "Delete" | "Retain";
  volume_binding_mode: "Immediate" | "WaitForFirstConsumer";
  allow_volume_expansion: boolean;

  // Governance
  encryption: "AES-256 at rest" | "AES-256 + per-tenant KMS";
  replication: "none" | "async" | "sync";

  // Per-tenant usage (read-only; derived from PVC tracking)
  consumers: StorageTierConsumer[];
}

interface StorageTierConsumer {
  tenant: string;         // tenant slug
  clusters: string[];     // cluster names using this tier
  pvcs: number;           // active PVC count
  used_tib: number;       // allocated capacity TiB
}
```

### 15.2 Known tiers

| ID | IOPS | Throughput | Latency | Media | Replication | Protocol | Default |
|---|---|---|---|---|---|---|---|
| `platinum` | 200k | 40 GB/s | <0.2 ms | NVMe SSD RAID-10 | sync | NFSv4.1 | — |
| `gold` | 100k | 25 GB/s | <0.5 ms | NVMe SSD | async | NFSv4.1 | ✓ |
| `silver` | 30k | 10 GB/s | <2 ms | SATA SSD | async | NFSv4.1 | — |
| `bronze` | 5k | 4 GB/s | <20 ms | HDD (SMR) | none | S3 | — |

### 15.3 StorageTier conditions

```typescript
type StorageTierConditionType =
  | "TIER_CONDITION_BACKEND_HEALTHY"          // VAST cluster reachable
  | "TIER_CONDITION_CSI_INSTALLED"            // CSI driver running on cluster
  | "TIER_CONDITION_STORAGECLASS_RECONCILED"  // per-tenant StorageClass exists
  | "TIER_CONDITION_QUOTA_AVAILABLE";         // used_tib < capacity threshold
```

### 15.4 Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/provider/storage-tiers` | List all tiers |
| `GET` | `/provider/storage-tiers/{id}` | Tier detail (overview, backend, CSI manifest, consumers, activity) |
| `POST` | `/provider/storage-tiers` | Create tier (wizard payload below) |
| `PATCH` | `/provider/storage-tiers/{id}` | Update tier; body: `{ enabled?: boolean }` etc. |
| `DELETE` | `/provider/storage-tiers/{id}` | Retire; rejected if consumers.length > 0 |

### 15.5 Create tier request body

```typescript
interface CreateStorageTierRequest {
  id: string;
  name: string;
  description: string;
  is_default: boolean;

  // Performance
  media: "NVMe SSD RAID-10" | "NVMe SSD" | "SATA SSD" | "HDD (SMR)";
  target_iops: string;
  throughput_gbps: number;
  latency_ms: number;
  capacity_tib: number;

  // Backend
  vast_cluster: "vast-prod-α" | "vast-prod-β" | "vast-archive-γ"; // or open string
  vast_view_prefix: string;    // e.g. "/tenants/{tenant}/titanium"
  protocol: "NFSv4.1" | "NFSv3" | "S3";

  // CSI
  csi_driver: string;
  storage_class_template: string;
  snapshot_class_template: string;
  reclaim_policy: "Delete" | "Retain";
  volume_binding_mode: "Immediate" | "WaitForFirstConsumer";
  allow_volume_expansion: boolean;

  // Governance
  encryption: "AES-256 at rest" | "AES-256 + per-tenant KMS";
  replication: "none" | "async" | "sync";
}
```

### 15.6 Per-tenant StorageClass manifest (auto-generated)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: tenant-{tenant}-{tier_id}
provisioner: csi.vastdata.com
reclaimPolicy: {reclaim_policy}
volumeBindingMode: {volume_binding_mode}
allowVolumeExpansion: {allow_volume_expansion}
parameters:
  view_policy: {tier_id}
  protocol: {protocol}
  vast_cluster: {vast_cluster}
  view: {vast_view_prefix}/{tenant}
```

Alongside each StorageClass, a `VolumeSnapshotClass` named `{snapshot_class_template}` is installed using `driver: csi.vastdata.com`.

---

## 16. Provider — RBAC

### 16.1 Types

```typescript
interface OsacRole {
  id: string;            // e.g. "cloud-provider-admin"
  label: string;
  scope: "system" | "org";
  description: string;
  member_count: number;
}

interface GroupRoleMapping {
  keycloak_group: string;  // Keycloak group path, e.g. "/northstar/platform-admins"
  realm: string;           // Keycloak realm, e.g. "northstar.osac"
  role: string;            // OsacRole.id
  member_count: number;
}

interface AuthPolicy {
  name: string;
  target_route: string;
  allowed_roles: string[];
  raw?: string;            // YAML manifest
}
```

### 16.2 AuthPolicy manifest shape

```yaml
apiVersion: kuadrant.io/v1beta3
kind: AuthPolicy
metadata:
  name: vms-write
spec:
  targetRef:
    kind: HTTPRoute
    name: vms-api
  rules:
    authentication:
      keycloak:
        jwt:
          issuerUrl: https://auth.osac.internal/realms/{tenant}
    authorization:
      role-check:
        opa:
          rego: |
            allow { input.auth.identity.groups[_] == "/{tenant}/platform-admins" }
            allow { input.auth.identity.groups[_] == "/{tenant}/dev-team"
                  ; input.request.http.method == "GET" }
```

### 16.3 Endpoints

```
GET  /provider/rbac/roles
GET  /provider/rbac/mappings
POST /provider/rbac/mappings   — body: { keycloak_group, realm, role }
DELETE /provider/rbac/mappings — body: { keycloak_group, realm }
GET  /provider/rbac/auth-policies
```

---

## 17. Provider — Onboarding

### 17.1 Types

```typescript
interface OnboardingPipeline {
  id: string;
  organization_name: string;
  current_stage: string;
  progress_percent: number;       // 0–100
  status: "progressing" | "ready" | "failed";
  started_at: string;
}
```

### 17.2 Fixed pipeline stages (all automated)

1. Organization record
2. Keycloak realm
3. External IdP federation
4. Role & group mapping
5. OpenShift Projects
6. Storage provisioning trigger
7. Smoke test login

### 17.3 Endpoints

```
GET  /provider/onboarding/pipelines
GET  /provider/onboarding/pipelines/{id}
POST /provider/onboarding/pipelines    — body: OnboardTenantRequest (see §13.4)
```

---

## 18. Provider — Ansible Collection

### 18.1 Types

```typescript
type AnsibleDomain = "storage" | "networking" | "bm" | "identity";

interface AnsibleRole {
  id: string;             // e.g. "storage.vast"
  domain: AnsibleDomain;
  version: string;
  status: "ready" | "progressing" | "failed";
  last_run_at: string;
  description: string;
}

interface AnsibleRoleStatus {
  phase: "ready" | "progressing" | "failed";
  reason: string;
  observed_generation: number;
  resources: { kind: string; name: string; ready: boolean }[];
  metrics: { duration_ms: number };
}
```

### 18.2 Collection metadata

| Field | Value |
|---|---|
| Galaxy namespace | `osac.platform` |
| Current version | `2.4.0` |
| Install | `ansible-galaxy collection install osac.platform:==2.4.0` |

### 18.3 Lifecycle callbacks (standardized interface)

`validate` → `plan` → `apply` → `verify` → `report-status` → `rollback`

### 18.4 Endpoints

```
GET /provider/ansible/roles
GET /provider/ansible/roles/{id}/status
```

---

## 19. Activity Log

```typescript
interface ActivityEntry {
  timestamp: string;     // ISO datetime
  actor: string;         // email or "system" or "platform@osac"
  action: string;        // e.g. "quota.update", "cluster.create", "rbac.assign", "tenant.onboard"
  resource: string;      // resource name or description
  risk_level: "high" | "medium" | "low";
}
```

### 19.1 Audit event actions (from UI)

| Action | Description |
|---|---|
| `quota.update` | Tenant quota limit changed |
| `cluster.create` | New cluster provisioned |
| `cluster.upgrade` | Cluster OCP version upgraded |
| `cluster.scale` | Node count changed |
| `cluster.delete` | Cluster deleted |
| `vm.create` | VM provisioned |
| `vm.start` / `vm.stop` | Power state change |
| `vm.restart` | Restart requested |
| `vm.delete` | VM deleted |
| `rbac.assign` | Group → role mapping added |
| `tenant.onboard` | Tenant realm created |
| `tenant.suspend` | Tenant suspended |
| `storage.capacity-increase` | StorageTier capacity expanded |
| `agent.enroll` | New physical host enrolled |
| `agent.deprovision` | Host removed from fleet |

### 19.2 Endpoints

```
GET /activity           — tenant-scoped; query: limit, offset, risk_level
GET /provider/activity  — provider-wide cross-tenant audit
GET /provider/tenants/{id}/audit — tenant-specific audit log
```

---

## 20. Dashboard KPIs

### 20.1 Tenant user dashboard

```
GET /dashboard/tenant
```

**Response**

```typescript
{
  running_vms: number;
  active_clusters: number;
  storage_tib: number;
  public_ips: number;
  workloads: {
    name: string;
    type: "vm" | "cluster";
    status: string;     // ComputeInstanceState or ClusterState enum value
    project: string;
  }[];
}
```

### 20.2 Provider dashboard

```
GET /dashboard/provider
```

**Response**

```typescript
{
  total_tenants: number;
  active_tenants: number;
  onboarding_tenants: number;
  total_vms: number;
  total_clusters: number;
  storage_capacity_tib: number;
  cpu_utilization_percent: number;
  memory_utilization_percent: number;
  utilization_timeseries: { t: string; v: number }[];
  top_tenants: {
    name: string;
    vm_count: number;
    cluster_count: number;
  }[];
}
```

### 20.3 Tenant admin dashboard

```
GET /dashboard/admin
```

**Response**

```typescript
{
  total_users: number;
  mfa_adoption_percent: number;
  compliance_items: {
    label: string;
    status: "pass" | "fail" | "warn";
  }[];
}
```

---

## Appendix A — Route map

| UI route | Data consumed | API section |
|---|---|---|
| `/` (persona picker) | Static `PERSONAS` list | Auth / session |
| `/sign-in` | Session | §2 |
| `/app` (shell) | Session, nav by role | — |
| `/app` (tenant user dashboard) | KPIs, workload list | §20.1 |
| `/app/vms` | `ComputeInstance[]` | §3 |
| `/app/vms/{name}` | `ComputeInstance` detail + networking, disks, snapshots, metrics, activity | §3 |
| `/app/catalog` | `CatalogTemplate[]` | §8.2 |
| `/app/clusters` | `Cluster[]` | §4 |
| `/app/clusters/{name}` | `Cluster` detail + nodes, storage, network, addons, activity | §4 |
| `/app/console` | Console stream | §3.3 |
| `/app/activity` | `ActivityEntry[]` | §19 |
| `/app/admin` | Admin dashboard KPIs | §20.3 |
| `/app/admin/users` | `TenantUser[]` | §9 |
| `/app/admin/quota` | `QuotaResource[]` | §10 |
| `/app/admin/networks` | `VirtualNetwork[]`, `Subnet[]` | §11 |
| `/app/admin/cluster-offerings` | `ClusterOffering[]` | §12 |
| `/app/admin/cluster-offerings/{id}` | `ClusterOffering` detail + usage | §12 |
| `/app/provider` | Provider dashboard KPIs | §20.2 |
| `/app/provider/tenants` | `TenantRow[]` | §13.1 |
| `/app/provider/tenants/{id}` | `TenantDetail` + clusters, VMs, storage, agents, audit | §13.2 |
| `/app/provider/infrastructure` | Topology nodes/edges | §14 |
| `/app/provider/agents` | `Agent[]` | §14 |
| `/app/provider/agents/{hostname}` | `Agent` detail + networking, storage, logs | §14 |
| `/app/provider/storage-tiers` | `StorageTier[]` | §15 |
| `/app/provider/storage-tiers/{id}` | `StorageTier` detail + backend, CSI, consumers, activity | §15 |
| `/app/provider/templates` | `ProviderTemplate[]` | §8.1 |
| `/app/provider/clusters` | `Cluster[]` (cross-tenant) | §4 + §Appendix B |
| `/app/provider/vms` | `ComputeInstance[]` (cross-tenant) | §3 + §Appendix B |
| `/app/provider/organizations` | `Organization[]` | §13.3 |
| `/app/provider/rbac` | `OsacRole[]`, `GroupRoleMapping[]` | §16 |
| `/app/provider/onboarding` | `OnboardingPipeline[]` | §17 |
| `/app/provider/catalog-items` | `CatalogItem[]` | §8.3 |
| `/app/provider/ansible` | `AnsibleRole[]` | §18 |

---

## Appendix B — Cross-tenant provider views

The provider views `/app/provider/vms` and `/app/provider/clusters` show all resources across all tenants. Extend the standard resource with `tenant` for cross-tenant list endpoints.

```typescript
interface ProviderVM extends ComputeInstance {
  // metadata.tenant is already present; no extension needed
}

interface ProviderCluster extends Cluster {
  // metadata.tenant is already present
}
```

```
GET /provider/vms       — all ComputeInstances; metadata.tenant scopes them
GET /provider/clusters  — all Clusters across all tenants
```

---

## Appendix C — Sovereign Gateway Pattern

Every API request flows through:

1. **Kuadrant HTTPRoute** — routes traffic to backend services
2. **Authorino AuthPolicy** — validates JWT (RS256, Keycloak issuer per realm)
3. **OPA Rego** — maps `groups` claim → OSAC role → allow/deny

**Token issuer pattern:** `https://auth.osac.internal/realms/<realm>`

The `realm` field in `Organization` (e.g. `northstar.osac`) is the slug used in the issuer URL. The backend must validate that the `iss` claim in each JWT matches `https://auth.osac.internal/realms/<expected-realm>` for all tenant-scoped routes.

---

## Appendix D — VAST Storage Infrastructure

- **Primary storage backend:** VAST Data (Universal Storage — file + block + object)
- **CSI driver:** `csi.vastdata.com`
- **VAST clusters in use:** `vast-prod-α`, `vast-prod-β`, `vast-archive-γ`
- **View path pattern per tenant:** `/tenants/{tenant}/{tier_id}` (e.g. `/tenants/northstar/gold`)
- **StorageClasses provisioned per cluster at `ClusterOrderPhaseReady`**: one StorageClass + one VolumeSnapshotClass per enabled tier
- **VAST tenant resources (views, quotas, per-tenant secrets)** are **shared across clusters** in the same tenant and are **not deleted** when a cluster is destroyed
- **Tier `{tenant}` substitution** in `storage_class_template` and `snapshot_class_template` is performed server-side when reconciling a cluster
