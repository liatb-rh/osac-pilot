import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import { Button } from "@patternfly/react-core";
import { BARE_METAL_HOSTS } from "@/lib/bare-metal-data";

export const Route = createFileRoute("/app/provider/")({ component: ProviderOverview });

function ProviderOverview() {
  const totalBm = BARE_METAL_HOSTS.length;
  const availableBm = BARE_METAL_HOSTS.filter((h) => h.discoveryState === "available").length;
  const allocatedBm = BARE_METAL_HOSTS.filter((h) => h.discoveryState === "allocated").length;
  const maintBm = BARE_METAL_HOSTS.filter((h) => h.discoveryState === "maintenance").length;
  return (
    <>
      <PageHeader
        title="Provider Operations"
        subtitle="Platform-wide visibility across tenants, infrastructure, agents, and policy."
        actions={<Link to="/app/provider/tenants"><Button variant="primary">Manage tenants</Button></Link>}
      />
      <div className="osac-kpi-grid" style={{ marginBottom: 24 }}>
        <Kpi label="Tenant organizations" value={14} hint="2 onboarding" tone="default" />
        <Kpi label="Active VMs (platform)" value={1284} hint="+86 today" tone="success" />
        <Kpi label="Clusters (platform)" value={37} tone="default" />
        <Kpi label="Bare metal hosts" value={`${allocatedBm} / ${totalBm}`} hint={`${availableBm} available · ${maintBm} maintenance`} tone="default" />
        <Kpi label="Infrastructure agents" value="208 / 212" tone="warning" hint="4 unreachable" />
        <Kpi label="Storage tiers" value={4} tone="default" />
        <Kpi label="Open incidents" value={2} tone="danger" />
      </div>


      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "2fr 1fr" }}>
        <div className="osac-panel">
          <h3 className="osac-section-title">Resource utilization (24h)</h3>
          <UtilizationChart />
        </div>
        <div className="osac-panel">
          <h3 className="osac-section-title">Top tenants by vCPU</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {[
              { n: "Northstar Bank", v: 420, max: 600 },
              { n: "Bluestone Financial", v: 280, max: 500 },
              { n: "Aurora Health", v: 190, max: 300 },
              { n: "Helix Logistics", v: 124, max: 200 },
            ].map((t) => (
              <li key={t.n}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{t.n}</span>
                  <span style={{ color: "#5b6b7c" }}>{t.v} / {t.max}</span>
                </div>
                <div style={{ background: "#eef3f8", height: 6, borderRadius: 3 }}>
                  <div style={{ background: "#0066cc", height: 6, borderRadius: 3, width: `${(t.v / t.max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function UtilizationChart() {
  const points = Array.from({ length: 24 }, (_, i) => 40 + Math.round(Math.sin(i / 2) * 18 + (i * 0.6)));
  const max = Math.max(...points);
  const W = 600, H = 160, pad = 24;
  const dx = (W - pad * 2) / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${pad + i * dx} ${H - pad - (p / max) * (H - pad * 2)}`).join(" ");
  const area = `${path} L ${pad + (points.length - 1) * dx} ${H - pad} L ${pad} ${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Utilization">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066cc" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0066cc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g)" />
      <path d={path} fill="none" stroke="#0066cc" strokeWidth="2" />
    </svg>
  );
}
