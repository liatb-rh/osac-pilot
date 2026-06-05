// OSAC Fulfillment Service — typed mock data layer
// Mirrors proto/public/osac/public/v1 shapes (resource envelope, state enums,
// conditions, immutable fields). Kept as static fixtures so the UI can render
// realistic API responses without a live backend.

// ---------- Shared envelope ----------
export interface Metadata {
  creation_timestamp?: string;
  deletion_timestamp?: string;
  creator: string;
  name: string;
  tenant: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  version: number;
}

export type ConditionStatus =
  | "CONDITION_STATUS_UNSPECIFIED"
  | "CONDITION_STATUS_TRUE"
  | "CONDITION_STATUS_FALSE";

export interface Condition {
  type: string;
  status: ConditionStatus;
  last_transition_time: string;
  reason?: string;
  message?: string;
}

export interface Resource<Spec, Status> {
  id: string;
  metadata: Metadata;
  spec: Spec;
  status: Status;
}

const meta = (
  name: string,
  tenant = "northstar",
  creator = "platform@osac",
  extra: Partial<Metadata> = {},
): Metadata => ({
  name,
  tenant,
  creator,
  creation_timestamp: "2026-05-12T09:14:00Z",
  labels: {},
  annotations: {},
  version: 1,
  ...extra,
});

// ---------- Compute Instances ----------
export type ComputeInstanceState =
  | "COMPUTE_INSTANCE_STATE_UNSPECIFIED"
  | "COMPUTE_INSTANCE_STATE_STARTING"
  | "COMPUTE_INSTANCE_STATE_RUNNING"
  | "COMPUTE_INSTANCE_STATE_STOPPING"
  | "COMPUTE_INSTANCE_STATE_STOPPED"
  | "COMPUTE_INSTANCE_STATE_PAUSED"
  | "COMPUTE_INSTANCE_STATE_FAILED"
  | "COMPUTE_INSTANCE_STATE_DELETING";

export interface NetworkAttachment {
  subnet: string;
  security_groups: string[];
}

export interface ComputeInstanceSpec {
  template?: string;
  template_parameters?: Record<string, unknown>;
  catalog_item?: string;
  restart_requested_at?: string;
  image?: { source_type: string; source_ref: string };
  cores: number;
  memory_gib: number;
  ssh_key?: string;
  boot_disk: { size_gib: number };
  additional_disks?: { size_gib: number }[];
  run_strategy: "Always" | "Halted";
  user_data?: string;
  network_attachments: NetworkAttachment[];
}

export interface ComputeInstanceStatus {
  state: ComputeInstanceState;
  conditions: Condition[];
  internal_ip_address: string;
  public_ip_address: string;
  last_restarted_at?: string;
}

export type ComputeInstance = Resource<ComputeInstanceSpec, ComputeInstanceStatus>;

export const COMPUTE_INSTANCES: ComputeInstance[] = [
  {
    id: "ci-0001",
    metadata: meta("bnk-app-01", "northstar", "alice@northstar", {
      labels: { env: "prod", app: "payments" },
    }),
    spec: {
      template: "tpl-rhel-9-medium",
      cores: 4, memory_gib: 16,
      image: { source_type: "registry", source_ref: "quay.io/osac/rhel-9:9.4" },
      boot_disk: { size_gib: 80 },
      run_strategy: "Always",
      network_attachments: [{ subnet: "sn-app", security_groups: ["sg-app-tier"] }],
    },
    status: {
      state: "COMPUTE_INSTANCE_STATE_RUNNING",
      conditions: [
        { type: "COMPUTE_INSTANCE_CONDITION_TYPE_PROVISIONED", status: "CONDITION_STATUS_TRUE", last_transition_time: "2026-05-12T09:15:00Z" },
        { type: "COMPUTE_INSTANCE_CONDITION_TYPE_READY", status: "CONDITION_STATUS_TRUE", last_transition_time: "2026-05-12T09:18:00Z" },
      ],
      internal_ip_address: "10.10.4.21",
      public_ip_address: "",
      last_restarted_at: "2026-05-12T09:15:00Z",
    },
  },
  {
    id: "ci-0002",
    metadata: meta("bnk-app-02", "northstar", "alice@northstar", { labels: { env: "prod", app: "payments" } }),
    spec: {
      template: "tpl-rhel-9-large", cores: 8, memory_gib: 32,
      image: { source_type: "registry", source_ref: "quay.io/osac/rhel-9:9.4" },
      boot_disk: { size_gib: 200 }, run_strategy: "Always",
      network_attachments: [{ subnet: "sn-app", security_groups: ["sg-app-tier"] }],
    },
    status: {
      state: "COMPUTE_INSTANCE_STATE_RUNNING",
      conditions: [{ type: "COMPUTE_INSTANCE_CONDITION_TYPE_READY", status: "CONDITION_STATUS_TRUE", last_transition_time: "2026-05-12T09:18:00Z" }],
      internal_ip_address: "10.10.4.22", public_ip_address: "203.0.113.42",
    },
  },
  {
    id: "ci-0003",
    metadata: meta("bnk-warehouse", "northstar", "bob@northstar", { labels: { env: "prod", app: "analytics" } }),
    spec: {
      template: "tpl-ubuntu-22-large", cores: 16, memory_gib: 64,
      image: { source_type: "registry", source_ref: "quay.io/osac/ubuntu:22.04" },
      boot_disk: { size_gib: 1024 }, run_strategy: "Halted",
      network_attachments: [{ subnet: "sn-db", security_groups: ["sg-db-tier"] }],
    },
    status: {
      state: "COMPUTE_INSTANCE_STATE_STOPPED",
      conditions: [{ type: "COMPUTE_INSTANCE_CONDITION_TYPE_PROVISIONED", status: "CONDITION_STATUS_TRUE", last_transition_time: "2026-03-02T11:00:00Z" }],
      internal_ip_address: "", public_ip_address: "",
    },
  },
  {
    id: "ci-0004",
    metadata: meta("bnk-app-04", "northstar", "alice@northstar"),
    spec: {
      catalog_item: "cat-rhel-medium", cores: 4, memory_gib: 16,
      boot_disk: { size_gib: 80 }, run_strategy: "Always",
      network_attachments: [{ subnet: "sn-app", security_groups: ["sg-app-tier"] }],
    },
    status: {
      state: "COMPUTE_INSTANCE_STATE_STARTING",
      conditions: [
        { type: "COMPUTE_INSTANCE_CONDITION_TYPE_PROVISIONED", status: "CONDITION_STATUS_TRUE", last_transition_time: "2026-06-05T10:01:00Z" },
        { type: "COMPUTE_INSTANCE_CONDITION_TYPE_READY", status: "CONDITION_STATUS_FALSE", last_transition_time: "2026-06-05T10:01:00Z", reason: "BootInProgress" },
      ],
      internal_ip_address: "", public_ip_address: "",
    },
  },
  {
    id: "ci-0005",
    metadata: meta("bnk-api-01", "northstar", "alice@northstar"),
    spec: {
      template: "tpl-rhel-9-small", cores: 2, memory_gib: 8,
      boot_disk: { size_gib: 60 }, run_strategy: "Always",
      network_attachments: [{ subnet: "sn-edge", security_groups: ["sg-edge"] }],
    },
    status: {
      state: "COMPUTE_INSTANCE_STATE_RUNNING",
      conditions: [{ type: "COMPUTE_INSTANCE_CONDITION_TYPE_READY", status: "CONDITION_STATUS_TRUE", last_transition_time: "2026-05-21T12:00:00Z" }],
      internal_ip_address: "10.10.6.31", public_ip_address: "",
    },
  },
  {
    id: "ci-0006",
    metadata: meta("bnk-ml-01", "northstar", "ml@northstar", { labels: { env: "prod", app: "ai-platform" } }),
    spec: {
      template: "tpl-ubuntu-22-gpu", cores: 32, memory_gib: 128,
      boot_disk: { size_gib: 2048 }, run_strategy: "Always",
      network_attachments: [{ subnet: "sn-app", security_groups: ["sg-app-tier"] }],
    },
    status: {
      state: "COMPUTE_INSTANCE_STATE_FAILED",
      conditions: [
        { type: "COMPUTE_INSTANCE_CONDITION_TYPE_PROVISIONED", status: "CONDITION_STATUS_FALSE", last_transition_time: "2026-06-01T08:22:00Z", reason: "NoGPUCapacity", message: "No GPU host capacity in zone-a" },
      ],
      internal_ip_address: "", public_ip_address: "",
    },
  },
];

// ---------- Clusters ----------
export type ClusterState =
  | "CLUSTER_STATE_UNSPECIFIED"
  | "CLUSTER_STATE_PROGRESSING"
  | "CLUSTER_STATE_READY"
  | "CLUSTER_STATE_FAILED";

export interface ClusterNodeSet { host_type: string; size: number; }
export interface ClusterSpec {
  template?: string;
  template_parameters?: Record<string, unknown>;
  catalog_item?: string;
  node_sets: Record<string, ClusterNodeSet>;
  pull_secret?: string;
  ssh_public_key?: string;
  release_image?: string;
  network?: { pod_cidr?: string; service_cidr?: string };
}
export interface ClusterStatus {
  state: ClusterState;
  conditions: Condition[];
  api_url: string;
  console_url: string;
  node_sets: Record<string, ClusterNodeSet>;
}
export type Cluster = Resource<ClusterSpec, ClusterStatus>;

export const CLUSTERS: Cluster[] = [
  {
    id: "cl-prod-ocp",
    metadata: meta("prod-ocp", "northstar", "ops@northstar", { labels: { env: "prod" } }),
    spec: {
      template: "tpl-ocp-417",
      release_image: "quay.io/openshift-release-dev/ocp-release:4.17.3-multi",
      node_sets: { compute: { host_type: "acme_1tb", size: 9 } },
      network: { pod_cidr: "10.128.0.0/14", service_cidr: "172.30.0.0/16" },
      pull_secret: "***",
    },
    status: {
      state: "CLUSTER_STATE_PROGRESSING",
      conditions: [
        { type: "CLUSTER_CONDITION_TYPE_PROGRESSING", status: "CONDITION_STATUS_TRUE", last_transition_time: "2026-06-04T14:00:00Z", reason: "Upgrading", message: "Upgrading from 4.17.1 → 4.17.3" },
      ],
      api_url: "https://api.prod-ocp.northstar.osac:6443",
      console_url: "https://console.prod-ocp.northstar.osac",
      node_sets: { compute: { host_type: "acme_1tb", size: 9 } },
    },
  },
  {
    id: "cl-stg-ocp",
    metadata: meta("stg-ocp", "northstar", "ops@northstar", { labels: { env: "stg" } }),
    spec: {
      template: "tpl-ocp-417",
      release_image: "quay.io/openshift-release-dev/ocp-release:4.17.1-multi",
      node_sets: { compute: { host_type: "acme_512g", size: 6 } },
    },
    status: {
      state: "CLUSTER_STATE_READY",
      conditions: [{ type: "CLUSTER_CONDITION_TYPE_READY", status: "CONDITION_STATUS_TRUE", last_transition_time: "2026-01-22T08:00:00Z" }],
      api_url: "https://api.stg-ocp.northstar.osac:6443",
      console_url: "https://console.stg-ocp.northstar.osac",
      node_sets: { compute: { host_type: "acme_512g", size: 6 } },
    },
  },
  {
    id: "cl-dev-ocp",
    metadata: meta("dev-ocp", "northstar", "dev@northstar", { labels: { env: "dev" } }),
    spec: {
      template: "tpl-ocp-416",
      release_image: "quay.io/openshift-release-dev/ocp-release:4.16.8-multi",
      node_sets: { compute: { host_type: "acme_256g", size: 3 } },
    },
    status: {
      state: "CLUSTER_STATE_READY",
      conditions: [{ type: "CLUSTER_CONDITION_TYPE_READY", status: "CONDITION_STATUS_TRUE", last_transition_time: "2026-03-09T07:00:00Z" }],
      api_url: "https://api.dev-ocp.northstar.osac:6443",
      console_url: "https://console.dev-ocp.northstar.osac",
      node_sets: { compute: { host_type: "acme_256g", size: 3 } },
    },
  },
];

// ---------- Virtual Networks / Subnets / Security Groups ----------
export type VirtualNetworkState =
  | "VIRTUAL_NETWORK_STATE_UNSPECIFIED"
  | "VIRTUAL_NETWORK_STATE_PENDING"
  | "VIRTUAL_NETWORK_STATE_READY"
  | "VIRTUAL_NETWORK_STATE_FAILED";

export interface VirtualNetworkSpec {
  network_class?: string;
  ipv4_cidr?: string;
  ipv6_cidr?: string;
  capabilities: { enable_ipv4: boolean; enable_ipv6: boolean; enable_dual_stack: boolean };
}
export type VirtualNetwork = Resource<VirtualNetworkSpec, { state: VirtualNetworkState; message?: string }>;

export type SubnetState =
  | "SUBNET_STATE_PENDING" | "SUBNET_STATE_READY" | "SUBNET_STATE_FAILED"
  | "SUBNET_STATE_DELETING" | "SUBNET_STATE_DELETE_FAILED";
export interface SubnetSpec { virtual_network: string; ipv4_cidr?: string; ipv6_cidr?: string; }
export type Subnet = Resource<SubnetSpec, { state: SubnetState; message?: string }>;

export const VIRTUAL_NETWORKS: VirtualNetwork[] = [
  {
    id: "vn-prod", metadata: meta("vn-prod", "northstar", "net@northstar", { annotations: { description: "Production workloads" } }),
    spec: { network_class: "ovn-kubernetes", ipv4_cidr: "10.10.0.0/16", capabilities: { enable_ipv4: true, enable_ipv6: false, enable_dual_stack: false } },
    status: { state: "VIRTUAL_NETWORK_STATE_READY" },
  },
  {
    id: "vn-dev", metadata: meta("vn-dev", "northstar", "net@northstar", { annotations: { description: "Developer sandbox" } }),
    spec: { network_class: "ovn-kubernetes", ipv4_cidr: "10.20.0.0/16", capabilities: { enable_ipv4: true, enable_ipv6: false, enable_dual_stack: false } },
    status: { state: "VIRTUAL_NETWORK_STATE_READY" },
  },
  {
    id: "vn-data", metadata: meta("vn-data", "northstar", "net@northstar", { annotations: { description: "Air-gapped data plane" } }),
    spec: { network_class: "ovn-kubernetes", ipv4_cidr: "10.30.0.0/16", capabilities: { enable_ipv4: true, enable_ipv6: false, enable_dual_stack: false } },
    status: { state: "VIRTUAL_NETWORK_STATE_PENDING", message: "Awaiting OVN logical switch programming" },
  },
];

const ownerRef = (vnetId: string) => ({ "osac.openshift.io/owner-reference": vnetId });

export const SUBNETS: Subnet[] = [
  { id: "sn-app", metadata: meta("sn-app", "northstar", "net@northstar", { annotations: ownerRef("vn-prod") }), spec: { virtual_network: "vn-prod", ipv4_cidr: "10.10.4.0/24" }, status: { state: "SUBNET_STATE_READY" } },
  { id: "sn-db", metadata: meta("sn-db", "northstar", "net@northstar", { annotations: ownerRef("vn-prod") }), spec: { virtual_network: "vn-prod", ipv4_cidr: "10.10.5.0/24" }, status: { state: "SUBNET_STATE_READY" } },
  { id: "sn-edge", metadata: meta("sn-edge", "northstar", "net@northstar", { annotations: ownerRef("vn-prod") }), spec: { virtual_network: "vn-prod", ipv4_cidr: "10.10.6.0/24" }, status: { state: "SUBNET_STATE_READY" } },
  { id: "sn-mgmt", metadata: meta("sn-mgmt", "northstar", "net@northstar", { annotations: ownerRef("vn-prod") }), spec: { virtual_network: "vn-prod", ipv4_cidr: "10.10.7.0/24" }, status: { state: "SUBNET_STATE_READY" } },
  { id: "sn-dev-app", metadata: meta("sn-dev-app", "northstar", "net@northstar", { annotations: ownerRef("vn-dev") }), spec: { virtual_network: "vn-dev", ipv4_cidr: "10.20.1.0/24" }, status: { state: "SUBNET_STATE_READY" } },
  { id: "sn-dev-db", metadata: meta("sn-dev-db", "northstar", "net@northstar", { annotations: ownerRef("vn-dev") }), spec: { virtual_network: "vn-dev", ipv4_cidr: "10.20.2.0/24" }, status: { state: "SUBNET_STATE_READY" } },
  { id: "sn-warehouse", metadata: meta("sn-warehouse", "northstar", "net@northstar", { annotations: ownerRef("vn-data") }), spec: { virtual_network: "vn-data", ipv4_cidr: "10.30.1.0/24" }, status: { state: "SUBNET_STATE_PENDING" } },
];

// ---------- Network Classes / Host Types ----------
export const NETWORK_CLASSES = [
  { id: "ovn-kubernetes", title: "OVN-Kubernetes", description: "Default OVN-based overlay with dual-stack support.", is_default: true, capabilities: { supports_ipv4: true, supports_ipv6: true, supports_dual_stack: true }, status: { state: "NETWORK_CLASS_STATE_READY" } },
  { id: "vpc-direct", title: "VPC Direct (BM)", description: "Bare-metal pass-through for high-throughput tenants.", is_default: false, capabilities: { supports_ipv4: true, supports_ipv6: false, supports_dual_stack: false }, status: { state: "NETWORK_CLASS_STATE_READY" } },
];

export const HOST_TYPES = [
  { id: "acme_256g", title: "Acme M5 · 256 GiB", description: "32 cores · 256 GiB RAM · NVMe local · suitable for control plane and small worker sets." },
  { id: "acme_512g", title: "Acme M5 · 512 GiB", description: "48 cores · 512 GiB RAM · NVMe local · general-purpose workers." },
  { id: "acme_1tb", title: "Acme M5 · 1 TiB", description: "64 cores · 1 TiB RAM · NVMe local · high-memory analytics & databases." },
  { id: "acme_gpu_h100", title: "Acme G8 · 4× H100", description: "96 cores · 1 TiB RAM · 4× NVIDIA H100 · for ML training & inference." },
];

// ---------- UI-side helpers ----------
export type SimpleStatus = "ready" | "progressing" | "stopped" | "failed";

export function vmSimpleStatus(s: ComputeInstanceState): SimpleStatus {
  switch (s) {
    case "COMPUTE_INSTANCE_STATE_RUNNING": return "ready";
    case "COMPUTE_INSTANCE_STATE_STOPPED":
    case "COMPUTE_INSTANCE_STATE_PAUSED": return "stopped";
    case "COMPUTE_INSTANCE_STATE_FAILED": return "failed";
    default: return "progressing";
  }
}

export function clusterSimpleStatus(s: ClusterState): SimpleStatus {
  switch (s) {
    case "CLUSTER_STATE_READY": return "ready";
    case "CLUSTER_STATE_FAILED": return "failed";
    default: return "progressing";
  }
}

export function vnetSimpleStatus(s: VirtualNetworkState): SimpleStatus {
  switch (s) {
    case "VIRTUAL_NETWORK_STATE_READY": return "ready";
    case "VIRTUAL_NETWORK_STATE_FAILED": return "failed";
    default: return "progressing";
  }
}

export const findVM = (name: string) => COMPUTE_INSTANCES.find((v) => v.metadata.name === name);
export const findCluster = (name: string) => CLUSTERS.find((c) => c.metadata.name === name);
export const subnetsOfVnet = (vnetId: string) => SUBNETS.filter((s) => s.spec.virtual_network === vnetId);
