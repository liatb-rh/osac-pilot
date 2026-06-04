import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Label } from "@patternfly/react-core";

export const Route = createFileRoute("/app/activity")({ component: ActivityPage });

const RISK_COLOR: Record<string, "red" | "orange" | "blue"> = { high: "red", medium: "orange", low: "blue" };

const ENTRIES = [
  { t: "3 min ago", actor: "alice@northstar", action: "Provisioned VM bnk-app-02", risk: "high" },
  { t: "12 min ago", actor: "system", action: "Cluster prod-ocp upgrade started → 4.17.3", risk: "high" },
  { t: "44 min ago", actor: "alice@northstar", action: "Updated network policy ns-app", risk: "medium" },
  { t: "1 h ago", actor: "ops@vertexa", action: "Approved quota request +16 vCPU", risk: "medium" },
  { t: "2 h ago", actor: "carl@northstar", action: "Downloaded kubeconfig for dev-ocp", risk: "medium" },
  { t: "3 h ago", actor: "system", action: "Storage tier 'gold' availability toggled", risk: "high" },
  { t: "yesterday", actor: "alice@northstar", action: "Signed in from new device", risk: "low" },
];

function ActivityPage() {
  return (
    <>
      <PageHeader title="Recent Activity" subtitle="Audit-grade event stream for your scope." />
      <div className="osac-panel">
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
          {ENTRIES.map((e, i) => (
            <li key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 12, alignItems: "center", paddingBottom: 12, borderBottom: i < ENTRIES.length - 1 ? "1px solid #eef3f8" : "none" }}>
              <div style={{ fontSize: 12, color: "#5b6b7c" }}>{e.t}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{e.action}</div>
                <div style={{ fontSize: 12, color: "#5b6b7c" }}>by {e.actor}</div>
              </div>
              <Label color={RISK_COLOR[e.risk]} isCompact>{e.risk} risk</Label>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
