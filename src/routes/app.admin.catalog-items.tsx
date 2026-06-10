import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Label, Switch, Modal, ModalVariant, ModalHeader, ModalBody,
  Select, SelectOption, SelectList, MenuToggle, Alert,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { AngleUpIcon, AngleDownIcon } from "@patternfly/react-icons";
import { CatalogItemIcon } from "@/components/osac/CatalogItemPicker";
import {
  CATALOG_ITEMS, TYPE_LABELS, TYPE_COLORS, WORKLOAD_LABELS, findCatalogItem,
  type CatalogItem,
} from "@/lib/catalog-data";

export const Route = createFileRoute("/app/admin/catalog-items")({ component: TenantCatalogItemsPage });

interface RowState { id: string; enabled: boolean; groups: string[] }

function TenantCatalogItemsPage() {
  const available = CATALOG_ITEMS
    .filter((i) => i.assignedGroups.length > 0)
    .slice()
    .sort((a, b) => a.order - b.order);

  const [rows, setRows] = useState<RowState[]>(
    available.map((i) => ({ id: i.id, enabled: i.tenantEnabled, groups: [...i.assignedGroups] })),
  );
  const [groupOpenFor, setGroupOpenFor] = useState<string | null>(null);
  const [detail, setDetail] = useState<CatalogItem | null>(null);

  const enabledCount = rows.filter((r) => r.enabled).length;
  const groupsCovered = new Set(rows.flatMap((r) => r.groups)).size;

  const move = (idx: number, dir: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const toggleGroup = (rowId: string, group: string) => {
    setRows((prev) => prev.map((r) =>
      r.id === rowId
        ? { ...r, groups: r.groups.includes(group) ? r.groups.filter((g) => g !== group) : [...r.groups, group] }
        : r,
    ));
  };

  return (
    <>
      <PageHeader
        title="Catalog Items"
        subtitle="Manage the catalog items the Provider Admin has made available to this tenant. Enable or disable items, assign them to user groups, and set their display order."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="Available items" value={rows.length} hint="Made available by the provider" />
        <Kpi label="Enabled" value={enabledCount} tone="success" />
        <Kpi label="Disabled" value={rows.length - enabledCount} tone={rows.length - enabledCount > 0 ? "warning" : "default"} />
        <Kpi label="User groups covered" value={groupsCovered} />
      </div>

      <Alert
        variant="info" isInline
        title="Templates and parameter schemas are managed by the Provider Admin and are not visible here."
        style={{ marginBottom: 16 }}
      />

      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table aria-label="Tenant catalog items">
          <Thead>
            <Tr>
              <Th width={10}>Order</Th>
              <Th>Catalog item</Th>
              <Th>Type</Th>
              <Th>Workload</Th>
              <Th>Enabled</Th>
              <Th>User groups</Th>
              <Th screenReaderText="Actions" />
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((r, idx) => {
              const item = findCatalogItem(r.id);
              if (!item) return null;
              const open = groupOpenFor === r.id;
              return (
                <Tr key={r.id}>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <span style={{ width: 22, fontVariantNumeric: "tabular-nums" }}>{idx + 1}</span>
                      <Button variant="plain" size="sm" aria-label="Move up" isDisabled={idx === 0} onClick={() => move(idx, -1)}>
                        <AngleUpIcon />
                      </Button>
                      <Button variant="plain" size="sm" aria-label="Move down" isDisabled={idx === rows.length - 1} onClick={() => move(idx, 1)}>
                        <AngleDownIcon />
                      </Button>
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CatalogItemIcon item={item} size={28} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: "#5b6b7c" }}>{item.metadata.name}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><Label isCompact color={TYPE_COLORS[item.type]}>{TYPE_LABELS[item.type]}</Label></Td>
                  <Td>{item.workloadProfile ? WORKLOAD_LABELS[item.workloadProfile] : "—"}</Td>
                  <Td>
                    <Switch
                      id={`en-${r.id}`} aria-label={`Enable ${item.title}`}
                      isChecked={r.enabled}
                      onChange={(_, v) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, enabled: v } : x))}
                    />
                  </Td>
                  <Td style={{ minWidth: 220 }}>
                    <Select
                      role="menu" isOpen={open}
                      onOpenChange={(o) => setGroupOpenFor(o ? r.id : null)}
                      toggle={(ref) => (
                        <MenuToggle ref={ref} onClick={() => setGroupOpenFor(open ? null : r.id)} isExpanded={open} size="sm">
                          {r.groups.length > 0 ? `${r.groups.length} group${r.groups.length > 1 ? "s" : ""}` : "No groups"}
                        </MenuToggle>
                      )}
                      onSelect={(_, v) => toggleGroup(r.id, String(v))}
                    >
                      <SelectList>
                        {item.assignedGroups.map((g) => (
                          <SelectOption key={g} value={g} hasCheckbox isSelected={r.groups.includes(g)}>
                            {g}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                    <div style={{ fontSize: 11, color: "#5b6b7c", marginTop: 4 }}>
                      Limited to groups authorized by the provider
                    </div>
                  </Td>
                  <Td>
                    <Button variant="link" size="sm" onClick={() => setDetail(item)}>View details</Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>

      <Modal variant={ModalVariant.medium} isOpen={!!detail} onClose={() => setDetail(null)} aria-label="Catalog item details">
        {detail && (
          <>
            <ModalHeader title={detail.title} description={detail.description} />
            <ModalBody>
              <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
                <div><strong>Machine name:</strong> <code>{detail.metadata.name}</code></div>
                <div><strong>Type:</strong> {TYPE_LABELS[detail.type]}</div>
                {detail.workloadProfile && <div><strong>Workload profile:</strong> {WORKLOAD_LABELS[detail.workloadProfile]}</div>}
                {(detail.tags ?? []).length > 0 && (
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <strong>Tags:</strong>
                    {(detail.tags ?? []).map((t) => <Label key={t} isCompact color="blue">{t}</Label>)}
                  </div>
                )}
                <div className="osac-panel" style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <strong style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#5b6b7c" }}>
                    Fixed defaults
                  </strong>
                  {detail.fixedDefaults.cpu != null && <div>{detail.fixedDefaults.cpu} vCPU</div>}
                  {detail.fixedDefaults.memoryGib != null && <div>{detail.fixedDefaults.memoryGib} GiB RAM</div>}
                  {detail.fixedDefaults.bootDiskSizeGib != null && <div>{detail.fixedDefaults.bootDiskSizeGib} GiB boot disk</div>}
                  {detail.fixedDefaults.ocpVersion && <div>OCP version {detail.fixedDefaults.ocpVersion}</div>}
                  {detail.fixedDefaults.nodeProfile && <div>Node profile <code>{detail.fixedDefaults.nodeProfile}</code></div>}
                  <div style={{ color: "#5b6b7c", fontSize: 12 }}>
                    Resize by users: {detail.fixedDefaults.allowUserResize === false ? "locked" : "allowed"}
                  </div>
                </div>
                <Alert
                  variant="info" isInline isPlain
                  title="The backing template and parameter schema are Provider Admin-only and cannot be changed here."
                />
              </div>
            </ModalBody>
          </>
        )}
      </Modal>
    </>
  );
}
