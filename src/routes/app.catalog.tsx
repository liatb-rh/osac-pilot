import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Label, Button } from "@patternfly/react-core";

export const Route = createFileRoute("/app/catalog")({ component: CatalogPage });

const TEMPLATES = [
  { id: "rhel-9-small", name: "RHEL 9 — Small", os: "Red Hat Enterprise Linux 9", cpu: 2, ram: 8, tags: ["general", "linux"] },
  { id: "rhel-9-medium", name: "RHEL 9 — Medium", os: "Red Hat Enterprise Linux 9", cpu: 4, ram: 16, tags: ["general"] },
  { id: "rhel-9-large", name: "RHEL 9 — Large", os: "Red Hat Enterprise Linux 9", cpu: 8, ram: 32, tags: ["compute"] },
  { id: "ubuntu-22-large", name: "Ubuntu 22 — Large", os: "Ubuntu 22.04 LTS", cpu: 16, ram: 64, tags: ["data"] },
  { id: "rhel-9-gpu", name: "RHEL 9 — GPU A100", os: "RHEL 9 + NVIDIA A100", cpu: 32, ram: 256, tags: ["ai", "gpu"] },
  { id: "windows-2022", name: "Windows Server 2022", os: "Windows Server 2022", cpu: 4, ram: 16, tags: ["windows"] },
];

function CatalogPage() {
  return (
    <>
      <PageHeader title="Template Catalog" subtitle="Curated base images approved for this tenant organization." />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {TEMPLATES.map((t) => (
          <div key={t.id} className="osac-panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{t.name}</strong>
              <div style={{ display: "flex", gap: 4 }}>
                {t.tags.map((tag) => <Label key={tag} isCompact color={tag === "ai" ? "purple" : tag === "gpu" ? "orange" : "blue"}>{tag}</Label>)}
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#5b6b7c" }}>{t.os}</div>
            <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
              <div><strong>{t.cpu}</strong> vCPU</div>
              <div><strong>{t.ram}</strong> GiB RAM</div>
            </div>
            <Link to="/app/vms" style={{ marginTop: "auto" }}>
              <Button variant="secondary" isBlock>Provision from template</Button>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
