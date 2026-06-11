import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import { CatalogItemIcon } from "@/components/osac/CatalogItemPicker";
import {
  tenantVisibleItems, TYPE_LABELS, TYPE_COLORS, WORKLOAD_LABELS, osOf,
  type CatalogItem, type CatalogItemType, type WorkloadProfile,
} from "@/lib/catalog-data";
import { findInstanceType } from "@/lib/instance-types-data";
import {
  Button, Label, SearchInput,
  Drawer, DrawerContent, DrawerContentBody, DrawerPanelContent,
  DrawerHead, DrawerActions, DrawerCloseButton, DrawerPanelBody,
} from "@patternfly/react-core";

export const Route = createFileRoute("/app/catalog")({ component: CatalogPage });

const TYPE_FILTERS: { id: "all" | CatalogItemType; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "vm", label: "VM" },
  { id: "cluster", label: "Cluster" },
  { id: "baremetal", label: "Bare Metal" },
];
const OS_FILTERS = ["RHEL", "Windows", "Linux"] as const;
const WL_FILTERS: WorkloadProfile[] = ["high-performance", "machine-learning", "data-processing", "analytics"];

function CatalogPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<"all" | CatalogItemType>("all");
  const [os, setOs] = useState<string>("all");
  const [wl, setWl] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<CatalogItem | null>(null);

  const items = useMemo(() => {
    const needle = q.toLowerCase();
    return tenantVisibleItems().filter((i) =>
      (type === "all" || i.type === type) &&
      (os === "all" || osOf(i) === os) &&
      (wl === "all" || i.workloadProfile === wl) &&
      (needle === "" ||
        i.title.toLowerCase().includes(needle) ||
        (i.description ?? "").toLowerCase().includes(needle) ||
        (i.tags ?? []).some((t) => t.toLowerCase().includes(needle)))
    );
  }, [type, os, wl, q]);

  const launchCreate = (i: CatalogItem) => {
    if (i.type === "vm") navigate({ to: "/app/vms", search: { catalogItem: i.id } });
    else if (i.type === "cluster") navigate({ to: "/app/clusters", search: { catalogItem: i.id } });
    else navigate({ to: "/app/bare-metal", search: { catalogItem: i.id } });
  };

  const panel = sel ? (
    <DrawerPanelContent widths={{ default: "width_33" }}>
      <DrawerHead>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CatalogItemIcon item={sel} size={40} />
          <div>
            <div style={{ fontWeight: 700 }}>{sel.title}</div>
            <Label isCompact color={TYPE_COLORS[sel.type]}>{TYPE_LABELS[sel.type]}</Label>
          </div>
        </div>
        <DrawerActions>
          <DrawerCloseButton onClick={() => setSel(null)} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <div style={{ display: "grid", gap: 14 }}>
          {sel.description && <p style={{ margin: 0, color: "#5b6b7c", fontSize: 13 }}>{sel.description}</p>}
          {sel.workloadProfile && (
            <div style={{ fontSize: 13 }}>
              <strong>Workload profile:</strong> {WORKLOAD_LABELS[sel.workloadProfile]}
            </div>
          )}
          {(sel.tags ?? []).length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(sel.tags ?? []).map((t) => (
                <Label key={t} isCompact color={t === "ai" ? "purple" : t === "gpu" ? "orange" : "blue"}>{t}</Label>
              ))}
            </div>
          )}
          <div className="osac-panel" style={{ display: "grid", gap: 6, fontSize: 13 }}>
            <strong style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#5b6b7c" }}>
              Defaults
            </strong>
            {(() => {
              const it = sel.type === "vm" ? findInstanceType(sel.fixedDefaults.instanceTypeId) : undefined;
              if (it) {
                return <>
                  <div>Instance type <strong>{it.displayName}</strong> <code style={{ fontSize: 12 }}>{it.name}</code></div>
                  <div><strong>{it.cpu}</strong> vCPU · <strong>{it.memoryGib}</strong> GiB RAM · <strong>{it.bootDiskGib}</strong> GiB boot disk</div>
                </>;
              }
              return <>
                {sel.fixedDefaults.cpu != null && <div><strong>{sel.fixedDefaults.cpu}</strong> vCPU</div>}
                {sel.fixedDefaults.memoryGib != null && <div><strong>{sel.fixedDefaults.memoryGib}</strong> GiB RAM</div>}
                {sel.fixedDefaults.bootDiskSizeGib != null && <div><strong>{sel.fixedDefaults.bootDiskSizeGib}</strong> GiB boot disk</div>}
                {sel.fixedDefaults.ocpVersion && <div>OCP version <strong>{sel.fixedDefaults.ocpVersion}</strong></div>}
                {sel.fixedDefaults.nodeProfile && <div>Node profile <code>{sel.fixedDefaults.nodeProfile}</code></div>}
              </>;
            })()}
          </div>
          {sel.paramSchema && Object.keys(sel.paramSchema.properties).length > 0 && (
            <div style={{ fontSize: 12, color: "#5b6b7c" }}>
              This item includes {Object.keys(sel.paramSchema.properties).length} additional parameter
              {Object.keys(sel.paramSchema.properties).length > 1 ? "s" : ""} configured during provisioning.
            </div>
          )}
          <Button variant="primary" isBlock onClick={() => launchCreate(sel)}>
            Create {TYPE_LABELS[sel.type]}
          </Button>
        </div>
      </DrawerPanelBody>
    </DrawerPanelContent>
  ) : undefined;

  return (
    <>
      <PageHeader
        title="Catalog"
        subtitle="Browse published catalog items across all resource types and provision workloads from them."
      />
      <Drawer isExpanded={!!sel} isInline>
        <DrawerContent panelContent={panel}>
          <DrawerContentBody>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              <aside style={{ width: 190, flexShrink: 0 }}>
                <FilterList
                  title="Type"
                  options={TYPE_FILTERS.map((t) => ({ id: t.id, label: t.label }))}
                  value={type}
                  onSelect={(id) => setType(id as "all" | CatalogItemType)}
                />
                <FilterList
                  title="OS"
                  options={[{ id: "all", label: "All" }, ...OS_FILTERS.map((o) => ({ id: o, label: o }))]}
                  value={os}
                  onSelect={setOs}
                />
                <FilterList
                  title="Workload"
                  options={[{ id: "all", label: "All" }, ...WL_FILTERS.map((w) => ({ id: w, label: WORKLOAD_LABELS[w] }))]}
                  value={wl}
                  onSelect={setWl}
                />
              </aside>
              <main style={{ flex: 1, minWidth: 0 }}>
                <SearchInput
                  placeholder="Search catalog items"
                  value={q}
                  onChange={(_, v) => setQ(v)}
                  onClear={() => setQ("")}
                  style={{ maxWidth: 360, marginBottom: 16 }}
                />
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                  {items.map((i) => (
                    <div
                      key={i.id}
                      className="osac-panel"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSel(i)}
                      onKeyDown={(e) => { if (e.key === "Enter") setSel(i); }}
                      style={{
                        display: "flex", flexDirection: "column", gap: 10, cursor: "pointer",
                        outline: sel?.id === i.id ? "2px solid #0066cc" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CatalogItemIcon item={i} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: 14 }}>{i.title}</strong>
                        </div>
                        <Label isCompact color={TYPE_COLORS[i.type]}>{TYPE_LABELS[i.type]}</Label>
                      </div>
                      {i.description && <div style={{ fontSize: 13, color: "#5b6b7c" }}>{i.description}</div>}
                      <div style={{ display: "flex", gap: 14, fontSize: 13, marginTop: "auto", flexWrap: "wrap" }}>
                        {i.fixedDefaults.cpu != null && <div><strong>{i.fixedDefaults.cpu}</strong> vCPU</div>}
                        {i.fixedDefaults.memoryGib != null && <div><strong>{i.fixedDefaults.memoryGib}</strong> GiB RAM</div>}
                        {i.fixedDefaults.ocpVersion && <div>OCP <strong>{i.fixedDefaults.ocpVersion}</strong></div>}
                        {i.fixedDefaults.nodeProfile && <code style={{ fontSize: 12 }}>{i.fixedDefaults.nodeProfile}</code>}
                      </div>
                      {(i.tags ?? []).length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {(i.tags ?? []).map((t) => (
                            <Label key={t} isCompact color={t === "ai" ? "purple" : t === "gpu" ? "orange" : "blue"}>{t}</Label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div style={{ color: "#5b6b7c", fontSize: 13, padding: 24 }}>
                      No catalog items match the current filters.
                    </div>
                  )}
                </div>
              </main>
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function FilterList({
  title, options, value, onSelect,
}: {
  title: string;
  options: { id: string; label: string }[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "#5b6b7c", marginBottom: 6,
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id} type="button" onClick={() => onSelect(o.id)}
              style={{
                textAlign: "left", border: "none",
                background: active ? "#e7f1fb" : "transparent",
                color: active ? "#0066cc" : "inherit",
                fontWeight: active ? 600 : 400,
                padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
