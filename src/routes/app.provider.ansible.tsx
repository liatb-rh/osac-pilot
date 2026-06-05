import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import { Label, Button, Tabs, Tab, TabTitleText, ClipboardCopy, Alert } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { useState } from "react";

export const Route = createFileRoute("/app/provider/ansible")({ component: AnsiblePage });

const ROLES = [
  { id: "storage.vast", kind: "storage", version: "1.4.2", status: "ready", lastRun: "2m ago", desc: "Provisions VAST mounts, exports, and CSI StorageClasses." },
  { id: "storage.netapp", kind: "storage", version: "0.9.0", status: "progressing", lastRun: "12m ago", desc: "NetApp ONTAP driver — pluggable behind the same storage interface." },
  { id: "networking.ovn", kind: "networking", version: "2.1.0", status: "ready", lastRun: "5m ago", desc: "OVN/Kubernetes virtual networks and load-balancer VIPs." },
  { id: "networking.frr", kind: "networking", version: "1.0.3", status: "ready", lastRun: "1h ago", desc: "BGP egress / FRR controller for on-prem peering." },
  { id: "baremetal.ironic", kind: "bm", version: "3.2.0", status: "ready", lastRun: "30m ago", desc: "Bare-metal lifecycle via Metal3/Ironic." },
  { id: "baremetal.redfish", kind: "bm", version: "2.0.1", status: "failed", lastRun: "20m ago", desc: "Redfish out-of-band power & inventory provider." },
  { id: "identity.keycloak", kind: "identity", version: "1.7.0", status: "ready", lastRun: "8m ago", desc: "Realm + IdP federation lifecycle." },
];

const LIFECYCLE = ["validate", "plan", "apply", "verify", "report-status", "rollback"];

function AnsiblePage() {
  const [tab, setTab] = useState<string | number>("roles");

  return (
    <>
      <PageHeader title="Modular Ansible Collection" subtitle="Pluggable provider roles (storage, networking, bare-metal, identity) with standardized status reporting." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="Pluggable roles" value={ROLES.length} />
        <Kpi label="Healthy" value={`${ROLES.filter(r => r.status === "ready").length} / ${ROLES.length}`} tone="success" />
        <Kpi label="Provider domains" value={new Set(ROLES.map(r => r.kind)).size} hint="storage · network · bm · identity" />
        <Kpi label="Lifecycle callbacks" value={LIFECYCLE.length} />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)}>
        <Tab eventKey="roles" title={<TabTitleText>Pluggable roles</TabTitleText>}>
          <div className="osac-panel" style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
            <Table>
              <Thead><Tr><Th>Role</Th><Th>Domain</Th><Th>Version</Th><Th>Status</Th><Th>Last run</Th><Th>Description</Th></Tr></Thead>
              <Tbody>
                {ROLES.map(r => (
                  <Tr key={r.id}>
                    <Td><code>{r.id}</code></Td>
                    <Td><Label isCompact color={r.kind === "storage" ? "blue" : r.kind === "networking" ? "purple" : r.kind === "bm" ? "orange" : "green"}>{r.kind}</Label></Td>
                    <Td><code>{r.version}</code></Td>
                    <Td><StatusDot status={r.status as any} /></Td>
                    <Td style={{ fontSize: 12, color: "#5b6b7c" }}>{r.lastRun}</Td>
                    <Td style={{ fontSize: 12, color: "#5b6b7c" }}>{r.desc}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="iface" title={<TabTitleText>Standard interface</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 16 }}>
            <Alert variant="info" isInline title="All provider roles implement the same lifecycle and status contract.">
              Drop-in replacement: swap <code>storage.vast</code> for <code>storage.netapp</code> without touching the orchestrator.
            </Alert>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="osac-panel" style={{ background: "#f6f9fc" }}>
                <strong>Lifecycle callbacks</strong>
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  {LIFECYCLE.map((c, i) => (
                    <div key={c} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, alignItems: "center" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 11, background: "#e7f1fb", color: "#0066cc", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                      <code>{c}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div className="osac-panel" style={{ background: "#f6f9fc" }}>
                <strong>Status report shape</strong>
                <pre style={{ marginTop: 8, fontSize: 12, background: "#0b1b2b", color: "#dbe7f3", padding: 12, borderRadius: 8, overflow: "auto" }}>{`status:
  phase: ready|progressing|failed
  reason: <string>
  observedGeneration: 12
  resources:
    - kind: StorageClass
      name: vast-fast
      ready: true
  metrics:
    durationMs: 4321`}</pre>
              </div>
            </div>
          </div>
        </Tab>

        <Tab eventKey="meta" title={<TabTitleText>Collection metadata</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <div><strong>Galaxy namespace:</strong> <code>osac.platform</code></div>
            <div><strong>Current version:</strong> <code>2.4.0</code></div>
            <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
              ansible-galaxy collection install osac.platform:==2.4.0
            </ClipboardCopy>
            <div><Button variant="secondary">View changelog</Button></div>
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
