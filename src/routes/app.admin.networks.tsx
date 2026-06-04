import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Button, Label } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";

export const Route = createFileRoute("/app/admin/networks")({ component: NetworksPage });

const NETWORKS = [
  { n: "vn-prod", cidr: "10.10.0.0/16", subnets: 4, sg: 6 },
  { n: "vn-dev", cidr: "10.20.0.0/16", subnets: 2, sg: 3 },
  { n: "vn-data", cidr: "10.30.0.0/16", subnets: 3, sg: 4 },
];

const NODES = [
  { id: "vn-prod", x: 60, y: 50, label: "vn-prod", sub: "10.10.0.0/16" },
  { id: "sn-app", x: 240, y: 20, label: "sn-app", sub: "10.10.4.0/24" },
  { id: "sn-db", x: 240, y: 90, label: "sn-db", sub: "10.10.5.0/24" },
  { id: "vm1", x: 460, y: 5, label: "bnk-app-01", sub: "VM · 10.10.4.21" },
  { id: "vm2", x: 460, y: 45, label: "bnk-app-02", sub: "VM · 10.10.4.22" },
  { id: "vm3", x: 460, y: 100, label: "bnk-warehouse", sub: "VM · 10.10.5.10" },
];

function NetworksPage() {
  return (
    <>
      <PageHeader title="Networks" subtitle="Virtual networks, subnets, and topology for your tenant."
        actions={<Button variant="primary">New virtual network</Button>}
      />

      <div className="osac-panel" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead><Tr><Th>Name</Th><Th>CIDR</Th><Th>Subnets</Th><Th>Security groups</Th><Th /></Tr></Thead>
          <Tbody>
            {NETWORKS.map((n) => (
              <Tr key={n.n}>
                <Td><strong>{n.n}</strong></Td>
                <Td><code>{n.cidr}</code></Td>
                <Td><Label isCompact>{n.subnets}</Label></Td>
                <Td><Label isCompact color="blue">{n.sg}</Label></Td>
                <Td isActionCell><ActionsColumn items={[{ title: "Manage subnets" }, { title: "Edit" }, { isSeparator: true }, { title: "Delete" }]} /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      <div className="osac-topology">
        <h3 className="osac-section-title">Topology — vn-prod</h3>
        <svg width="100%" height="200" style={{ position: "absolute", left: 0, top: 60, pointerEvents: "none" }}>
          <line x1="170" y1="80" x2="240" y2="50" stroke="#cfe1f5" strokeWidth="2" />
          <line x1="170" y1="80" x2="240" y2="120" stroke="#cfe1f5" strokeWidth="2" />
          <line x1="350" y1="50" x2="460" y2="35" stroke="#cfe1f5" strokeWidth="2" />
          <line x1="350" y1="50" x2="460" y2="75" stroke="#cfe1f5" strokeWidth="2" />
          <line x1="350" y1="120" x2="460" y2="130" stroke="#cfe1f5" strokeWidth="2" />
        </svg>
        {NODES.map((n) => (
          <div key={n.id} className="osac-topo-node" style={{ left: n.x, top: n.y + 50 }}>
            <span style={{ width: 8, height: 8, background: "#0066cc", borderRadius: 50 }} />
            <div>
              <div>{n.label}</div>
              <small>{n.sub}</small>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
