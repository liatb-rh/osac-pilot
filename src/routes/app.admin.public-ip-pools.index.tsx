import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, Kpi, Empty } from "@/components/osac/Primitives";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { poolsForTenant, ipsForPool, groupAssignmentsForPool, ipsForTenant } from "@/lib/public-ip-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/app/admin/public-ip-pools/")({ component: AdminPoolsPage });

function AdminPoolsPage() {
  const navigate = useNavigate();
  const { tenant } = useSession();
  const pools = poolsForTenant(tenant);
  const tenantIps = ipsForTenant(tenant);

  return (
    <>
      <PageHeader
        title="Public IP Pools"
        subtitle="Pools assigned to this tenant by the provider. Map pools to user groups and set optional allocation quotas."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Assigned pools" value={pools.length} />
        <Kpi label="Tenant allocations" value={tenantIps.length} hint={`${tenantIps.filter((ip) => ip.state === "attached").length} attached`} />
        <Kpi label="Group assignments" value={pools.reduce((a, p) => a + groupAssignmentsForPool(p.id, tenant).length, 0)} />
      </div>

      {pools.length === 0 ? (
        <Empty title="No pools assigned to this tenant" body="Ask the provider admin to assign a public IP pool to your tenant namespace." />
      ) : (
        <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
          <Table aria-label="Tenant public IP pools">
            <Thead><Tr><Th>Name</Th><Th>CIDR</Th><Th>Zone</Th><Th>Status</Th><Th>User groups</Th><Th>Tenant allocations</Th></Tr></Thead>
            <Tbody>
              {pools.map((p) => {
                const groups = groupAssignmentsForPool(p.id, tenant);
                const count = ipsForPool(p.id).filter((ip) => ip.tenant === tenant).length;
                const dot = p.status === "ready" ? "ready" : p.status === "failed" ? "failed" : "progressing";
                return (
                  <Tr key={p.id} isClickable onRowClick={() => navigate({ to: "/app/admin/public-ip-pools/$id", params: { id: p.id } })}>
                    <Td>
                      <Link to="/app/admin/public-ip-pools/$id" params={{ id: p.id }} style={{ color: "#0066cc", fontWeight: 600 }}>
                        {p.name}
                      </Link>
                    </Td>
                    <Td><code>{p.cidr}</code></Td>
                    <Td>{p.zone ?? "—"}</Td>
                    <Td><span className="osac-status-dot" data-s={dot} /><span style={{ textTransform: "capitalize" }}>{p.status}</span></Td>
                    <Td>{groups.length > 0 ? groups.map((g) => g.group).join(", ") : <span style={{ color: "#5b6b7c" }}>Not assigned</span>}</Td>
                    <Td>{count}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>
      )}
    </>
  );
}
