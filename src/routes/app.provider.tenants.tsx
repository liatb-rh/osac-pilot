import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Button, Label } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";

export const Route = createFileRoute("/app/provider/tenants")({ component: TenantsPage });

const TENANTS = [
  { n: "Northstar Bank", id: "northstar", users: 48, vms: 96, cl: 4, status: "active" },
  { n: "Bluestone Financial Group", id: "evergreen", users: 32, vms: 64, cl: 3, status: "active" },
  { n: "Aurora Health", id: "aurora", users: 21, vms: 42, cl: 2, status: "active" },
  { n: "Helix Logistics", id: "helix", users: 14, vms: 28, cl: 1, status: "onboarding" },
  { n: "Crestline Insurance", id: "crestline", users: 0, vms: 0, cl: 0, status: "onboarding" },
];

function TenantsPage() {
  return (
    <>
      <PageHeader title="Tenant Organizations" subtitle="Onboard, suspend, or scope policy across sovereign tenants."
        actions={<Button variant="primary">Onboard tenant</Button>}
      />
      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead><Tr><Th>Organization</Th><Th>ID</Th><Th>Users</Th><Th>VMs</Th><Th>Clusters</Th><Th>Status</Th><Th /></Tr></Thead>
          <Tbody>
            {TENANTS.map((t) => (
              <Tr key={t.id}>
                <Td><strong>{t.n}</strong></Td>
                <Td><code>{t.id}</code></Td>
                <Td>{t.users}</Td>
                <Td>{t.vms}</Td>
                <Td>{t.cl}</Td>
                <Td><Label isCompact color={t.status === "active" ? "green" : "orange"}>{t.status}</Label></Td>
                <Td isActionCell><ActionsColumn items={[{ title: "View details" }, { title: "Edit quota" }, { title: "Audit log" }, { isSeparator: true }, { title: "Suspend" }]} /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </>
  );
}
