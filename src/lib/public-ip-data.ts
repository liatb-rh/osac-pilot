// Public IP pools & allocations — OSAC mock data layer
import type { TenantId } from "./session";

export type PoolStatus = "ready" | "pending" | "failed";

export interface PublicIpPool {
  id: string;
  name: string;
  cidr: string;
  zone?: string;
  status: PoolStatus;
  /** usable addresses in the CIDR block */
  capacity: number;
  tenantAssignments: TenantId[];
  createdAt: string;
}

export interface PoolGroupAssignment {
  poolId: string;
  tenant: TenantId;
  group: string;
  maxAllocations?: number;
}

export type PublicIpState =
  | "pending"
  | "allocated"
  | "attaching"
  | "attached"
  | "releasing"
  | "failed";

export type WorkloadType = "vm" | "cluster" | "baremetal";

export interface PublicIp {
  id: string;
  address: string;
  poolId: string;
  tenant: TenantId;
  state: PublicIpState;
  workloadType?: WorkloadType;
  workloadId?: string;
  /** bare metal nodes support one public IP per NIC */
  nic?: string;
  owner: string;
  createdAt: string;
}

export const WORKLOAD_LABEL: Record<WorkloadType, string> = {
  vm: "VM",
  cluster: "Cluster",
  baremetal: "Bare Metal",
};

export const USER_GROUPS: Record<TenantId, string[]> = {
  northstar: ["app-team", "platform-engineering", "data-science"],
  evergreen: ["core-banking", "risk-analytics"],
  vertexa: ["cloud-ops", "sre"],
};

export const PUBLIC_IP_POOLS: PublicIpPool[] = [
  {
    id: "pool-frontend", name: "pub-frontend", cidr: "198.51.100.0/24", zone: "zone-a",
    status: "ready", capacity: 254, tenantAssignments: ["northstar", "evergreen"],
    createdAt: "2025-11-02",
  },
  {
    id: "pool-dmz", name: "pub-dmz", cidr: "203.0.113.0/25", zone: "zone-a",
    status: "ready", capacity: 126, tenantAssignments: ["northstar"],
    createdAt: "2025-12-14",
  },
  {
    id: "pool-edge", name: "pub-edge", cidr: "192.0.2.0/26", zone: "zone-b",
    status: "pending", capacity: 62, tenantAssignments: [],
    createdAt: "2026-05-28",
  },
  {
    id: "pool-legacy", name: "pub-legacy", cidr: "203.0.113.128/26", zone: "zone-a",
    status: "failed", capacity: 62, tenantAssignments: ["evergreen"],
    createdAt: "2024-08-19",
  },
];

export const POOL_GROUP_ASSIGNMENTS: PoolGroupAssignment[] = [
  { poolId: "pool-frontend", tenant: "northstar", group: "app-team", maxAllocations: 10 },
  { poolId: "pool-frontend", tenant: "northstar", group: "platform-engineering" },
  { poolId: "pool-dmz", tenant: "northstar", group: "platform-engineering", maxAllocations: 4 },
  { poolId: "pool-frontend", tenant: "evergreen", group: "core-banking", maxAllocations: 8 },
];

export const PUBLIC_IPS: PublicIp[] = [
  {
    id: "pip-001", address: "203.0.113.42", poolId: "pool-dmz", tenant: "northstar",
    state: "attached", workloadType: "vm", workloadId: "bnk-app-02",
    owner: "alice@northstar", createdAt: "2026-01-09",
  },
  {
    id: "pip-002", address: "198.51.100.10", poolId: "pool-frontend", tenant: "northstar",
    state: "attached", workloadType: "cluster", workloadId: "prod-ocp",
    owner: "ops@northstar", createdAt: "2026-02-21",
  },
  {
    id: "pip-003", address: "198.51.100.11", poolId: "pool-frontend", tenant: "northstar",
    state: "attached", workloadType: "baremetal", workloadId: "ns-payments-bm-01", nic: "ens1f0",
    owner: "ops@northstar", createdAt: "2026-03-04",
  },
  {
    id: "pip-004", address: "198.51.100.12", poolId: "pool-frontend", tenant: "northstar",
    state: "attached", workloadType: "baremetal", workloadId: "ns-payments-bm-01", nic: "ens1f1",
    owner: "ops@northstar", createdAt: "2026-03-04",
  },
  {
    id: "pip-005", address: "198.51.100.23", poolId: "pool-frontend", tenant: "northstar",
    state: "allocated", owner: "alice@northstar", createdAt: "2026-05-30",
  },
  {
    id: "pip-006", address: "203.0.113.55", poolId: "pool-dmz", tenant: "northstar",
    state: "attaching", workloadType: "vm", workloadId: "bnk-api-01",
    owner: "bob@northstar", createdAt: "2026-06-09",
  },
  {
    id: "pip-007", address: "198.51.100.30", poolId: "pool-frontend", tenant: "northstar",
    state: "releasing", owner: "ml@northstar", createdAt: "2026-04-17",
  },
  {
    id: "pip-008", address: "198.51.100.7", poolId: "pool-frontend", tenant: "evergreen",
    state: "allocated", owner: "infra@bluestone", createdAt: "2026-05-12",
  },
  {
    id: "pip-009", address: "203.0.113.61", poolId: "pool-dmz", tenant: "northstar",
    state: "failed", owner: "bob@northstar", createdAt: "2026-06-01",
  },
];

export const findPool = (id: string) => PUBLIC_IP_POOLS.find((p) => p.id === id);

export const poolsForTenant = (tenant: TenantId | null) =>
  tenant ? PUBLIC_IP_POOLS.filter((p) => p.tenantAssignments.includes(tenant)) : [];

/** ready pools the tenant can allocate from */
export const eligiblePools = (tenant: TenantId | null) =>
  poolsForTenant(tenant).filter((p) => p.status === "ready");

export const groupAssignmentsForPool = (poolId: string, tenant: TenantId | null) =>
  POOL_GROUP_ASSIGNMENTS.filter((a) => a.poolId === poolId && (!tenant || a.tenant === tenant));

export const ipsForTenant = (tenant: TenantId | null) =>
  tenant ? PUBLIC_IPS.filter((ip) => ip.tenant === tenant) : PUBLIC_IPS;

export const ipsForPool = (poolId: string) => PUBLIC_IPS.filter((ip) => ip.poolId === poolId);

export const TRANSITIONAL_STATES: PublicIpState[] = ["pending", "attaching", "releasing"];

export function ipDotStatus(s: PublicIpState): "running" | "ready" | "progressing" | "failed" {
  switch (s) {
    case "attached": return "running";
    case "allocated": return "ready";
    case "failed": return "failed";
    default: return "progressing";
  }
}

/** carve the next free mock address out of a pool */
export function nextIpAddress(pool: PublicIpPool, taken: string[]): string {
  const base = pool.cidr.split("/")[0].split(".").slice(0, 3).join(".");
  let host = 40;
  while (taken.includes(`${base}.${host}`)) host++;
  return `${base}.${host}`;
}
