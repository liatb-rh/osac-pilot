import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Tabs, Tab, TabTitleText, Breadcrumb, BreadcrumbItem,
  Label, LabelGroup, Card, CardBody, CardTitle,
  DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { RedoIcon, PowerOffIcon, EditIcon, TrashIcon, SyncAltIcon } from "@patternfly/react-icons";

import { findAgent } from "@/lib/agents-data";
import { HOST_TYPES } from "@/lib/osac-api";

export const Route = createFileRoute("/app/provider/agents/$host")({ component: AgentDetail });

const TONE: Record<string, "green" | "orange" | "red" | "blue"> = {
  healthy: "green", drift: "orange", unreachable: "red", provisioning: "blue",
};

function AgentDetail() {
  const { host } = Route.useParams();
  const a = findAgent(host);
  const [tab, setTab] = useState<string | number>("overview");

  if (!a) {
    return (
      <>
        <Breadcrumb style={{ marginBottom: 12 }}>
          <BreadcrumbItem><Link to="/app/provider/agents">Infrastructure Agents</Link></BreadcrumbItem>
          <BreadcrumbItem isActive>{host}</BreadcrumbItem>
        </Breadcrumb>
        <PageHeader title={host} subtitle="Agent not found in fleet inventory." />
      </>
    );
  }

  const ht = HOST_TYPES.find((h) => h.id === a.host_type);
  const reachable = a.status !== "unreachable";

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/provider/agents">Infrastructure Agents</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{a.hostname}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={a.hostname}
        subtitle={`${ht?.title ?? a.host_type} · ${a.az} · serial ${a.serial}`}
        actions={
          <>
            <Button variant="secondary" icon={<SyncAltIcon />}>Upgrade</Button>
            <Button variant="secondary" icon={<RedoIcon />}>Reboot</Button>
            <Button variant="danger" icon={<PowerOffIcon />}>Deprovision</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Status" value={<Label color={TONE[a.status]}>{a.status}</Label> as any} />
        <Kpi label="Agent version" value={a.version} hint={`channel ${a.channel}`} />
        <Kpi label="Cores" value={a.cores} hint="physical" />
        <Kpi label="Memory" value={`${a.memory_gib} GiB`} hint="installed" />
        <Kpi label="Local disk" value={`${a.disk_tib} TiB`} hint="NVMe" />
        <Kpi label="Cluster" value={a.cluster ?? "—"} hint={a.cluster ? "joined" : "unassigned"} />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Agent detail tabs">
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Card><CardTitle>Inventory</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Hostname</DescriptionListTerm><DescriptionListDescription>{a.hostname}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Serial</DescriptionListTerm><DescriptionListDescription><code>{a.serial}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Rack / Zone</DescriptionListTerm><DescriptionListDescription>{a.rack} · {a.az}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Host type</DescriptionListTerm><DescriptionListDescription><code>{a.host_type}</code> — {ht?.description}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Virtual network</DescriptionListTerm><DescriptionListDescription>{a.virtual_network}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Mgmt / Data IP</DescriptionListTerm><DescriptionListDescription><code>{a.mgmt_ip}</code> · <code>{a.data_ip}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Enrolled</DescriptionListTerm><DescriptionListDescription>{a.enrolled_at.slice(0, 10)} by {a.enrolled_by}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Last heartbeat</DescriptionListTerm><DescriptionListDescription>{a.last_heartbeat.replace("T", " ").replace("Z", " UTC")}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Labels</DescriptionListTerm><DescriptionListDescription>
                  <LabelGroup>
                    <Label color="blue">zone={a.az}</Label>
                    <Label color="purple">host-type={a.host_type}</Label>
                    {a.cluster && <Label color="green">cluster={a.cluster}</Label>}
                    <Label color="grey">channel={a.channel}</Label>
                  </LabelGroup>
                </DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>

            <Card><CardTitle>Conditions</CardTitle><CardBody>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
                {[
                  { t: "AGENT_CONDITION_PROVISIONED", ok: true },
                  { t: "AGENT_CONDITION_REACHABLE", ok: reachable },
                  { t: "AGENT_CONDITION_VERSION_CURRENT", ok: a.status !== "drift" },
                  { t: "AGENT_CONDITION_CLUSTER_JOINED", ok: !!a.cluster },
                ].map((c) => (
                  <li key={c.t} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>
                    <code style={{ fontSize: 12 }}>{c.t}</code>
                    <Label isCompact color={c.ok ? "green" : "red"}>{c.ok ? "True" : "False"}</Label>
                  </li>
                ))}
              </ul>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="networking" title={<TabTitleText>Networking</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>NIC</Th><Th>MAC</Th><Th>Speed</Th><Th>Link</Th><Th>Bound to</Th></Tr></Thead>
              <Tbody>
                {a.nics.map((n, i) => (
                  <Tr key={n.name}>
                    <Td><code>{n.name}</code></Td>
                    <Td><code>{n.mac}</code></Td>
                    <Td>{n.speed_gbps} Gbps</Td>
                    <Td><Label isCompact color={n.link === "up" ? "green" : "red"}>{n.link}</Label></Td>
                    <Td>{i === 0 ? `mgmt · ${a.mgmt_ip}` : `data · ${a.data_ip}`}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="storage" title={<TabTitleText>Storage</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Device</Th><Th>Role</Th><Th>Size</Th><Th>Type</Th><Th>Tier</Th></Tr></Thead>
              <Tbody>
                <Tr><Td><code>/dev/nvme0n1</Td><Td>OS / etcd</Td><Td>960 GiB</Td><Td>NVMe</Td><Td><Label color="grey" isCompact>local</Label></Td></Tr>
                <Tr><Td><code>/dev/nvme1n1</Td><Td>CSI cache</Td><Td>{(a.disk_tib * 1024 / 2).toFixed(0)} GiB</Td><Td>NVMe</Td><Td><Label color="yellow" isCompact>gold</Label></Td></Tr>
                <Tr><Td>vast://tenant-northstar</Td><Td>Tenant storage</Td><Td>via Tier API</Td><Td>VAST CSI</Td><Td><Label color="blue" isCompact>networked</Label></Td></Tr>
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="logs" title={<TabTitleText>Logs</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#0b1b2b", whiteSpace: "pre-wrap" }}>
{`[2026-06-05 10:42:11Z] INFO  heartbeat sent to fulfillment-svc (rtt=4ms)
[2026-06-05 10:41:50Z] INFO  reconcile node-set ${a.cluster ?? "—"} version=ok
[2026-06-05 10:41:00Z] DEBUG inventory pushed: cpu=${a.cores} mem=${a.memory_gib}GiB
[2026-06-05 10:40:01Z] INFO  CSI driver vast-csi up (mode=networked)
[2026-06-05 10:00:00Z] WARN  ntp drift 12ms, within tolerance`}
            </pre>
          </div>
        </Tab>

        <Tab eventKey="danger" title={<TabTitleText>Danger zone</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gap: 12 }}>
            <DangerRow icon={<EditIcon />} title="Re-label agent" body="Update zone, host-type, or cluster labels." cta="Edit" />
            <DangerRow icon={<SyncAltIcon />} title="Pin release channel" body="Lock this agent to a specific channel and version." cta="Pin" />
            <DangerRow icon={<TrashIcon />} title="Deprovision host" body="Drain workloads, revoke trust, and remove from fleet." cta="Deprovision" tone="danger" />
          </div>
        </Tab>
      </Tabs>
    </>
  );
}

function DangerRow({ icon, title, body, cta, tone }: { icon: React.ReactNode; title: string; body: string; cta: string; tone?: "danger" }) {
  return (
    <div className="osac-panel" style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ color: tone === "danger" ? "#c9190b" : "#0b1b2b" }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ color: "#5b6b7c", fontSize: 13 }}>{body}</div>
        </div>
      </div>
      <Button variant={tone === "danger" ? "danger" : "secondary"}>{cta}</Button>
    </div>
  );
}
