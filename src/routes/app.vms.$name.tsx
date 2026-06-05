import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import {
  Button, Tabs, Tab, TabTitleText, Breadcrumb, BreadcrumbItem,
  Label, LabelGroup, Card, CardBody, CardTitle, Divider, Flex, FlexItem,
  DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import {
  PowerOffIcon, RedoIcon, TerminalIcon, CameraIcon, EditIcon,
  CopyIcon, PlayIcon, TrashIcon,
} from "@patternfly/react-icons";

export const Route = createFileRoute("/app/vms/$name")({ component: VmDetail });

interface VMInfo {
  name: string; status: "running" | "stopped" | "progressing" | "failed";
  os: string; cpu: number; ram: number; ip: string; disk: number;
  template: string; created: string; project: string; node: string;
}

const VM_INDEX: Record<string, VMInfo> = {
  "bnk-app-01": { name: "bnk-app-01", status: "running", os: "RHEL 9.4", cpu: 4, ram: 16, ip: "10.10.4.21", disk: 80, template: "rhel-9-medium", created: "2026-04-12", project: "payments-prod", node: "worker-az1-03" },
  "bnk-app-02": { name: "bnk-app-02", status: "running", os: "RHEL 9.4", cpu: 8, ram: 32, ip: "10.10.4.22", disk: 200, template: "rhel-9-large", created: "2026-04-12", project: "payments-prod", node: "worker-az2-01" },
  "bnk-warehouse": { name: "bnk-warehouse", status: "stopped", os: "Ubuntu 22.04", cpu: 16, ram: 64, ip: "10.10.4.23", disk: 1024, template: "ubuntu-22-large", created: "2026-03-02", project: "analytics", node: "worker-az3-02" },
  "bnk-app-04": { name: "bnk-app-04", status: "progressing", os: "RHEL 9.4", cpu: 4, ram: 16, ip: "—", disk: 80, template: "rhel-9-medium", created: "2026-06-05", project: "payments-stg", node: "—" },
  "bnk-api-01": { name: "bnk-api-01", status: "running", os: "RHEL 9.4", cpu: 2, ram: 8, ip: "10.10.4.31", disk: 60, template: "rhel-9-small", created: "2026-05-21", project: "edge-api", node: "worker-az1-05" },
  "bnk-ml-01": { name: "bnk-ml-01", status: "failed", os: "Ubuntu 22.04", cpu: 32, ram: 128, ip: "—", disk: 2048, template: "ubuntu-22-large", created: "2026-06-01", project: "ai-platform", node: "gpu-az2-01" },
};

function VmDetail() {
  const { name } = Route.useParams();
  const vm: VMInfo = VM_INDEX[name] ?? {
    name, status: "stopped", os: "RHEL 9.4", cpu: 2, ram: 8, ip: "—",
    disk: 40, template: "rhel-9-small", created: "—", project: "default", node: "—",
  };
  const [tab, setTab] = useState<string | number>("overview");
  const isRunning = vm.status === "running";

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/vms">Virtual Machines</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{vm.name}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={vm.name}
        subtitle={`${vm.os} · ${vm.template} · project ${vm.project}`}
        actions={
          <>
            <Button variant="secondary" icon={isRunning ? <PowerOffIcon /> : <PlayIcon />}>
              {isRunning ? "Stop" : "Start"}
            </Button>
            <Button variant="secondary" icon={<RedoIcon />}>Restart</Button>
            <Link to="/app/console" search={{ vm: vm.name } as any}>
              <Button variant="primary" icon={<TerminalIcon />}>Console</Button>
            </Link>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Power state" value={<span><StatusDot status={vm.status as any} /></span> as any} />
        <Kpi label="vCPU" value={vm.cpu} hint="cores allocated" />
        <Kpi label="Memory" value={`${vm.ram} GiB`} hint="provisioned" />
        <Kpi label="Disk" value={`${vm.disk} GiB`} hint="root volume" />
        <Kpi label="Primary IP" value={vm.ip} hint="vn-prod / sn-app" />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="VM detail tabs">
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Card><CardTitle>Configuration</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Name</DescriptionListTerm><DescriptionListDescription>{vm.name}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Template</DescriptionListTerm><DescriptionListDescription>{vm.template}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Operating system</DescriptionListTerm><DescriptionListDescription>{vm.os}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Project</DescriptionListTerm><DescriptionListDescription>{vm.project}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Node</DescriptionListTerm><DescriptionListDescription><code>{vm.node}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Created</DescriptionListTerm><DescriptionListDescription>{vm.created}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Labels</DescriptionListTerm><DescriptionListDescription>
                  <LabelGroup><Label color="blue">env=prod</Label><Label color="purple">app=banking</Label><Label color="green">tier=app</Label></LabelGroup>
                </DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>
            <Card><CardTitle>Lifecycle</CardTitle><CardBody>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
                {[
                  { t: "10:42", e: "VM started", k: "ok" },
                  { t: "10:41", e: "Boot disk attached", k: "ok" },
                  { t: "10:40", e: "Cloud-init applied", k: "ok" },
                  { t: "10:39", e: "Provisioned from template", k: "ok" },
                ].map((x) => (
                  <li key={x.t} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>
                    <span style={{ color: "#5b6b7c", width: 50 }}>{x.t}</span>
                    <span>{x.e}</span>
                  </li>
                ))}
              </ul>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="networking" title={<TabTitleText>Networking</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Interface</Th><Th>Virtual network</Th><Th>Subnet</Th><Th>IP</Th><Th>MAC</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>eth0</Td><Td>vn-prod</Td><Td>sn-app (10.10.4.0/24)</Td><Td><code>{vm.ip}</code></Td><Td><code>52:54:00:a1:1c:0e</code></Td></Tr>
                <Tr><Td>eth1</Td><Td>vn-mgmt</Td><Td>sn-mgmt (10.20.0.0/24)</Td><Td><code>10.20.0.{vm.cpu + 10}</code></Td><Td><code>52:54:00:a1:1c:0f</code></Td></Tr>
              </Tbody>
            </Table>
            <Divider />
            <div style={{ padding: 16 }}>
              <strong>Security groups</strong>
              <LabelGroup style={{ marginTop: 8 }}>
                <Label color="blue">sg-app-default</Label>
                <Label color="blue">sg-ssh-bastion</Label>
                <Label color="orange">sg-egress-restricted</Label>
              </LabelGroup>
            </div>
          </div>
        </Tab>

        <Tab eventKey="storage" title={<TabTitleText>Storage</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Disk</Th><Th>Bus</Th><Th>Tier</Th><Th>Size</Th><Th>IOPS</Th><Th>Backing PVC</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>boot</Td><Td>virtio</Td><Td><Label color="gold" isCompact>gold</Label></Td><Td>{vm.disk} GiB</Td><Td>100k</Td><Td><code>{vm.name}-root</code></Td></Tr>
                <Tr><Td>data-01</Td><Td>virtio</Td><Td><Label color="grey" isCompact>silver</Label></Td><Td>500 GiB</Td><Td>30k</Td><Td><code>{vm.name}-data-01</code></Td></Tr>
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="snapshots" title={<TabTitleText>Snapshots</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} style={{ marginBottom: 12 }}>
              <FlexItem><strong>Volume snapshots</strong></FlexItem>
              <FlexItem><Button variant="primary" icon={<CameraIcon />}>Create snapshot</Button></FlexItem>
            </Flex>
            <div className="osac-panel" style={{ padding: 0 }}>
              <Table>
                <Thead><Tr><Th>Name</Th><Th>Disk</Th><Th>Size</Th><Th>Class</Th><Th>Created</Th></Tr></Thead>
                <Tbody>
                  <Tr><Td><code>{vm.name}-pre-upgrade</code></Td><Td>boot</Td><Td>{vm.disk} GiB</Td><Td>vast-snap</Td><Td>2026-06-04 02:15</Td></Tr>
                  <Tr><Td><code>{vm.name}-nightly-0603</code></Td><Td>data-01</Td><Td>500 GiB</Td><Td>vast-snap</Td><Td>2026-06-03 00:00</Td></Tr>
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>

        <Tab eventKey="metrics" title={<TabTitleText>Metrics</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {["CPU utilization", "Memory pressure", "Disk IOPS", "Network throughput"].map((m) => (
              <Card key={m}><CardTitle>{m}</CardTitle><CardBody>
                <MiniSpark seed={m.length} />
              </CardBody></Card>
            ))}
          </div>
        </Tab>

        <Tab eventKey="activity" title={<TabTitleText>Activity</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Result</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>2026-06-05 10:42</Td><Td>m.alvarez@northstar</Td><Td>Started VM</Td><Td><Label color="green" isCompact>success</Label></Td></Tr>
                <Tr><Td>2026-06-04 22:18</Td><Td>system</Td><Td>Scheduled snapshot</Td><Td><Label color="green" isCompact>success</Label></Td></Tr>
                <Tr><Td>2026-06-02 14:01</Td><Td>m.alvarez@northstar</Td><Td>Resized memory 8 → 16 GiB</Td><Td><Label color="green" isCompact>success</Label></Td></Tr>
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="danger" title={<TabTitleText>Danger zone</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gap: 12 }}>
            <DangerRow icon={<EditIcon />} title="Rename VM" body="Changing the VM name updates DNS within 60 seconds." cta="Rename" />
            <DangerRow icon={<CopyIcon />} title="Clone VM" body="Create an exact copy in the same project." cta="Clone" />
            <DangerRow icon={<TrashIcon />} title="Delete VM" body="Destroys the VM and detaches all volumes. Snapshots are retained." cta="Delete" tone="danger" />
          </div>
        </Tab>
      </Tabs>
    </>
  );
}

function MiniSpark({ seed }: { seed: number }) {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const v = 30 + ((Math.sin(i / 2 + seed) + 1) * 30) + (i % 5) * 2;
    return `${(i / 23) * 100},${100 - v}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 120 }}>
      <defs>
        <linearGradient id={`g${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066cc" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0066cc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke="#0066cc" strokeWidth="1.5" />
      <polygon points={`0,100 ${pts} 100,100`} fill={`url(#g${seed})`} />
    </svg>
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
