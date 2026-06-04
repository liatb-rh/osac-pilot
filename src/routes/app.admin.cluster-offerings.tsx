import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Switch, Label } from "@patternfly/react-core";
import { useState } from "react";

export const Route = createFileRoute("/app/admin/cluster-offerings")({ component: ClusterOfferingsPage });

const OFFERINGS = [
  { id: "ocp-417", name: "OpenShift 4.17 — Standard", desc: "GA OpenShift cluster offering for production workloads.", risk: "stable" },
  { id: "ocp-416", name: "OpenShift 4.16 — Standard", desc: "Previous OCP release; supported until next quarter.", risk: "stable" },
  { id: "ocp-ai", name: "OpenShift AI — GPU enabled", desc: "Includes NVIDIA operator and GPU-accelerated node pools.", risk: "preview" },
  { id: "rosa-ha", name: "OCP HA — Multi-zone", desc: "3 control plane nodes spread across availability zones.", risk: "stable" },
];

function ClusterOfferingsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "ocp-417": true, "ocp-416": true, "ocp-ai": false, "rosa-ha": true,
  });
  return (
    <>
      <PageHeader title="Cluster Offerings" subtitle="Enable or disable cluster catalog items for users in your organization." />
      <div className="osac-panel" style={{ display: "grid", gap: 12 }}>
        {OFFERINGS.map((o) => (
          <div key={o.id} style={{
            display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center",
            padding: 14, border: "1px solid #e3e8ee", borderRadius: 8,
          }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <strong>{o.name}</strong>
                <Label isCompact color={o.risk === "preview" ? "orange" : "green"}>{o.risk}</Label>
              </div>
              <div style={{ fontSize: 13, color: "#5b6b7c" }}>{o.desc}</div>
            </div>
            <Switch
              id={o.id}
              label="Enabled"
              isChecked={enabled[o.id]}
              onChange={(_, v) => setEnabled((p) => ({ ...p, [o.id]: v }))}
            />
          </div>
        ))}
      </div>
    </>
  );
}
