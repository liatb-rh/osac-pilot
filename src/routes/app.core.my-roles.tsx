import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import { Label, Alert, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { useState } from "react";
import { useSession, TENANTS } from "@/lib/session";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

export const Route = createFileRoute("/app/core/my-roles")({ component: MyRolesPage });

/**
 * Mirrors osac.iam.v1: Role, RoleBinding, Project, User.
 * The signed-in user sees the Roles they hold, the RoleBindings that grant them,
 * and the Projects those bindings scope to.
 */
type RoleRow = {
  // Role
  id: string;
  metadata: { name: string; tenant: string; version: string; creation_timestamp: string };
  spec: { title: string; description: string };
  status: { state: "READY" | "PENDING" | "FAILED"; message: string };
};

type RoleBindingRow = {
  id: string;
  metadata: { name: string; tenant: string; version: string };
  spec: { role: string; groups: string[]; project?: string };
  status: { state: "READY" | "PENDING" | "FAILED"; message: string };
};

function MyRolesPage() {
  const { tenant, user, role } = useSession();
  const [tab, setTab] = useState<string | number>("roles");
  if (!tenant || !role) return null;
  const t = TENANTS[tenant];
  const shortLc = t.short.toLowerCase();
  const perms = Array.from(ROLE_PERMISSIONS[role]);

  const myRoles: RoleRow[] = [
    {
      id: "role-tenant-user",
      metadata: { name: "tenant-user", tenant, version: "v1", creation_timestamp: "2025-11-14T09:18:00Z" },
      spec: {
        title: "Tenant User",
        description: "Order from the catalog, provision and operate VMs, view bare-metal allocations.",
      },
      status: { state: "READY", message: "Bound via 1 RoleBinding" },
    },
  ];

  const myBindings: RoleBindingRow[] = [
    {
      id: "rb-dev-team",
      metadata: { name: "dev-team-tenant-user", tenant, version: "v2" },
      spec: {
        role: "tenant-user",
        groups: [`/${shortLc}/dev-team`],
        project: `${shortLc}-workloads`,
      },
      status: { state: "READY", message: "Synced from Keycloak 18s ago" },
    },
  ];

  const userObj = {
    id: "user-self",
    metadata: { name: user?.name?.toLowerCase().replace(/\s+/g, ".") ?? "you", tenant, version: "v1" },
    spec: {
      username: user?.name?.toLowerCase().replace(/\s+/g, ".") ?? "you",
      email: `${(user?.name ?? "you").toLowerCase().replace(/\s+/g, ".")}@${shortLc}.example`,
      email_verified: true,
      enabled: true,
      first_name: user?.name?.split(" ")[0] ?? "",
      last_name: user?.name?.split(" ").slice(1).join(" ") ?? "",
      organization: shortLc,
    },
    status: { phase: "READY" as const },
  };

  return (
    <>
      <PageHeader
        title="My Roles"
        subtitle={`Effective access for ${user?.name ?? "you"} in ${t.name} · osac.iam.v1`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="Roles" value={myRoles.length} />
        <Kpi label="RoleBindings" value={myBindings.length} />
        <Kpi label="Source groups" value={myBindings.reduce((a, b) => a + b.spec.groups.length, 0)} />
        <Kpi label="Granted permissions" value={perms.length} hint="enforced by Authorino" />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)}>
        <Tab eventKey="roles" title={<TabTitleText>Roles</TabTitleText>}>
          <div className="osac-panel" style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
            <Table variant="compact">
              <Thead>
                <Tr><Th>id</Th><Th>metadata.name</Th><Th>spec.title</Th><Th>status.state</Th><Th>version</Th></Tr>
              </Thead>
              <Tbody>
                {myRoles.map((r) => (
                  <Tr key={r.id}>
                    <Td><code style={{ fontSize: 12 }}>{r.id}</code></Td>
                    <Td><code>{r.metadata.name}</code></Td>
                    <Td>
                      <div><strong>{r.spec.title}</strong></div>
                      <div style={{ fontSize: 12, color: "#5b6b7c" }}>{r.spec.description}</div>
                    </Td>
                    <Td><StatusDot status={r.status.state === "READY" ? "ready" : r.status.state === "PENDING" ? "progressing" : "failed"} /> {r.status.state}</Td>
                    <Td><Label isCompact>{r.metadata.version}</Label></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="bindings" title={<TabTitleText>RoleBindings</TabTitleText>}>
          <div className="osac-panel" style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
            <Table variant="compact">
              <Thead>
                <Tr><Th>id</Th><Th>spec.role</Th><Th>spec.groups[]</Th><Th>spec.project</Th><Th>status</Th></Tr>
              </Thead>
              <Tbody>
                {myBindings.map((b) => (
                  <Tr key={b.id}>
                    <Td><code style={{ fontSize: 12 }}>{b.id}</code></Td>
                    <Td><Label isCompact color="blue">{b.spec.role}</Label></Td>
                    <Td>
                      {b.spec.groups.map((g) => (
                        <code key={g} style={{ fontSize: 12, marginRight: 6 }}>{g}</code>
                      ))}
                    </Td>
                    <Td>{b.spec.project ? <code style={{ fontSize: 12 }}>{b.spec.project}</code> : <span style={{ color: "#5b6b7c" }}>org-scope</span>}</Td>
                    <Td>
                      <StatusDot status="ready" /> {b.status.state}
                      <div style={{ fontSize: 12, color: "#5b6b7c" }}>{b.status.message}</div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="user" title={<TabTitleText>User</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 13 }}>
            <KV k="id" v={<code>{userObj.id}</code>} />
            <KV k="spec.username" v={<code>{userObj.spec.username}</code>} />
            <KV k="spec.email" v={<code>{userObj.spec.email}</code>} />
            <KV k="spec.email_verified" v={<Label isCompact color="green">{String(userObj.spec.email_verified)}</Label>} />
            <KV k="spec.enabled" v={<Label isCompact color="green">{String(userObj.spec.enabled)}</Label>} />
            <KV k="spec.first_name" v={userObj.spec.first_name} />
            <KV k="spec.last_name" v={userObj.spec.last_name} />
            <KV k="spec.organization" v={<code>{userObj.spec.organization}</code>} />
            <KV k="status.phase" v={<><StatusDot status="ready" /> {userObj.status.phase}</>} />
            <KV k="spec.credentials" v={<span style={{ color: "#5b6b7c" }}>(write-only · managed by your IdP)</span>} />
          </div>
        </Tab>

        <Tab eventKey="perms" title={<TabTitleText>Granted permissions</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 6 }}>
            {perms.map((p) => (
              <code key={p} style={{ fontSize: 12, padding: "4px 8px", background: "#f6f9fc", border: "1px solid #e3e8ee", borderRadius: 6 }}>{p}</code>
            ))}
          </div>
        </Tab>
      </Tabs>

      <Alert
        variant="info"
        isInline
        isPlain
        title={
          <>
            Your roles come from <code>RoleBinding.spec.groups</code> matching a Keycloak group your IdP places you in.
            To request more access, ask your tenant admin to create a binding.
          </>
        }
        style={{ marginTop: 16 }}
      />
    </>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, alignItems: "baseline" }}>
      <code style={{ fontSize: 12, color: "#5b6b7c" }}>{k}</code>
      <div>{v}</div>
    </div>
  );
}
