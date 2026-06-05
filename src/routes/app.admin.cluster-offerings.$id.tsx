import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Breadcrumb, BreadcrumbItem, Tabs, Tab, TabTitleText, Button, Label,
  Card, CardTitle, CardBody, DescriptionList, DescriptionListGroup,
  DescriptionListTerm, DescriptionListDescription, ClipboardCopy, ClipboardCopyVariant,
  Alert,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { OFFERINGS } from "./app.admin.cluster-offerings";
import { CLUSTERS } from "@/lib/osac-api";
import { STORAGE_TIERS } from "@/lib/storage-tiers-data";
import { AGENTS } from "@/lib/agents-data";

export const Route = createFileRoute("/app/admin/cluster-offerings/$id")({ component: OfferingDetail });

function offeringMinor(ocp: string) {
  return ocp.split(".").slice(0, 2).join("."); // "4.17.3" → "4.17"
}

function OfferingDetail() {
  const { id } = Route.useParams();
  const offering = OFFERINGS.find((o) => o.id === id) ?? { id, name: id, desc: "—", risk: "stable" as const, minNodes: 3, gpu: false, ocp: "4.17.3" };
  const [tab, setTab] = useState<string | number>("overview");

  // Derive consuming clusters from osac-api fixtures whose release_image matches this offering's OCP minor.
  const minor = offeringMinor(offering.ocp);
  const matchingClusters = CLUSTERS.filter((c) => (c.spec.release_image ?? "").includes(`:${minor}`));

  // Compatible storage tiers (all enabled tiers — narrowed by GPU requirement to tiers with NVMe media for offerings that require GPUs).
  const compatibleTiers = STORAGE_TIERS.filter((t) => t.enabled && (offering.gpu ? /NVMe/i.test(t.media) : true));

  // Eligible agents — match host_type expectations (GPU offerings need GPU hosts).
  const eligibleAgents = AGENTS.filter((a) => offering.gpu ? /gpu/i.test(a.host_type) : !/gpu/i.test(a.host_type));
  const healthyAgents = eligibleAgents.filter((a) => a.status === "healthy");

  const totalNodes = matchingClusters.reduce(
    (a, c) => a + Object.values(c.spec.node_sets).reduce((s, n) => s + n.size, 0), 0,
  );

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/admin/cluster-offerings">Cluster offerings</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{offering.name}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={offering.name}
        subtitle={offering.desc}
        actions={
          <>
            <Button variant="secondary">Disable</Button>
            <Button variant="primary">Edit offering</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Maturity" value={offering.risk} tone={offering.risk === "preview" ? "warning" : "success"} />
        <Kpi label="OCP version" value={offering.ocp} hint={`channel ${minor}`} />
        <Kpi label="Min worker nodes" value={offering.minNodes} />
        <Kpi label="GPU" value={offering.gpu ? "Enabled" : "Disabled"} hint={offering.gpu ? "NVIDIA operator" : undefined} />
        <Kpi label="Active clusters" value={matchingClusters.length} hint={`${totalNodes} workers in flight`} />
        <Kpi label="Eligible agents" value={`${healthyAgents.length} / ${eligibleAgents.length}`} tone={healthyAgents.length === eligibleAgents.length ? "success" : "warning"} hint="healthy hosts" />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Offering tabs">
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Card><CardTitle>Specification</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Identifier</DescriptionListTerm><DescriptionListDescription><code>{offering.id}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>OCP version</DescriptionListTerm><DescriptionListDescription>{offering.ocp}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Release image</DescriptionListTerm><DescriptionListDescription><code style={{ fontSize: 12 }}>quay.io/openshift-release-dev/ocp-release:{offering.ocp}-multi</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Maturity</DescriptionListTerm><DescriptionListDescription><Label isCompact color={offering.risk === "preview" ? "orange" : "green"}>{offering.risk}</Label></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Min worker nodes</DescriptionListTerm><DescriptionListDescription>{offering.minNodes}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>GPU support</DescriptionListTerm><DescriptionListDescription>{offering.gpu ? "NVIDIA operator + GPU node pool" : "—"}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Default CSI</DescriptionListTerm><DescriptionListDescription>{compatibleTiers.map(t => t.csi_driver).filter((v, i, a) => a.indexOf(v) === i).join(", ") || "—"}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Pod CIDR</DescriptionListTerm><DescriptionListDescription><code>10.128.0.0/14</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Service CIDR</DescriptionListTerm><DescriptionListDescription><code>172.30.0.0/16</code></DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>
            <Card><CardTitle>Lifecycle</CardTitle><CardBody>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13 }}>
                <li style={{ padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>Published — 2026-02-04</li>
                <li style={{ padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>Last revision — 2026-05-22</li>
                <li style={{ padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>Support end — 2027-02-04</li>
                <li style={{ padding: "8px 0" }}>Next planned z-stream — 2026-06-18</li>
              </ul>
              {offering.risk === "preview" && (
                <Alert variant="warning" isInline isPlain title="Preview offering — no production SLA" style={{ marginTop: 12 }} />
              )}
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="clusters" title={<TabTitleText>Consuming clusters ({matchingClusters.length})</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            {matchingClusters.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#5b6b7c" }}>
                No clusters currently use this offering.
              </div>
            ) : (
              <Table>
                <Thead><Tr><Th>Cluster</Th><Th>Tenant</Th><Th>Release</Th><Th>Workers</Th><Th>State</Th><Th /></Tr></Thead>
                <Tbody>
                  {matchingClusters.map((c) => {
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
                        <Td><code>{c.metadata.tenant}</code></Td>
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

        <Tab eventKey="storage" title={<TabTitleText>Storage tiers ({compatibleTiers.length})</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Tier</Th><Th>Media</Th><Th>IOPS</Th><Th>Latency</Th><Th>CSI driver</Th><Th>Protocol</Th></Tr></Thead>
              <Tbody>
                {compatibleTiers.map((t) => (
                  <Tr key={t.id}>
                    <Td>
                      <Link to="/app/provider/storage-tiers/$id" params={{ id: t.id }} style={{ color: "#0066cc", fontWeight: 600 }}>
                        {t.name}
                      </Link>
                      {t.is_default && <> <Label isCompact color="blue">default</Label></>}
                    </Td>
                    <Td>{t.media}</Td>
                    <Td>{t.iops}</Td>
                    <Td>{t.latency_ms} ms</Td>
                    <Td><code style={{ fontSize: 12 }}>{t.csi_driver}</code></Td>
                    <Td><Label isCompact color="blue">{t.protocol}</Label></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="agents" title={<TabTitleText>Eligible agents ({eligibleAgents.length})</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Hostname</Th><Th>AZ / Rack</Th><Th>Host type</Th><Th>Cores</Th><Th>Memory</Th><Th>Status</Th><Th>Joined cluster</Th></Tr></Thead>
              <Tbody>
                {eligibleAgents.map((a) => (
                  <Tr key={a.hostname}>
                    <Td>
                      <Link to="/app/provider/agents/$host" params={{ host: a.hostname }} style={{ color: "#0066cc", fontWeight: 600 }}>
                        {a.hostname}
                      </Link>
                    </Td>
                    <Td>{a.az} · {a.rack}</Td>
                    <Td><code>{a.host_type}</code></Td>
                    <Td>{a.cores}</Td>
                    <Td>{a.memory_gib} GiB</Td>
                    <Td>
                      <span className="osac-status-dot" data-s={a.status === "healthy" ? "ready" : a.status === "unreachable" ? "failed" : "progressing"} />
                      <span style={{ textTransform: "capitalize" }}>{a.status}</span>
                    </Td>
                    <Td>{a.cluster ?? <span style={{ color: "#5b6b7c" }}>—</span>}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="manifest" title={<TabTitleText>Manifest</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <ClipboardCopy isCode hoverTip="Copy" clickTip="Copied" variant={ClipboardCopyVariant.expansion}>
{`apiVersion: osac.io/v1
kind: ClusterOffering
metadata:
  name: ${offering.id}
spec:
  ocpVersion: "${offering.ocp}"
  releaseImage: quay.io/openshift-release-dev/ocp-release:${offering.ocp}-multi
  maturity: ${offering.risk}
  minWorkerNodes: ${offering.minNodes}
  gpu: ${offering.gpu}
  network:
    podCidr: 10.128.0.0/14
    serviceCidr: 172.30.0.0/16
  csi:
${compatibleTiers.map(t => `    - name: ${t.csi_driver}\n      tier: ${t.id}`).join("\n") || "    - name: openshift-cns"}
  hostTypes:
${Array.from(new Set(eligibleAgents.map(a => a.host_type))).map(h => `    - ${h}`).join("\n") || "    - acme_512g"}`}
            </ClipboardCopy>
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
