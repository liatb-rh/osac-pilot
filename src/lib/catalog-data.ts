// OSAC unified catalog — a Catalog Item is the single user-facing entity that wraps a
// backing template (provider-only concept), adds display metadata, and carries a JSON
// schema that drives dynamic provisioning forms. All resource types share one catalog.

export type CatalogItemType = "vm" | "cluster" | "baremetal";
export type WorkloadProfile = "high-performance" | "machine-learning" | "data-processing" | "analytics";

export interface ParamSchemaProperty {
  type: "string" | "number" | "integer" | "boolean";
  title?: string;
  description?: string;
  default?: string | number | boolean;
  enum?: string[];
  readOnly?: boolean;
}

export interface ParamSchema {
  $schema?: string;
  type: "object";
  properties: Record<string, ParamSchemaProperty>;
  required?: string[];
}

export interface CatalogItem {
  id: string;
  metadata: { name: string; labels?: Record<string, string> };
  title: string;
  description?: string;
  icon?: "rhel" | "windows" | "linux" | string;
  type: CatalogItemType;
  workloadProfile?: WorkloadProfile;
  tags?: string[];
  published: boolean;
  /** Backing template reference — backend / Provider Admin use only, never shown to tenants. */
  templateRef: string;
  fixedDefaults: {
    cpu?: number;
    memoryGib?: number;
    bootDiskSizeGib?: number;
    allowUserResize?: boolean;
    ocpVersion?: string;
    nodeProfile?: string;
    /** VM-only: backing instance type (flavor) id. Resolved cpu/memory/disk mirror this. */
    instanceTypeId?: string;
  };
  paramSchema?: ParamSchema;
  /** User groups (within the tenant) authorized by the Provider Admin. */
  assignedGroups: string[];
  /** Tenant Admin visibility toggle. */
  tenantEnabled: boolean;
  /** Display order in the tenant catalog gallery. */
  order: number;
}

export const USER_GROUPS = ["grp-app-dev", "grp-data-science", "grp-platform-eng", "grp-sec-ops"];

export const TYPE_LABELS: Record<CatalogItemType, string> = {
  vm: "VM",
  cluster: "Cluster",
  baremetal: "Bare Metal",
};

export const TYPE_COLORS: Record<CatalogItemType, "blue" | "purple" | "orange"> = {
  vm: "blue",
  cluster: "purple",
  baremetal: "orange",
};

export const WORKLOAD_LABELS: Record<WorkloadProfile, string> = {
  "high-performance": "High performance",
  "machine-learning": "Machine learning",
  "data-processing": "Data processing",
  analytics: "Analytics",
};

export const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "ci-vm-rhel9-s",
    metadata: { name: "vm-rhel9-small" },
    title: "RHEL 9 — Small",
    description: "General-purpose RHEL 9 virtual machine for lightweight services.",
    icon: "rhel", type: "vm", tags: ["general", "linux"], published: true,
    templateRef: "vm-rhel9",
    fixedDefaults: { cpu: 2, memoryGib: 8, bootDiskSizeGib: 64, allowUserResize: false },
    assignedGroups: ["grp-app-dev", "grp-platform-eng"], tenantEnabled: true, order: 1,
  },
  {
    id: "ci-vm-rhel9-m",
    metadata: { name: "vm-rhel9-medium" },
    title: "RHEL 9 — Medium",
    description: "Balanced RHEL 9 profile for application tiers and services.",
    icon: "rhel", type: "vm", tags: ["general", "linux"], published: true,
    templateRef: "vm-rhel9",
    fixedDefaults: { cpu: 4, memoryGib: 16, bootDiskSizeGib: 128, allowUserResize: true },
    assignedGroups: ["grp-app-dev", "grp-platform-eng", "grp-data-science"], tenantEnabled: true, order: 2,
  },
  {
    id: "ci-vm-rhel9-l",
    metadata: { name: "vm-rhel9-large" },
    title: "RHEL 9 — Large",
    description: "Compute-heavy RHEL 9 profile for demanding workloads.",
    icon: "rhel", type: "vm", workloadProfile: "high-performance", tags: ["compute"], published: true,
    templateRef: "vm-rhel9",
    fixedDefaults: { cpu: 8, memoryGib: 32, bootDiskSizeGib: 256, allowUserResize: true },
    assignedGroups: ["grp-platform-eng"], tenantEnabled: true, order: 3,
  },
  {
    id: "ci-vm-win2022",
    metadata: { name: "vm-win2022-std" },
    title: "Windows Server 2022",
    description: "Windows Server 2022 Standard with tenant domain join support.",
    icon: "windows", type: "vm", tags: ["windows"], published: true,
    templateRef: "vm-win2022",
    fixedDefaults: { cpu: 4, memoryGib: 16, bootDiskSizeGib: 128, allowUserResize: true },
    paramSchema: {
      type: "object",
      properties: {
        licenseMode: { type: "string", title: "License activation", enum: ["AVMA", "KMS"], default: "AVMA" },
        rdpEnabled: { type: "boolean", title: "Enable RDP", default: true, description: "Remote Desktop access on the tenant network." },
      },
    },
    assignedGroups: ["grp-app-dev"], tenantEnabled: true, order: 4,
  },
  {
    id: "ci-vm-ubuntu22-data",
    metadata: { name: "vm-ubuntu22-data" },
    title: "Ubuntu 22 — Data",
    description: "Ubuntu 22.04 LTS tuned for data pipelines and processing jobs.",
    icon: "linux", type: "vm", workloadProfile: "data-processing", tags: ["data"], published: true,
    templateRef: "vm-ubuntu22",
    fixedDefaults: { cpu: 16, memoryGib: 64, bootDiskSizeGib: 256, allowUserResize: true },
    paramSchema: {
      type: "object",
      properties: {
        dataDiskGib: { type: "integer", title: "Data disk size (GiB)", default: 500 },
        enableBackups: { type: "boolean", title: "Nightly backups", default: false },
      },
      required: ["dataDiskGib"],
    },
    assignedGroups: ["grp-data-science"], tenantEnabled: true, order: 5,
  },
  {
    id: "ci-vm-rhel9-gpu",
    metadata: { name: "vm-rhel9-gpu-a100" },
    title: "RHEL 9 — GPU A100",
    description: "RHEL 9 with NVIDIA A100 passthrough for ML training and inference.",
    icon: "rhel", type: "vm", workloadProfile: "machine-learning", tags: ["ai", "gpu"], published: true,
    templateRef: "vm-rhel9-gpu",
    fixedDefaults: { cpu: 32, memoryGib: 256, bootDiskSizeGib: 512, allowUserResize: false },
    paramSchema: {
      type: "object",
      properties: {
        gpuCount: { type: "string", title: "GPU count", enum: ["1", "2", "4"], default: "1" },
        cudaVersion: { type: "string", title: "CUDA version", default: "12.4", readOnly: true, description: "Pinned by the platform image." },
      },
    },
    assignedGroups: ["grp-data-science"], tenantEnabled: true, order: 6,
  },
  {
    id: "ci-vm-win2025",
    metadata: { name: "vm-win2025-preview" },
    title: "Windows Server 2025 (Preview)",
    description: "Early-access Windows Server 2025 image — draft, not yet published.",
    icon: "windows", type: "vm", tags: ["windows", "preview"], published: false,
    templateRef: "vm-win2025",
    fixedDefaults: { cpu: 4, memoryGib: 16, bootDiskSizeGib: 128, allowUserResize: true },
    assignedGroups: [], tenantEnabled: true, order: 7,
  },
  {
    id: "ci-ocp-standard",
    metadata: { name: "ocp-417-standard" },
    title: "OpenShift 4.17 — Standard",
    description: "Managed OpenShift cluster with a standard worker node set.",
    type: "cluster", tags: ["openshift"], published: true,
    templateRef: "ocp-4.17",
    fixedDefaults: { ocpVersion: "4.17.3" },
    paramSchema: {
      type: "object",
      properties: {
        networkPlugin: { type: "string", title: "Network plugin", default: "OVNKubernetes", readOnly: true },
        fipsMode: { type: "boolean", title: "FIPS mode", default: false, description: "Enable FIPS-validated cryptography on cluster nodes." },
      },
    },
    assignedGroups: ["grp-platform-eng", "grp-app-dev"], tenantEnabled: true, order: 8,
  },
  {
    id: "ci-ocp-gpu",
    metadata: { name: "ocp-417-gpu" },
    title: "OpenShift 4.17 — GPU",
    description: "OpenShift cluster with GPU-enabled worker nodes for AI platforms.",
    type: "cluster", workloadProfile: "machine-learning", tags: ["openshift", "ai", "gpu"], published: true,
    templateRef: "ocp-4.17-gpu",
    fixedDefaults: { ocpVersion: "4.17.3" },
    paramSchema: {
      type: "object",
      properties: {
        gpuOperator: { type: "boolean", title: "Install GPU operator", default: true },
      },
    },
    assignedGroups: ["grp-data-science"], tenantEnabled: true, order: 9,
  },
  {
    id: "ci-ocp-edge",
    metadata: { name: "ocp-417-edge" },
    title: "OpenShift 4.17 — Edge",
    description: "Compact 3-node OpenShift profile for branch and edge sites.",
    type: "cluster", tags: ["openshift", "edge"], published: true,
    templateRef: "ocp-4.17-edge",
    fixedDefaults: { ocpVersion: "4.17.3" },
    assignedGroups: ["grp-platform-eng"], tenantEnabled: false, order: 10,
  },
  {
    id: "ci-bm-gpu-h100",
    metadata: { name: "bm-gpu-h100" },
    title: "Bare Metal — GPU H100",
    description: "Dedicated physical server with 4× NVIDIA H100 for AI/ML clusters.",
    type: "baremetal", workloadProfile: "machine-learning", tags: ["ai", "gpu", "dedicated"], published: true,
    templateRef: "bm-provision-gpu",
    fixedDefaults: { nodeProfile: "bm.gpu.h100x4" },
    paramSchema: {
      type: "object",
      properties: {
        gpuDriver: { type: "string", title: "GPU driver channel", enum: ["production", "lts", "beta"], default: "production" },
      },
    },
    assignedGroups: ["grp-data-science"], tenantEnabled: true, order: 11,
  },
  {
    id: "ci-bm-highmem",
    metadata: { name: "bm-highmem-1tb" },
    title: "Bare Metal — High Memory",
    description: "1 TiB memory-optimized host for in-memory databases.",
    type: "baremetal", workloadProfile: "high-performance", tags: ["dedicated", "memory"], published: true,
    templateRef: "bm-provision-generic",
    fixedDefaults: { nodeProfile: "bm.mem.xlarge" },
    assignedGroups: ["grp-platform-eng"], tenantEnabled: true, order: 12,
  },
  {
    id: "ci-bm-gp-large",
    metadata: { name: "bm-gp-large" },
    title: "Bare Metal — General Purpose L",
    description: "48-core dedicated host for OpenShift nodes requiring physical isolation.",
    type: "baremetal", tags: ["dedicated"], published: true,
    templateRef: "bm-provision-generic",
    fixedDefaults: { nodeProfile: "bm.gp1.large" },
    assignedGroups: ["grp-platform-eng", "grp-app-dev"], tenantEnabled: true, order: 13,
  },
];

/** Items visible in the tenant user catalog: published, tenant-enabled, and group-assigned. */
export function tenantVisibleItems(type?: CatalogItemType): CatalogItem[] {
  return CATALOG_ITEMS
    .filter((i) => i.published && i.tenantEnabled && i.assignedGroups.length > 0 && (!type || i.type === type))
    .sort((a, b) => a.order - b.order);
}

export function findCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG_ITEMS.find((i) => i.id === id);
}

export function osOf(i: CatalogItem): "RHEL" | "Windows" | "Linux" | undefined {
  if (i.icon === "rhel") return "RHEL";
  if (i.icon === "windows") return "Windows";
  if (i.icon === "linux") return "Linux";
  return undefined;
}
