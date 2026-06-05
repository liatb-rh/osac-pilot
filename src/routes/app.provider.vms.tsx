import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import { SearchInput, ToggleGroup, ToggleGroupItem, Label } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";

export const Route = createFileRoute("/app/provider/vms")({ component: ProviderVmsPage });

interface PVM { name: string; tenant: string; status: "running" | "stopped" | "progressing" | "failed"; os: string; cpu: number; ram: number; node: string; }

const VMS: PVM[] = [
  { name: "bnk-app-01", tenant: "Northstar Bank", status: "running", os: "RHEL 9", cpu: 4, ram: 16, node: "worker-az1-03" },
  { name: "bnk-app-02", tenant: "Northstar Bank", status: "running", os: "RHEL 9", cpu: 8, ram: 32, node: "worker-az2-01" },
  { name: "bnk-warehouse", tenant: "Northstar Bank", status: "stopped", os: "Ubuntu 22", cpu: 16, ram: 64, node: "worker-az3-02" },
  { name: "bl-ledger-01", tenant: "Bluestone Financial", status: "running", os: "RHEL 9", cpu: 8, ram: 32, node: "worker-az1-07" },
  { name: "bl-ledger-02", tenant: "Bluestone Financial", status: "running", os: "RHEL 9", cpu: 8, ram: 32, node: "worker-az2-04" },
  { name: "au-radiology-gpu", tenant: "Aurora Health", status: "running", os: "Ubuntu 22", cpu: 32, ram: 128, node: "gpu-az1-02" },
  { name: "au-archive", tenant: "Aurora Health", status: "stopped", os: "RHEL 9", cpu: 4, ram: 16, node: "worker-az3-01" },
  { name: "hl-tracker", tenant: "Helix Logistics", status: "progressing", os: "RHEL 9", cpu: 2, ram: 8, node: "—" },
  { name: "vx-platform-01", tenant: "Vertexa", status: "failed", os: "Ubuntu 22", cpu: 16, ram: 64, node: "gpu-az2-01" },
];

function ProviderVmsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "running" | "stopped" | "failed">("all");

  const rows = VMS.filter((v) =>
    (filter === "all" || v.status === filter) &&
    (v.name.includes(q) || v.tenant.toLowerCase().includes(q.toLowerCase()))
  );

  const counts = {
    total: VMS.length,
    running: VMS.filter((v) => v.status === "running").length,
    stopped: VMS.filter((v) => v.status === "stopped").length,
    failed: VMS.filter((v) => v.status === "failed").length,
  };

  return (
    <>
      <PageHeader title="All Virtual Machines" subtitle="Cross-tenant view of VM workloads across the sovereign cloud." />

      <div className="osac-kpi-grid" style={{ marginBottom: 16 }}>
        <Kpi label="Total VMs" value={counts.total} />
        <Kpi label="Running" value={counts.running} tone="success" />
        <Kpi label="Stopped" value={counts.stopped} tone="muted" />
        <Kpi label="Failed" value={counts.failed} tone="danger" />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <SearchInput placeholder="Filter by name or tenant" value={q} onChange={(_, v) => setQ(v)} onClear={() => setQ("")} style={{ minWidth: 280 }} />
        <ToggleGroup>
          <ToggleGroupItem text="All" isSelected={filter === "all"} onChange={() => setFilter("all")} />
          <ToggleGroupItem text="Running" isSelected={filter === "running"} onChange={() => setFilter("running")} />
          <ToggleGroupItem text="Stopped" isSelected={filter === "stopped"} onChange={() => setFilter("stopped")} />
          <ToggleGroupItem text="Failed" isSelected={filter === "failed"} onChange={() => setFilter("failed")} />
        </ToggleGroup>
      </div>

      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table aria-label="Cross-tenant VM list">
          <Thead><Tr>
            <Th>Name</Th><Th>Tenant</Th><Th>Status</Th><Th>OS</Th><Th>vCPU</Th><Th>Memory</Th><Th>Node</Th>
          </Tr></Thead>
          <Tbody>
            {rows.map((v) => (
              <Tr key={v.name}>
                <Td><Link to="/app/vms/$name" params={{ name: v.name }} style={{ color: "#0066cc", fontWeight: 600 }}>{v.name}</Link></Td>
                <Td><Label isCompact color="blue">{v.tenant}</Label></Td>
                <Td><span className="osac-status-dot" data-s={v.status} /><span style={{ textTransform: "capitalize" }}>{v.status}</span></Td>
                <Td>{v.os}</Td>
                <Td>{v.cpu}</Td>
                <Td>{v.ram} GiB</Td>
                <Td><code>{v.node}</code></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </>
  );
}
