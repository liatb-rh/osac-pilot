import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Button, Label } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";

export const Route = createFileRoute("/app/provider/agents")({ component: AgentsPage });

const AGENTS = [
  { h: "rack-α-01", az: "AZ-α", v: "1.12.4", st: "healthy" },
  { h: "rack-α-02", az: "AZ-α", v: "1.12.4", st: "healthy" },
  { h: "rack-α-03", az: "AZ-α", v: "1.12.3", st: "drift" },
  { h: "rack-β-04", az: "AZ-β", v: "1.12.4", st: "healthy" },
  { h: "rack-β-05", az: "AZ-β", v: "1.12.4", st: "unreachable" },
  { h: "rack-γ-06", az: "AZ-γ", v: "1.12.4", st: "healthy" },
];

const TONE: Record<string, "green" | "orange" | "red"> = { healthy: "green", drift: "orange", unreachable: "red" };

function AgentsPage() {
  return (
    <>
      <PageHeader title="Infrastructure Agents" subtitle="Sovereign edge agent fleet and lifecycle."
        actions={<Button variant="primary">Provision agent</Button>}
      />
      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead><Tr><Th>Hostname</Th><Th>Zone</Th><Th>Version</Th><Th>Status</Th><Th /></Tr></Thead>
          <Tbody>
            {AGENTS.map((a) => (
              <Tr key={a.h}>
                <Td><strong>{a.h}</strong></Td>
                <Td>{a.az}</Td>
                <Td><code>{a.v}</code></Td>
                <Td><Label isCompact color={TONE[a.st]}>{a.st}</Label></Td>
                <Td isActionCell><ActionsColumn items={[{ title: "Upgrade" }, { title: "Reboot" }, { isSeparator: true }, { title: "Deprovision" }]} /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </>
  );
}
