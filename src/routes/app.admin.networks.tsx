import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Button, Label, Modal, ModalVariant, ModalHeader, ModalBody,
  Wizard, WizardStep, Form, FormGroup, TextInput, TextArea, Checkbox,
  NumberInput, Radio,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";

export const Route = createFileRoute("/app/admin/networks")({ component: NetworksPage });

const NETWORKS = [
  { n: "vn-prod", cidr: "10.10.0.0/16", subnets: 4, sg: 6 },
  { n: "vn-dev", cidr: "10.20.0.0/16", subnets: 2, sg: 3 },
  { n: "vn-data", cidr: "10.30.0.0/16", subnets: 3, sg: 4 },
];

const NODES = [
  { id: "vn-prod", x: 60, y: 50, label: "vn-prod", sub: "10.10.0.0/16" },
  { id: "sn-app", x: 240, y: 20, label: "sn-app", sub: "10.10.4.0/24" },
  { id: "sn-db", x: 240, y: 90, label: "sn-db", sub: "10.10.5.0/24" },
  { id: "vm1", x: 460, y: 5, label: "bnk-app-01", sub: "VM · 10.10.4.21" },
  { id: "vm2", x: 460, y: 45, label: "bnk-app-02", sub: "VM · 10.10.4.22" },
  { id: "vm3", x: 460, y: 100, label: "bnk-warehouse", sub: "VM · 10.10.5.10" },
];

function NetworksPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  return (
    <>
      <PageHeader title="Networks" subtitle="Virtual networks, subnets, and topology for your tenant."
        actions={<Button variant="primary" onClick={() => setWizardOpen(true)}>New virtual network</Button>}
      />

      <div className="osac-panel" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead><Tr><Th>Name</Th><Th>CIDR</Th><Th>Subnets</Th><Th>Security groups</Th><Th /></Tr></Thead>
          <Tbody>
            {NETWORKS.map((n) => (
              <Tr key={n.n}>
                <Td><strong>{n.n}</strong></Td>
                <Td><code>{n.cidr}</code></Td>
                <Td><Label isCompact>{n.subnets}</Label></Td>
                <Td><Label isCompact color="blue">{n.sg}</Label></Td>
                <Td isActionCell><ActionsColumn items={[{ title: "Manage subnets" }, { title: "Edit" }, { isSeparator: true }, { title: "Delete" }]} /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      <div className="osac-topology">
        <h3 className="osac-section-title">Topology — vn-prod</h3>
        <svg width="100%" height="200" style={{ position: "absolute", left: 0, top: 60, pointerEvents: "none" }}>
          <line x1="170" y1="80" x2="240" y2="50" stroke="#cfe1f5" strokeWidth="2" />
          <line x1="170" y1="80" x2="240" y2="120" stroke="#cfe1f5" strokeWidth="2" />
          <line x1="350" y1="50" x2="460" y2="35" stroke="#cfe1f5" strokeWidth="2" />
          <line x1="350" y1="50" x2="460" y2="75" stroke="#cfe1f5" strokeWidth="2" />
          <line x1="350" y1="120" x2="460" y2="130" stroke="#cfe1f5" strokeWidth="2" />
        </svg>
        {NODES.map((n) => (
          <div key={n.id} className="osac-topo-node" style={{ left: n.x, top: n.y + 50 }}>
            <span style={{ width: 8, height: 8, background: "#0066cc", borderRadius: 50 }} />
            <div>
              <div>{n.label}</div>
              <small>{n.sub}</small>
            </div>
          </div>
        ))}
      </div>

      <Modal variant={ModalVariant.large} isOpen={wizardOpen} onClose={() => setWizardOpen(false)} aria-label="New virtual network">
        <ModalHeader title="New virtual network" description="Define address space, subnets, and egress policy for your tenant." />
        <ModalBody style={{ minHeight: 480 }}>
          <NewNetworkWizard onDone={() => setWizardOpen(false)} />
        </ModalBody>
      </Modal>
    </>
  );
}

function NewNetworkWizard({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("vn-new");
  const [desc, setDesc] = useState("");
  const [cidr, setCidr] = useState("10.40.0.0/16");
  const [subnets, setSubnets] = useState(2);
  const [egress, setEgress] = useState<"restricted" | "open" | "none">("restricted");
  const [defaultSg, setDefaultSg] = useState(true);
  const [enableDns, setEnableDns] = useState(true);

  return (
    <Wizard onClose={onDone} onSave={onDone} height={460}>
      <WizardStep name="Identity" id="ident">
        <Form>
          <FormGroup label="Network name" isRequired fieldId="n"><TextInput id="n" value={name} onChange={(_, v) => setName(v)} /></FormGroup>
          <FormGroup label="Description" fieldId="d"><TextArea id="d" value={desc} onChange={(_, v) => setDesc(v)} rows={2} /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Address space" id="cidr">
        <Form>
          <FormGroup label="IPv4 CIDR block" isRequired fieldId="c"><TextInput id="c" value={cidr} onChange={(_, v) => setCidr(v)} /></FormGroup>
          <FormGroup label="Initial subnets" fieldId="s">
            <NumberInput value={subnets} min={1} max={16} onMinus={() => setSubnets(s => Math.max(1, s - 1))} onPlus={() => setSubnets(s => Math.min(16, s + 1))} onChange={(e: any) => setSubnets(Number((e.target as HTMLInputElement).value) || 1)} />
          </FormGroup>
          <FormGroup fieldId="dns"><Checkbox id="dns" label="Enable private DNS resolution" isChecked={enableDns} onChange={(_, v) => setEnableDns(v)} /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Security" id="sec">
        <Form>
          <FormGroup label="Default egress policy" fieldId="egress" role="radiogroup">
            <Radio id="e-restricted" name="egress" label="Restricted — only whitelisted destinations" isChecked={egress === "restricted"} onChange={() => setEgress("restricted")} />
            <Radio id="e-open" name="egress" label="Open — any destination" isChecked={egress === "open"} onChange={() => setEgress("open")} />
            <Radio id="e-none" name="egress" label="None — air-gapped" isChecked={egress === "none"} onChange={() => setEgress("none")} />
          </FormGroup>
          <FormGroup fieldId="sg"><Checkbox id="sg" label="Create default security group (allow intra-VNet, deny external)" isChecked={defaultSg} onChange={(_, v) => setDefaultSg(v)} /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Review" id="rev" footer={{ nextButtonText: "Create network" }}>
        <div className="osac-panel" style={{ display: "grid", gap: 6 }}>
          <div><strong>Name:</strong> {name}</div>
          <div><strong>CIDR:</strong> <code>{cidr}</code> · {subnets} initial subnet(s)</div>
          <div><strong>DNS:</strong> {enableDns ? "private DNS enabled" : "disabled"}</div>
          <div><strong>Egress:</strong> {egress}</div>
          <div><strong>Default SG:</strong> {defaultSg ? "yes" : "no"}</div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
