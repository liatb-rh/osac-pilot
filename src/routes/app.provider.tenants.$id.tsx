import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Breadcrumb, BreadcrumbItem, Tabs, Tab, TabTitleText, Button, Label,
  Card, CardTitle, CardBody, DescriptionList, DescriptionListGroup,
  DescriptionListTerm, DescriptionListDescription, Alert, Progress, ProgressSize,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { CLUSTERS, COMPUTE_INSTANCES } from "@/lib/osac-api";
import { STORAGE_TIERS } from "@/lib/storage-tiers-data";
import { AGENTS } from "@/lib/agents-data";

export const Route = createFileRoute("/app/provider/tenants/$id")({ component: TenantDetail });

// Catalog of known tenants — mirrors lists used elsewhere (organizations / RBAC).
const DIRECTORY: Record<string, {
  name: string; realm: string;
  idp: "LDAP" | "SAML" | "OIDC" | "AD";
  idpHost: string; idpStatus: "running" | "progressing" | "failed";
  status: "active" | "onboarding"; breakGlass: number; createdAt: string;
  quota: { cores: number; memGib: number; vmMax: number; clusterMax: number };
}> = {
  northstar:  { name: "Northstar Bank",            realm: "northstar.osac",  idp: "LDAP", idpHost: "ldap.northstar.internal", idpStatus: "running",     status: "active",     breakGlass: 2, createdAt: "2025-11-04", quota: { cores: 512, memGib: 2048, vmMax: 200, clusterMax: 6 } },
  evergreen:  { name: "Bluestone Financial Group", realm: "bluestone.osac",  idp: "SAML", idpHost: "sso.bluestone.fi",        idpStatus: "running",     status: "active",     breakGlass: 2, createdAt: "2025-12-19", quota: { cores: 384, memGib: 1536, vmMax: 160, clusterMax: 5 } },
  aurora:     { name: "Aurora Health",             realm: "aurora.osac",     idp: "OIDC", idpHost: "auth.aurora.health",      idpStatus: "progressing", status: "active",     breakGlass: 1, createdAt: "2026-01-22", quota: { cores: 256, memGib: 1024, vmMax: 100, clusterMax: 3 } },
  helix:      { name: "Helix Logistics",           realm: "helix.osac",      idp: "AD",   idpHost: "dc01.helix.local",        idpStatus: "failed",      status: "onboarding", breakGlass: 2, createdAt: "2026-03-08", quota: { cores: 128, memGib: 512,  vmMax: 60,  clusterMax: 2 } },
  crestline:  { name: "Crestline Insurance",       realm: "crestline.osac",  idp: "OIDC", idpHost: "auth.crestline.example",  idpStatus: "progressing", status: "onboarding", breakGlass: 2, createdAt: "2026-05-30", quota: { cores: 64,  memGib: 256,  vmMax: 50,  clusterMax: 3 } },
};

function TenantDetail() {
  const { id } = Route.useParams();
  const dir = DIRECTORY[id] ?? {
    name: id, realm: `${id}.osac`, idp: "OIDC" as const, idpHost: "—",
    idpStatus: "progressing" as const, status: "onboarding" as const, breakGlass: 0,
    createdAt: "—", quota: { cores: 0, memGib: 0, vmMax: 0, clusterMax: 0 },
  };
  const [tab, setTab] = useState<string | number>("overview");

  // Derive cross-resource state from the existing data model.
  const clusters = CLUSTERS.filter((c) => c.metadata.tenant === id);
  const vms = COMPUTE_INSTANCES.filter((v) => v.metadata.tenant === id);
  const tierConsumers = STORAGE_TIERS
    .map((t) => ({ tier: t, c: t.consumers.find((x) => x.tenant === id) }))
    .filter((x) => x.c);
  const agents = AGENTS.filter((a) => a.cluster && clusters.some((c) => c.metadata.name === a.cluster));

  const usedCores = vms.reduce((a, v) => a + v.spec.cores, 0);
  const usedMem = vms.reduce((a, v) => a + v.spec.memory_gib, 0);
  const usedStorage = tierConsumers.reduce((a, x) => a + (x.c?.used_tib ?? 0), 0);

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/provider/tenants">Tenant organizations</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{dir.name}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={dir.name}
        subtitle={<>Tenant <code>{id}</code> · realm <code>{dir.realm}</code></>}
        actions={
          <>
            <Button variant="secondary">Audit log</Button>
            <Button variant="secondary">Edit quota</Button>
            <Button variant="danger">Suspend</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Status" value={dir.status} tone={dir.status === "active" ? "success" : "warning"} />
        <Kpi label="IdP" value={dir.idp} hint={dir.idpHost} tone={dir.idpStatus === "running" ? "success" : dir.idpStatus === "failed" ? "danger" : "warning"} />
        <Kpi label="Clusters" value={clusters.length} hint={`limit ${dir.quota.clusterMax}`} />
        <Kpi label="VMs" value={vms.length} hint={`limit ${dir.quota.vmMax}`} />
        <Kpi label="vCPU used" value={`${usedCores} / ${dir.quota.cores}`} />
        <Kpi label="Memory used" value={`${usedMem} / ${dir.quota.memGib} GiB`} />
        <Kpi label="Storage" value={`${usedStorage.toFixed(1)} TiB`} hint={`${tierConsumers.length} tiers`} />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Tenant tabs">
        {/* ---------- Overview ---------- */}
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Card>
              <CardTitle>Identity & federation</CardTitle>
              <CardBody>
                <DescriptionList isHorizontal>
                  <DescriptionListGroup><DescriptionListTerm>Tenant ID</DescriptionListTerm><DescriptionListDescription><code>{id}</code></DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>Keycloak realm</DescriptionListTerm><DescriptionListDescription><code>{dir.realm}</code></DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>Issuer</DescriptionListTerm><DescriptionListDescription><code style={{ fontSize: 12 }}>https://auth.osac.internal/realms/{dir.realm}</code></DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>IdP protocol</DescriptionListTerm><DescriptionListDescription><Label isCompact color="blue">{dir.idp}</Label></DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>IdP host</DescriptionListTerm><DescriptionListDescription><code>{dir.idpHost}</code></DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>Break-glass</DescriptionListTerm><DescriptionListDescription>{dir.breakGlass} account(s)</DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>Onboarded</DescriptionListTerm><DescriptionListDescription>{dir.createdAt}</DescriptionListDescription></DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
            <Card>
              <CardTitle>Governance</CardTitle>
              <CardBody>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13 }}>
                  <li style={{ padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>Authorino AuthPolicy: <Label isCompact color="green">enforced</Label></li>
                  <li style={{ padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>Network isolation: <code>strict</code> (dedicated VRF)</li>
                  <li style={{ padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>Audit export: <Label isCompact color="green">to SIEM</Label></li>
                  <li style={{ padding: "8px 0" }}>RBAC source: osac-rbac v1</li>
                </ul>
                {dir.idpStatus !== "running" && (
                  <Alert variant={dir.idpStatus === "failed" ? "danger" : "warning"} isInline isPlain
                    title={`IdP probe ${dir.idpStatus}`} style={{ marginTop: 12 }} />
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* ---------- Quota ---------- */}
        <Tab eventKey="quota" title={<TabTitleText>Quota</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gap: 12 }} className="osac-panel">
            <QuotaBar label="vCPU cores" used={usedCores} max={dir.quota.cores} unit="" />
            <QuotaBar label="Memory" used={usedMem} max={dir.quota.memGib} unit=" GiB" />
            <QuotaBar label="VM instances" used={vms.length} max={dir.quota.vmMax} unit="" />
            <QuotaBar label="CaaS clusters" used={clusters.length} max={dir.quota.clusterMax} unit="" />
            <QuotaBar label="Storage (allocated)" used={usedStorage} max={Math.max(usedStorage, 100)} unit=" TiB" />
          </div>
        </Tab>

        {/* ---------- Clusters ---------- */}
        <Tab eventKey="clusters" title={<TabTitleText>Clusters ({clusters.length})</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            {clusters.length === 0 ? <Empty msg="No CaaS clusters for this tenant yet." /> : (
              <Table>
                <Thead><Tr><Th>Cluster</Th><Th>Release</Th><Th>Workers</Th><Th>State</Th><Th /></Tr></Thead>
                <Tbody>
                  {clusters.map((c) => {
                    const release = (c.spec.release_image ?? "").split(":").pop()?.replace("-multi", "") ?? "—";
                    const nodes = Object.values(c.spec.node_sets).reduce((a, n) => a + n.size, 0);
                    const state = c.status.state.replace("CLUSTER_STATE_", "").toLowerCase();
                    return (
                      <Tr key={c.id}>
                        <Td>
                          <Link to="/app/clusters/$name" params={{ name: c.metadata.name }} style={{ color: "#0066cc", fontWeight: 600 }}>
                            {c.metadata.name}
                          </Link>
                        </Td>
                        <Td>{release}</Td>
                        <Td>{nodes}</Td>
                        <Td>
                          <span className="osac-status-dot" data-s={state === "ready" ? "ready" : state === "failed" ? "failed" : "progressing"} />
                          <span style={{ textTransform: "capitalize" }}>{state}</span>
                        </Td>
                        <Td><Link to="/app/clusters/$name" params={{ name: c.metadata.name }}><Button variant="link" isInline>Open</Button></Link></Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </div>
        </Tab>

        {/* ---------- VMs ---------- */}
        <Tab eventKey="vms" title={<TabTitleText>Virtual machines ({vms.length})</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            {vms.length === 0 ? <Empty msg="This tenant has no VM workloads." /> : (
              <Table>
                <Thead><Tr><Th>Name</Th><Th>Cores</Th><Th>Memory</Th><Th>Boot disk</Th><Th>State</Th><Th>Internal IP</Th></Tr></Thead>
                <Tbody>
                  {vms.map((v) => {
                    const state = v.status.state.replace("COMPUTE_INSTANCE_STATE_", "").toLowerCase();
                    return (
                      <Tr key={v.id}>
                        <Td>
                          <Link to="/app/vms/$name" params={{ name: v.metadata.name }} style={{ color: "#0066cc", fontWeight: 600 }}>
                            {v.metadata.name}
                          </Link>
                        </Td>
                        <Td>{v.spec.cores}</Td>
                        <Td>{v.spec.memory_gib} GiB</Td>
                        <Td>{v.spec.boot_disk.size_gib} GiB</Td>
                        <Td>
                          <span className="osac-status-dot" data-s={state === "running" ? "ready" : state === "failed" ? "failed" : "progressing"} />
                          <span style={{ textTransform: "capitalize" }}>{state}</span>
                        </Td>
                        <Td>{v.status.internal_ip_address || <span style={{ color: "#5b6b7c" }}>—</span>}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </div>
        </Tab>

        {/* ---------- Storage ---------- */}
        <Tab eventKey="storage" title={<TabTitleText>Storage ({tierConsumers.length})</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            {tierConsumers.length === 0 ? <Empty msg="No storage tiers consumed by this tenant." /> : (
              <Table>
                <Thead><Tr><Th>Tier</Th><Th>Media</Th><Th>Clusters</Th><Th>PVCs</Th><Th>Used</Th><Th>Protocol</Th></Tr></Thead>
                <Tbody>
                  {tierConsumers.map(({ tier, c }) => (
                    <Tr key={tier.id}>
                      <Td>
                        <Link to="/app/provider/storage-tiers/$id" params={{ id: tier.id }} style={{ color: "#0066cc", fontWeight: 600 }}>
                          {tier.name}
                        </Link>
                      </Td>
                      <Td>{tier.media}</Td>
                      <Td>{c!.clusters.join(", ")}</Td>
                      <Td>{c!.pvcs}</Td>
                      <Td>{c!.used_tib} TiB</Td>
                      <Td><Label isCompact color="blue">{tier.protocol}</Label></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </div>
        </Tab>

        {/* ---------- Agents ---------- */}
        <Tab eventKey="agents" title={<TabTitleText>Infrastructure agents ({agents.length})</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            {agents.length === 0 ? <Empty msg="No physical hosts attached to this tenant's clusters." /> : (
              <Table>
                <Thead><Tr><Th>Hostname</Th><Th>AZ / Rack</Th><Th>Host type</Th><Th>Cluster</Th><Th>Status</Th></Tr></Thead>
                <Tbody>
                  {agents.map((a) => (
                    <Tr key={a.hostname}>
                      <Td>
                        <Link to="/app/provider/agents/$host" params={{ host: a.hostname }} style={{ color: "#0066cc", fontWeight: 600 }}>
                          {a.hostname}
                        </Link>
                      </Td>
                      <Td>{a.az} · {a.rack}</Td>
                      <Td><code>{a.host_type}</code></Td>
                      <Td>{a.cluster}</Td>
                      <Td>
                        <span className="osac-status-dot" data-s={a.status === "healthy" ? "ready" : a.status === "unreachable" ? "failed" : "progressing"} />
                        <span style={{ textTransform: "capitalize" }}>{a.status}</span>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </div>
        </Tab>

        {/* ---------- Audit ---------- */}
        <Tab eventKey="audit" title={<TabTitleText>Audit log</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Timestamp</Th><Th>Actor</Th><Th>Action</Th><Th>Resource</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>2026-06-05 10:42</Td><Td>platform@osac</Td><Td>quota.update</Td><Td>cores 256 → {dir.quota.cores}</Td></Tr>
                <Tr><Td>2026-06-04 18:11</Td><Td>ops@{id}</Td><Td>cluster.create</Td><Td>{clusters[0]?.metadata.name ?? "—"}</Td></Tr>
                <Tr><Td>2026-06-02 09:03</Td><Td>jane.holloway@{id}</Td><Td>rbac.assign</Td><Td>/{id}/platform-admins → tenantAdmin</Td></Tr>
                <Tr><Td>{dir.createdAt} 09:00</Td><Td>platform@osac</Td><Td>tenant.onboard</Td><Td>realm <code>{dir.realm}</code></Td></Tr>
              </Tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>
    </>
  );
}

function QuotaBar({ label, used, max, unit }: { label: string; used: number; max: number; unit: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <strong>{label}</strong>
        <span style={{ color: "#5b6b7c" }}>{used}{unit} / {max}{unit}</span>
      </div>
      <Progress value={pct} size={ProgressSize.sm} aria-label={label}
        variant={pct >= 90 ? "danger" : pct >= 75 ? "warning" : undefined} />
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ padding: 24, textAlign: "center", color: "#5b6b7c" }}>{msg}</div>;
}
