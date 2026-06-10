import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Tabs, Tab, TabTitleText, Breadcrumb, BreadcrumbItem, Label,
  Card, CardBody, CardTitle, Modal, ModalVariant, ModalHeader, ModalBody,
  Form, FormGroup, TextInput, Select, SelectOption, SelectList, MenuToggle,
  DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon } from "@patternfly/react-icons";
import {
  findPool, ipsForPool, ipDotStatus, groupAssignmentsForPool,
  USER_GROUPS, WORKLOAD_LABEL, type PoolGroupAssignment,
} from "@/lib/public-ip-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/app/admin/public-ip-pools/$id")({ component: AdminPoolDetail });

function AdminPoolDetail() {
  const { id } = Route.useParams();
  const { tenant } = useSession();
  const pool = findPool(id);
  const [tab, setTab] = useState<string | number>("groups");
  const [assignments, setAssignments] = useState<PoolGroupAssignment[]>(
    () => (pool && tenant ? groupAssignmentsForPool(pool.id, tenant) : []),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [group, setGroup] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const [quota, setQuota] = useState("");

  if (!pool || !tenant || !pool.tenantAssignments.includes(tenant)) {
    return (
      <>
        <Breadcrumb style={{ marginBottom: 12 }}>
          <BreadcrumbItem><Link to="/app/admin/public-ip-pools">Public IP Pools</Link></BreadcrumbItem>
          <BreadcrumbItem isActive>{id}</BreadcrumbItem>
        </Breadcrumb>
        <PageHeader title={id} subtitle="Pool not found or not assigned to this tenant." />
      </>
    );
  }

  const tenantIps = ipsForPool(pool.id).filter((ip) => ip.tenant === tenant);
  const dot = pool.status === "ready" ? "ready" : pool.status === "failed" ? "failed" : "progressing";
  const availableGroups = (USER_GROUPS[tenant] ?? []).filter((g) => !assignments.some((a) => a.group === g));

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/admin/public-ip-pools">Public IP Pools</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{pool.name}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={pool.name}
        subtitle={`Provider pool ${pool.cidr}${pool.zone ? ` · ${pool.zone}` : ""} — assigned to your tenant.`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Status" value={<span><span className="osac-status-dot" data-s={dot} /><span style={{ textTransform: "capitalize" }}>{pool.status}</span></span> as any} />
        <Kpi label="User groups" value={assignments.length} hint="may allocate from this pool" />
        <Kpi label="Tenant allocations" value={tenantIps.length} hint={`${tenantIps.filter((ip) => ip.state === "attached").length} attached`} />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Pool detail tabs">
        <Tab eventKey="groups" title={<TabTitleText>User Group Assignments</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Button variant="secondary" icon={<PlusCircleIcon />} isDisabled={availableGroups.length === 0} onClick={() => setAddOpen(true)}>
                Add group
              </Button>
            </div>
            <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
              <Table aria-label="Group assignments">
                <Thead><Tr><Th>User group</Th><Th>Quota (max allocations)</Th><Th>Used</Th><Th screenReaderText="Actions" /></Tr></Thead>
                <Tbody>
                  {assignments.map((a) => (
                    <Tr key={a.group}>
                      <Td><Label color="blue">{a.group}</Label></Td>
                      <Td>{a.maxAllocations ?? <span style={{ color: "#5b6b7c" }}>Unlimited</span>}</Td>
                      <Td>{tenantIps.length > 0 ? Math.min(tenantIps.length, a.maxAllocations ?? tenantIps.length) : 0}</Td>
                      <Td isActionCell>
                        <ActionsColumn items={[
                          { title: "Edit quota" },
                          { isSeparator: true },
                          { title: "Remove", onClick: () => setAssignments((p) => p.filter((x) => x.group !== a.group)) },
                        ]} />
                      </Td>
                    </Tr>
                  ))}
                  {assignments.length === 0 && (
                    <Tr><Td colSpan={4} style={{ textAlign: "center", padding: 32, color: "#5b6b7c" }}>No groups assigned — users cannot allocate from this pool yet.</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>

        <Tab eventKey="allocations" title={<TabTitleText>Tenant Allocations</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
              <Table aria-label="Tenant allocations">
                <Thead><Tr><Th>Address</Th><Th>State</Th><Th>Attached to</Th><Th>Owner</Th><Th>Created</Th></Tr></Thead>
                <Tbody>
                  {tenantIps.map((ip) => (
                    <Tr key={ip.id}>
                      <Td><code>{ip.address}</code></Td>
                      <Td><span className="osac-status-dot" data-s={ipDotStatus(ip.state)} /><span style={{ textTransform: "capitalize" }}>{ip.state}</span></Td>
                      <Td>
                        {ip.workloadId ? (
                          <span>
                            <Label isCompact style={{ marginRight: 6 }}>{WORKLOAD_LABEL[ip.workloadType ?? "vm"]}</Label>
                            {ip.workloadId}{ip.nic ? ` · ${ip.nic}` : ""}
                          </span>
                        ) : "—"}
                      </Td>
                      <Td>{ip.owner}</Td>
                      <Td>{ip.createdAt}</Td>
                    </Tr>
                  ))}
                  {tenantIps.length === 0 && (
                    <Tr><Td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#5b6b7c" }}>No allocations from this pool yet.</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>

        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, maxWidth: 720 }}>
            <Card><CardTitle>Pool details</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Pool ID</DescriptionListTerm><DescriptionListDescription><code>{pool.id}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>CIDR</DescriptionListTerm><DescriptionListDescription><code>{pool.cidr}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Zone</DescriptionListTerm><DescriptionListDescription>{pool.zone ?? "—"}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Ownership</DescriptionListTerm><DescriptionListDescription>Provider-owned. Tenant admins govern which user groups may allocate.</DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>
          </div>
        </Tab>
      </Tabs>

      <Modal variant={ModalVariant.small} isOpen={addOpen} onClose={() => setAddOpen(false)} aria-label="Add group">
        <ModalHeader title="Assign pool to user group" description="Users in the group may allocate public IPs from this pool." />
        <ModalBody>
          <Form>
            <FormGroup label="User group" fieldId="ga-group" isRequired>
              <Select isOpen={groupOpen} onOpenChange={setGroupOpen}
                toggle={(ref) => (
                  <MenuToggle ref={ref} onClick={() => setGroupOpen((v) => !v)} isExpanded={groupOpen}>
                    {group || "Select a group"}
                  </MenuToggle>
                )}
                onSelect={(_, v) => { setGroup(String(v)); setGroupOpen(false); }}
              >
                <SelectList>
                  {availableGroups.map((g) => <SelectOption key={g} value={g}>{g}</SelectOption>)}
                </SelectList>
              </Select>
            </FormGroup>
            <FormGroup label="Quota — max allocations (optional)" fieldId="ga-quota">
              <TextInput id="ga-quota" type="number" value={quota} onChange={(_, v) => setQuota(v)} placeholder="Unlimited" />
            </FormGroup>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="primary" isDisabled={!group} onClick={() => {
                setAssignments((p) => [...p, {
                  poolId: pool.id, tenant, group,
                  maxAllocations: quota ? Number(quota) : undefined,
                }]);
                setGroup(""); setQuota(""); setAddOpen(false);
              }}>Assign</Button>
              <Button variant="link" onClick={() => setAddOpen(false)}>Cancel</Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </>
  );
}
