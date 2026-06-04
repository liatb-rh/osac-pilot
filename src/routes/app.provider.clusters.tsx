import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";

export const Route = createFileRoute("/app/provider/clusters")({ component: AllClustersPage });

const CLUSTERS = [
  { n: "ns-prod-ocp", tenant: "Northstar Bank", v: "4.17.3", st: "upgrading", nodes: 9 },
  { n: "ns-stg-ocp", tenant: "Northstar Bank", v: "4.17.1", st: "ready", nodes: 6 },
  { n: "bl-prod-ocp", tenant: "Bluestone Financial", v: "4.17.3", st: "ready", nodes: 12 },
  { n: "au-ai", tenant: "Aurora Health", v: "4.17.3", st: "ready", nodes: 5 },
  { n: "hl-edge-01", tenant: "Helix Logistics", v: "4.16.8", st: "progressing", nodes: 3 },
];

function AllClustersPage() {
  return (
    <>
      <PageHeader title="All Clusters" subtitle="Cross-tenant view of OpenShift clusters across the sovereign cloud." />
      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead><Tr><Th>Cluster</Th><Th>Tenant</Th><Th>OCP version</Th><Th>Status</Th><Th>Nodes</Th></Tr></Thead>
          <Tbody>
            {CLUSTERS.map((c) => (
              <Tr key={c.n}>
                <Td><strong>{c.n}</strong></Td>
                <Td>{c.tenant}</Td>
                <Td>{c.v}</Td>
                <Td><span className="osac-status-dot" data-s={c.st} /><span style={{ textTransform: "capitalize" }}>{c.st}</span></Td>
                <Td>{c.nodes}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </>
  );
}
