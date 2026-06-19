import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import { Label, Alert } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { useSession, TENANTS } from "@/lib/session";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

export const Route = createFileRoute("/app/core/my-roles")({ component: MyRolesPage });

function MyRolesPage() {
  const { tenant, user, role } = useSession();
  if (!tenant || !role) return null;
  const t = TENANTS[tenant];
  const perms = Array.from(ROLE_PERMISSIONS[role]);
  const group = `/${t.short.toLowerCase()}/dev-team`;

  return (
    <>
      <PageHeader
        title="My Roles"
        subtitle={`Effective access for ${user?.name ?? "you"} in ${t.name}.`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="Effective role" value="tenant-user" />
        <Kpi label="Keycloak group" value="1" hint={group} />
        <Kpi label="Granted permissions" value={perms.length} />
        <Kpi label="Scope" value="organization" />
      </div>

      <div className="osac-panel" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <Table variant="compact">
          <Thead>
            <Tr><Th>Role</Th><Th>Source group</Th><Th>Realm</Th><Th>What it lets you do</Th></Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td><Label isCompact color="blue">tenant-user</Label></Td>
              <Td><code style={{ fontSize: 12 }}>{group}</code></Td>
              <Td><code style={{ fontSize: 12 }}>{t.short.toLowerCase()}.osac</code></Td>
              <Td style={{ fontSize: 13, color: "#5b6b7c" }}>
                Order from the catalog, provision and operate VMs, view your bare-metal allocations.
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </div>

      <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#5b6b7c", letterSpacing: ".04em", textTransform: "uppercase" }}>
        Granted permissions
      </h3>
      <div className="osac-panel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 6 }}>
        {perms.map((p) => (
          <code key={p} style={{ fontSize: 12, padding: "4px 8px", background: "#f6f9fc", border: "1px solid #e3e8ee", borderRadius: 6 }}>{p}</code>
        ))}
      </div>

      <Alert
        variant="info"
        isInline
        isPlain
        title="Your role comes from a Keycloak group your IdP places you in. To request more access, contact your tenant admin."
        style={{ marginTop: 16 }}
      />
    </>
  );
}
