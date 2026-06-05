import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Label, Modal, ModalVariant, ModalHeader, ModalBody, Wizard, WizardStep,
  Form, FormGroup, TextInput, TextArea, NumberInput, Select, SelectOption, SelectList, MenuToggle, Switch, Alert,
} from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons";
import { useState } from "react";

export const Route = createFileRoute("/app/provider/catalog-items")({ component: CatalogItemsPage });

const ITEMS = [
  { id: "vm-rhel9-s", name: "RHEL 9 — Small", template: "vm-rhel9", variant: "S", cpu: 2, ram: 8, presets: 4, published: true },
  { id: "vm-rhel9-m", name: "RHEL 9 — Medium", template: "vm-rhel9", variant: "M", cpu: 4, ram: 16, presets: 4, published: true },
  { id: "vm-rhel9-l", name: "RHEL 9 — Large", template: "vm-rhel9", variant: "L", cpu: 8, ram: 32, presets: 4, published: true },
  { id: "vm-rhel9-gpu", name: "RHEL 9 — GPU A100", template: "vm-rhel9-gpu", variant: "XL", cpu: 32, ram: 256, presets: 6, published: false },
  { id: "ocp-edge", name: "OpenShift 4.17 — Edge", template: "ocp-4.17", variant: "Edge", cpu: 3, ram: 24, presets: 8, published: true },
];

function CatalogItemsPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Catalog Items"
        subtitle="User-facing offerings layered on top of Ansible templates. Publish curated variants (S/M/L) with preset values and field constraints."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpen(true)}>Publish catalog item</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="Catalog items" value={ITEMS.length} />
        <Kpi label="Published" value={ITEMS.filter(i => i.published).length} tone="success" />
        <Kpi label="Backing templates" value={new Set(ITEMS.map(i => i.template)).size} hint="Ansible roles" />
        <Kpi label="Avg presets / item" value={Math.round(ITEMS.reduce((a, i) => a + i.presets, 0) / ITEMS.length)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {ITEMS.map(i => (
          <div key={i.id} className="osac-panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{i.name}</strong>
              <Label isCompact color={i.published ? "green" : "grey"}>{i.published ? "published" : "draft"}</Label>
            </div>
            <div style={{ fontSize: 12, color: "#5b6b7c" }}>Template: <code>{i.template}</code> · variant <strong>{i.variant}</strong></div>
            <div style={{ display: "flex", gap: 14, fontSize: 13 }}>
              <div><strong>{i.cpu}</strong> vCPU</div>
              <div><strong>{i.ram}</strong> GiB RAM</div>
              <div><strong>{i.presets}</strong> presets</div>
            </div>
            <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm">Edit presets</Button>
              <Button variant="link" size="sm">{i.published ? "Unpublish" : "Publish"}</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal variant={ModalVariant.large} isOpen={open} onClose={() => setOpen(false)} aria-label="Publish catalog item">
        <ModalHeader title="Publish catalog item" description="Curated user-facing offering layered on top of an Ansible template." />
        <ModalBody style={{ minHeight: 480 }}>
          <PublishWizard onDone={() => setOpen(false)} />
        </ModalBody>
      </Modal>
    </>
  );
}

function PublishWizard({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("RHEL 9 — Edge");
  const [desc, setDesc] = useState("Compact RHEL 9 profile preset for branch deployments.");
  const [template, setTemplate] = useState("vm-rhel9");
  const [tOpen, setTOpen] = useState(false);
  const [variant, setVariant] = useState("Edge");
  const [cpu, setCpu] = useState(2);
  const [ram, setRam] = useState(4);
  const [allowResize, setAllowResize] = useState(false);
  const [publish, setPublish] = useState(true);

  return (
    <Wizard onClose={onDone} onSave={onDone} height={500}>
      <WizardStep name="Identity" id="id">
        <Form>
          <FormGroup label="Catalog item name" isRequired fieldId="n"><TextInput id="n" value={name} onChange={(_, v) => setName(v)} /></FormGroup>
          <FormGroup label="Description" fieldId="d"><TextArea id="d" value={desc} onChange={(_, v) => setDesc(v)} rows={3} /></FormGroup>
          <FormGroup label="Variant label" fieldId="v"><TextInput id="v" value={variant} onChange={(_, v) => setVariant(v)} /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Template" id="tpl">
        <Form>
          <FormGroup label="Backing Ansible template" fieldId="t">
            <Select isOpen={tOpen} onOpenChange={setTOpen}
              toggle={(ref) => <MenuToggle ref={ref} onClick={() => setTOpen(v => !v)}>{template}</MenuToggle>}
              selected={template} onSelect={(_, v) => { setTemplate(String(v)); setTOpen(false); }}>
              <SelectList>
                {["vm-rhel9","vm-rhel9-gpu","vm-ubuntu22","vm-win2022","ocp-4.17","ocp-4.17-ai"].map(o =>
                  <SelectOption key={o} value={o}>{o}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
          <Alert variant="info" isInline isPlain title="One template can back many catalog items. Use variants to expose S / M / L sizes." />
        </Form>
      </WizardStep>
      <WizardStep name="Presets & constraints" id="pre">
        <Form>
          <FormGroup label="Preset vCPU" fieldId="c">
            <NumberInput value={cpu} min={1} max={64} onMinus={() => setCpu(n => Math.max(1, n - 1))} onPlus={() => setCpu(n => n + 1)} onChange={(e: any) => setCpu(Number((e.target as HTMLInputElement).value) || 1)} />
          </FormGroup>
          <FormGroup label="Preset RAM (GiB)" fieldId="r">
            <NumberInput value={ram} min={1} max={512} onMinus={() => setRam(n => Math.max(1, n - 1))} onPlus={() => setRam(n => n + 2)} onChange={(e: any) => setRam(Number((e.target as HTMLInputElement).value) || 1)} />
          </FormGroup>
          <FormGroup fieldId="ar"><Switch id="ar" label="Allow tenants to override cpu / ram at order time" isChecked={allowResize} onChange={(_, v) => setAllowResize(v)} /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Publish" id="pub" footer={{ nextButtonText: publish ? "Publish" : "Save draft" }}>
        <Form>
          <FormGroup fieldId="p"><Switch id="p" label="Publish to tenant catalog immediately" isChecked={publish} onChange={(_, v) => setPublish(v)} /></FormGroup>
        </Form>
        <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 6 }}>
          <div><strong>Name:</strong> {name} ({variant})</div>
          <div><strong>Template:</strong> <code>{template}</code></div>
          <div><strong>Preset:</strong> {cpu} vCPU · {ram} GiB RAM · resize {allowResize ? "allowed" : "locked"}</div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
