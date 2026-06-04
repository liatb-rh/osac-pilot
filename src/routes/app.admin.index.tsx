import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import { Button } from "@patternfly/react-core";

export const Route = createFileRoute("/app/admin/")({ component: AdminOverview });

function AdminOverview() {
  return (
    <>
      <PageHeader title="Tenant Administration" subtitle="Govern users, quota, networks, and cluster offerings for your organization."
        actions={<Link to="/app/admin/users"><Button variant="primary">Manage users</Button></Link>}
      />
      <div className="osac-kpi-grid" style={{ marginBottom: 24 }}>
        <Kpi label="Active users" value={48} hint="+3 this week" tone="success" />
        <Kpi label="Pending invites" value={4} tone="warning" />
        <Kpi label="vCPU quota used" value="120 / 256" tone="default" />
        <Kpi label="Memory quota used" value="540 / 1024 GiB" tone="default" />
        <Kpi label="Virtual networks" value={6} tone="default" />
        <Kpi label="Cluster offerings enabled" value={4} tone="success" />
      </div>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
        <div className="osac-panel">
          <h3 className="osac-section-title">Policy compliance</h3>
          <ul style={{ paddingLeft: 16, color: "#5b6b7c", lineHeight: 1.8 }}>
            <li><span className="osac-status-dot" data-s="ready" /> All VMs encrypted at rest</li>
            <li><span className="osac-status-dot" data-s="ready" /> Network policies enforced</li>
            <li><span className="osac-status-dot" data-s="progressing" /> 2 users pending MFA enrollment</li>
            <li><span className="osac-status-dot" data-s="ready" /> Audit log forwarded to SIEM</li>
          </ul>
        </div>
        <div className="osac-panel">
          <h3 className="osac-section-title">Quick actions</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <Link to="/app/admin/quota"><Button variant="secondary" isBlock>Request quota increase</Button></Link>
            <Link to="/app/admin/networks"><Button variant="secondary" isBlock>Manage networks</Button></Link>
            <Link to="/app/admin/cluster-offerings"><Button variant="secondary" isBlock>Configure cluster offerings</Button></Link>
          </div>
        </div>
      </div>
    </>
  );
}
