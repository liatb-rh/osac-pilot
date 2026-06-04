import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSession } from "@/lib/session";
import { Kpi } from "@/components/osac/Primitives";
import { PageHeader } from "@/components/osac/Primitives";
import { Button } from "@patternfly/react-core";
import { PlusCircleIcon, ServerIcon } from "@patternfly/react-icons";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  component: DashRouter,
});

function DashRouter() {
  const { role } = useSession();
  if (role === "providerAdmin") return <Navigate to="/app/provider" />;
  if (role === "tenantAdmin") return <Navigate to="/app/admin" />;
  return <TenantUserDashboard />;
}

function TenantUserDashboard() {
  return (
    <>
      <PageHeader
        title="VMaaS Dashboard"
        subtitle="Workload health across your tenant workspace, at a glance."
        actions={
          <Link to="/app/catalog"><Button icon={<PlusCircleIcon />} variant="primary">Create VM</Button></Link>
        }
      />

      <div className="osac-kpi-grid" style={{ marginBottom: 24 }}>
        <Kpi label="Running VMs" value={12} hint="+2 this week" tone="success" />
        <Kpi label="Stopped" value={3} tone="muted" />
        <Kpi label="Progressing" value={1} tone="warning" hint="Provisioning bnk-app-04" />
        <Kpi label="Failed" value={0} tone="default" />
        <Kpi label="Clusters" value={2} hint="1 READY · 1 UPGRADING" tone="success" />
        <Kpi label="vCPU in use" value="48 / 96" hint="Quota 50%" tone="default" />
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "2fr 1fr" }}>
        <div className="osac-panel">
          <h3 className="osac-section-title">Recent workloads</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { n: "bnk-app-01", s: "running", t: "RHEL 9 · 4 vCPU · 16 GiB" },
              { n: "bnk-app-02", s: "running", t: "RHEL 9 · 8 vCPU · 32 GiB" },
              { n: "bnk-warehouse", s: "stopped", t: "Ubuntu 22 · 16 vCPU · 64 GiB" },
              { n: "bnk-app-04", s: "progressing", t: "RHEL 9 · 4 vCPU · 16 GiB" },
            ].map((r) => (
              <div key={r.n} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", border: "1px solid #e3e8ee", borderRadius: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ServerIcon style={{ color: "#5b6b7c" }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.n}</div>
                    <div style={{ fontSize: 12, color: "#5b6b7c" }}>{r.t}</div>
                  </div>
                </div>
                <span><span className="osac-status-dot" data-s={r.s} /> <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{r.s}</span></span>
              </div>
            ))}
          </div>
        </div>
        <div className="osac-panel">
          <h3 className="osac-section-title">Activity</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {[
              "Provisioned bnk-app-02 (RHEL 9)",
              "Cluster prod-ocp upgraded to 4.17.3",
              "Network policy ns-app updated",
              "Quota request approved (+16 vCPU)",
            ].map((a, i) => (
              <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ width: 6, height: 6, background: "#0066cc", borderRadius: 50, marginTop: 7 }} />
                <div>
                  <div style={{ fontSize: 13 }}>{a}</div>
                  <div style={{ fontSize: 11, color: "#5b6b7c" }}>{i * 12 + 3} min ago</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
