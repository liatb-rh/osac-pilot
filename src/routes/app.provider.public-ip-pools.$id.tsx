import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Tabs, Tab, TabTitleText, Breadcrumb, BreadcrumbItem, Label,
  Card, CardBody, CardTitle, Modal, ModalVariant, ModalHeader, ModalBody,
  Form, FormGroup, Select, SelectOption, SelectList, MenuToggle,
  DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { EditIcon, TrashIcon, PlusCircleIcon } from "@patternfly/react-icons";
import { findPool, ipsForPool, ipDotStatus, WORKLOAD_LABEL, groupAssignmentsForPool } from "@/lib/public-ip-data";
import { TENANTS, type TenantId } from "@/lib/session";

export const Route = createFileRoute("/app/provider/public-ip-pools/$id")({ component: PoolDetail });

function PoolDetail() {
  const { id } = Route.useParams();
  const pool = findPool(id);
  const [tab, setTab] = useState<string | number>("overview");
  const [assigned, setAssigned] = useState<TenantId[]>(pool?.tenantAssignments ?? []);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pick, setPick] = useState<TenantId | "">("");
  const [pickOpen, setPickOpen] = useState(false);

  if (!pool) {
    return (
      <>
        <Breadcrumb style={{ marginBottom: 12 }}>
          <BreadcrumbItem><Link to="/app/provider/public-ip-pools">Public IP Pools</Link></BreadcrumbItem>
          <BreadcrumbItem isActive>{id}</BreadcrumbItem>
        </Breadcrumb>
        <PageHeader title={id} subtitle="Pool not found." />
      </>
    );
  }

  const allocations = ipsForPool(pool.id);
  const dot = pool.status === "ready" ? "ready" : pool.status === "failed" ? "failed" : "progressing";
  const unassigned = (Object.keys(TENANTS) as TenantId[]).filter((t) => !assigned.includes(t));

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/provider/public-ip-pools">Public IP Pools</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{pool.name}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={pool.name}
        subtitle={`Routable block ${pool.cidr}${pool.zone ? ` · ${pool.zone}` : ""}`}
        actions={
          <>
            <Button variant="secondary" icon={<EditIcon />}>Edit pool</Button>
            <Button variant="danger" icon={<TrashIcon />} isDisabled={allocations.length > 0}>Delete</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Status" value={<span><span className="osac-status-dot" data-s={dot} /><span style={{ textTransform: "capitalize" }}>{pool.status}</span></span> as any} />
        <Kpi label="Capacity" value={pool.capacity} hint="usable addresses" />
        <Kpi label="Allocated" value={allocations.length} hint={`${Math.round((allocations.length / pool.capacity) * 100)}% utilization`} />
        <Kpi label="Tenant assignments" value={assigned.length} />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Pool detail tabs">
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, maxWidth: 720 }}>
            <Card><CardTitle>Specification</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Pool ID</DescriptionListTerm><DescriptionListDescription><code>{pool.id}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>CIDR</DescriptionListTerm><DescriptionListDescription><code>{pool.cidr}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Zone</DescriptionListTerm><DescriptionListDescription>{pool.zone ?? "—"}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Created</DescriptionListTerm><DescriptionListDescription>{pool.createdAt}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Allocation rule</DescriptionListTerm><DescriptionListDescription>A tenant can only allocate from pools assigned to its namespace.</DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="tenants" title={<TabTitleText>Tenant Assignments</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Button variant="secondary" icon={<PlusCircleIcon />} isDisabled={unassigned.length === 0} onClick={() => setAssignOpen(true)}>
                Assign tenant
              </Button>
            </div>
            <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
              <Table aria-label="Tenant assignments">
                <Thead><Tr><Th>Tenant</Th><Th>Group assignments</Th><Th>Allocations</Th><Th screenReaderText="Actions" /></Tr></Thead>
                <Tbody>
                  {assigned.map((t) => {
                    const groups = groupAssignmentsForPool(pool.id, t);
                    const count = allocations.filter((ip) => ip.tenant === t).length;
                    return (
                      <Tr key={t}>
                        <Td><strong>{TENANTS[t].name}</strong></Td>
                        <Td>{groups.length > 0 ? groups.map((g) => g.group).join(", ") : <span style={{ color: "#5b6b7c" }}>None yet (tenant admin assigns)</span>}</Td>
                        <Td>{count}</Td>
                        <Td isActionCell>
                          <ActionsColumn items={[
                            { title: "Revoke access", isDisabled: count > 0, onClick: () => setAssigned((p) => p.filter((x) => x !== t)) },
                          ]} />
                        </Td>
                      </Tr>
                    );
                  })}
                  {assigned.length === 0 && (
                    <Tr><Td colSpan={4} style={{ textAlign: "center", padding: 32, color: "#5b6b7c" }}>No tenants assigned. This pool is not allocatable yet.</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>

        <Tab eventKey="allocations" title={<TabTitleText>Allocations</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
              <Table aria-label="Allocations">
                <Thead><Tr><Th>Address</Th><Th>State</Th><Th>Tenant</Th><Th>Attached to</Th><Th>Owner</Th></Tr></Thead>
                <Tbody>
                  {allocations.map((ip) => (
                    <Tr key={ip.id}>
                      <Td><code>{ip.address}</code></Td>
                      <Td><span className="osac-status-dot" data-s={ipDotStatus(ip.state)} /><span style={{ textTransform: "capitalize" }}>{ip.state}</span></Td>
                      <Td>{TENANTS[ip.tenant].short}</Td>
                      <Td>
                        {ip.workloadId ? (
                          <span>
                            <Label isCompact style={{ marginRight: 6 }}>{WORKLOAD_LABEL[ip.workloadType ?? "vm"]}</Label>
                            {ip.workloadId}{ip.nic ? ` · ${ip.nic}` : ""}
                          </span>
                        ) : "—"}
                      </Td>
                      <Td>{ip.owner}</Td>
                    </Tr>
                  ))}
                  {allocations.length === 0 && (
                    <Tr><Td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#5b6b7c" }}>No allocations from this pool.</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>
      </Tabs>

      <Modal variant={ModalVariant.small} isOpen={assignOpen} onClose={() => setAssignOpen(false)} aria-label="Assign tenant">
        <ModalHeader title="Assign tenant" description="Grant a tenant namespace access to allocate from this pool." />
        <ModalBody>
          <Form>
            <FormGroup label="Tenant" fieldId="assign-tenant" isRequired>
              <Select isOpen={pickOpen} onOpenChange={setPickOpen}
                toggle={(ref) => (
                  <MenuToggle ref={ref} onClick={() => setPickOpen((v) => !v)} isExpanded={pickOpen}>
                    {pick ? TENANTS[pick].name : "Select a tenant"}
                  </MenuToggle>
                )}
                onSelect={(_, v) => { setPick(v as TenantId); setPickOpen(false); }}
              >
                <SelectList>
                  {unassigned.map((t) => <SelectOption key={t} value={t}>{TENANTS[t].name}</SelectOption>)}
                </SelectList>
              </Select>
            </FormGroup>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="primary" isDisabled={!pick} onClick={() => {
                if (pick) setAssigned((p) => [...p, pick]);
                setPick(""); setAssignOpen(false);
              }}>Assign</Button>
              <Button variant="link" onClick={() => setAssignOpen(false)}>Cancel</Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </>
  );
}
