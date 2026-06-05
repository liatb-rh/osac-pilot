import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Progress, ProgressMeasureLocation, Modal, ModalVariant, ModalHeader,
  ModalBody, Wizard, WizardStep, Form, FormGroup, TextInput, TextArea,
  Select, SelectOption, SelectList, MenuToggle, Radio, NumberInput,
} from "@patternfly/react-core";

export const Route = createFileRoute("/app/admin/quota")({ component: QuotaPage });

const ITEMS = [
  { l: "vCPU", used: 120, total: 256 },
  { l: "Memory (GiB)", used: 540, total: 1024 },
  { l: "Block storage (TiB)", used: 18, total: 40 },
  { l: "Public IPs", used: 6, total: 16 },
  { l: "VMs", used: 42, total: 100 },
  { l: "Clusters", used: 2, total: 6 },
];

function QuotaPage() {
  const [wizOpen, setWizOpen] = useState(false);
  return (
    <>
      <PageHeader title="Tenant Quota" subtitle="Allocation vs usage across sovereign cloud primitives."
        actions={<Button variant="primary" onClick={() => setWizOpen(true)}>Request increase</Button>}
      />
      <div className="osac-kpi-grid" style={{ marginBottom: 24 }}>
        <Kpi label="Overall utilization" value="47%" tone="default" />
        <Kpi label="Approaching limit" value={1} tone="warning" hint="Block storage at 45%" />
        <Kpi label="Pending requests" value={1} tone="muted" />
      </div>
      <div className="osac-panel">
        <h3 className="osac-section-title">Resource quotas</h3>
        <div style={{ display: "grid", gap: 18 }}>
          {ITEMS.map((q) => {
            const pct = Math.round((q.used / q.total) * 100);
            return (
              <Progress key={q.l} value={pct}
                title={`${q.l} — ${q.used} / ${q.total} (${pct}%)`}
                measureLocation={ProgressMeasureLocation.outside}
                variant={pct > 80 ? "danger" : pct > 60 ? "warning" : "success"}
              />
            );
          })}
        </div>
      </div>

      <Modal variant={ModalVariant.large} isOpen={wizOpen} onClose={() => setWizOpen(false)} aria-label="Request quota increase">
        <ModalHeader title="Request quota increase" description="Submit a quota change request to the provider admin team." />
        <ModalBody style={{ minHeight: 480 }}>
          <QuotaWizard onDone={() => setWizOpen(false)} />
        </ModalBody>
      </Modal>
    </>
  );
}

function QuotaWizard({ onDone }: { onDone: () => void }) {
  const [resource, setResource] = useState("vCPU");
  const [resOpen, setResOpen] = useState(false);
  const item = ITEMS.find((i) => i.l === resource) ?? ITEMS[0];
  const [target, setTarget] = useState(item.total * 2);
  const [priority, setPriority] = useState<"normal" | "high" | "critical">("normal");
  const [justification, setJustification] = useState("Capacity required for upcoming launch of payments-prod cluster.");

  return (
    <Wizard onClose={onDone} onSave={onDone} height={460}>
      <WizardStep name="Resource" id="res">
        <Form>
          <FormGroup label="Resource to increase" isRequired fieldId="r">
            <Select isOpen={resOpen} onOpenChange={setResOpen}
              toggle={(ref) => <MenuToggle ref={ref} onClick={() => setResOpen(v => !v)} isExpanded={resOpen}>{resource}</MenuToggle>}
              onSelect={(_, v) => { setResource(String(v)); setResOpen(false); const it = ITEMS.find(i => i.l === v); if (it) setTarget(it.total * 2); }}
            >
              <SelectList>
                {ITEMS.map((i) => <SelectOption key={i.l} value={i.l}>{i.l} — current {i.total}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup label="Current allocation" fieldId="cur"><TextInput id="cur" value={String(item.total)} isDisabled /></FormGroup>
          <FormGroup label="Current usage" fieldId="use"><TextInput id="use" value={`${item.used} (${Math.round(item.used / item.total * 100)}%)`} isDisabled /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Target" id="target">
        <Form>
          <FormGroup label={`New allocation for ${resource}`} isRequired fieldId="t">
            <NumberInput value={target} min={item.total} onMinus={() => setTarget(t => Math.max(item.total, t - Math.max(1, Math.round(item.total / 10))))} onPlus={() => setTarget(t => t + Math.max(1, Math.round(item.total / 10)))} onChange={(e: any) => setTarget(Number((e.target as HTMLInputElement).value) || item.total)} />
          </FormGroup>
          <FormGroup label="Priority" fieldId="p" role="radiogroup">
            <Radio id="p-normal" name="p" label="Normal — within 5 business days" isChecked={priority === "normal"} onChange={() => setPriority("normal")} />
            <Radio id="p-high" name="p" label="High — within 1 business day" isChecked={priority === "high"} onChange={() => setPriority("high")} />
            <Radio id="p-critical" name="p" label="Critical — within hours (incident response)" isChecked={priority === "critical"} onChange={() => setPriority("critical")} />
          </FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Justification" id="just">
        <Form>
          <FormGroup label="Business justification" isRequired fieldId="j">
            <TextArea id="j" value={justification} onChange={(_, v) => setJustification(v)} rows={6} />
          </FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Review" id="rev" footer={{ nextButtonText: "Submit request" }}>
        <div className="osac-panel" style={{ display: "grid", gap: 6 }}>
          <div><strong>Resource:</strong> {resource}</div>
          <div><strong>From:</strong> {item.total} → <strong>{target}</strong> (+{target - item.total})</div>
          <div><strong>Priority:</strong> {priority}</div>
          <div><strong>Justification:</strong> {justification}</div>
          <div style={{ fontSize: 12, color: "#5b6b7c", marginTop: 6 }}>The provider admin team will review and update your tenant quota.</div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
