import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Button, Label, Modal, ModalVariant, ModalHeader, ModalBody,
  Wizard, WizardStep, Form, FormGroup, TextInput, TextArea, Radio,
  NumberInput, Checkbox, FormSelect, FormSelectOption, Alert, ClipboardCopy,
  ClipboardCopyVariant,
} from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons";
import { useState } from "react";
import { HOST_TYPES, SUBNETS } from "@/lib/osac-api";
import { STORAGE_TIERS, tierProtocol } from "@/lib/storage-tiers-data";

export const Route = createFileRoute("/app/provider/templates")({ component: TemplatesPage });

type TemplateScope = "global" | "preview";
type TemplateRow = {
  n: string;
  scope: TemplateScope;
  cpu: number;
  ram: number;
  os?: string;
  version?: string;
  publishedAt?: string;
};

const SEED_TEMPLATES: TemplateRow[] = [
  { n: "RHEL 9 — Small", scope: "global", cpu: 2, ram: 8, os: "rhel-9", version: "1.4.0", publishedAt: "2026-03-12" },
  { n: "RHEL 9 — Medium", scope: "global", cpu: 4, ram: 16, os: "rhel-9", version: "1.4.0", publishedAt: "2026-03-12" },
  { n: "RHEL 9 — Large", scope: "global", cpu: 8, ram: 32, os: "rhel-9", version: "1.4.0", publishedAt: "2026-03-12" },
  { n: "RHEL 9 — GPU A100", scope: "preview", cpu: 32, ram: 256, os: "rhel-9", version: "0.9.0-rc1", publishedAt: "2026-05-30" },
  { n: "Ubuntu 22 — Data", scope: "global", cpu: 16, ram: 64, os: "ubuntu-22", version: "2.1.0", publishedAt: "2026-04-02" },
  { n: "Windows Server 2022", scope: "global", cpu: 4, ram: 16, os: "windows-2022", version: "1.0.3", publishedAt: "2026-02-18" },
];

const BASE_IMAGES = [
  { id: "rhel-9", label: "RHEL 9.4", ref: "quay.io/osac/rhel-9:9.4" },
  { id: "ubuntu-22", label: "Ubuntu 22.04 LTS", ref: "quay.io/osac/ubuntu:22.04" },
  { id: "windows-2022", label: "Windows Server 2022", ref: "quay.io/osac/win:2022" },
  { id: "rocky-9", label: "Rocky Linux 9", ref: "quay.io/osac/rocky:9" },
];

function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>(SEED_TEMPLATES);
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Global Templates"
        subtitle="Base images and shape definitions available to every tenant."
        actions={
          <Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setWizardOpen(true)}>
            Publish template
          </Button>
        }
      />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {templates.map((t) => (
          <div key={t.n} className="osac-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{t.n}</strong>
              <Label isCompact color={t.scope === "preview" ? "orange" : "blue"}>{t.scope}</Label>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#5b6b7c" }}>
              {t.cpu} vCPU · {t.ram} GiB RAM
            </div>
            {(t.version || t.publishedAt) && (
              <div style={{ marginTop: 4, fontSize: 12, color: "#8b96a3" }}>
                {t.version && <>v{t.version}</>} {t.publishedAt && <>· {t.publishedAt}</>}
              </div>
            )}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm">Edit</Button>
              <Button variant="link" size="sm">Versions</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal variant={ModalVariant.large} isOpen={wizardOpen} onClose={() => setWizardOpen(false)} aria-label="Publish template">
        <ModalHeader title="Publish template" description="Promote a base image and shape definition to the global tenant catalog." />
        <ModalBody style={{ minHeight: 520 }}>
          <PublishTemplateWizard
            onDone={(row) => {
              if (row) setTemplates((p) => [row, ...p]);
              setWizardOpen(false);
            }}
          />
        </ModalBody>
      </Modal>
    </>
  );
}

function PublishTemplateWizard({ onDone }: { onDone: (row?: TemplateRow) => void }) {
  const [name, setName] = useState("RHEL 9 — XLarge");
  const [desc, setDesc] = useState("High-memory profile for in-memory analytics workloads.");
  const [version, setVersion] = useState("1.0.0");
  const [scope, setScope] = useState<TemplateScope>("global");

  const [baseId, setBaseId] = useState(BASE_IMAGES[0].id);
  const base = BASE_IMAGES.find((b) => b.id === baseId)!;

  const [cpu, setCpu] = useState(16);
  const [ram, setRam] = useState(128);
  const [bootDisk, setBootDisk] = useState(120);
  const [hostType, setHostType] = useState(HOST_TYPES[1].id);

  const [storageTier, setStorageTier] = useState(
    STORAGE_TIERS.find((t) => t.is_default)?.id ?? STORAGE_TIERS[0]?.id ?? "",
  );
  const [defaultSubnet, setDefaultSubnet] = useState(SUBNETS[0]?.id ?? "");
  const [cloudInit, setCloudInit] = useState(true);

  const enabledTiers = STORAGE_TIERS.filter((t) => t.enabled);
  const selectedTier = enabledTiers.find((t) => t.id === storageTier);

  const manifest = `apiVersion: osac.io/v1
kind: VirtualMachineTemplate
metadata:
  name: ${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}
  scope: ${scope}
  version: "${version}"
spec:
  image:
    sourceType: registry
    sourceRef: ${base.ref}
  shape:
    cores: ${cpu}
    memoryGiB: ${ram}
    hostType: ${hostType}
  bootDisk:
    sizeGiB: ${bootDisk}
    storageTier: ${storageTier}
  network:
    defaultSubnet: ${defaultSubnet}
  cloudInit: ${cloudInit}`;

  const publish = () => {
    onDone({
      n: name, scope, cpu, ram, os: baseId, version,
      publishedAt: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <Wizard onClose={() => onDone()} onSave={publish} height={500}>
      <WizardStep name="Identity" id="ident">
        <Form>
          <FormGroup label="Template name" isRequired fieldId="n">
            <TextInput id="n" value={name} onChange={(_, v) => setName(v)} />
          </FormGroup>
          <FormGroup label="Description" fieldId="d">
            <TextArea id="d" value={desc} onChange={(_, v) => setDesc(v)} rows={3} />
          </FormGroup>
          <FormGroup label="Version" isRequired fieldId="v">
            <TextInput id="v" value={version} onChange={(_, v) => setVersion(v)} />
          </FormGroup>
          <FormGroup label="Distribution scope" fieldId="scope" role="radiogroup">
            <Radio id="s-global" name="scope" label="Global — published to every tenant catalog"
              isChecked={scope === "global"} onChange={() => setScope("global")} />
            <Radio id="s-preview" name="scope" label="Preview — opt-in tenants only, no SLA"
              isChecked={scope === "preview"} onChange={() => setScope("preview")} />
          </FormGroup>
        </Form>
      </WizardStep>

      <WizardStep name="Base image" id="image">
        <Form>
          <FormGroup label="Base image" isRequired fieldId="img">
            <FormSelect id="img" value={baseId} onChange={(_, v) => setBaseId(v)}>
              {BASE_IMAGES.map((b) => (
                <FormSelectOption key={b.id} value={b.id} label={b.label} />
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup label="Source reference" fieldId="ref">
            <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" variant={ClipboardCopyVariant.inlineCompact}>
              {base.ref}
            </ClipboardCopy>
          </FormGroup>
          <FormGroup fieldId="ci">
            <Checkbox id="ci" label="Enable cloud-init / sysprep on boot" isChecked={cloudInit} onChange={(_, v) => setCloudInit(v)} />
          </FormGroup>
        </Form>
      </WizardStep>

      <WizardStep name="Shape" id="shape">
        <Form>
          <FormGroup label="vCPU cores" fieldId="cpu">
            <NumberInput value={cpu} min={1} max={128}
              onMinus={() => setCpu((n) => Math.max(1, n - 1))}
              onPlus={() => setCpu((n) => n + 1)}
              onChange={(e: any) => setCpu(Number((e.target as HTMLInputElement).value) || 1)} />
          </FormGroup>
          <FormGroup label="Memory (GiB)" fieldId="ram">
            <NumberInput value={ram} min={1} max={2048}
              onMinus={() => setRam((n) => Math.max(1, n - 4))}
              onPlus={() => setRam((n) => n + 4)}
              onChange={(e: any) => setRam(Number((e.target as HTMLInputElement).value) || 1)} />
          </FormGroup>
          <FormGroup label="Preferred host type" fieldId="ht">
            <FormSelect id="ht" value={hostType} onChange={(_, v) => setHostType(v)}>
              {HOST_TYPES.map((h) => (
                <FormSelectOption key={h.id} value={h.id} label={h.title} />
              ))}
            </FormSelect>
          </FormGroup>
        </Form>
      </WizardStep>

      <WizardStep name="Storage & network" id="sn">
        <Form>
          <FormGroup label="Boot disk size (GiB)" fieldId="bd">
            <NumberInput value={bootDisk} min={20} max={4096}
              onMinus={() => setBootDisk((n) => Math.max(20, n - 20))}
              onPlus={() => setBootDisk((n) => n + 20)}
              onChange={(e: any) => setBootDisk(Number((e.target as HTMLInputElement).value) || 20)} />
          </FormGroup>
          <FormGroup label="Storage tier" fieldId="tier">
            <FormSelect id="tier" value={storageTier} onChange={(_, v) => setStorageTier(v)}>
              {enabledTiers.map((t) => (
                <FormSelectOption key={t.id} value={t.id}
                  label={`${t.name} — ${t.media} · ${t.iops} · ${t.latency_ms}ms`} />
              ))}
            </FormSelect>
          </FormGroup>
          {selectedTier && (
            <Alert variant="info" isInline isPlain
              title={`CSI driver ${selectedTier.csi_driver} · ${tierProtocol(selectedTier)}`} />
          )}
          <FormGroup label="Default subnet" fieldId="sn">
            <FormSelect id="sn" value={defaultSubnet} onChange={(_, v) => setDefaultSubnet(v)}>
              {SUBNETS.map((s) => (
                <FormSelectOption key={s.id} value={s.id}
                  label={`${s.metadata.name} (${s.spec.ipv4_cidr ?? "—"})`} />
              ))}
            </FormSelect>
          </FormGroup>
        </Form>
      </WizardStep>

      <WizardStep name="Review & publish" id="rev" footer={{ nextButtonText: "Publish template" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div className="osac-panel" style={{ display: "grid", gap: 6 }}>
            <div><strong>Name:</strong> {name} <Label isCompact color={scope === "preview" ? "orange" : "blue"}>{scope}</Label></div>
            <div><strong>Version:</strong> {version}</div>
            <div><strong>Base image:</strong> {base.label} (<code>{base.ref}</code>)</div>
            <div><strong>Shape:</strong> {cpu} vCPU · {ram} GiB · host {hostType}</div>
            <div><strong>Boot disk:</strong> {bootDisk} GiB on <code>{storageTier}</code></div>
            <div><strong>Network:</strong> default subnet <code>{defaultSubnet}</code></div>
            <div><strong>Cloud-init:</strong> {cloudInit ? "enabled" : "disabled"}</div>
          </div>
          {scope === "preview" && (
            <Alert variant="warning" isInline title="Preview templates are not covered by tenant SLAs." />
          )}
          <div>
            <div style={{ fontSize: 12, color: "#5b6b7c", marginBottom: 6 }}>Generated manifest</div>
            <ClipboardCopy isCode hoverTip="Copy" clickTip="Copied" variant={ClipboardCopyVariant.expansion}>
              {manifest}
            </ClipboardCopy>
          </div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
