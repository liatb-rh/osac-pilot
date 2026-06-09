// Storage Tiers — CaaS Tenant Storage data model.
// Each tier maps to a VAST view + per-tenant StorageClass / VolumeSnapshotClass
// installed on tenant clusters when ClusterOrderPhase reaches Ready.

export type Temperature = "hot" | "warm" | "cool" | "cold" | "archive";

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
  // VAST backends (a tier may span multiple clusters)
  backends: {
    cluster: string;
    view_prefix: string;
    protocol: "NFSv4.1" | "NFSv3" | "S3";
    status: "healthy" | "degraded" | "unavailable";
    capacity_tib: number;
    used_tib: number;
  }[];
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
  // UX — temperature & economics
  temperature: Temperature;
  cost_storage_per_tib_month: number; // USD
  cost_retrieval_per_tib: number; // USD per TiB retrieved
  min_retention_days: number;
  early_delete_fee_per_tib: number; // USD
  rehydration_eta: string; // "instant", "minutes", "1–4 hours" ...
  // Consumers (drives "data to show")
  consumers: {
    tenant: string;
    clusters: string[];
    pvcs: number;
    used_tib: number;
  }[];
}

export const TEMPERATURE_META: Record<Temperature, { label: string; blurb: string; tone: string }> = {
  hot:     { label: "Hot",     blurb: "Frequently accessed, lowest latency",          tone: "#c9190b" },
  warm:    { label: "Warm",    blurb: "Moderately accessed production data",          tone: "#ec7a08" },
  cool:    { label: "Cool",    blurb: "Infrequently accessed, retrieval fees apply",  tone: "#0066cc" },
  cold:    { label: "Cold",    blurb: "Rarely accessed, slow retrieval, low cost",    tone: "#5752d1" },
  archive: { label: "Archive", blurb: "Lowest cost, hours to thaw",                   tone: "#4f5255" },
};

export const STORAGE_TIERS: StorageTier[] = [
  {
    id: "platinum", name: "Platinum",
    description: "Latency-critical OLTP and trading workloads. Synchronous replication across AZs.",
    enabled: true, is_default: false,
    media: "NVMe SSD RAID-10", iops: "200k", throughput_gbps: 40, latency_ms: "<0.2",
    capacity_tib: 120, used_tib: 38,
    backends: [
      { cluster: "vast-prod-α", view_prefix: "/tenants/{tenant}/platinum", protocol: "NFSv4.1", status: "healthy", capacity_tib: 120, used_tib: 38 },
    ],
    csi_driver: "csi.vastdata.com",
    storage_class_template: "tenant-{tenant}-platinum",
    snapshot_class_template: "tenant-{tenant}-platinum-snap",
    reclaim_policy: "Retain", volume_binding_mode: "WaitForFirstConsumer",
    allow_volume_expansion: true,
    encryption: "AES-256 + per-tenant KMS", replication: "sync",
    temperature: "hot",
    cost_storage_per_tib_month: 220, cost_retrieval_per_tib: 0,
    min_retention_days: 0, early_delete_fee_per_tib: 0,
    rehydration_eta: "instant",
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
    temperature: "warm",
    cost_storage_per_tib_month: 95, cost_retrieval_per_tib: 0,
    min_retention_days: 0, early_delete_fee_per_tib: 0,
    rehydration_eta: "instant",
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
    temperature: "cool",
    cost_storage_per_tib_month: 38, cost_retrieval_per_tib: 5,
    min_retention_days: 30, early_delete_fee_per_tib: 6,
    rehydration_eta: "minutes",
    consumers: [
      { tenant: "northstar", clusters: ["dev-ocp"], pvcs: 58, used_tib: 220 },
      { tenant: "helios", clusters: ["helios-dev"], pvcs: 22, used_tib: 92 },
    ],
  },
  {
    id: "bronze", name: "Bronze",
    description: "Cold backup for compliance retention. Retrieval in 1–4 hours.",
    enabled: true, is_default: false,
    media: "HDD (SMR)", iops: "5k", throughput_gbps: 4, latency_ms: "<20",
    capacity_tib: 2400, used_tib: 410,
    vast_cluster: "vast-archive-γ", vast_view_prefix: "/tenants/{tenant}/bronze",
    protocol: "S3",
    csi_driver: "csi.vastdata.com",
    storage_class_template: "tenant-{tenant}-bronze",
    snapshot_class_template: "tenant-{tenant}-bronze-snap",
    reclaim_policy: "Retain", volume_binding_mode: "Immediate",
    allow_volume_expansion: false,
    encryption: "AES-256 at rest", replication: "none",
    temperature: "cold",
    cost_storage_per_tib_month: 12, cost_retrieval_per_tib: 18,
    min_retention_days: 90, early_delete_fee_per_tib: 14,
    rehydration_eta: "1–4 hours",
    consumers: [
      { tenant: "northstar", clusters: ["prod-ocp"], pvcs: 9, used_tib: 410 },
    ],
  },
  {
    id: "glacier", name: "Glacier",
    description: "Deep archive for long-term backups and regulatory holds. Lowest cost.",
    enabled: true, is_default: false,
    media: "Tape library + erasure-coded HDD", iops: "—", throughput_gbps: 1, latency_ms: "n/a",
    capacity_tib: 5000, used_tib: 1280,
    vast_cluster: "vast-archive-γ", vast_view_prefix: "/tenants/{tenant}/glacier",
    protocol: "S3",
    csi_driver: "csi.vastdata.com",
    storage_class_template: "tenant-{tenant}-glacier",
    snapshot_class_template: "tenant-{tenant}-glacier-snap",
    reclaim_policy: "Retain", volume_binding_mode: "Immediate",
    allow_volume_expansion: false,
    encryption: "AES-256 + per-tenant KMS", replication: "none",
    temperature: "archive",
    cost_storage_per_tib_month: 4, cost_retrieval_per_tib: 60,
    min_retention_days: 180, early_delete_fee_per_tib: 40,
    rehydration_eta: "up to 12 hours",
    consumers: [
      { tenant: "atlas", clusters: ["atlas-prod"], pvcs: 3, used_tib: 1280 },
    ],
  },
];

export const findTier = (id: string) => STORAGE_TIERS.find((t) => t.id === id);
export const tierHasData = (t: StorageTier) => t.consumers.length > 0;

// ───────────────── Lifecycle rules (mock) ─────────────────
export interface LifecycleRule {
  id: string;
  name: string;
  source_tier: string;
  target_tier: string;
  filter: string;            // human description, e.g. "age > 90d AND label=logs"
  enabled: boolean;
  est_monthly_savings_usd: number;
}

export const LIFECYCLE_RULES: LifecycleRule[] = [
  { id: "r-snap-30",  name: "VM snapshots older than 30 days → Silver",   source_tier: "gold",    target_tier: "silver",  filter: "age > 30d AND kind=snapshot",       enabled: true,  est_monthly_savings_usd: 5_420 },
  { id: "r-logs-1y",  name: "Application logs older than 1 year → Bronze",source_tier: "silver",  target_tier: "bronze",  filter: "age > 365d AND label=logs",         enabled: true,  est_monthly_savings_usd: 11_960 },
  { id: "r-bk-90",    name: "Backups older than 90 days → Glacier",       source_tier: "bronze",  target_tier: "glacier", filter: "age > 90d AND kind=backup",         enabled: false, est_monthly_savings_usd: 18_300 },
];

// ───────────────── Rehydration jobs (mock) ─────────────────
export interface RehydrationJob {
  id: string;
  source_tier: string;
  target_tier: string;
  size_tib: number;
  progress_pct: number;     // 0..100
  eta: string;              // "38m", "Ready"
  status: "thawing" | "ready" | "queued" | "failed";
  requested_by: string;
  started_at: string;
}

export const REHYDRATION_JOBS: RehydrationJob[] = [
  { id: "rh-8a14", source_tier: "glacier", target_tier: "silver", size_tib: 1.2,  progress_pct: 62, eta: "≈ 38 min", status: "thawing", requested_by: "atlas/ops",      started_at: "2026-06-08 08:11" },
  { id: "rh-7c02", source_tier: "bronze",  target_tier: "gold",   size_tib: 0.08, progress_pct: 100, eta: "Ready",   status: "ready",   requested_by: "northstar/data", started_at: "2026-06-08 07:46" },
  { id: "rh-6f99", source_tier: "glacier", target_tier: "bronze", size_tib: 3.4,  progress_pct: 12, eta: "≈ 4 h 20m", status: "thawing", requested_by: "atlas/audit",    started_at: "2026-06-08 09:02" },
];
