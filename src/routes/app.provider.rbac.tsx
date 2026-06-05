import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import { Tabs, Tab, TabTitleText, Label, Button, Alert } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { useState } from "react";

export const Route = createFileRoute("/app/provider/rbac")({ component: RbacPage });

const SYSTEM_ROLES = [
  { id: "cloud-provider-admin", label: "Cloud Provider Admin", scope: "system", desc: "Full platform authority across all tenant realms.", members: 4 },
  { id: "cloud-provider-reader", label: "Cloud Provider Reader", scope: "system", desc: "Read-only observability across all tenants & infrastructure.", members: 9 },
];

const ORG_ROLES = [
  { id: "tenant-admin", label: "Tenant Admin", scope: "org", desc: "Manage users, quota, network topology, cluster offerings within a tenant.", members: 12 },
  { id: "tenant-reader", label: "Tenant Reader", scope: "org", desc: "Read-only view of tenant workloads, quota, networks.", members: 28 },
  { id: "tenant-user", label: "Tenant User", scope: "org", desc: "Operate VM and cluster lifecycle inside a tenant workspace.", members: 87 },
];

const GROUPS = [
  { kc: "/northstar/platform-admins", role: "tenant-admin", members: 4, realm: "northstar.osac" },
  { kc: "/northstar/dev-team", role: "tenant-user", members: 22, realm: "northstar.osac" },
  { kc: "/bluestone/operators", role: "tenant-admin", members: 3, realm: "bluestone.osac" },
  { kc: "/bluestone/analysts", role: "tenant-reader", members: 14, realm: "bluestone.osac" },
  { kc: "/osac-system/provider-admins", role: "cloud-provider-admin", members: 4, realm: "master" },
];

function RbacPage() {
  const [tab, setTab] = useState<string | number>("roles");

  return (
    <>
      <PageHeader title="RBAC Management" subtitle="System-level and organization-level roles, mapped from Keycloak groups, enforced by Authorino at the gateway." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="System roles" value={SYSTEM_ROLES.length} />
        <Kpi label="Org roles" value={ORG_ROLES.length} />
        <Kpi label="Group→role mappings" value={GROUPS.length} />
        <Kpi label="Enforced by" value="Authorino" hint="at Kuadrant gateway" />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)}>
        <Tab eventKey="roles" title={<TabTitleText>Roles</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#5b6b7c", letterSpacing: ".04em", textTransform: "uppercase" }}>System scope</h3>
            <Table variant="compact">
              <Thead><Tr><Th>Role</Th><Th>ID</Th><Th>Description</Th><Th>Members</Th><Th /></Tr></Thead>
              <Tbody>
                {SYSTEM_ROLES.map(r => (
                  <Tr key={r.id}>
                    <Td><strong>{r.label}</strong></Td>
                    <Td><code>{r.id}</code></Td>
                    <Td>{r.desc}</Td>
                    <Td><Label isCompact color="purple">{r.members}</Label></Td>
                    <Td isActionCell><ActionsColumn items={[{ title: "View members" }, { title: "Edit permissions" }]} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            <h3 style={{ margin: "24px 0 8px", fontSize: 14, color: "#5b6b7c", letterSpacing: ".04em", textTransform: "uppercase" }}>Organization scope</h3>
            <Table variant="compact">
              <Thead><Tr><Th>Role</Th><Th>ID</Th><Th>Description</Th><Th>Members</Th><Th /></Tr></Thead>
              <Tbody>
                {ORG_ROLES.map(r => (
                  <Tr key={r.id}>
                    <Td><strong>{r.label}</strong></Td>
                    <Td><code>{r.id}</code></Td>
                    <Td>{r.desc}</Td>
                    <Td><Label isCompact color="blue">{r.members}</Label></Td>
                    <Td isActionCell><ActionsColumn items={[{ title: "View members" }, { title: "Edit permissions" }]} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="mappings" title={<TabTitleText>Group → Role mappings</TabTitleText>}>
          <div className="osac-panel" style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
            <Table>
              <Thead><Tr><Th>Keycloak group</Th><Th>Realm</Th><Th>Mapped role</Th><Th>Members</Th><Th /></Tr></Thead>
              <Tbody>
                {GROUPS.map((g, i) => (
                  <Tr key={i}>
                    <Td><code>{g.kc}</code></Td>
                    <Td><code style={{ fontSize: 12 }}>{g.realm}</code></Td>
                    <Td><Label isCompact color={g.role.startsWith("cloud") ? "purple" : "blue"}>{g.role}</Label></Td>
                    <Td>{g.members}</Td>
                    <Td isActionCell><ActionsColumn items={[{ title: "Edit mapping" }, { title: "Remove" }]} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="enforce" title={<TabTitleText>Enforcement</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <Alert variant="info" isInline title="Deny-by-default at the gateway">
              Every API route requires an explicit AuthPolicy. Authorino validates the Keycloak token, extracts <code>groups</code> claim, maps it to an OSAC role, and evaluates the matching policy.
            </Alert>
            <pre style={{ background: "#0b1b2b", color: "#dbe7f3", padding: 16, borderRadius: 8, fontSize: 12, overflow: "auto" }}>{`apiVersion: kuadrant.io/v1beta3
kind: AuthPolicy
metadata:
  name: vms-write
spec:
  targetRef: { kind: HTTPRoute, name: vms-api }
  rules:
    authentication:
      keycloak:
        jwt: { issuerUrl: https://auth.osac.internal/realms/{tenant} }
    authorization:
      role-check:
        opa:
          rego: |
            allow { input.auth.identity.groups[_] == "/{tenant}/platform-admins" }
            allow { input.auth.identity.groups[_] == "/{tenant}/dev-team" ; input.request.http.method == "GET" }`}</pre>
            <div><Button variant="secondary">View all AuthPolicies</Button></div>
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
