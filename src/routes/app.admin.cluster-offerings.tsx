import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Switch, Label, Button, Modal, ModalVariant, ModalHeader, ModalBody,
  Wizard, WizardStep, Form, FormGroup, TextInput, TextArea, Radio,
  Checkbox, NumberInput,
} from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons";
import { useState } from "react";

export const Route = createFileRoute("/app/admin/cluster-offerings")({ component: ClusterOfferingsPage });

export const OFFERINGS = [
  { id: "ocp-417", name: "OpenShift 4.17 — Standard", desc: "GA OpenShift cluster offering for production workloads.", risk: "stable", minNodes: 3, gpu: false, ocp: "4.17.3" },
  { id: "ocp-416", name: "OpenShift 4.16 — Standard", desc: "Previous OCP release; supported until next quarter.", risk: "stable", minNodes: 3, gpu: false, ocp: "4.16.8" },
  { id: "ocp-ai", name: "OpenShift AI — GPU enabled", desc: "Includes NVIDIA operator and GPU-accelerated node pools.", risk: "preview", minNodes: 2, gpu: true, ocp: "4.17.3" },
  { id: "rosa-ha", name: "OCP HA — Multi-zone", desc: "3 control plane nodes spread across availability zones.", risk: "stable", minNodes: 6, gpu: false, ocp: "4.17.3" },
];

function ClusterOfferingsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "ocp-417": true, "ocp-416": true, "ocp-ai": false, "rosa-ha": true,
  });
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <PageHeader title="Cluster Offerings" subtitle="Enable or disable cluster catalog items for users in your organization."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setWizardOpen(true)}>New offering</Button>}
      />
      <div className="osac-panel" style={{ display: "grid", gap: 12 }}>
        {OFFERINGS.map((o) => (
          <div key={o.id} style={{
            display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16, alignItems: "center",
            padding: 14, border: "1px solid #e3e8ee", borderRadius: 8,
          }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Link to="/app/admin/cluster-offerings/$id" params={{ id: o.id }}
                  style={{ color: "#0066cc", fontWeight: 600, textDecoration: "none" }}>{o.name}</Link>
                <Label isCompact color={o.risk === "preview" ? "orange" : "green"}>{o.risk}</Label>
              </div>
              <div style={{ fontSize: 13, color: "#5b6b7c" }}>{o.desc}</div>
            </div>
            <Link to="/app/admin/cluster-offerings/$id" params={{ id: o.id }}>
              <Button variant="link">View details</Button>
            </Link>
            <Switch
              id={o.id}
              label="Enabled"
              isChecked={enabled[o.id]}
              onChange={(_, v) => setEnabled((p) => ({ ...p, [o.id]: v }))}
            />
          </div>
        ))}
      </div>

      <Modal variant={ModalVariant.large} isOpen={wizardOpen} onClose={() => setWizardOpen(false)} aria-label="New cluster offering">
        <ModalHeader title="New cluster offering" description="Publish a new cluster catalog item available to tenants in your organization." />
        <ModalBody style={{ minHeight: 480 }}>
          <NewOfferingWizard onDone={() => setWizardOpen(false)} />
        </ModalBody>
      </Modal>
    </>
  );
}

function NewOfferingWizard({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("OpenShift 4.17 — Edge");
  const [desc, setDesc] = useState("Lightweight OCP profile for edge and branch sites.");
  const [ocp, setOcp] = useState("4.17.3");
  const [risk, setRisk] = useState<"stable" | "preview">("stable");
  const [minNodes, setMinNodes] = useState(3);
  const [gpu, setGpu] = useState(false);
  const [multiZone, setMultiZone] = useState(true);

  return (
    <Wizard onClose={onDone} onSave={onDone} height={460}>
      <WizardStep name="Identity" id="ident">
        <Form>
          <FormGroup label="Offering name" isRequired fieldId="n"><TextInput id="n" value={name} onChange={(_, v) => setName(v)} /></FormGroup>
          <FormGroup label="Description" fieldId="d"><TextArea id="d" value={desc} onChange={(_, v) => setDesc(v)} rows={3} /></FormGroup>
          <FormGroup label="OCP version" fieldId="v"><TextInput id="v" value={ocp} onChange={(_, v) => setOcp(v)} /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Risk tier" id="risk">
        <Form>
          <FormGroup label="Maturity" fieldId="risk" role="radiogroup">
            <Radio id="r-stable" name="risk" label="Stable — GA, production-ready" isChecked={risk === "stable"} onChange={() => setRisk("stable")} />
            <Radio id="r-preview" name="risk" label="Preview — early access, no SLA" isChecked={risk === "preview"} onChange={() => setRisk("preview")} />
          </FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Topology" id="topo">
        <Form>
          <FormGroup label="Minimum worker nodes" fieldId="min">
            <NumberInput value={minNodes} min={1} max={50} onMinus={() => setMinNodes(n => Math.max(1, n - 1))} onPlus={() => setMinNodes(n => n + 1)} onChange={(e: any) => setMinNodes(Number((e.target as HTMLInputElement).value) || 1)} />
          </FormGroup>
          <FormGroup fieldId="mz"><Checkbox id="mz" label="Spread control plane across availability zones" isChecked={multiZone} onChange={(_, v) => setMultiZone(v)} /></FormGroup>
          <FormGroup fieldId="gpu"><Checkbox id="gpu" label="GPU enabled (NVIDIA operator)" isChecked={gpu} onChange={(_, v) => setGpu(v)} /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Review" id="rev" footer={{ nextButtonText: "Publish offering" }}>
        <div className="osac-panel" style={{ display: "grid", gap: 6 }}>
          <div><strong>Name:</strong> {name}</div>
          <div><strong>OCP version:</strong> {ocp}</div>
          <div><strong>Maturity:</strong> {risk}</div>
          <div><strong>Min nodes:</strong> {minNodes}{multiZone ? " · multi-AZ control plane" : ""}</div>
          <div><strong>GPU:</strong> {gpu ? "enabled" : "disabled"}</div>
          <div style={{ color: "#5b6b7c", fontSize: 12, marginTop: 8 }}>This offering will be available to tenants once enabled in the list.</div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
