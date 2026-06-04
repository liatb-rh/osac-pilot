import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import { Button, Progress, ProgressMeasureLocation } from "@patternfly/react-core";

export const Route = createFileRoute("/app/admin/quota")({ component: QuotaPage });

const ITEMS = [
  { l: "vCPU", used: 120, total: 256 },
  { l: "Memory (GiB)", used: 540, total: 1024 },
  { l: "Block storage (TiB)", used: 18, total: 40 },
  { l: "Public IPs", used: 6, total: 16 },
  { l: "VMs", used: 42, total: 100 },
  { l: "Clusters", used: 2, total: 6 },
];

function QuotaPage() {
  return (
    <>
      <PageHeader title="Tenant Quota" subtitle="Allocation vs usage across sovereign cloud primitives."
        actions={<Button variant="primary">Request increase</Button>}
      />
      <div className="osac-kpi-grid" style={{ marginBottom: 24 }}>
        <Kpi label="Overall utilization" value="47%" tone="default" />
        <Kpi label="Approaching limit" value={1} tone="warning" hint="Block storage at 45%" />
        <Kpi label="Pending requests" value={1} tone="muted" />
      </div>
      <div className="osac-panel">
        <h3 className="osac-section-title">Resource quotas</h3>
        <div style={{ display: "grid", gap: 18 }}>
          {ITEMS.map((q) => {
            const pct = Math.round((q.used / q.total) * 100);
            return (
              <Progress key={q.l} value={pct}
                title={`${q.l} — ${q.used} / ${q.total} (${pct}%)`}
                measureLocation={ProgressMeasureLocation.outside}
                variant={pct > 80 ? "danger" : pct > 60 ? "warning" : "success"}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
