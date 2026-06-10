import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import {
  Button, Tabs, Tab, TabTitleText, Breadcrumb, BreadcrumbItem,
  Label, LabelGroup, Card, CardBody, CardTitle,
  DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { PowerOffIcon, RedoIcon, TerminalIcon, PlayIcon, TrashIcon } from "@patternfly/react-icons";
import { findBmInstance, findBmHost, bmSimpleStatus } from "@/lib/bare-metal-data";

export const Route = createFileRoute("/app/bare-metal/$name")({ component: BareMetalDetail });

function BareMetalDetail() {
  const { name } = Route.useParams();
  const inst = findBmInstance(name);
  const host = inst ? findBmHost(inst.hostRef) : undefined;
  const [tab, setTab] = useState<string | number>("overview");

  if (!inst) {
    return (
      <>
        <Breadcrumb style={{ marginBottom: 12 }}>
          <BreadcrumbItem><Link to="/app/bare-metal">Bare Metal</Link></BreadcrumbItem>
          <BreadcrumbItem isActive>{name}</BreadcrumbItem>
        </Breadcrumb>
        <div className="osac-panel">Instance <code>{name}</code> not found.</div>
      </>
    );
  }

  const s = bmSimpleStatus(inst.provisioningState, host?.powerState ?? "unknown");
  const isOn = host?.powerState === "on";

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/bare-metal">Bare Metal</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{inst.name}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={inst.name}
        subtitle={`${inst.flavor} · ${inst.image} · host ${host?.hostname ?? "—"}`}
        actions={
          <>
            <Button variant="secondary" icon={isOn ? <PowerOffIcon /> : <PlayIcon />}>
              {isOn ? "Power off" : "Power on"}
            </Button>
            <Button variant="secondary" icon={<RedoIcon />}>Reboot</Button>
            <Button variant="primary" icon={<TerminalIcon />} component="a" href={inst.ipmiUrl} target="_blank">
              BMC console
            </Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="State" value={<span><StatusDot status={s as any} /></span> as any} hint={inst.provisioningState} />
        <Kpi label="Power" value={host?.powerState ?? "—"} hint="via BMC" />
        <Kpi label="Cores" value={host?.cores ?? "—"} hint={host?.cpuModel} />
        <Kpi label="Memory" value={host ? `${host.memoryGiB} GiB` : "—"} />
        <Kpi label="Primary IP" value={inst.ip} hint={`${inst.vnet} / ${inst.subnet}`} />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Bare metal detail tabs">
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Card><CardTitle>Configuration</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Instance</DescriptionListTerm><DescriptionListDescription>{inst.name}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Flavor</DescriptionListTerm><DescriptionListDescription><code>{inst.flavor}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Image</DescriptionListTerm><DescriptionListDescription>{inst.image}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Boot mode</DescriptionListTerm><DescriptionListDescription>{inst.bootMode} · Secure boot {inst.secureBoot ? "on" : "off"}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Allocated host</DescriptionListTerm><DescriptionListDescription>{host ? <code>{host.hostname}</code> : "—"} · rack {host?.rack} · zone {host?.zone}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>BMC</DescriptionListTerm><DescriptionListDescription><code>{inst.ipmiUrl}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Created</DescriptionListTerm><DescriptionListDescription>{inst.createdAt.slice(0, 10)} by {inst.createdBy}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Labels</DescriptionListTerm><DescriptionListDescription>
                  <LabelGroup>
                    <Label color="blue">tenant={inst.tenant}</Label>
                    <Label color="purple">{inst.flavor}</Label>
                    <Label color="green">dedicated</Label>
                  </LabelGroup>
                </DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>
            <Card><CardTitle>Lifecycle</CardTitle><CardBody>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
                {[
                  { t: "now", e: `State: ${inst.provisioningState}` },
                  { t: "—", e: "OS installed via PXE" },
                  { t: "—", e: "Host inspected & matched" },
                  { t: "—", e: "Request queued" },
                ].map((x) => (
                  <li key={x.e} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>
                    <span style={{ color: "#5b6b7c", width: 50 }}>{x.t}</span><span>{x.e}</span>
                  </li>
                ))}
              </ul>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="hardware" title={<TabTitleText>Hardware</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gap: 16 }}>
            <Card><CardTitle>Chassis</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Manufacturer</DescriptionListTerm><DescriptionListDescription>{host?.manufacturer}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Model</DescriptionListTerm><DescriptionListDescription>{host?.model}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Serial</DescriptionListTerm><DescriptionListDescription><code>{host?.serial}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>CPU</DescriptionListTerm><DescriptionListDescription>{host?.cpuModel} · {host?.cores} cores</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Memory</DescriptionListTerm><DescriptionListDescription>{host?.memoryGiB} GiB</DescriptionListDescription></DescriptionListGroup>
                {host?.gpu && <DescriptionListGroup><DescriptionListTerm>GPU</DescriptionListTerm><DescriptionListDescription>{host.gpu.count}× {host.gpu.model} ({host.gpu.memoryGiB} GiB total)</DescriptionListDescription></DescriptionListGroup>}
              </DescriptionList>
            </CardBody></Card>
            <div className="osac-panel" style={{ padding: 0 }}>
              <div style={{ padding: "12px 16px", fontWeight: 600 }}>Disks</div>
              <Table>
                <Thead><Tr><Th>Device</Th><Th>Type</Th><Th>Size</Th></Tr></Thead>
                <Tbody>
                  {host?.disks.map((d) => (
                    <Tr key={d.name}><Td><code>{d.name}</code></Td><Td>{d.type}</Td><Td>{d.sizeGiB} GiB</Td></Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
            <div className="osac-panel" style={{ padding: 0 }}>
              <div style={{ padding: "12px 16px", fontWeight: 600 }}>Network interfaces</div>
              <Table>
                <Thead><Tr><Th>Interface</Th><Th>Speed</Th><Th>MAC</Th></Tr></Thead>
                <Tbody>
                  {host?.nics.map((n) => (
                    <Tr key={n.name}><Td><code>{n.name}</code></Td><Td>{n.speedGbps} Gbps</Td><Td><code>{n.mac}</code></Td></Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>

        <Tab eventKey="network" title={<TabTitleText>Network</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Virtual network</Th><Th>Subnet</Th><Th>VLAN</Th><Th>IP</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>{inst.vnet}</Td><Td>{inst.subnet}</Td><Td>{inst.vlan}</Td><Td><code>{inst.ip}</code></Td></Tr>
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="power" title={<TabTitleText>Power & Console</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gap: 12 }}>
            <Card><CardTitle>BMC</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Endpoint</DescriptionListTerm><DescriptionListDescription><code>{inst.ipmiUrl}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Power state</DescriptionListTerm><DescriptionListDescription>{host?.powerState}</DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button variant="secondary" icon={isOn ? <PowerOffIcon /> : <PlayIcon />}>{isOn ? "Soft power off" : "Power on"}</Button>
                <Button variant="secondary">Hard reset</Button>
                <Button variant="primary" icon={<TerminalIcon />} component="a" href={inst.ipmiUrl} target="_blank">Open BMC console</Button>
              </div>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="danger" title={<TabTitleText>Danger zone</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <TrashIcon style={{ color: "#c9190b" }} />
              <div>
                <div style={{ fontWeight: 600 }}>Release host</div>
                <div style={{ color: "#5b6b7c", fontSize: 13 }}>Wipes disks, returns the physical server to the available inventory pool.</div>
              </div>
            </div>
            <Button variant="danger">Release</Button>
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
