import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Switch, Label, Button } from "@patternfly/react-core";
import { useState } from "react";

export const Route = createFileRoute("/app/provider/storage-tiers")({ component: StoragePage });

const TIERS = [
  { id: "platinum", name: "Platinum", iops: "200k", media: "NVMe SSD RAID-10", lat: "<0.2 ms", on: true },
  { id: "gold", name: "Gold", iops: "100k", media: "NVMe SSD", lat: "<0.5 ms", on: true },
  { id: "silver", name: "Silver", iops: "30k", media: "SATA SSD", lat: "<2 ms", on: true },
  { id: "bronze", name: "Bronze", iops: "5k", media: "HDD (SMR)", lat: "<20 ms", on: false },
];

function StoragePage() {
  const [tiers, setTiers] = useState(TIERS);
  return (
    <>
      <PageHeader title="Storage Tiers" subtitle="Define and govern sovereign-cloud storage classes."
        actions={<Button variant="primary">New tier</Button>}
      />
      <div className="osac-panel" style={{ display: "grid", gap: 12 }}>
        {tiers.map((t) => (
          <div key={t.id} style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
            gap: 12, alignItems: "center", padding: 14, border: "1px solid #e3e8ee", borderRadius: 8,
          }}>
            <div>
              <strong>{t.name}</strong>{" "}
              <Label isCompact color={t.on ? "green" : "grey"}>{t.on ? "available" : "disabled"}</Label>
              <div style={{ fontSize: 12, color: "#5b6b7c" }}>{t.media}</div>
            </div>
            <div><span style={{ color: "#5b6b7c", fontSize: 12 }}>IOPS</span><div><strong>{t.iops}</strong></div></div>
            <div><span style={{ color: "#5b6b7c", fontSize: 12 }}>Latency</span><div><strong>{t.lat}</strong></div></div>
            <div><span style={{ color: "#5b6b7c", fontSize: 12 }}>Media</span><div style={{ fontSize: 13 }}>{t.media}</div></div>
            <Switch id={t.id} label="Available" isChecked={t.on}
              onChange={(_, v) => setTiers((p) => p.map((x) => x.id === t.id ? { ...x, on: v } : x))} />
          </div>
        ))}
      </div>
    </>
  );
}
