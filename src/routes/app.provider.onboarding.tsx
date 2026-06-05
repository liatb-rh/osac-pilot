import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import {
  Button, Modal, ModalVariant, ModalHeader, ModalBody, Wizard, WizardStep,
  Form, FormGroup, TextInput, Select, SelectOption, SelectList, MenuToggle,
  Checkbox, Alert, Progress, ProgressSize, Label,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { PlusCircleIcon, CheckCircleIcon } from "@patternfly/react-icons";
import { useState } from "react";

export const Route = createFileRoute("/app/provider/onboarding")({ component: OnboardingPage });

const PIPELINES = [
  { org: "Crestline Insurance", step: "Project creation", progress: 60, status: "progressing", started: "2m ago" },
  { org: "Helix Logistics", step: "Storage provisioning", progress: 85, status: "progressing", started: "8m ago" },
  { org: "Aurora Health", step: "Ready", progress: 100, status: "ready", started: "1h ago" },
  { org: "Northstar Bank", step: "Ready", progress: 100, status: "ready", started: "3d ago" },
];

const STAGES = [
  "Organization record",
  "Keycloak realm",
  "External IdP federation",
  "Role & group mapping",
  "OpenShift Projects",
  "Storage provisioning trigger",
  "Smoke test login",
];

function OnboardingPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Tenant Onboarding"
        subtitle="End-to-end provisioning from organization creation to tenant readiness."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpen(true)}>Start onboarding</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="In progress" value={PIPELINES.filter(p => p.status !== "ready").length} tone="warning" />
        <Kpi label="Ready" value={PIPELINES.filter(p => p.status === "ready").length} tone="success" />
        <Kpi label="Median time" value="14m" hint="org → first login" />
        <Kpi label="Pipeline stages" value={STAGES.length} />
      </div>

      <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#5b6b7c", letterSpacing: ".04em", textTransform: "uppercase" }}>Active pipelines</h3>
      <div className="osac-panel" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        <Table>
          <Thead><Tr><Th>Organization</Th><Th>Current stage</Th><Th>Progress</Th><Th>Status</Th><Th>Started</Th></Tr></Thead>
          <Tbody>
            {PIPELINES.map((p, i) => (
              <Tr key={i}>
                <Td><strong>{p.org}</strong></Td>
                <Td>{p.step}</Td>
                <Td><Progress value={p.progress} size={ProgressSize.sm} aria-label="progress" measureLocation="outside" /></Td>
                <Td><StatusDot status={p.status as any} /></Td>
                <Td>{p.started}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#5b6b7c", letterSpacing: ".04em", textTransform: "uppercase" }}>Pipeline reference</h3>
      <div className="osac-panel" style={{ display: "grid", gap: 8 }}>
        {STAGES.map((s, i) => (
          <div key={s} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 12, alignItems: "center", padding: "8px 12px", border: "1px solid #e3e8ee", borderRadius: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: "#e7f1fb", color: "#0066cc", display: "grid", placeItems: "center", fontWeight: 700 }}>{i + 1}</div>
            <div><strong>{s}</strong></div>
            <Label isCompact color="green" icon={<CheckCircleIcon />}>automated</Label>
          </div>
        ))}
      </div>

      <Modal variant={ModalVariant.large} isOpen={open} onClose={() => setOpen(false)} aria-label="Start onboarding">
        <ModalHeader title="Start tenant onboarding" description="Runs the 7-stage pipeline end-to-end." />
        <ModalBody style={{ minHeight: 500 }}>
          <OnboardWizard onDone={() => setOpen(false)} />
        </ModalBody>
      </Modal>
    </>
  );
}

function OnboardWizard({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("Crestline Insurance");
  const [realm, setRealm] = useState("crestline.osac");
  const [idp, setIdp] = useState("OIDC");
  const [idpOpen, setIdpOpen] = useState(false);
  const [admins, setAdmins] = useState("ops@crestline.example");
  const [projects, setProjects] = useState("crestline-prod\ncrestline-dev");
  const [tier, setTier] = useState("standard");
  const [tierOpen, setTierOpen] = useState(false);
  const [smokeTest, setSmokeTest] = useState(true);

  return (
    <Wizard onClose={onDone} onSave={onDone} height={520}>
      <WizardStep name="Organization" id="org">
        <Form>
          <FormGroup label="Organization name" isRequired fieldId="n"><TextInput id="n" value={name} onChange={(_, v) => setName(v)} /></FormGroup>
          <FormGroup label="Keycloak realm slug" isRequired fieldId="r"><TextInput id="r" value={realm} onChange={(_, v) => setRealm(v)} /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Identity provider" id="idp">
        <Form>
          <FormGroup label="IdP type" fieldId="i">
            <Select isOpen={idpOpen} onOpenChange={setIdpOpen}
              toggle={(ref) => <MenuToggle ref={ref} onClick={() => setIdpOpen(v => !v)}>{idp}</MenuToggle>}
              selected={idp} onSelect={(_, v) => { setIdp(String(v)); setIdpOpen(false); }}>
              <SelectList>{["LDAP","AD","OIDC","SAML"].map(o => <SelectOption key={o} value={o}>{o}</SelectOption>)}</SelectList>
            </Select>
          </FormGroup>
          <Alert variant="info" isInline isPlain title="Connection details are entered after the realm is created in the IdP tab of Organizations." />
        </Form>
      </WizardStep>
      <WizardStep name="Roles" id="roles">
        <Form>
          <FormGroup label="Initial tenant-admin emails (comma or newline separated)" fieldId="a"><TextInput id="a" value={admins} onChange={(_, v) => setAdmins(v)} /></FormGroup>
          <Alert variant="info" isInline isPlain title="A Keycloak group will be created and mapped to the tenant-admin role for each user." />
        </Form>
      </WizardStep>
      <WizardStep name="Projects" id="proj">
        <Form>
          <FormGroup label="OpenShift Project names (one per line)" fieldId="p">
            <textarea id="p" value={projects} onChange={(e) => setProjects(e.target.value)} rows={4}
              style={{ width: "100%", fontFamily: "monospace", padding: 8, border: "1px solid #c7d3e0", borderRadius: 6 }} />
          </FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Storage" id="stor">
        <Form>
          <FormGroup label="Default storage tier" fieldId="t">
            <Select isOpen={tierOpen} onOpenChange={setTierOpen}
              toggle={(ref) => <MenuToggle ref={ref} onClick={() => setTierOpen(v => !v)}>{tier}</MenuToggle>}
              selected={tier} onSelect={(_, v) => { setTier(String(v)); setTierOpen(false); }}>
              <SelectList>
                <SelectOption value="fast">vast-fast — NVMe-backed, low-latency</SelectOption>
                <SelectOption value="standard">vast-standard — balanced</SelectOption>
                <SelectOption value="archive">vast-archive — capacity tier</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup fieldId="sm"><Checkbox id="sm" label="Run smoke test login after provisioning" isChecked={smokeTest} onChange={(_, v) => setSmokeTest(v)} /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Review" id="rev" footer={{ nextButtonText: "Start onboarding" }}>
        <div className="osac-panel" style={{ display: "grid", gap: 6 }}>
          <div><strong>Organization:</strong> {name}</div>
          <div><strong>Realm:</strong> <code>{realm}</code></div>
          <div><strong>IdP:</strong> {idp}</div>
          <div><strong>Admins:</strong> {admins}</div>
          <div><strong>Projects:</strong> {projects.split(/\s+/).filter(Boolean).join(", ")}</div>
          <div><strong>Storage tier:</strong> {tier}</div>
          <div><strong>Smoke test:</strong> {smokeTest ? "yes" : "no"}</div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
