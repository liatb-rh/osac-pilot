import { useState, type ReactNode } from "react";
import {
  FormGroup, TextInput, Switch, Select, SelectOption, SelectList, MenuToggle,
} from "@patternfly/react-core";
import {
  RedhatIcon, WindowsIcon, LinuxIcon, CloudIcon, ServerIcon, CubesIcon,
} from "@patternfly/react-icons";
import {
  tenantVisibleItems,
  type CatalogItem, type CatalogItemType, type ParamSchema,
} from "@/lib/catalog-data";

export function CatalogItemIcon({ item, size = 34 }: { item: CatalogItem; size?: number }) {
  const Icon =
    item.icon === "rhel" ? RedhatIcon :
    item.icon === "windows" ? WindowsIcon :
    item.icon === "linux" ? LinuxIcon :
    item.type === "cluster" ? CloudIcon :
    item.type === "baremetal" ? ServerIcon : CubesIcon;
  const bg = item.type === "vm" ? "#e7f1fb" : item.type === "cluster" ? "#f3ebfb" : "#fdf0e7";
  const fg = item.type === "vm" ? "#0066cc" : item.type === "cluster" ? "#6a3fb5" : "#b05c1f";
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, background: bg, color: fg,
      display: "grid", placeItems: "center", flexShrink: 0,
    }}>
      <Icon />
    </div>
  );
}

/** Gallery picker used as Step 1 of every provisioning wizard. */
export function CatalogItemPicker({
  type, selectedId, onSelect,
}: { type: CatalogItemType; selectedId?: string; onSelect: (item: CatalogItem) => void }) {
  const items = tenantVisibleItems(type);
  return (
    <div>
      <div style={{ fontSize: 13, color: "#5b6b7c", marginBottom: 10 }}>
        Published catalog items assigned to your user group. The selected item drives all following steps.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 10 }}>
        {items.map((i) => {
          const selected = i.id === selectedId;
          return (
            <button
              key={i.id} type="button" onClick={() => onSelect(i)}
              style={{
                textAlign: "left", cursor: "pointer", borderRadius: 10, padding: 12,
                background: selected ? "#e7f1fb" : "transparent",
                border: selected ? "2px solid #0066cc" : "1px solid #d2d8e0",
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CatalogItemIcon item={i} size={30} />
                <strong style={{ fontSize: 13 }}>{i.title}</strong>
              </div>
              {i.description && <div style={{ fontSize: 12, color: "#5b6b7c" }}>{i.description}</div>}
              <div style={{ display: "flex", gap: 10, fontSize: 12, marginTop: "auto", flexWrap: "wrap" }}>
                {i.fixedDefaults.cpu != null && <span><strong>{i.fixedDefaults.cpu}</strong> vCPU</span>}
                {i.fixedDefaults.memoryGib != null && <span><strong>{i.fixedDefaults.memoryGib}</strong> GiB</span>}
                {i.fixedDefaults.ocpVersion && <span>OCP <strong>{i.fixedDefaults.ocpVersion}</strong></span>}
                {i.fixedDefaults.nodeProfile && <code style={{ fontSize: 11 }}>{i.fixedDefaults.nodeProfile}</code>}
              </div>
            </button>
          );
        })}
        {items.length === 0 && (
          <div style={{ color: "#5b6b7c", fontSize: 13 }}>
            No published catalog items assigned to your group for this type.
          </div>
        )}
      </div>
    </div>
  );
}

export type DynamicValues = Record<string, string | number | boolean>;

export function dynamicDefaults(schema?: ParamSchema): DynamicValues {
  const out: DynamicValues = {};
  if (!schema) return out;
  for (const [key, p] of Object.entries(schema.properties)) {
    if (p.default !== undefined) out[key] = p.default;
    else if (p.enum && p.enum.length > 0) out[key] = p.enum[0];
    else if (p.type === "boolean") out[key] = false;
    else if (p.type === "number" || p.type === "integer") out[key] = 0;
    else out[key] = "";
  }
  return out;
}

/** Renders dynamic fields generically from a catalog item's paramSchema (JSON Schema draft-07). */
export function DynamicParamFields({
  schema, values, onChange,
}: {
  schema?: ParamSchema;
  values: DynamicValues;
  onChange: (key: string, value: string | number | boolean) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!schema || Object.keys(schema.properties).length === 0) {
    return <div style={{ color: "#5b6b7c", fontSize: 13 }}>This catalog item has no dynamic parameters.</div>;
  }

  return (
    <>
      {Object.entries(schema.properties).map(([key, p]) => {
        const label = p.title ?? key;
        const required = schema.required?.includes(key) ?? false;
        const ro = p.readOnly === true;
        let field: ReactNode;
        if (p.type === "boolean") {
          field = (
            <Switch
              id={`dyn-${key}`} isChecked={Boolean(values[key])} isDisabled={ro}
              onChange={(_, v) => onChange(key, v)}
              label={Boolean(values[key]) ? "Enabled" : "Disabled"}
            />
          );
        } else if (p.enum) {
          const open = openKey === key;
          field = (
            <Select
              isOpen={open} onOpenChange={(o) => setOpenKey(o ? key : null)}
              toggle={(ref) => (
                <MenuToggle ref={ref} isDisabled={ro} onClick={() => setOpenKey(open ? null : key)} isExpanded={open}>
                  {String(values[key] ?? "")}
                </MenuToggle>
              )}
              onSelect={(_, v) => { onChange(key, String(v)); setOpenKey(null); }}
            >
              <SelectList>
                {p.enum.map((o) => <SelectOption key={o} value={o}>{o}</SelectOption>)}
              </SelectList>
            </Select>
          );
        } else if (p.type === "number" || p.type === "integer") {
          field = (
            <TextInput
              id={`dyn-${key}`} type="number" isDisabled={ro}
              value={String(values[key] ?? "")}
              onChange={(_, v) => onChange(key, Number(v) || 0)}
            />
          );
        } else {
          field = (
            <TextInput
              id={`dyn-${key}`} isDisabled={ro}
              value={String(values[key] ?? "")}
              onChange={(_, v) => onChange(key, v)}
            />
          );
        }
        return (
          <FormGroup key={key} label={label} fieldId={`dyn-${key}`} isRequired={required}>
            {field}
            {(p.description || ro) && (
              <div style={{ fontSize: 12, color: "#5b6b7c", marginTop: 4 }}>
                {p.description}{p.description && ro ? " · " : ""}{ro ? "Read-only (set by the catalog item)" : ""}
              </div>
            )}
          </FormGroup>
        );
      })}
    </>
  );
}
