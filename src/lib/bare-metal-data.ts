// OSAC Bare Metal as a Service (BMaaS) — mock data layer
// Physical inventory + tenant-provisioned bare metal instances.

export type BmDiscoveryState =
  | "discovered"
  | "inspecting"
  | "available"
  | "allocated"
  | "maintenance"
  | "failed";

export type BmPowerState = "on" | "off" | "unknown";

export type BmProvisioningState =
  | "queued"
  | "inspecting"
  | "installing"
  | "configuring"
  | "active"
  | "failed"
  | "releasing";

export interface BmDisk { name: string; sizeGiB: number; type: "NVMe" | "SSD" | "HDD"; }
export interface BmNic { name: string; speedGbps: number; mac: string; }
export interface BmGpu { model: string; count: number; memoryGiB: number; }

export interface BareMetalHost {
  id: string;
  hostname: string;
  serial: string;
  manufacturer: string;
  model: string;
  bmcAddress: string;
  cpuModel: string;
  cores: number;
  memoryGiB: number;
  disks: BmDisk[];
  nics: BmNic[];
  gpu?: BmGpu;
  rack: string;
  zone: string;
  powerState: BmPowerState;
  discoveryState: BmDiscoveryState;
  tenantAllocation?: string; // tenant id
  instanceRef?: string;      // BareMetalInstance.id
  discoveredAt: string;
  inspectedAt?: string;
}

export interface BareMetalInstance {
  id: string;
  name: string;
  tenant: string;
  hostRef: string;          // BareMetalHost.id
  flavor: string;
  image: string;
  vnet: string;
  subnet: string;
  vlan: number;
  bootMode: "UEFI" | "BIOS";
  secureBoot: boolean;
  ipmiUrl: string;
  ip: string;
  provisioningState: BmProvisioningState;
  createdAt: string;
  createdBy: string;
}

export const BM_FLAVORS = [
  { id: "bm.gp1.medium",  label: "bm.gp1.medium · 32c · 256 GiB",  cores: 32, memoryGiB: 256 },
  { id: "bm.gp1.large",   label: "bm.gp1.large · 48c · 512 GiB",   cores: 48, memoryGiB: 512 },
  { id: "bm.mem.xlarge",  label: "bm.mem.xlarge · 64c · 1 TiB",    cores: 64, memoryGiB: 1024 },
  { id: "bm.gpu.h100x4",  label: "bm.gpu.h100x4 · 96c · 1 TiB · 4×H100", cores: 96, memoryGiB: 1024 },
];

export const BM_IMAGES = [
  "RHEL 9.4 (bare metal)",
  "Ubuntu 22.04 LTS",
  "OpenShift 4.17 node",
  "RHEL CoreOS 4.17",
  "Custom ISO",
];

export const BARE_METAL_HOSTS: BareMetalHost[] = [
  {
    id: "bmh-001", hostname: "bm-r1u01", serial: "ACM-7K2-001",
    manufacturer: "Acme", model: "M5-512G",
    bmcAddress: "https://bmc-r1u01.dc1.osac:443",
    cpuModel: "Intel Xeon Platinum 8480+", cores: 48, memoryGiB: 512,
    disks: [
      { name: "nvme0n1", sizeGiB: 1920, type: "NVMe" },
      { name: "nvme1n1", sizeGiB: 1920, type: "NVMe" },
    ],
    nics: [
      { name: "ens1f0", speedGbps: 25, mac: "b4:96:91:0a:00:01" },
      { name: "ens1f1", speedGbps: 25, mac: "b4:96:91:0a:00:02" },
    ],
    rack: "R1", zone: "dc1-z-a", powerState: "on",
    discoveryState: "allocated",
    tenantAllocation: "northstar", instanceRef: "bmi-001",
    discoveredAt: "2026-02-11T08:00:00Z", inspectedAt: "2026-02-11T08:35:00Z",
  },
  {
    id: "bmh-002", hostname: "bm-r1u02", serial: "ACM-7K2-002",
    manufacturer: "Acme", model: "M5-512G",
    bmcAddress: "https://bmc-r1u02.dc1.osac:443",
    cpuModel: "Intel Xeon Platinum 8480+", cores: 48, memoryGiB: 512,
    disks: [{ name: "nvme0n1", sizeGiB: 1920, type: "NVMe" }],
    nics: [{ name: "ens1f0", speedGbps: 25, mac: "b4:96:91:0a:00:11" }],
    rack: "R1", zone: "dc1-z-a", powerState: "off",
    discoveryState: "available",
    discoveredAt: "2026-02-11T08:00:00Z", inspectedAt: "2026-02-11T08:42:00Z",
  },
  {
    id: "bmh-003", hostname: "bm-r1u03", serial: "ACM-9G8-001",
    manufacturer: "Acme", model: "G8-H100x4",
    bmcAddress: "https://bmc-r1u03.dc1.osac:443",
    cpuModel: "AMD EPYC 9654", cores: 96, memoryGiB: 1024,
    disks: [
      { name: "nvme0n1", sizeGiB: 3840, type: "NVMe" },
      { name: "nvme1n1", sizeGiB: 3840, type: "NVMe" },
    ],
    nics: [
      { name: "ens2f0", speedGbps: 100, mac: "b4:96:91:0a:00:21" },
      { name: "ens2f1", speedGbps: 100, mac: "b4:96:91:0a:00:22" },
    ],
    gpu: { model: "NVIDIA H100 80GB", count: 4, memoryGiB: 320 },
    rack: "R1", zone: "dc1-z-a", powerState: "on",
    discoveryState: "allocated",
    tenantAllocation: "aurora", instanceRef: "bmi-002",
    discoveredAt: "2026-03-04T12:00:00Z", inspectedAt: "2026-03-04T13:10:00Z",
  },
  {
    id: "bmh-004", hostname: "bm-r2u01", serial: "ACM-7K2-101",
    manufacturer: "Acme", model: "M5-1TB",
    bmcAddress: "https://bmc-r2u01.dc1.osac:443",
    cpuModel: "Intel Xeon Platinum 8580", cores: 64, memoryGiB: 1024,
    disks: [
      { name: "nvme0n1", sizeGiB: 3840, type: "NVMe" },
      { name: "nvme1n1", sizeGiB: 3840, type: "NVMe" },
    ],
    nics: [{ name: "ens1f0", speedGbps: 25, mac: "b4:96:91:0b:00:01" }],
    rack: "R2", zone: "dc1-z-b", powerState: "on",
    discoveryState: "allocated",
    tenantAllocation: "bluestone", instanceRef: "bmi-003",
    discoveredAt: "2026-01-22T10:00:00Z", inspectedAt: "2026-01-22T10:48:00Z",
  },
  {
    id: "bmh-005", hostname: "bm-r2u02", serial: "ACM-7K2-102",
    manufacturer: "Acme", model: "M5-1TB",
    bmcAddress: "https://bmc-r2u02.dc1.osac:443",
    cpuModel: "Intel Xeon Platinum 8580", cores: 64, memoryGiB: 1024,
    disks: [{ name: "nvme0n1", sizeGiB: 3840, type: "NVMe" }],
    nics: [{ name: "ens1f0", speedGbps: 25, mac: "b4:96:91:0b:00:11" }],
    rack: "R2", zone: "dc1-z-b", powerState: "off",
    discoveryState: "maintenance",
    discoveredAt: "2026-01-22T10:00:00Z", inspectedAt: "2026-01-22T10:55:00Z",
  },
  {
    id: "bmh-006", hostname: "bm-r2u03", serial: "ACM-9G8-002",
    manufacturer: "Acme", model: "G8-H100x4",
    bmcAddress: "https://bmc-r2u03.dc1.osac:443",
    cpuModel: "AMD EPYC 9654", cores: 96, memoryGiB: 1024,
    disks: [{ name: "nvme0n1", sizeGiB: 3840, type: "NVMe" }],
    nics: [{ name: "ens2f0", speedGbps: 100, mac: "b4:96:91:0b:00:21" }],
    gpu: { model: "NVIDIA H100 80GB", count: 4, memoryGiB: 320 },
    rack: "R2", zone: "dc1-z-b", powerState: "off",
    discoveryState: "discovered",
    discoveredAt: "2026-06-08T07:14:00Z",
  },
  {
    id: "bmh-007", hostname: "bm-r2u04", serial: "ACM-7K2-103",
    manufacturer: "Acme", model: "M5-512G",
    bmcAddress: "https://bmc-r2u04.dc1.osac:443",
    cpuModel: "Intel Xeon Platinum 8480+", cores: 48, memoryGiB: 512,
    disks: [{ name: "nvme0n1", sizeGiB: 1920, type: "NVMe" }],
    nics: [{ name: "ens1f0", speedGbps: 25, mac: "b4:96:91:0b:00:31" }],
    rack: "R2", zone: "dc1-z-b", powerState: "off",
    discoveryState: "inspecting",
    discoveredAt: "2026-06-09T18:02:00Z",
  },
];

export const BARE_METAL_INSTANCES: BareMetalInstance[] = [
  {
    id: "bmi-001", name: "ns-payments-bm-01", tenant: "northstar",
    hostRef: "bmh-001", flavor: "bm.gp1.large",
    image: "RHEL 9.4 (bare metal)",
    vnet: "vn-prod", subnet: "sn-app", vlan: 410,
    bootMode: "UEFI", secureBoot: true,
    ipmiUrl: "https://bmc-r1u01.dc1.osac:443",
    ip: "10.10.4.51",
    provisioningState: "active",
    createdAt: "2026-02-12T09:14:00Z", createdBy: "alice@northstar",
  },
  {
    id: "bmi-002", name: "au-ml-train-01", tenant: "aurora",
    hostRef: "bmh-003", flavor: "bm.gpu.h100x4",
    image: "Ubuntu 22.04 LTS",
    vnet: "vn-data", subnet: "sn-warehouse", vlan: 730,
    bootMode: "UEFI", secureBoot: false,
    ipmiUrl: "https://bmc-r1u03.dc1.osac:443",
    ip: "10.30.1.21",
    provisioningState: "active",
    createdAt: "2026-03-05T11:00:00Z", createdBy: "ml@aurora",
  },
  {
    id: "bmi-003", name: "bl-db-bm-01", tenant: "bluestone",
    hostRef: "bmh-004", flavor: "bm.mem.xlarge",
    image: "RHEL 9.4 (bare metal)",
    vnet: "vn-prod", subnet: "sn-db", vlan: 420,
    bootMode: "UEFI", secureBoot: true,
    ipmiUrl: "https://bmc-r2u01.dc1.osac:443",
    ip: "10.10.5.31",
    provisioningState: "active",
    createdAt: "2026-01-23T15:42:00Z", createdBy: "dba@bluestone",
  },
  {
    id: "bmi-004", name: "ns-edge-bm-02", tenant: "northstar",
    hostRef: "bmh-002", flavor: "bm.gp1.large",
    image: "OpenShift 4.17 node",
    vnet: "vn-prod", subnet: "sn-edge", vlan: 430,
    bootMode: "UEFI", secureBoot: true,
    ipmiUrl: "https://bmc-r1u02.dc1.osac:443",
    ip: "—",
    provisioningState: "installing",
    createdAt: "2026-06-10T08:55:00Z", createdBy: "ops@northstar",
  },
];

export type BmSimpleStatus = "ready" | "progressing" | "stopped" | "failed";

export function bmSimpleStatus(s: BmProvisioningState, power: BmPowerState = "on"): BmSimpleStatus {
  if (s === "failed") return "failed";
  if (s === "active") return power === "on" ? "ready" : "stopped";
  return "progressing";
}

export const findBmInstance = (name: string) =>
  BARE_METAL_INSTANCES.find((i) => i.name === name);

export const findBmHost = (id: string) =>
  BARE_METAL_HOSTS.find((h) => h.id === id);

export const bmInstancesForTenant = (tenant: string) =>
  BARE_METAL_INSTANCES.filter((i) => i.tenant === tenant);
