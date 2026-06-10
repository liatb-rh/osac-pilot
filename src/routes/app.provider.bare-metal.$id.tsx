import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Tabs, Tab, TabTitleText, Breadcrumb, BreadcrumbItem,
  Label, Card, CardBody, CardTitle,
  DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { findBmHost, BARE_METAL_INSTANCES } from "@/lib/bare-metal-data";

export const Route = createFileRoute("/app/provider/bare-metal/$id")({ component: HostDetail });

function HostDetail() {
  const { id } = Route.useParams();
  const host = findBmHost(id);
  const [tab, setTab] = useState<string | number>("hardware");

  if (!host) {
    return (
      <>
        <Breadcrumb style={{ marginBottom: 12 }}>
          <BreadcrumbItem><Link to="/app/provider/bare-metal">Bare Metal Inventory</Link></BreadcrumbItem>
          <BreadcrumbItem isActive>{id}</BreadcrumbItem>
        </Breadcrumb>
        <div className="osac-panel">Host <code>{id}</code> not found.</div>
      </>
    );
  }

  const instance = host.instanceRef ? BARE_METAL_INSTANCES.find((i) => i.id === host.instanceRef) : undefined;

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/provider/bare-metal">Bare Metal Inventory</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{host.hostname}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={host.hostname}
        subtitle={`${host.manufacturer} ${host.model} · serial ${host.serial} · rack ${host.rack}`}
        actions={
          <>
            <Button variant="secondary">Inspect</Button>
            <Button variant="secondary">{host.discoveryState === "maintenance" ? "Exit maintenance" : "Enter maintenance"}</Button>
            <Button variant="danger">Decommission</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Discovery state" value={<Label isCompact>{host.discoveryState}</Label> as any} />
        <Kpi label="Power" value={host.powerState} />
        <Kpi label="Cores" value={host.cores} hint={host.cpuModel} />
        <Kpi label="Memory" value={`${host.memoryGiB} GiB`} />
        <Kpi label="Allocation" value={host.tenantAllocation ?? "—"} hint={instance?.name} />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Host detail tabs">
        <Tab eventKey="hardware" title={<TabTitleText>Hardware</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gap: 16 }}>
            <Card><CardTitle>Chassis</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Manufacturer</DescriptionListTerm><DescriptionListDescription>{host.manufacturer}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Model</DescriptionListTerm><DescriptionListDescription>{host.model}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Serial</DescriptionListTerm><DescriptionListDescription><code>{host.serial}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>CPU</DescriptionListTerm><DescriptionListDescription>{host.cpuModel} · {host.cores} cores</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Memory</DescriptionListTerm><DescriptionListDescription>{host.memoryGiB} GiB</DescriptionListDescription></DescriptionListGroup>
                {host.gpu && <DescriptionListGroup><DescriptionListTerm>GPU</DescriptionListTerm><DescriptionListDescription>{host.gpu.count}× {host.gpu.model} ({host.gpu.memoryGiB} GiB total)</DescriptionListDescription></DescriptionListGroup>}
                <DescriptionListGroup><DescriptionListTerm>Discovered</DescriptionListTerm><DescriptionListDescription>{host.discoveredAt}</DescriptionListDescription></DescriptionListGroup>
                {host.inspectedAt && <DescriptionListGroup><DescriptionListTerm>Inspected</DescriptionListTerm><DescriptionListDescription>{host.inspectedAt}</DescriptionListDescription></DescriptionListGroup>}
              </DescriptionList>
            </CardBody></Card>
            <div className="osac-panel" style={{ padding: 0 }}>
              <div style={{ padding: "12px 16px", fontWeight: 600 }}>Disks</div>
              <Table>
                <Thead><Tr><Th>Device</Th><Th>Type</Th><Th>Size</Th></Tr></Thead>
                <Tbody>{host.disks.map((d) => (
                  <Tr key={d.name}><Td><code>{d.name}</code></Td><Td>{d.type}</Td><Td>{d.sizeGiB} GiB</Td></Tr>
                ))}</Tbody>
              </Table>
            </div>
            <div className="osac-panel" style={{ padding: 0 }}>
              <div style={{ padding: "12px 16px", fontWeight: 600 }}>Network interfaces</div>
              <Table>
                <Thead><Tr><Th>Interface</Th><Th>Speed</Th><Th>MAC</Th></Tr></Thead>
                <Tbody>{host.nics.map((n) => (
                  <Tr key={n.name}><Td><code>{n.name}</code></Td><Td>{n.speedGbps} Gbps</Td><Td><code>{n.mac}</code></Td></Tr>
                ))}</Tbody>
              </Table>
            </div>
          </div>
        </Tab>

        <Tab eventKey="bmc" title={<TabTitleText>BMC</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <Card><CardTitle>Baseboard management</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Address</DescriptionListTerm><DescriptionListDescription><code>{host.bmcAddress}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Protocol</DescriptionListTerm><DescriptionListDescription>Redfish</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Credentials</DescriptionListTerm><DescriptionListDescription>vault: <code>bmc/{host.hostname}</code></DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
              <div style={{ marginTop: 12 }}>
                <Button variant="primary" component="a" href={host.bmcAddress} target="_blank">Open BMC web console</Button>
              </div>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="allocation" title={<TabTitleText>Allocation</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            {instance ? (
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Tenant</DescriptionListTerm><DescriptionListDescription>{host.tenantAllocation}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Instance</DescriptionListTerm><DescriptionListDescription>{instance.name}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Flavor</DescriptionListTerm><DescriptionListDescription><code>{instance.flavor}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Image</DescriptionListTerm><DescriptionListDescription>{instance.image}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Created</DescriptionListTerm><DescriptionListDescription>{instance.createdAt.slice(0, 10)} by {instance.createdBy}</DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            ) : (
              <div style={{ color: "#5b6b7c" }}>This host is not currently allocated to a tenant.</div>
            )}
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
