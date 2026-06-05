import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Breadcrumb, BreadcrumbItem, Tabs, Tab, TabTitleText, Button, Label,
  Card, CardTitle, CardBody, DescriptionList, DescriptionListGroup,
  DescriptionListTerm, DescriptionListDescription, ClipboardCopy, ClipboardCopyVariant,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { OFFERINGS } from "./app.admin.cluster-offerings";

export const Route = createFileRoute("/app/admin/cluster-offerings/$id")({ component: OfferingDetail });

const TENANT_USAGE: Record<string, { tenant: string; clusters: number; created: string }[]> = {
  default: [
    { tenant: "payments-prod", clusters: 2, created: "2026-03-12" },
    { tenant: "edge-api", clusters: 1, created: "2026-04-01" },
    { tenant: "analytics", clusters: 1, created: "2026-05-20" },
  ],
};

function OfferingDetail() {
  const { id } = Route.useParams();
  const offering = OFFERINGS.find((o) => o.id === id) ?? { id, name: id, desc: "—", risk: "stable", minNodes: 3, gpu: false, ocp: "4.17.3" };
  const [tab, setTab] = useState<string | number>("overview");
  const usage = TENANT_USAGE.default;

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Maturity" value={<Label color={offering.risk === "preview" ? "orange" : "green"} isCompact>{offering.risk}</Label> as any} />
        <Kpi label="OCP version" value={offering.ocp} />
        <Kpi label="Min worker nodes" value={offering.minNodes} />
        <Kpi label="GPU" value={offering.gpu ? "Enabled" : "Disabled"} hint="NVIDIA operator" />
        <Kpi label="Active clusters" value={usage.reduce((s, u) => s + u.clusters, 0)} hint="across tenants" />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Offering tabs">
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Card><CardTitle>Specification</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Identifier</DescriptionListTerm><DescriptionListDescription><code>{offering.id}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>OCP version</DescriptionListTerm><DescriptionListDescription>{offering.ocp}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Maturity</DescriptionListTerm><DescriptionListDescription>{offering.risk}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Min worker nodes</DescriptionListTerm><DescriptionListDescription>{offering.minNodes}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>GPU support</DescriptionListTerm><DescriptionListDescription>{offering.gpu ? "NVIDIA operator + GPU node pool" : "—"}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>CSI drivers</DescriptionListTerm><DescriptionListDescription>vast-csi, openshift-cns</DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>
            <Card><CardTitle>Lifecycle</CardTitle><CardBody>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13 }}>
                <li style={{ padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>Published — 2026-02-04</li>
                <li style={{ padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>Last revision — 2026-05-22</li>
                <li style={{ padding: "8px 0" }}>Support end — 2027-02-04</li>
              </ul>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="usage" title={<TabTitleText>Usage</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel" >
            <Table>
              <Thead><Tr><Th>Tenant project</Th><Th>Clusters</Th><Th>First provisioned</Th></Tr></Thead>
              <Tbody>
                {usage.map((u) => (
                  <Tr key={u.tenant}><Td><strong>{u.tenant}</strong></Td><Td>{u.clusters}</Td><Td>{u.created}</Td></Tr>
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
  maturity: ${offering.risk}
  minWorkerNodes: ${offering.minNodes}
  gpu: ${offering.gpu}
  csi:
    - vast-csi
    - openshift-cns`}
            </ClipboardCopy>
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
