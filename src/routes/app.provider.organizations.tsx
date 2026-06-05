import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import {
  Button, Label, Modal, ModalVariant, ModalHeader, ModalBody, Tabs, Tab, TabTitleText,
  Form, FormGroup, TextInput, Select, SelectOption, SelectList, MenuToggle, Switch, Alert,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon, KeyIcon, ShieldAltIcon } from "@patternfly/react-icons";
import { useState } from "react";

export const Route = createFileRoute("/app/provider/organizations")({ component: OrganizationsPage });

const ORGS = [
  { id: "northstar", name: "Northstar Bank", realm: "northstar.osac", idp: "LDAP", idpHost: "ldap.northstar.internal", idpStatus: "running", users: 48, breakGlass: 2 },
  { id: "evergreen", name: "Bluestone Financial Group", realm: "bluestone.osac", idp: "SAML", idpHost: "sso.bluestone.fi", idpStatus: "running", users: 32, breakGlass: 2 },
  { id: "aurora", name: "Aurora Health", realm: "aurora.osac", idp: "OIDC", idpHost: "auth.aurora.health", idpStatus: "progressing", users: 21, breakGlass: 1 },
  { id: "helix", name: "Helix Logistics", realm: "helix.osac", idp: "AD", idpHost: "dc01.helix.local", idpStatus: "failed", users: 14, breakGlass: 2 },
];

function OrganizationsPage() {
  const [tab, setTab] = useState<string | number>("orgs");
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Organizations & Authentication"
        subtitle="Keycloak realms, external identity providers, and the Sovereign Gateway Pattern (Authorino + Kuadrant)."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpen(true)}>New organization</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="Organizations" value={ORGS.length} hint="across all realms" />
        <Kpi label="Healthy IdPs" value={`${ORGS.filter(o => o.idpStatus === "running").length} / ${ORGS.length}`} tone="success" />
        <Kpi label="Break-glass accounts" value={ORGS.reduce((a, o) => a + o.breakGlass, 0)} hint="across all realms" tone="warning" />
        <Kpi label="Gateway policies" value={12} hint="Authorino AuthPolicies" />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)}>
        <Tab eventKey="orgs" title={<TabTitleText>Organizations</TabTitleText>}>
          <div className="osac-panel" style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
            <Table>
              <Thead><Tr><Th>Organization</Th><Th>Keycloak realm</Th><Th>IdP</Th><Th>IdP host</Th><Th>Status</Th><Th>Users</Th><Th>Break-glass</Th><Th /></Tr></Thead>
              <Tbody>
                {ORGS.map(o => (
                  <Tr key={o.id}>
                    <Td><strong>{o.name}</strong></Td>
                    <Td><code>{o.realm}</code></Td>
                    <Td><Label isCompact color="blue">{o.idp}</Label></Td>
                    <Td><code style={{ fontSize: 12 }}>{o.idpHost}</code></Td>
                    <Td><StatusDot status={o.idpStatus as any} /></Td>
                    <Td>{o.users}</Td>
                    <Td>{o.breakGlass}</Td>
                    <Td isActionCell><ActionsColumn items={[{ title: "Test IdP connection" }, { title: "Rotate break-glass" }, { title: "View realm" }, { isSeparator: true }, { title: "Disable" }]} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="gateway" title={<TabTitleText>Sovereign Gateway</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 16 }}>
            <Alert variant="info" isInline title="Sovereign Gateway Pattern is active">
              Every API request is authenticated by Keycloak and authorized by Authorino through Kuadrant policies at the cluster edge.
            </Alert>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="osac-panel" style={{ background: "#f6f9fc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <KeyIcon /> <strong>Keycloak — token issuance</strong>
                </div>
                <div style={{ fontSize: 13, color: "#5b6b7c", display: "grid", gap: 4 }}>
                  <div>Issuer: <code>https://auth.osac.internal/realms/&lt;tenant&gt;</code></div>
                  <div>Algorithm: RS256 · JWKS cached 10m</div>
                  <div>Federation: LDAP / AD / OIDC / SAML per realm</div>
                </div>
              </div>
              <div className="osac-panel" style={{ background: "#f6f9fc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <ShieldAltIcon /> <strong>Authorino — authorization</strong>
                </div>
                <div style={{ fontSize: 13, color: "#5b6b7c", display: "grid", gap: 4 }}>
                  <div>12 AuthPolicies deployed across Kuadrant Gateways</div>
                  <div>Group-claim mapped to OSAC roles</div>
                  <div>Deny-by-default · explicit allow per route</div>
                </div>
              </div>
            </div>
          </div>
        </Tab>

        <Tab eventKey="health" title={<TabTitleText>IdP health</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {ORGS.map(o => (
              <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 16, alignItems: "center", padding: 12, border: "1px solid #e3e8ee", borderRadius: 8 }}>
                <div>
                  <strong>{o.name}</strong> <span style={{ color: "#5b6b7c", fontSize: 12 }}>· {o.idp} · {o.idpHost}</span>
                </div>
                <div style={{ fontSize: 12, color: "#5b6b7c" }}>p95 lookup: {Math.floor(Math.random() * 80 + 30)}ms</div>
                <StatusDot status={o.idpStatus as any} />
                <Button variant="link" size="sm">Run health probe</Button>
              </div>
            ))}
          </div>
        </Tab>
      </Tabs>

      <Modal variant={ModalVariant.medium} isOpen={open} onClose={() => setOpen(false)} aria-label="New organization">
        <ModalHeader title="Create organization" description="Provisions a Keycloak realm and registers the external IdP." />
        <ModalBody>
          <NewOrgForm onDone={() => setOpen(false)} />
        </ModalBody>
      </Modal>
    </>
  );
}

function NewOrgForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("Crestline Insurance");
  const [realm, setRealm] = useState("crestline.osac");
  const [idp, setIdp] = useState("OIDC");
  const [idpOpen, setIdpOpen] = useState(false);
  const [host, setHost] = useState("auth.crestline.example");
  const [breakGlass, setBreakGlass] = useState(true);

  return (
    <Form>
      <FormGroup label="Organization name" isRequired fieldId="n"><TextInput id="n" value={name} onChange={(_, v) => setName(v)} /></FormGroup>
      <FormGroup label="Keycloak realm" isRequired fieldId="r"><TextInput id="r" value={realm} onChange={(_, v) => setRealm(v)} /></FormGroup>
      <FormGroup label="Identity provider" fieldId="i">
        <Select isOpen={idpOpen} onOpenChange={setIdpOpen}
          toggle={(ref) => (<MenuToggle ref={ref} onClick={() => setIdpOpen(v => !v)}>{idp}</MenuToggle>)}
          selected={idp} onSelect={(_, v) => { setIdp(String(v)); setIdpOpen(false); }}>
          <SelectList>
            {["LDAP","AD","OIDC","SAML"].map(o => <SelectOption key={o} value={o}>{o}</SelectOption>)}
          </SelectList>
        </Select>
      </FormGroup>
      <FormGroup label="IdP endpoint / host" fieldId="h"><TextInput id="h" value={host} onChange={(_, v) => setHost(v)} /></FormGroup>
      <FormGroup fieldId="bg"><Switch id="bg" label="Provision 2 break-glass accounts (recommended)" isChecked={breakGlass} onChange={(_, v) => setBreakGlass(v)} /></FormGroup>
      <Alert variant="info" isInline isPlain title="Authorino AuthPolicies will be generated automatically for the new realm." />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <Button variant="link" onClick={onDone}>Cancel</Button>
        <Button variant="primary" onClick={onDone}>Create organization</Button>
      </div>
    </Form>
  );
}
