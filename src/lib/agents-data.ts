// Infrastructure Agents — mock data aligned with OSAC infrastructure model.
// Agents are sovereign-edge daemons running on physical hosts (host_types from
// osac-api.ts) that join clusters and report inventory to the fulfillment svc.

export type AgentStatus = "healthy" | "drift" | "unreachable" | "provisioning";

export interface Agent {
  hostname: string;
  az: string;            // availability zone
  rack: string;
  host_type: string;     // FK -> HOST_TYPES.id
  serial: string;
  version: string;       // agent build
  channel: "stable" | "candidate" | "edge";
  status: AgentStatus;
  cluster?: string;      // FK -> CLUSTERS.metadata.name (if joined)
  virtual_network: string;
  mgmt_ip: string;
  data_ip: string;
  last_heartbeat: string;
  enrolled_at: string;
  enrolled_by: string;
  cores: number;
  memory_gib: number;
  disk_tib: number;
  nics: { name: string; mac: string; speed_gbps: number; link: "up" | "down" }[];
}

export const AGENTS: Agent[] = [
  {
    hostname: "rack-α-01", az: "AZ-α", rack: "R-α-01", host_type: "acme_1tb",
    serial: "ACM-9F1A-0001", version: "1.12.4", channel: "stable", status: "healthy",
    cluster: "prod-ocp", virtual_network: "vn-prod",
    mgmt_ip: "10.10.7.11", data_ip: "10.10.4.11",
    last_heartbeat: "2026-06-05T10:42:11Z", enrolled_at: "2026-01-08T09:00:00Z", enrolled_by: "platform@osac",
    cores: 64, memory_gib: 1024, disk_tib: 7.6,
    nics: [
      { name: "eno1", mac: "ac:1f:6b:00:01:01", speed_gbps: 25, link: "up" },
      { name: "eno2", mac: "ac:1f:6b:00:01:02", speed_gbps: 25, link: "up" },
    ],
  },
  {
    hostname: "rack-α-02", az: "AZ-α", rack: "R-α-02", host_type: "acme_1tb",
    serial: "ACM-9F1A-0002", version: "1.12.4", channel: "stable", status: "healthy",
    cluster: "prod-ocp", virtual_network: "vn-prod",
    mgmt_ip: "10.10.7.12", data_ip: "10.10.4.12",
    last_heartbeat: "2026-06-05T10:42:09Z", enrolled_at: "2026-01-08T09:05:00Z", enrolled_by: "platform@osac",
    cores: 64, memory_gib: 1024, disk_tib: 7.6,
    nics: [{ name: "eno1", mac: "ac:1f:6b:00:02:01", speed_gbps: 25, link: "up" }],
  },
  {
    hostname: "rack-α-03", az: "AZ-α", rack: "R-α-03", host_type: "acme_512g",
    serial: "ACM-5C2B-0003", version: "1.12.3", channel: "stable", status: "drift",
    cluster: "prod-ocp", virtual_network: "vn-prod",
    mgmt_ip: "10.10.7.13", data_ip: "10.10.4.13",
    last_heartbeat: "2026-06-05T10:41:50Z", enrolled_at: "2026-02-12T11:00:00Z", enrolled_by: "ops@northstar",
    cores: 48, memory_gib: 512, disk_tib: 3.8,
    nics: [{ name: "eno1", mac: "ac:1f:6b:00:03:01", speed_gbps: 25, link: "up" }],
  },
  {
    hostname: "rack-β-04", az: "AZ-β", rack: "R-β-04", host_type: "acme_512g",
    serial: "ACM-5C2B-0004", version: "1.12.4", channel: "stable", status: "healthy",
    cluster: "stg-ocp", virtual_network: "vn-prod",
    mgmt_ip: "10.10.7.14", data_ip: "10.10.4.14",
    last_heartbeat: "2026-06-05T10:42:00Z", enrolled_at: "2026-02-20T15:00:00Z", enrolled_by: "ops@northstar",
    cores: 48, memory_gib: 512, disk_tib: 3.8,
    nics: [{ name: "eno1", mac: "ac:1f:6b:00:04:01", speed_gbps: 25, link: "up" }],
  },
  {
    hostname: "rack-β-05", az: "AZ-β", rack: "R-β-05", host_type: "acme_256g",
    serial: "ACM-2A4D-0005", version: "1.12.4", channel: "stable", status: "unreachable",
    cluster: "stg-ocp", virtual_network: "vn-prod",
    mgmt_ip: "10.10.7.15", data_ip: "10.10.4.15",
    last_heartbeat: "2026-06-05T08:11:02Z", enrolled_at: "2026-03-01T10:00:00Z", enrolled_by: "ops@northstar",
    cores: 32, memory_gib: 256, disk_tib: 1.9,
    nics: [{ name: "eno1", mac: "ac:1f:6b:00:05:01", speed_gbps: 10, link: "down" }],
  },
  {
    hostname: "rack-γ-06", az: "AZ-γ", rack: "R-γ-06", host_type: "acme_gpu_h100",
    serial: "ACM-GPU8-0006", version: "1.12.4", channel: "candidate", status: "healthy",
    cluster: "dev-ocp", virtual_network: "vn-dev",
    mgmt_ip: "10.20.7.16", data_ip: "10.20.1.16",
    last_heartbeat: "2026-06-05T10:42:13Z", enrolled_at: "2026-04-18T12:00:00Z", enrolled_by: "ml@northstar",
    cores: 96, memory_gib: 1024, disk_tib: 15.3,
    nics: [
      { name: "eno1", mac: "ac:1f:6b:00:06:01", speed_gbps: 100, link: "up" },
      { name: "eno2", mac: "ac:1f:6b:00:06:02", speed_gbps: 100, link: "up" },
    ],
  },
];

export const findAgent = (h: string) => AGENTS.find((a) => a.hostname === h);
