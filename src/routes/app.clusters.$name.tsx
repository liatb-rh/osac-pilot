import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import {
  Button, Tabs, Tab, TabTitleText, Breadcrumb, BreadcrumbItem,
  Label, LabelGroup, Card, CardBody, CardTitle, Divider,
  DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription,
  ClipboardCopy, Modal, ModalVariant, ModalHeader, ModalBody, ModalFooter,
  Alert,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import {
  DownloadIcon, ArrowCircleUpIcon, TrashIcon, PlusCircleIcon,
  CheckCircleIcon, InProgressIcon, OutlinedCircleIcon,
} from "@patternfly/react-icons";

import { findCluster, clusterSimpleStatus } from "@/lib/osac-api";

export const Route = createFileRoute("/app/clusters/$name")({ component: ClusterDetail });

interface ClusterInfo {
  name: string; version: string; nodes: number; status: "ready" | "progressing" | "upgrading" | "failed";
  region: string; network: string; created: string; storageReady: boolean;
}

const TIER_DESCRIPTION: Record<string, string> = {
  fast: "Low-latency NVMe pool for transactional and OLTP workloads.",
  standard: "Balanced SSD pool for general-purpose application data.",
  archive: "Cost-optimized HDD pool for long-retention datasets and backups.",
};

function ClusterDetail() {
  const { name } = Route.useParams();
  const cl = findCluster(name);
  const s = cl ? clusterSimpleStatus(cl.status.state) : "ready";
  const progressing = cl?.status.conditions.find((x) => x.type === "CLUSTER_CONDITION_TYPE_PROGRESSING" && x.status === "CONDITION_STATUS_TRUE");
  const ui: ClusterInfo["status"] = progressing ? "upgrading" : s === "ready" ? "ready" : s === "failed" ? "failed" : "progressing";
  const c: ClusterInfo = cl ? {
    name: cl.metadata.name,
    version: (cl.spec.release_image ?? "").split(":").pop()?.replace("-multi", "") ?? "4.17.3",
    nodes: Object.values(cl.spec.node_sets).reduce((a, ns) => a + ns.size, 0),
    status: ui,
    region: "eu-central-1",
    network: cl.metadata.labels["env"] ? `vn-${cl.metadata.labels["env"]}` : "vn-default",
    created: cl.metadata.creation_timestamp?.slice(0, 10) ?? "—",
    storageReady: ui === "ready" || ui === "upgrading",
  } : {
    name, version: "4.17.3", nodes: 3, status: "ready",
    region: "eu-central-1", network: "vn-default", created: "—", storageReady: true,
  };
  const [tab, setTab] = useState<string | number>("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/clusters">Clusters</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{c.name}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={c.name}
        subtitle={`OpenShift ${c.version} · ${c.region} · ${c.nodes} workers`}
        actions={
          <>
            <Button variant="secondary" icon={<DownloadIcon />}>kubeconfig</Button>
            <Button variant="secondary" icon={<ArrowCircleUpIcon />}>Upgrade</Button>
            <Button variant="danger" icon={<TrashIcon />} onClick={() => setDeleteOpen(true)}>Delete</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Cluster state" value={<span><StatusDot status={c.status as any} /></span> as any} />
        <Kpi label="Storage" value={c.storageReady ? "Ready" : "Provisioning"} tone={c.storageReady ? "success" : "warning"} hint="VAST CSI" />
        <Kpi label="OCP version" value={c.version} hint="control plane" />
        <Kpi label="Workers" value={c.nodes} hint="across 3 AZ" />
        <Kpi label="Virtual network" value={c.network} hint={c.region} />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Cluster detail tabs">
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Card><CardTitle>Cluster configuration</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>API server</DescriptionListTerm><DescriptionListDescription><code>https://api.{c.name}.osac.internal:6443</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Console</DescriptionListTerm><DescriptionListDescription><code>https://console.{c.name}.osac.internal</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Created</DescriptionListTerm><DescriptionListDescription>{c.created}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Pod CIDR</DescriptionListTerm><DescriptionListDescription><code>10.128.0.0/14</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Service CIDR</DescriptionListTerm><DescriptionListDescription><code>172.30.0.0/16</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Labels</DescriptionListTerm><DescriptionListDescription>
                  <LabelGroup><Label color="blue">env=prod</Label><Label color="purple">workload=core-banking</Label></LabelGroup>
                </DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>
            <Card><CardTitle>Health</CardTitle><CardBody>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
                {[
                  { l: "etcd quorum", k: "ok" },
                  { l: "API server availability", k: "ok" },
                  { l: "Ingress controllers", k: "ok" },
                  { l: "Cluster operators", k: c.status === "upgrading" ? "warn" : "ok" },
                ].map((x) => (
                  <li key={x.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>
                    <span>{x.l}</span>
                    <Label color={x.k === "ok" ? "green" : "orange"} isCompact>{x.k === "ok" ? "healthy" : "in progress"}</Label>
                  </li>
                ))}
              </ul>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="nodes" title={<TabTitleText>Nodes</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Name</Th><Th>Role</Th><Th>AZ</Th><Th>Status</Th><Th>vCPU</Th><Th>Memory</Th><Th>OCP</Th></Tr></Thead>
              <Tbody>
                {Array.from({ length: c.nodes }, (_, i) => (
                  <Tr key={i}>
                    <Td><code>{c.name}-w-{String(i + 1).padStart(2, "0")}</code></Td>
                    <Td>worker</Td>
                    <Td>az{(i % 3) + 1}</Td>
                    <Td><StatusDot status="ready" /></Td>
                    <Td>16</Td>
                    <Td>64 GiB</Td>
                    <Td>{c.version}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="storage" title={<TabTitleText>Storage</TabTitleText>}>
          <StorageTab cluster={c} />
        </Tab>

        <Tab eventKey="network" title={<TabTitleText>Network</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gap: 16 }}>
            <Card><CardTitle>Virtual network</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>VNet</DescriptionListTerm><DescriptionListDescription><code>{c.network}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Node subnet</DescriptionListTerm><DescriptionListDescription><code>sn-nodes (10.10.0.0/22)</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Ingress subnet</DescriptionListTerm><DescriptionListDescription><code>sn-ingress (10.10.8.0/24)</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>CNI</DescriptionListTerm><DescriptionListDescription>OVN-Kubernetes</DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>
            <Card><CardTitle>Load balancers</CardTitle><CardBody>
              <Table>
                <Thead><Tr><Th>Name</Th><Th>Type</Th><Th>VIP</Th><Th>Backends</Th></Tr></Thead>
                <Tbody>
                  <Tr><Td><code>api-{c.name}</code></Td><Td>internal</Td><Td><code>10.10.0.10</code></Td><Td>3 control plane nodes</Td></Tr>
                  <Tr><Td><code>ingress-{c.name}</code></Td><Td>internal</Td><Td><code>10.10.8.20</code></Td><Td>{c.nodes} workers</Td></Tr>
                </Tbody>
              </Table>
            </CardBody></Card>
            <Card><CardTitle>Egress policies</CardTitle><CardBody>
              <LabelGroup>
                <Label color="green">allow: vast.{c.network}.internal</Label>
                <Label color="green">allow: registry.osac.internal</Label>
                <Label color="orange">deny: 0.0.0.0/0</Label>
              </LabelGroup>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="addons" title={<TabTitleText>Add-ons</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Add-on</Th><Th>Version</Th><Th>Status</Th><Th /></Tr></Thead>
              <Tbody>
                {[
                  { n: "VAST CSI driver", v: "2.4.1", s: "installed" },
                  { n: "Cert-manager", v: "1.15.0", s: "installed" },
                  { n: "OpenShift Logging", v: "5.9.2", s: "installed" },
                  { n: "OpenShift Monitoring", v: "4.17", s: "installed" },
                  { n: "Service Mesh", v: "—", s: "available" },
                ].map((a) => (
                  <Tr key={a.n}>
                    <Td><strong>{a.n}</strong></Td>
                    <Td>{a.v}</Td>
                    <Td><Label color={a.s === "installed" ? "green" : "grey"} isCompact>{a.s}</Label></Td>
                    <Td isActionCell>
                      <Button variant="link" isInline>{a.s === "installed" ? "Configure" : "Install"}</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="activity" title={<TabTitleText>Activity</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>When</Th><Th>Actor</Th><Th>Event</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>2026-06-05 09:00</Td><Td>system</Td><Td>Upgrade to {c.version} started</Td></Tr>
                <Tr><Td>2026-06-04 22:30</Td><Td>system</Td><Td>StorageClass <code>vast-fast</code> reconciled</Td></Tr>
                <Tr><Td>2026-06-04 12:11</Td><Td>m.alvarez@northstar</Td><Td>Scaled workers 6 → 9</Td></Tr>
              </Tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>

      <Modal variant={ModalVariant.small} isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <ModalHeader title={`Delete cluster ${c.name}?`} titleIconVariant="warning" />
        <ModalBody>
          <p>This action destroys the OpenShift control plane and worker nodes. It cannot be undone.</p>
          <Alert variant="info" isInline isPlain title="Backend resources are retained" style={{ marginTop: 12 }}>
            Storage classes and CSI secrets will be removed from this cluster. VAST tenant resources,
            views, quotas, and per-tenant secrets are <strong>retained</strong> and remain shared with
            other clusters in this tenant.
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button variant="danger" onClick={() => setDeleteOpen(false)}>Delete cluster</Button>
          <Button variant="link" onClick={() => setDeleteOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

/* ---------------- Storage tab ---------------- */

function StorageTab({ cluster }: { cluster: ClusterInfo }) {
  const computeReady = cluster.status === "ready" || cluster.status === "upgrading";
  const steps = [
    { id: 1, label: "Cluster provisioned", done: true },
    { id: 2, label: "CSI driver installed", done: computeReady },
    { id: 3, label: "StorageClasses created", done: computeReady && cluster.storageReady },
    { id: 4, label: "Ready for PVCs", done: computeReady && cluster.storageReady },
  ];
  const currentIdx = steps.findIndex((s) => !s.done);
  const tiers = [
    { id: "fast", name: "vast-fast", tier: "fast", iops: "100k", media: "NVMe SSD" },
    { id: "standard", name: "vast-standard", tier: "standard", iops: "30k", media: "SATA SSD" },
    { id: "archive", name: "vast-archive", tier: "archive", iops: "5k", media: "HDD (SMR)" },
  ];

  return (
    <div style={{ paddingTop: 16, display: "grid", gap: 16 }}>
      {/* Progress stepper */}
      <Card>
        <CardTitle>Storage readiness</CardTitle>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 0, alignItems: "center" }}>
            {steps.map((s, i) => {
              const inProgress = i === currentIdx;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", paddingRight: 8 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 50,
                    display: "grid", placeItems: "center", flexShrink: 0,
                    background: s.done ? "#3e8635" : inProgress ? "#e7f1fb" : "#eef3f8",
                    color: s.done ? "white" : inProgress ? "#0066cc" : "#8693a3",
                    border: inProgress ? "2px solid #0066cc" : "none",
                  }}>
                    {s.done ? <CheckCircleIcon /> : inProgress ? <InProgressIcon /> : <OutlinedCircleIcon />}
                  </span>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{s.label}</div>
                    <div style={{ color: "#5b6b7c", fontSize: 11 }}>
                      {s.done ? "Complete" : inProgress ? "In progress" : "Pending"}
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <span style={{
                      position: "absolute", right: 0, top: 14, height: 2, width: "calc(100% - 36px - 140px)",
                      background: s.done ? "#3e8635" : "#e3e8ee",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* CSI driver card */}
      <Card>
        <CardTitle>CSI driver</CardTitle>
        <CardBody>
          <DescriptionList isHorizontal>
            <DescriptionListGroup><DescriptionListTerm>Driver</DescriptionListTerm><DescriptionListDescription><code>csi.vastdata.com</code></DescriptionListDescription></DescriptionListGroup>
            <DescriptionListGroup><DescriptionListTerm>Provider</DescriptionListTerm><DescriptionListDescription>VAST Data</DescriptionListDescription></DescriptionListGroup>
            <DescriptionListGroup><DescriptionListTerm>Storage type</DescriptionListTerm><DescriptionListDescription>Universal Storage (file + block + object)</DescriptionListDescription></DescriptionListGroup>
            <DescriptionListGroup><DescriptionListTerm>Driver version</DescriptionListTerm><DescriptionListDescription>2.4.1</DescriptionListDescription></DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>

      {/* StorageClass cards */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".08em", color: "#5b6b7c" }}>
          Available StorageClasses
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
          {tiers.map((t) => (
            <Card key={t.id}>
              <CardTitle>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{t.name}</span>
                  <Label isCompact color={t.tier === "fast" ? "yellow" : t.tier === "standard" ? "blue" : "grey"}>{t.tier}</Label>
                </div>
              </CardTitle>
              <CardBody>
                <p style={{ color: "#5b6b7c", fontSize: 13, marginTop: 0 }}>{TIER_DESCRIPTION[t.tier]}</p>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#5b6b7c", marginBottom: 10 }}>
                  <span>IOPS: <strong style={{ color: "#0b1b2b" }}>{t.iops}</strong></span>
                  <span>Media: <strong style={{ color: "#0b1b2b" }}>{t.media}</strong></span>
                </div>
                <div style={{ fontSize: 11, color: "#5b6b7c", marginBottom: 4 }}>storageClassName</div>
                <ClipboardCopy hoverTip="Copy" clickTip="Copied" isReadOnly variant="inline-compact">{t.name}</ClipboardCopy>
                <div style={{ fontSize: 11, color: "#5b6b7c", margin: "10px 0 4px" }}>PVC example</div>
                <ClipboardCopy hoverTip="Copy" clickTip="Copied" isReadOnly variant="expansion" isCode>
{`apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: example-${t.id}
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: ${t.name}
  resources:
    requests:
      storage: 50Gi`}
                </ClipboardCopy>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* VolumeSnapshotClasses */}
      <Card>
        <CardTitle>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>VolumeSnapshotClasses</span>
            <Button variant="link" icon={<PlusCircleIcon />} isInline>Create snapshot class</Button>
          </div>
        </CardTitle>
        <CardBody style={{ padding: 0 }}>
          <Table>
            <Thead><Tr><Th>Name</Th><Th>Driver</Th><Th>Deletion policy</Th><Th>Default</Th></Tr></Thead>
            <Tbody>
              <Tr>
                <Td><code>vast-snap</code></Td>
                <Td><code>csi.vastdata.com</code></Td>
                <Td>Delete</Td>
                <Td><Label color="green" isCompact>default</Label></Td>
              </Tr>
              <Tr>
                <Td><code>vast-snap-retain</code></Td>
                <Td><code>csi.vastdata.com</code></Td>
                <Td>Retain</Td>
                <Td>—</Td>
              </Tr>
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
