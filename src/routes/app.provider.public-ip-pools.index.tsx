import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Modal, ModalVariant, ModalHeader, ModalBody, Form, FormGroup,
  TextInput, Label, LabelGroup,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon } from "@patternfly/react-icons";
import { PUBLIC_IP_POOLS, ipsForPool } from "@/lib/public-ip-data";
import { TENANTS } from "@/lib/session";

export const Route = createFileRoute("/app/provider/public-ip-pools/")({ component: PoolsPage });

function PoolsPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const totalCapacity = PUBLIC_IP_POOLS.reduce((a, p) => a + p.capacity, 0);
  const totalAllocated = PUBLIC_IP_POOLS.reduce((a, p) => a + ipsForPool(p.id).length, 0);
  const ready = PUBLIC_IP_POOLS.filter((p) => p.status === "ready").length;

  return (
    <>
      <PageHeader
        title="Public IP Pools"
        subtitle="Provider-owned CIDR blocks. Assign pools to tenant namespaces to make them allocatable."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setCreateOpen(true)}>Create pool</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Pools" value={PUBLIC_IP_POOLS.length} hint={`${ready} ready`} />
        <Kpi label="Capacity" value={totalCapacity} hint="usable addresses" />
        <Kpi label="Allocated" value={totalAllocated} hint={`${Math.round((totalAllocated / totalCapacity) * 100)}% utilization`} />
        <Kpi label="Tenants served" value={new Set(PUBLIC_IP_POOLS.flatMap((p) => p.tenantAssignments)).size} />
      </div>

      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table aria-label="Public IP pools">
          <Thead>
            <Tr><Th>Name</Th><Th>CIDR</Th><Th>Zone</Th><Th>Status</Th><Th>Utilization</Th><Th>Tenants</Th><Th screenReaderText="Actions" /></Tr>
          </Thead>
          <Tbody>
            {PUBLIC_IP_POOLS.map((p) => {
              const allocated = ipsForPool(p.id).length;
              const dot = p.status === "ready" ? "ready" : p.status === "failed" ? "failed" : "progressing";
              return (
                <Tr key={p.id} isClickable onRowClick={() => navigate({ to: "/app/provider/public-ip-pools/$id", params: { id: p.id } })}>
                  <Td>
                    <Link to="/app/provider/public-ip-pools/$id" params={{ id: p.id }} style={{ color: "#0066cc", fontWeight: 600 }}>
                      {p.name}
                    </Link>
                  </Td>
                  <Td><code>{p.cidr}</code></Td>
                  <Td>{p.zone ?? "—"}</Td>
                  <Td><span className="osac-status-dot" data-s={dot} /><span style={{ textTransform: "capitalize" }}>{p.status}</span></Td>
                  <Td>{allocated} / {p.capacity}</Td>
                  <Td>
                    {p.tenantAssignments.length === 0 ? <span style={{ color: "#5b6b7c" }}>Unassigned</span> : (
                      <LabelGroup>
                        {p.tenantAssignments.map((t) => <Label key={t} isCompact color="blue">{TENANTS[t].short}</Label>)}
                      </LabelGroup>
                    )}
                  </Td>
                  <Td isActionCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <ActionsColumn items={[
                      { title: "Edit pool" },
                      { title: "Assign tenants", onClick: () => navigate({ to: "/app/provider/public-ip-pools/$id", params: { id: p.id } }) },
                      { isSeparator: true },
                      { title: "Delete", isDisabled: ipsForPool(p.id).length > 0 },
                    ]} />
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>

      <Modal variant={ModalVariant.small} isOpen={createOpen} onClose={() => setCreateOpen(false)} aria-label="Create pool">
        <ModalHeader title="Create public IP pool" description="Register a routable CIDR block. Status moves to Ready once the network fabric confirms advertisement." />
        <ModalBody>
          <Form>
            <FormGroup label="Pool name" fieldId="pn" isRequired><TextInput id="pn" defaultValue="pub-zone-c" /></FormGroup>
            <FormGroup label="CIDR" fieldId="pc" isRequired><TextInput id="pc" defaultValue="198.18.40.0/24" /></FormGroup>
            <FormGroup label="Region / zone (optional)" fieldId="pz"><TextInput id="pz" defaultValue="zone-c" /></FormGroup>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="primary" onClick={() => setCreateOpen(false)}>Create</Button>
              <Button variant="link" onClick={() => setCreateOpen(false)}>Cancel</Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </>
  );
}
