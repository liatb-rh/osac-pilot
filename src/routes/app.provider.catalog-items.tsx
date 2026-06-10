import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Label, Modal, ModalVariant, ModalHeader, ModalBody, Wizard, WizardStep,
  Form, FormGroup, TextInput, TextArea, NumberInput, Select, SelectOption, SelectList,
  MenuToggle, Switch, Alert, Checkbox,
} from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons";
import { useState } from "react";
import { CatalogItemIcon } from "@/components/osac/CatalogItemPicker";
import {
  CATALOG_ITEMS, TYPE_LABELS, TYPE_COLORS, USER_GROUPS,
  type CatalogItemType,
} from "@/lib/catalog-data";

export const Route = createFileRoute("/app/provider/catalog-items")({ component: CatalogItemsPage });

const TEMPLATES_BY_TYPE: Record<CatalogItemType, string[]> = {
  vm: ["vm-rhel9", "vm-rhel9-gpu", "vm-ubuntu22", "vm-win2022", "vm-win2025"],
  cluster: ["ocp-4.17", "ocp-4.17-gpu", "ocp-4.17-edge"],
  baremetal: ["bm-provision-generic", "bm-provision-gpu"],
};

function CatalogItemsPage() {
  const [open, setOpen] = useState(false);
  const published = CATALOG_ITEMS.filter((i) => i.published).length;
  const templates = new Set(CATALOG_ITEMS.map((i) => i.templateRef)).size;

  return (
    <>
      <PageHeader
        title="Catalog Items"
        subtitle="The single user-facing entity wrapping backing templates across VMs, Clusters, and Bare Metal. Templates are a provider-only concept and are never exposed to tenants."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpen(true)}>Publish catalog item</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="Catalog items" value={CATALOG_ITEMS.length} />
        <Kpi label="Published" value={published} tone="success" />
        <Kpi label="Drafts" value={CATALOG_ITEMS.length - published} tone={CATALOG_ITEMS.length - published > 0 ? "warning" : "default"} />
        <Kpi label="Backing templates" value={templates} hint="Ansible / provisioning roles" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {CATALOG_ITEMS.map((i) => (
          <div key={i.id} className="osac-panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CatalogItemIcon item={i} size={30} />
              <strong style={{ flex: 1, minWidth: 0 }}>{i.title}</strong>
              <Label isCompact color={TYPE_COLORS[i.type]}>{TYPE_LABELS[i.type]}</Label>
              <Label isCompact color={i.published ? "green" : "grey"}>{i.published ? "published" : "draft"}</Label>
            </div>
            <div style={{ fontSize: 12, color: "#5b6b7c" }}>
              Template: <code>{i.templateRef}</code>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 13, flexWrap: "wrap" }}>
              {i.fixedDefaults.cpu != null && <div><strong>{i.fixedDefaults.cpu}</strong> vCPU</div>}
              {i.fixedDefaults.memoryGib != null && <div><strong>{i.fixedDefaults.memoryGib}</strong> GiB RAM</div>}
              {i.fixedDefaults.ocpVersion && <div>OCP <strong>{i.fixedDefaults.ocpVersion}</strong></div>}
              {i.fixedDefaults.nodeProfile && <code style={{ fontSize: 12 }}>{i.fixedDefaults.nodeProfile}</code>}
              {i.paramSchema && (
                <div><strong>{Object.keys(i.paramSchema.properties).length}</strong> dynamic params</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#5b6b7c" }}>Groups:</span>
              {i.assignedGroups.length > 0
                ? i.assignedGroups.map((g) => <Label key={g} isCompact>{g}</Label>)
                : <span style={{ fontSize: 12, color: "#5b6b7c" }}>none assigned</span>}
            </div>
            <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm">Edit</Button>
              <Button variant="link" size="sm">{i.published ? "Unpublish" : "Publish"}</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal variant={ModalVariant.large} isOpen={open} onClose={() => setOpen(false)} aria-label="Publish catalog item">
        <ModalHeader
          title="Publish catalog item"
          description="Curated user-facing offering wrapping a backing template. One template can back many catalog items (S / M / L variants)."
        />
        <ModalBody style={{ minHeight: 520 }}>
          <PublishCatalogItemWizard onDone={() => setOpen(false)} />
        </ModalBody>
      </Modal>
    </>
  );
}

function PublishCatalogItemWizard({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("RHEL 9 — Edge");
  const [name, setName] = useState("vm-rhel9-edge");
  const [desc, setDesc] = useState("Compact RHEL 9 profile preset for branch deployments.");
  const [variant, setVariant] = useState("Edge");
  const [type, setType] = useState<CatalogItemType>("vm");
  const [typeOpen, setTypeOpen] = useState(false);
  const [icon, setIcon] = useState("rhel");
  const [iconOpen, setIconOpen] = useState(false);
  const [tags, setTags] = useState("general, linux");
  const [template, setTemplate] = useState(TEMPLATES_BY_TYPE.vm[0]);
  const [tOpen, setTOpen] = useState(false);
  const [cpu, setCpu] = useState(2);
  const [ram, setRam] = useState(4);
  const [disk, setDisk] = useState(64);
  const [ocpVersion, setOcpVersion] = useState("4.17.3");
  const [nodeProfile, setNodeProfile] = useState("bm.gp1.large");
  const [allowResize, setAllowResize] = useState(false);
  const [schemaText, setSchemaText] = useState(
    JSON.stringify(
      { type: "object", properties: { exampleParam: { type: "string", title: "Example parameter", default: "value" } } },
      null, 2,
    ),
  );
  const [groups, setGroups] = useState<string[]>(["grp-app-dev"]);
  const [publish, setPublish] = useState(true);

  let schemaError: string | null = null;
  try {
    if (schemaText.trim()) JSON.parse(schemaText);
  } catch (e) {
    schemaError = e instanceof Error ? e.message : "Invalid JSON";
  }

  const selectType = (t: CatalogItemType) => {
    setType(t);
    setTemplate(TEMPLATES_BY_TYPE[t][0]);
  };

  const toggleGroup = (g: string) =>
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  return (
    <Wizard onClose={onDone} onSave={onDone} height={540}>
      <WizardStep name="Identity" id="id">
        <Form>
          <FormGroup label="Display title" isRequired fieldId="ti">
            <TextInput id="ti" value={title} onChange={(_, v) => setTitle(v)} />
          </FormGroup>
          <FormGroup label="Machine name (slug)" isRequired fieldId="mn">
            <TextInput id="mn" value={name} onChange={(_, v) => setName(v)} />
          </FormGroup>
          <FormGroup label="Description" fieldId="d">
            <TextArea id="d" value={desc} onChange={(_, v) => setDesc(v)} rows={2} />
          </FormGroup>
          <FormGroup label="Variant label" fieldId="v">
            <TextInput id="v" value={variant} onChange={(_, v) => setVariant(v)} />
          </FormGroup>
          <FormGroup label="Type" isRequired fieldId="ty">
            <Select
              isOpen={typeOpen} onOpenChange={setTypeOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setTypeOpen((v) => !v)} isExpanded={typeOpen}>
                  {TYPE_LABELS[type]}
                </MenuToggle>
              )}
              selected={type}
              onSelect={(_, v) => { selectType(v as CatalogItemType); setTypeOpen(false); }}
            >
              <SelectList>
                {(["vm", "cluster", "baremetal"] as CatalogItemType[]).map((t) => (
                  <SelectOption key={t} value={t}>{TYPE_LABELS[t]}</SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup label="Icon" fieldId="ic">
            <Select
              isOpen={iconOpen} onOpenChange={setIconOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setIconOpen((v) => !v)} isExpanded={iconOpen}>{icon}</MenuToggle>
              )}
              selected={icon}
              onSelect={(_, v) => { setIcon(String(v)); setIconOpen(false); }}
            >
              <SelectList>
                {["rhel", "windows", "linux", "none"].map((o) => <SelectOption key={o} value={o}>{o}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup label="Tags (comma separated)" fieldId="tg">
            <TextInput id="tg" value={tags} onChange={(_, v) => setTags(v)} />
          </FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Template" id="tpl">
        <Form>
          <FormGroup label="Backing provisioning template" isRequired fieldId="t">
            <Select
              isOpen={tOpen} onOpenChange={setTOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setTOpen((v) => !v)} isExpanded={tOpen}>{template}</MenuToggle>
              )}
              selected={template}
              onSelect={(_, v) => { setTemplate(String(v)); setTOpen(false); }}
            >
              <SelectList>
                {TEMPLATES_BY_TYPE[type].map((o) => <SelectOption key={o} value={o}>{o}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
          <Alert
            variant="info" isInline
            title="Provider Admin only — tenants never see the backing template. One template can back many catalog items (S / M / L variants)."
          />
        </Form>
      </WizardStep>
      <WizardStep name="Fixed defaults" id="fix">
        <Form>
          {type !== "cluster" && type !== "baremetal" && (
            <>
              <FormGroup label="Preset vCPU" fieldId="c">
                <NumberInput
                  value={cpu} min={1} max={64}
                  onMinus={() => setCpu((n) => Math.max(1, n - 1))}
                  onPlus={() => setCpu((n) => n + 1)}
                  onChange={(e) => setCpu(Number((e.target as HTMLInputElement).value) || 1)}
                />
              </FormGroup>
              <FormGroup label="Preset RAM (GiB)" fieldId="r">
                <NumberInput
                  value={ram} min={1} max={512}
                  onMinus={() => setRam((n) => Math.max(1, n - 1))}
                  onPlus={() => setRam((n) => n + 2)}
                  onChange={(e) => setRam(Number((e.target as HTMLInputElement).value) || 1)}
                />
              </FormGroup>
              <FormGroup label="Boot disk (GiB)" fieldId="bd">
                <NumberInput
                  value={disk} min={16} max={2048}
                  onMinus={() => setDisk((n) => Math.max(16, n - 16))}
                  onPlus={() => setDisk((n) => n + 16)}
                  onChange={(e) => setDisk(Number((e.target as HTMLInputElement).value) || 16)}
                />
              </FormGroup>
              <FormGroup fieldId="ar">
                <Switch
                  id="ar" label="Allow tenant users to override CPU / RAM at order time"
                  isChecked={allowResize} onChange={(_, v) => setAllowResize(v)}
                />
              </FormGroup>
            </>
          )}
          {type === "cluster" && (
            <FormGroup label="OCP version" fieldId="ocp">
              <TextInput id="ocp" value={ocpVersion} onChange={(_, v) => setOcpVersion(v)} />
            </FormGroup>
          )}
          {type === "baremetal" && (
            <FormGroup label="Node profile" fieldId="np">
              <TextInput id="np" value={nodeProfile} onChange={(_, v) => setNodeProfile(v)} />
            </FormGroup>
          )}
        </Form>
      </WizardStep>
      <WizardStep name="Dynamic parameters" id="dyn">
        <Form>
          <FormGroup label="Parameter schema (JSON Schema draft-07)" fieldId="js">
            <TextArea
              id="js" rows={12} value={schemaText} onChange={(_, v) => setSchemaText(v)}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </FormGroup>
          {schemaError
            ? <Alert variant="danger" isInline title={`Invalid JSON: ${schemaError}`} />
            : (
              <Alert
                variant="info" isInline isPlain
                title="Fields render generically in the provisioning wizards. Mark fields readOnly to show them greyed out. Leave empty to skip the dynamic step."
              />
            )}
        </Form>
      </WizardStep>
      <WizardStep name="User groups" id="grp">
        <Form>
          <FormGroup label="Authorized user groups" fieldId="g">
            <div style={{ display: "grid", gap: 8 }}>
              {USER_GROUPS.map((g) => (
                <Checkbox
                  key={g} id={`grp-${g}`} label={g}
                  isChecked={groups.includes(g)}
                  onChange={() => toggleGroup(g)}
                />
              ))}
            </div>
          </FormGroup>
          <Alert
            variant="info" isInline isPlain
            title="Only assigned groups can see and use this item. Tenant Admins can re-assign within this authorized set, but cannot expand it."
          />
        </Form>
      </WizardStep>
      <WizardStep name="Publish" id="pub" footer={{ nextButtonText: publish ? "Publish" : "Save draft" }}>
        <Form>
          <FormGroup fieldId="p">
            <Switch
              id="p" label="Publish to tenant catalogs immediately"
              isChecked={publish} onChange={(_, v) => setPublish(v)}
            />
          </FormGroup>
        </Form>
        <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 6 }}>
          <div><strong>Title:</strong> {title} ({variant})</div>
          <div><strong>Slug:</strong> <code>{name}</code> · <strong>Type:</strong> {TYPE_LABELS[type]} · <strong>Icon:</strong> {icon}</div>
          <div><strong>Template:</strong> <code>{template}</code></div>
          {type === "vm" && <div><strong>Defaults:</strong> {cpu} vCPU · {ram} GiB RAM · {disk} GiB disk · resize {allowResize ? "allowed" : "locked"}</div>}
          {type === "cluster" && <div><strong>Defaults:</strong> OCP {ocpVersion}</div>}
          {type === "baremetal" && <div><strong>Defaults:</strong> node profile <code>{nodeProfile}</code></div>}
          <div><strong>Tags:</strong> {tags || "—"}</div>
          <div><strong>User groups:</strong> {groups.length > 0 ? groups.join(", ") : "none"}</div>
          <div><strong>Dynamic params:</strong> {schemaError ? "invalid schema" : schemaText.trim() ? "defined" : "none"}</div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
