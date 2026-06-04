import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Button, Label } from "@patternfly/react-core";

export const Route = createFileRoute("/app/provider/templates")({ component: TemplatesPage });

const TEMPLATES = [
  { n: "RHEL 9 — Small", scope: "global", cpu: 2, ram: 8 },
  { n: "RHEL 9 — Medium", scope: "global", cpu: 4, ram: 16 },
  { n: "RHEL 9 — Large", scope: "global", cpu: 8, ram: 32 },
  { n: "RHEL 9 — GPU A100", scope: "preview", cpu: 32, ram: 256 },
  { n: "Ubuntu 22 — Data", scope: "global", cpu: 16, ram: 64 },
  { n: "Windows Server 2022", scope: "global", cpu: 4, ram: 16 },
];

function TemplatesPage() {
  return (
    <>
      <PageHeader title="Global Templates" subtitle="Base images and shape definitions available to every tenant."
        actions={<Button variant="primary">Publish template</Button>}
      />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {TEMPLATES.map((t) => (
          <div key={t.n} className="osac-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{t.n}</strong>
              <Label isCompact color={t.scope === "preview" ? "orange" : "blue"}>{t.scope}</Label>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#5b6b7c" }}>
              {t.cpu} vCPU · {t.ram} GiB RAM
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm">Edit</Button>
              <Button variant="link" size="sm">Versions</Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
