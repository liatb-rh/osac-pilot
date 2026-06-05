// Storage Tiers — CaaS Tenant Storage data model.
// Each tier maps to a VAST view + per-tenant StorageClass / VolumeSnapshotClass
// installed on tenant clusters when ClusterOrderPhase reaches Ready.

export interface StorageTier {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  is_default: boolean;
  media: string;
  iops: string;
  throughput_gbps: number;
  latency_ms: string;
  capacity_tib: number;
  used_tib: number;
  // VAST backend
  vast_cluster: string;
  vast_view_prefix: string;
  protocol: "NFSv4.1" | "NFSv3" | "S3";
  // K8s CSI
  csi_driver: string;
  storage_class_template: string;
  snapshot_class_template: string;
  reclaim_policy: "Delete" | "Retain";
  volume_binding_mode: "Immediate" | "WaitForFirstConsumer";
  allow_volume_expansion: boolean;
  // Governance
  encryption: "AES-256 at rest" | "AES-256 + per-tenant KMS";
  replication: "none" | "async" | "sync";
  // Consumers (drives "data to show")
  consumers: {
    tenant: string;
    clusters: string[];
    pvcs: number;
    used_tib: number;
  }[];
}

export const STORAGE_TIERS: StorageTier[] = [
  {
    id: "platinum", name: "Platinum",
    description: "Latency-critical OLTP and trading workloads. Synchronous replication across AZs.",
    enabled: true, is_default: false,
    media: "NVMe SSD RAID-10", iops: "200k", throughput_gbps: 40, latency_ms: "<0.2",
    capacity_tib: 120, used_tib: 38,
    vast_cluster: "vast-prod-α", vast_view_prefix: "/tenants/{tenant}/platinum",
    protocol: "NFSv4.1",
    csi_driver: "csi.vastdata.com",
    storage_class_template: "tenant-{tenant}-platinum",
    snapshot_class_template: "tenant-{tenant}-platinum-snap",
    reclaim_policy: "Retain", volume_binding_mode: "WaitForFirstConsumer",
    allow_volume_expansion: true,
    encryption: "AES-256 + per-tenant KMS", replication: "sync",
    consumers: [
      { tenant: "northstar", clusters: ["prod-ocp"], pvcs: 14, used_tib: 22.4 },
      { tenant: "atlas", clusters: ["atlas-prod"], pvcs: 6, used_tib: 15.6 },
    ],
  },
  {
    id: "gold", name: "Gold",
    description: "General-purpose production. Default tier for new VM boot disks.",
    enabled: true, is_default: true,
    media: "NVMe SSD", iops: "100k", throughput_gbps: 25, latency_ms: "<0.5",
    capacity_tib: 480, used_tib: 211,
    vast_cluster: "vast-prod-α", vast_view_prefix: "/tenants/{tenant}/gold",
    protocol: "NFSv4.1",
    csi_driver: "csi.vastdata.com",
    storage_class_template: "tenant-{tenant}-gold",
    snapshot_class_template: "tenant-{tenant}-gold-snap",
    reclaim_policy: "Delete", volume_binding_mode: "WaitForFirstConsumer",
    allow_volume_expansion: true,
    encryption: "AES-256 at rest", replication: "async",
    consumers: [
      { tenant: "northstar", clusters: ["prod-ocp", "stg-ocp"], pvcs: 142, used_tib: 168 },
      { tenant: "atlas", clusters: ["atlas-prod"], pvcs: 37, used_tib: 43 },
    ],
  },
  {
    id: "silver", name: "Silver",
    description: "Capacity-oriented working sets and dev/test data.",
    enabled: true, is_default: false,
    media: "SATA SSD", iops: "30k", throughput_gbps: 10, latency_ms: "<2",
    capacity_tib: 960, used_tib: 312,
    vast_cluster: "vast-prod-β", vast_view_prefix: "/tenants/{tenant}/silver",
    protocol: "NFSv4.1",
    csi_driver: "csi.vastdata.com",
    storage_class_template: "tenant-{tenant}-silver",
    snapshot_class_template: "tenant-{tenant}-silver-snap",
    reclaim_policy: "Delete", volume_binding_mode: "Immediate",
    allow_volume_expansion: true,
    encryption: "AES-256 at rest", replication: "async",
    consumers: [
      { tenant: "northstar", clusters: ["dev-ocp"], pvcs: 58, used_tib: 220 },
      { tenant: "helios", clusters: ["helios-dev"], pvcs: 22, used_tib: 92 },
    ],
  },
  {
    id: "bronze", name: "Bronze",
    description: "Cold archive and long-term backup. Not yet onboarded to any tenant.",
    enabled: false, is_default: false,
    media: "HDD (SMR)", iops: "5k", throughput_gbps: 4, latency_ms: "<20",
    capacity_tib: 2400, used_tib: 0,
    vast_cluster: "vast-archive-γ", vast_view_prefix: "/tenants/{tenant}/bronze",
    protocol: "S3",
    csi_driver: "csi.vastdata.com",
    storage_class_template: "tenant-{tenant}-bronze",
    snapshot_class_template: "tenant-{tenant}-bronze-snap",
    reclaim_policy: "Retain", volume_binding_mode: "Immediate",
    allow_volume_expansion: false,
    encryption: "AES-256 at rest", replication: "none",
    consumers: [],
  },
];

export const findTier = (id: string) => STORAGE_TIERS.find((t) => t.id === id);
export const tierHasData = (t: StorageTier) => t.consumers.length > 0;
