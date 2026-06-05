import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Tabs, Tab, TabTitleText, Label, Button, Alert,
  Modal, ModalVariant, ModalHeader, ModalBody, ModalFooter,
  Checkbox, SearchInput, Badge,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { useMemo, useState } from "react";
import { ROLE_PERMISSIONS, type PermissionId, type RoleId } from "@/lib/rbac";

export const Route = createFileRoute("/app/provider/rbac")({ component: RbacPage });

type RbacRoleId =
  | "cloud-provider-admin"
  | "cloud-provider-reader"
  | "tenant-admin"
  | "tenant-reader"
  | "tenant-user";

type RbacRole = {
  id: RbacRoleId;
  label: string;
  scope: "system" | "org";
  desc: string;
  members: number;
  mapsTo: RoleId; // bridge to ROLE_PERMISSIONS
  readOnly?: boolean;
};

const SYSTEM_ROLES: RbacRole[] = [
  { id: "cloud-provider-admin", label: "Cloud Provider Admin", scope: "system", desc: "Full platform authority across all tenant realms.", members: 4, mapsTo: "providerAdmin" },
  { id: "cloud-provider-reader", label: "Cloud Provider Reader", scope: "system", desc: "Read-only observability across all tenants & infrastructure.", members: 9, mapsTo: "providerAdmin", readOnly: true },
];

const ORG_ROLES: RbacRole[] = [
  { id: "tenant-admin", label: "Tenant Admin", scope: "org", desc: "Manage users, quota, network topology, cluster offerings within a tenant.", members: 12, mapsTo: "tenantAdmin" },
  { id: "tenant-reader", label: "Tenant Reader", scope: "org", desc: "Read-only view of tenant workloads, quota, networks.", members: 28, mapsTo: "tenantUser", readOnly: true },
  { id: "tenant-user", label: "Tenant User", scope: "org", desc: "Operate VM and cluster lifecycle inside a tenant workspace.", members: 87, mapsTo: "tenantUser" },
];

const GROUPS = [
  { kc: "/northstar/platform-admins", role: "tenant-admin", members: 4, realm: "northstar.osac" },
  { kc: "/northstar/dev-team", role: "tenant-user", members: 22, realm: "northstar.osac" },
  { kc: "/bluestone/operators", role: "tenant-admin", members: 3, realm: "bluestone.osac" },
  { kc: "/bluestone/analysts", role: "tenant-reader", members: 14, realm: "bluestone.osac" },
  { kc: "/osac-system/provider-admins", role: "cloud-provider-admin", members: 4, realm: "master" },
];

// Mock member directory derived from group mappings
const MEMBER_POOL: Record<string, { name: string; email: string }[]> = {
  "/osac-system/provider-admins": [
    { name: "Avery Chen", email: "avery.chen@osac.io" },
    { name: "Priya Raman", email: "priya.raman@osac.io" },
    { name: "Marcus Webb", email: "marcus.webb@osac.io" },
    { name: "Sofia Alvarez", email: "sofia.alvarez@osac.io" },
  ],
  "/northstar/platform-admins": [
    { name: "Jane Holloway", email: "jane.holloway@northstar.bank" },
    { name: "Devon Park", email: "devon.park@northstar.bank" },
    { name: "Mei Tanaka", email: "mei.tanaka@northstar.bank" },
    { name: "Owen Pierce", email: "owen.pierce@northstar.bank" },
  ],
  "/northstar/dev-team": [
    { name: "Liam O'Brien", email: "liam.obrien@northstar.bank" },
    { name: "Sara Kowalski", email: "sara.kowalski@northstar.bank" },
    { name: "Ravi Mehta", email: "ravi.mehta@northstar.bank" },
  ],
  "/bluestone/operators": [
    { name: "Kim Yusuf", email: "kim.yusuf@bluestone.fi" },
    { name: "Theo Marchetti", email: "theo.marchetti@bluestone.fi" },
    { name: "Hana Park", email: "hana.park@bluestone.fi" },
  ],
  "/bluestone/analysts": [
    { name: "Greta Lindqvist", email: "greta.lindqvist@bluestone.fi" },
    { name: "Diego Salas", email: "diego.salas@bluestone.fi" },
  ],
};

function membersForRole(roleId: RbacRoleId) {
  const out: { name: string; email: string; group: string; realm: string }[] = [];
  GROUPS.filter(g => g.role === roleId).forEach(g => {
    (MEMBER_POOL[g.kc] ?? []).forEach(m => out.push({ ...m, group: g.kc, realm: g.realm }));
  });
  return out;
}

// Group permissions by category for the editor
const PERMISSION_CATEGORIES: { label: string; perms: PermissionId[] }[] = [
  { label: "Shell & session", perms: ["choose_persona","use_theme_toggle","submit_sign_in","switch_institution","view_shell","navigate_shell_sections","logout","view_recent_activities"] },
  { label: "Tenant dashboards", perms: ["view_dashboard","view_tenant_admin_dashboard","view_provider_dashboard"] },
  { label: "VM lifecycle", perms: ["open_create_vm","view_catalog","create_from_template","use_vm_wizard","provision_vm","view_my_vms","operate_vm_power","clone_vm","launch_console"] },
  { label: "Clusters", perms: ["view_clusters","open_create_cluster","view_cluster_catalog_items","scale_cluster_nodes","delete_cluster","upgrade_cluster","download_kubeconfig","manage_cluster_offerings"] },
  { label: "Tenant administration", perms: ["manage_users","view_quota","view_topology","open_vm_from_topology"] },
  { label: "Provider infrastructure", perms: ["view_infrastructure","view_agents","manage_agents","view_storage_tiers","manage_storage_tiers"] },
  { label: "Provider governance", perms: ["manage_tenants","manage_resource_allocation","manage_global_templates","manage_organizations","manage_rbac","onboard_tenants","manage_catalog_items","view_ansible_collection"] },
];

function RbacPage() {
  const [tab, setTab] = useState<string | number>("roles");
  const [membersOf, setMembersOf] = useState<RbacRole | null>(null);
  const [editOf, setEditOf] = useState<RbacRole | null>(null);

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
            <RoleTable roles={SYSTEM_ROLES} color="purple" onView={setMembersOf} onEdit={setEditOf} />

            <h3 style={{ margin: "24px 0 8px", fontSize: 14, color: "#5b6b7c", letterSpacing: ".04em", textTransform: "uppercase" }}>Organization scope</h3>
            <RoleTable roles={ORG_ROLES} color="blue" onView={setMembersOf} onEdit={setEditOf} />
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

      <MembersModal role={membersOf} onClose={() => setMembersOf(null)} />
      <PermissionsModal role={editOf} onClose={() => setEditOf(null)} />
    </>
  );
}

function RoleTable({ roles, color, onView, onEdit }: {
  roles: RbacRole[];
  color: "purple" | "blue";
  onView: (r: RbacRole) => void;
  onEdit: (r: RbacRole) => void;
}) {
  return (
    <Table variant="compact">
      <Thead><Tr><Th>Role</Th><Th>ID</Th><Th>Description</Th><Th>Members</Th><Th /></Tr></Thead>
      <Tbody>
        {roles.map(r => (
          <Tr key={r.id}>
            <Td><strong>{r.label}</strong>{r.readOnly && <Label isCompact style={{ marginLeft: 6 }}>read-only</Label>}</Td>
            <Td><code>{r.id}</code></Td>
            <Td>{r.desc}</Td>
            <Td><Label isCompact color={color}>{r.members}</Label></Td>
            <Td isActionCell>
              <ActionsColumn items={[
                { title: "View members", onClick: () => onView(r) },
                { title: "Edit permissions", onClick: () => onEdit(r) },
              ]} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}

function MembersModal({ role, onClose }: { role: RbacRole | null; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const members = useMemo(() => role ? membersForRole(role.id) : [], [role]);
  const filtered = members.filter(m =>
    !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase())
  );
  const groupCount = role ? GROUPS.filter(g => g.role === role.id).length : 0;

  return (
    <Modal variant={ModalVariant.medium} isOpen={!!role} onClose={onClose} aria-label="Role members">
      {role && (
        <>
          <ModalHeader title={`Members · ${role.label}`} description={`${members.length} member${members.length === 1 ? "" : "s"} across ${groupCount} Keycloak group${groupCount === 1 ? "" : "s"}.`} />
          <ModalBody>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
              <SearchInput placeholder="Search members" value={query} onChange={(_, v) => setQuery(v)} onClear={() => setQuery("")} />
              <Badge isRead>{filtered.length} shown</Badge>
            </div>
            <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
              <Table variant="compact">
                <Thead><Tr><Th>User</Th><Th>Email</Th><Th>Keycloak group</Th><Th>Realm</Th></Tr></Thead>
                <Tbody>
                  {filtered.length === 0 ? (
                    <Tr><Td colSpan={4} style={{ textAlign: "center", color: "#5b6b7c", padding: 24 }}>No members match.</Td></Tr>
                  ) : filtered.map((m, i) => (
                    <Tr key={i}>
                      <Td><strong>{m.name}</strong></Td>
                      <Td><code style={{ fontSize: 12 }}>{m.email}</code></Td>
                      <Td><code style={{ fontSize: 12 }}>{m.group}</code></Td>
                      <Td><code style={{ fontSize: 12 }}>{m.realm}</code></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
            <Alert variant="info" isInline isPlain title="Membership is sourced from Keycloak group claims. Add or remove users at the IdP, then mappings sync within ~30s." style={{ marginTop: 12 }} />
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}

function PermissionsModal({ role, onClose }: { role: RbacRole | null; onClose: () => void }) {
  const initial = useMemo(
    () => role ? new Set(ROLE_PERMISSIONS[role.mapsTo]) : new Set<PermissionId>(),
    [role]
  );
  const [selected, setSelected] = useState<Set<PermissionId>>(initial);
  const [query, setQuery] = useState("");

  // Reset when role changes
  useMemo(() => { setSelected(new Set(initial)); setQuery(""); }, [initial]);

  const toggle = (p: PermissionId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const totalChanged = role
    ? [...selected].filter(p => !initial.has(p)).length + [...initial].filter(p => !selected.has(p)).length
    : 0;

  return (
    <Modal variant={ModalVariant.large} isOpen={!!role} onClose={onClose} aria-label="Edit permissions">
      {role && (
        <>
          <ModalHeader
            title={`Edit permissions · ${role.label}`}
            description={`Grants are evaluated by Authorino against the ${role.mapsTo} permission set. Toggle below, then publish to regenerate AuthPolicies.`}
          />
          <ModalBody>
            <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
              <SearchInput placeholder="Filter permissions" value={query} onChange={(_, v) => setQuery(v)} onClear={() => setQuery("")} />
              <Badge isRead>{selected.size} granted</Badge>
              {totalChanged > 0 && <Label color="gold" isCompact>{totalChanged} pending change{totalChanged === 1 ? "" : "s"}</Label>}
              {role.readOnly && <Label color="grey" isCompact>read-only role</Label>}
            </div>

            <div style={{ display: "grid", gap: 16, maxHeight: 460, overflowY: "auto", paddingRight: 8 }}>
              {PERMISSION_CATEGORIES.map(cat => {
                const visible = cat.perms.filter(p => !query || p.toLowerCase().includes(query.toLowerCase()));
                if (visible.length === 0) return null;
                const grantedInCat = visible.filter(p => selected.has(p)).length;
                return (
                  <div key={cat.label} className="osac-panel" style={{ background: "#f6f9fc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <strong style={{ fontSize: 13 }}>{cat.label}</strong>
                      <span style={{ fontSize: 12, color: "#5b6b7c" }}>{grantedInCat} / {visible.length} granted</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {visible.map(p => (
                        <Checkbox
                          key={p}
                          id={`${role.id}-${p}`}
                          label={<code style={{ fontSize: 12 }}>{p}</code>}
                          isChecked={selected.has(p)}
                          onChange={() => toggle(p)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert
              variant={totalChanged > 0 ? "warning" : "info"}
              isInline
              isPlain
              title={totalChanged > 0
                ? "Publishing will regenerate AuthPolicies for every Kuadrant gateway bound to this role."
                : "No pending changes. Toggle a permission to stage an update."}
              style={{ marginTop: 12 }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={onClose}>Cancel</Button>
            <Button variant="primary" isDisabled={totalChanged === 0} onClick={onClose}>
              Publish {totalChanged > 0 ? `(${totalChanged})` : ""}
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
