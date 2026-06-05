import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Button, Label, Modal, ModalVariant, ModalHeader, ModalBody, ModalFooter,
  Wizard, WizardStep, Form, FormGroup, TextInput, TextArea, Checkbox,
  NumberInput, Radio, Alert,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";

export const Route = createFileRoute("/app/admin/networks")({ component: NetworksPage });

type Subnet = { name: string; cidr: string; zone: string };
type Network = {
  n: string;
  cidr: string;
  sg: number;
  desc?: string;
  egress: "restricted" | "open" | "none";
  dns: boolean;
  subnets: Subnet[];
};

import { VIRTUAL_NETWORKS, SUBNETS, vnetSimpleStatus } from "@/lib/osac-api";

const INITIAL: Network[] = VIRTUAL_NETWORKS.map((vn) => {
  const subs = SUBNETS.filter((s) => s.spec.virtual_network === vn.id);
  return {
    n: vn.metadata.name,
    cidr: vn.spec.ipv4_cidr ?? vn.spec.ipv6_cidr ?? "—",
    sg: subs.length + 2,
    egress: "restricted" as const,
    dns: true,
    desc: vn.metadata.annotations["description"] ?? "",
    subnets: subs.map((s) => ({
      name: s.metadata.name,
      cidr: s.spec.ipv4_cidr ?? s.spec.ipv6_cidr ?? "—",
      zone: "zone-a",
    })),
  };
});

const NETWORK_STATE: Record<string, ReturnType<typeof vnetSimpleStatus>> = Object.fromEntries(
  VIRTUAL_NETWORKS.map((vn) => [vn.metadata.name, vnetSimpleStatus(vn.status.state)]),
);

const NODES = [
  { id: "vn-prod", x: 60, y: 50, label: "vn-prod", sub: "10.10.0.0/16" },
  { id: "sn-app", x: 240, y: 20, label: "sn-app", sub: "10.10.4.0/24" },
  { id: "sn-db", x: 240, y: 90, label: "sn-db", sub: "10.10.5.0/24" },
  { id: "vm1", x: 460, y: 5, label: "bnk-app-01", sub: "VM · 10.10.4.21" },
  { id: "vm2", x: 460, y: 45, label: "bnk-app-02", sub: "VM · 10.10.4.22" },
  { id: "vm3", x: 460, y: 100, label: "bnk-warehouse", sub: "VM · 10.10.5.10" },
];

function NetworksPage() {
  const [networks, setNetworks] = useState<Network[]>(INITIAL);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Network | null>(null);
  const [subnetsTarget, setSubnetsTarget] = useState<Network | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Network | null>(null);

  const upsert = (next: Network) =>
    setNetworks((list) => list.map((x) => (x.n === next.n ? next : x)));

  return (
    <>
      <PageHeader title="Networks" subtitle="Virtual networks, subnets, and topology for your tenant."
        actions={<Button variant="primary" onClick={() => setWizardOpen(true)}>New virtual network</Button>}
      />

      <div className="osac-panel" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead><Tr><Th>Name</Th><Th>State</Th><Th>CIDR</Th><Th>Subnets</Th><Th>Security groups</Th><Th /></Tr></Thead>
          <Tbody>
            {networks.map((n) => {
              const st = NETWORK_STATE[n.n] ?? "ready";
              return (
              <Tr key={n.n}>
                <Td><strong>{n.n}</strong></Td>
                <Td><span className="osac-status-dot" data-s={st} /><span style={{ textTransform: "capitalize" }}>{st === "ready" ? "Ready" : st === "progressing" ? "Pending" : "Failed"}</span></Td>
                <Td><code>{n.cidr}</code></Td>
                <Td><Label isCompact>{n.subnets.length}</Label></Td>
                <Td><Label isCompact color="blue">{n.sg}</Label></Td>
                <Td isActionCell>
                  <ActionsColumn items={[
                    { title: "Manage subnets", onClick: () => setSubnetsTarget(n) },
                    { title: "Edit", onClick: () => setEditTarget(n) },
                    { isSeparator: true },
                    { title: "Delete", onClick: () => setDeleteTarget(n) },
                  ]} />
                </Td>
              </Tr>
            );})}
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

      {editTarget && (
        <EditNetworkModal
          network={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(next) => { upsert(next); setEditTarget(null); }}
        />
      )}

      {subnetsTarget && (
        <ManageSubnetsModal
          network={subnetsTarget}
          onClose={() => setSubnetsTarget(null)}
          onSave={(next) => { upsert(next); setSubnetsTarget(null); }}
        />
      )}

      {deleteTarget && (
        <Modal variant={ModalVariant.small} isOpen onClose={() => setDeleteTarget(null)} aria-label="Delete network">
          <ModalHeader title={`Delete ${deleteTarget.n}?`} titleIconVariant="danger" />
          <ModalBody>
            <Alert variant="warning" isInline title="This will release the CIDR allocation and remove all subnets and security groups attached to this network." />
            <p style={{ marginTop: 12 }}>Running workloads bound to this network will lose connectivity. Type the network name to confirm in a real environment.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="danger" onClick={() => { setNetworks((l) => l.filter((x) => x.n !== deleteTarget.n)); setDeleteTarget(null); }}>Delete network</Button>
            <Button variant="link" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}

function EditNetworkModal({ network, onClose, onSave }: { network: Network; onClose: () => void; onSave: (n: Network) => void }) {
  const [name, setName] = useState(network.n);
  const [desc, setDesc] = useState(network.desc ?? "");
  const [cidr, setCidr] = useState(network.cidr);
  const [egress, setEgress] = useState(network.egress);
  const [dns, setDns] = useState(network.dns);

  return (
    <Modal variant={ModalVariant.medium} isOpen onClose={onClose} aria-label="Edit network">
      <ModalHeader title={`Edit ${network.n}`} description="Update network identity, address space, and policy." />
      <ModalBody>
        <Form>
          <FormGroup label="Network name" isRequired fieldId="en"><TextInput id="en" value={name} onChange={(_, v) => setName(v)} /></FormGroup>
          <FormGroup label="Description" fieldId="ed"><TextArea id="ed" value={desc} onChange={(_, v) => setDesc(v)} rows={2} /></FormGroup>
          <FormGroup label="IPv4 CIDR block" isRequired fieldId="ec"><TextInput id="ec" value={cidr} onChange={(_, v) => setCidr(v)} /></FormGroup>
          <FormGroup label="Default egress policy" fieldId="eg" role="radiogroup">
            <Radio id="ee-restricted" name="eedge" label="Restricted" isChecked={egress === "restricted"} onChange={() => setEgress("restricted")} />
            <Radio id="ee-open" name="eedge" label="Open" isChecked={egress === "open"} onChange={() => setEgress("open")} />
            <Radio id="ee-none" name="eedge" label="Air-gapped" isChecked={egress === "none"} onChange={() => setEgress("none")} />
          </FormGroup>
          <FormGroup fieldId="ednsg"><Checkbox id="ednsg" label="Private DNS resolution" isChecked={dns} onChange={(_, v) => setDns(v)} /></FormGroup>
        </Form>
        {cidr !== network.cidr && (
          <Alert variant="warning" isInline title="Changing the CIDR block may require re-IP'ing existing subnets." style={{ marginTop: 12 }} />
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={() => onSave({ ...network, n: name, desc, cidr, egress, dns })}>Save changes</Button>
        <Button variant="link" onClick={onClose}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
}

function ManageSubnetsModal({ network, onClose, onSave }: { network: Network; onClose: () => void; onSave: (n: Network) => void }) {
  const [subnets, setSubnets] = useState<Subnet[]>(network.subnets);
  const [draft, setDraft] = useState<Subnet>({ name: "", cidr: "", zone: "zone-a" });

  const canAdd = draft.name.trim() && /^\d+\.\d+\.\d+\.\d+\/\d+$/.test(draft.cidr);

  return (
    <Modal variant={ModalVariant.large} isOpen onClose={onClose} aria-label="Manage subnets">
      <ModalHeader title={`Manage subnets — ${network.n}`} description={`Parent CIDR ${network.cidr}. Subnets must fall within this range.`} />
      <ModalBody>
        <div className="osac-panel" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          <Table variant="compact">
            <Thead><Tr><Th>Name</Th><Th>CIDR</Th><Th>Zone</Th><Th /></Tr></Thead>
            <Tbody>
              {subnets.length === 0 && (
                <Tr><Td colSpan={4} style={{ textAlign: "center", color: "var(--pf-t-global-text-color-subtle)" }}>No subnets yet — add one below.</Td></Tr>
              )}
              {subnets.map((s, i) => (
                <Tr key={s.name + i}>
                  <Td>
                    <TextInput aria-label="subnet-name" value={s.name}
                      onChange={(_, v) => setSubnets((arr) => arr.map((x, j) => (j === i ? { ...x, name: v } : x)))} />
                  </Td>
                  <Td>
                    <TextInput aria-label="subnet-cidr" value={s.cidr}
                      onChange={(_, v) => setSubnets((arr) => arr.map((x, j) => (j === i ? { ...x, cidr: v } : x)))} />
                  </Td>
                  <Td>
                    <TextInput aria-label="subnet-zone" value={s.zone}
                      onChange={(_, v) => setSubnets((arr) => arr.map((x, j) => (j === i ? { ...x, zone: v } : x)))} />
                  </Td>
                  <Td isActionCell>
                    <Button variant="plain" aria-label="remove" onClick={() => setSubnets((arr) => arr.filter((_, j) => j !== i))}>
                      <TrashIcon />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>

        <h4 className="osac-section-title" style={{ marginBottom: 8 }}>Add subnet</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
          <FormGroup label="Name" fieldId="sn-n"><TextInput id="sn-n" value={draft.name} onChange={(_, v) => setDraft({ ...draft, name: v })} placeholder="sn-app" /></FormGroup>
          <FormGroup label="CIDR" fieldId="sn-c"><TextInput id="sn-c" value={draft.cidr} onChange={(_, v) => setDraft({ ...draft, cidr: v })} placeholder="10.10.8.0/24" /></FormGroup>
          <FormGroup label="Zone" fieldId="sn-z"><TextInput id="sn-z" value={draft.zone} onChange={(_, v) => setDraft({ ...draft, zone: v })} placeholder="zone-a" /></FormGroup>
          <Button isDisabled={!canAdd} onClick={() => { setSubnets((arr) => [...arr, draft]); setDraft({ name: "", cidr: "", zone: "zone-a" }); }}>Add</Button>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={() => onSave({ ...network, subnets })}>Save subnets</Button>
        <Button variant="link" onClick={onClose}>Cancel</Button>
      </ModalFooter>
    </Modal>
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
