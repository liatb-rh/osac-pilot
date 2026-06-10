import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Tabs, Tab, TabTitleText, SearchInput, Label,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import {
  BARE_METAL_HOSTS, BARE_METAL_INSTANCES, findBmHost, bmSimpleStatus,
} from "@/lib/bare-metal-data";

export const Route = createFileRoute("/app/provider/bare-metal/")({ component: ProviderBareMetalIndex });

const stateTone: Record<string, "blue" | "green" | "orange" | "red" | "grey" | "purple" | "yellow"> = {
  discovered: "blue",
  inspecting: "purple",
  available: "green",
  allocated: "yellow",
  maintenance: "orange",
  failed: "red",
};

function ProviderBareMetalIndex() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<string | number>("hosts");
  const [q, setQ] = useState("");

  const total = BARE_METAL_HOSTS.length;
  const available = BARE_METAL_HOSTS.filter((h) => h.discoveryState === "available").length;
  const allocated = BARE_METAL_HOSTS.filter((h) => h.discoveryState === "allocated").length;
  const maintenance = BARE_METAL_HOSTS.filter((h) => h.discoveryState === "maintenance").length;
  const discovery = BARE_METAL_HOSTS.filter((h) => h.discoveryState === "discovered" || h.discoveryState === "inspecting");

  const hosts = BARE_METAL_HOSTS.filter((h) =>
    h.hostname.includes(q) || h.serial.toLowerCase().includes(q.toLowerCase()) || h.rack.includes(q),
  );

  return (
    <>
      <PageHeader
        title="Bare Metal Inventory"
        subtitle="Physical server fleet, discovery pipeline, and cross-tenant allocations."
        actions={<Button variant="secondary">Trigger discovery scan</Button>}
      />

      <div className="osac-kpi-grid" style={{ marginBottom: 20 }}>
        <Kpi label="Total hosts" value={total} />
        <Kpi label="Available" value={available} tone="success" />
        <Kpi label="Allocated" value={allocated} />
        <Kpi label="Maintenance" value={maintenance} tone="warning" />
        <Kpi label="Pending discovery" value={discovery.length} tone="default" />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="BMaaS tabs">
        <Tab eventKey="hosts" title={<TabTitleText>Hosts</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <SearchInput placeholder="Filter by hostname, serial, rack" value={q} onChange={(_, v) => setQ(v)} onClear={() => setQ("")} style={{ minWidth: 320, marginBottom: 12 }} />
            <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
              <Table aria-label="Bare metal hosts">
                <Thead>
                  <Tr>
                    <Th>Hostname</Th><Th>Serial</Th><Th>Model</Th><Th>CPU / RAM</Th>
                    <Th>GPU</Th><Th>Rack / Zone</Th><Th>Power</Th><Th>State</Th><Th>Allocation</Th><Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {hosts.map((h) => (
                    <Tr key={h.id} isClickable onRowClick={() => navigate({ to: "/app/provider/bare-metal/$id", params: { id: h.id } })}>
                      <Td><Link to="/app/provider/bare-metal/$id" params={{ id: h.id }} style={{ color: "#0066cc", fontWeight: 600 }}>{h.hostname}</Link></Td>
                      <Td><code>{h.serial}</code></Td>
                      <Td>{h.manufacturer} {h.model}</Td>
                      <Td>{h.cores}c · {h.memoryGiB} GiB</Td>
                      <Td>{h.gpu ? `${h.gpu.count}× ${h.gpu.model.split(" ")[1]}` : "—"}</Td>
                      <Td>{h.rack} / {h.zone}</Td>
                      <Td><span className="osac-status-dot" data-s={h.powerState === "on" ? "ready" : "stopped"} />{h.powerState}</Td>
                      <Td><Label color={stateTone[h.discoveryState]} isCompact>{h.discoveryState}</Label></Td>
                      <Td>{h.tenantAllocation ?? <span style={{ color: "#5b6b7c" }}>—</span>}</Td>
                      <Td isActionCell onClick={(e) => e.stopPropagation()}>
                        <ActionsColumn items={[
                          { title: "Inspect" },
                          { title: h.discoveryState === "maintenance" ? "Exit maintenance" : "Enter maintenance" },
                          { isSeparator: true },
                          { title: "Decommission" },
                        ]} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>

        <Tab eventKey="instances" title={<TabTitleText>Instances</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel" style={{ padding: 0 }}>
            <Table aria-label="Bare metal instances">
              <Thead>
                <Tr><Th>Instance</Th><Th>Tenant</Th><Th>Flavor</Th><Th>Image</Th><Th>Host</Th><Th>State</Th><Th>Created</Th></Tr>
              </Thead>
              <Tbody>
                {BARE_METAL_INSTANCES.map((i) => {
                  const host = findBmHost(i.hostRef);
                  const s = bmSimpleStatus(i.provisioningState, host?.powerState ?? "on");
                  return (
                    <Tr key={i.id}>
                      <Td><strong>{i.name}</strong></Td>
                      <Td>{i.tenant}</Td>
                      <Td><code>{i.flavor}</code></Td>
                      <Td>{i.image}</Td>
                      <Td>{host ? <code>{host.hostname}</code> : "—"}</Td>
                      <Td><span className="osac-status-dot" data-s={s} />{i.provisioningState}</Td>
                      <Td>{i.createdAt.slice(0, 10)}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="discovery" title={<TabTitleText>Discovery</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <p style={{ color: "#5b6b7c", marginTop: 0 }}>Hardware discovered by the inspector but not yet released into the available pool.</p>
            <div className="osac-panel" style={{ padding: 0 }}>
              <Table>
                <Thead><Tr><Th>Hostname</Th><Th>Serial</Th><Th>Model</Th><Th>Discovered</Th><Th>State</Th><Th /></Tr></Thead>
                <Tbody>
                  {discovery.map((h) => (
                    <Tr key={h.id}>
                      <Td><Link to="/app/provider/bare-metal/$id" params={{ id: h.id }} style={{ color: "#0066cc", fontWeight: 600 }}>{h.hostname}</Link></Td>
                      <Td><code>{h.serial}</code></Td>
                      <Td>{h.manufacturer} {h.model}</Td>
                      <Td>{h.discoveredAt.slice(0, 10)}</Td>
                      <Td><Label color={stateTone[h.discoveryState]} isCompact>{h.discoveryState}</Label></Td>
                      <Td style={{ textAlign: "right" }}>
                        <Button variant="secondary" size="sm" style={{ marginRight: 8 }}>Inspect</Button>
                        <Button variant="primary" size="sm">Make available</Button>
                      </Td>
                    </Tr>
                  ))}
                  {discovery.length === 0 && (
                    <Tr><Td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#5b6b7c" }}>No hosts pending discovery.</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
