import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Button, Label, Modal, ModalVariant, ModalHeader, ModalBody,
  Form, FormGroup, TextInput, FormSelect, FormSelectOption, Wizard, WizardStep,
  TextArea, Checkbox, ClipboardCopy, ClipboardCopyVariant,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon } from "@patternfly/react-icons";

import { AGENTS } from "@/lib/agents-data";
import { HOST_TYPES, VIRTUAL_NETWORKS } from "@/lib/osac-api";

export const Route = createFileRoute("/app/provider/agents/")({ component: AgentsPage });

const TONE: Record<string, "green" | "orange" | "red" | "blue"> = {
  healthy: "green", drift: "orange", unreachable: "red", provisioning: "blue",
};

function AgentsPage() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate({ from: "/app/provider/agents" });
  return (
    <>
      <PageHeader title="Infrastructure Agents" subtitle="Sovereign edge agent fleet and lifecycle."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpen(true)}>Provision agent</Button>}
      />
      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead><Tr><Th>Hostname</Th><Th>Zone</Th><Th>Host type</Th><Th>Cluster</Th><Th>Version</Th><Th>Status</Th><Th screenReaderText="Actions" /></Tr></Thead>
          <Tbody>
            {AGENTS.map((a) => (
              <Tr key={a.hostname} isClickable
                onRowClick={() => navigate({ to: "/app/provider/agents/$host", params: { host: a.hostname } })}>
                <Td>
                  <Link to="/app/provider/agents/$host" params={{ host: a.hostname }} style={{ color: "#0066cc", fontWeight: 600 }}>
                    {a.hostname}
                  </Link>
                </Td>
                <Td>{a.az}</Td>
                <Td><code>{a.host_type}</code></Td>
                <Td>{a.cluster ?? <span style={{ color: "#5b6b7c" }}>—</span>}</Td>
                <Td><code>{a.version}</code></Td>
                <Td><Label isCompact color={TONE[a.status]}>{a.status}</Label></Td>
                <Td isActionCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <ActionsColumn items={[
                    { title: "Upgrade agent" },
                    { title: "Cordon" },
                    { title: "Reboot host" },
                    { isSeparator: true },
                    { title: "Deprovision" },
                  ]} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      <ProvisionAgentWizard isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ProvisionAgentWizard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [hostname, setHostname] = useState("rack-δ-07");
  const [az, setAz] = useState("AZ-α");
  const [hostType, setHostType] = useState(HOST_TYPES[0].id);
  const [vnet, setVnet] = useState(VIRTUAL_NETWORKS[0].metadata.name);
  const [channel, setChannel] = useState("stable");
  const [autoJoin, setAutoJoin] = useState(true);
  const [cluster, setCluster] = useState("prod-ocp");
  const [sshKey, setSshKey] = useState("ssh-ed25519 AAAA... ops@northstar");

  const enrollCmd = `curl -sSL https://osac.northstar/agent/install.sh | sudo bash -s -- \\
  --hostname ${hostname} --az ${az} --host-type ${hostType} \\
  --vnet ${vnet} --channel ${channel} \\
  --enroll-token $(osac-cli agents new-token)`;

  return (
    <Modal variant={ModalVariant.large} isOpen={isOpen} onClose={onClose} aria-label="Provision agent">
      <ModalHeader title="Provision infrastructure agent" description="Enroll a new physical host into the sovereign-edge fleet." />
      <ModalBody>
        <Wizard height={520} onClose={onClose} onSave={onClose}>
          <WizardStep name="Identity" id="step-id">
            <Form>
              <FormGroup label="Hostname" fieldId="h" isRequired>
                <TextInput id="h" value={hostname} onChange={(_, v) => setHostname(v)} />
              </FormGroup>
              <FormGroup label="Availability zone" fieldId="az">
                <FormSelect id="az" value={az} onChange={(_, v) => setAz(v)}>
                  {["AZ-α", "AZ-β", "AZ-γ"].map((z) => <FormSelectOption key={z} value={z} label={z} />)}
                </FormSelect>
              </FormGroup>
              <FormGroup label="Host type" fieldId="ht">
                <FormSelect id="ht" value={hostType} onChange={(_, v) => setHostType(v)}>
                  {HOST_TYPES.map((h) => <FormSelectOption key={h.id} value={h.id} label={h.title} />)}
                </FormSelect>
              </FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Networking" id="step-net">
            <Form>
              <FormGroup label="Virtual network" fieldId="vn">
                <FormSelect id="vn" value={vnet} onChange={(_, v) => setVnet(v)}>
                  {VIRTUAL_NETWORKS.map((n) => (
                    <FormSelectOption key={n.id} value={n.metadata.name} label={`${n.metadata.name} (${n.spec.ipv4_cidr ?? "—"})`} />
                  ))}
                </FormSelect>
              </FormGroup>
              <FormGroup label="Management interface" fieldId="mi"><TextInput id="mi" defaultValue="eno1" /></FormGroup>
              <FormGroup label="Data interface" fieldId="di"><TextInput id="di" defaultValue="eno2" /></FormGroup>
              <FormGroup label="MTU" fieldId="mtu"><TextInput id="mtu" defaultValue="9000" /></FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Cluster join" id="step-cluster">
            <Form>
              <FormGroup fieldId="aj">
                <Checkbox id="aj" label="Auto-join a cluster after enrollment" isChecked={autoJoin}
                  onChange={(_, v) => setAutoJoin(v)} />
              </FormGroup>
              {autoJoin && (
                <FormGroup label="Target cluster" fieldId="cl">
                  <FormSelect id="cl" value={cluster} onChange={(_, v) => setCluster(v)}>
                    {["prod-ocp", "stg-ocp", "dev-ocp"].map((c) => <FormSelectOption key={c} value={c} label={c} />)}
                  </FormSelect>
                </FormGroup>
              )}
              <FormGroup label="Release channel" fieldId="ch">
                <FormSelect id="ch" value={channel} onChange={(_, v) => setChannel(v)}>
                  {["stable", "candidate", "edge"].map((c) => <FormSelectOption key={c} value={c} label={c} />)}
                </FormSelect>
              </FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Trust" id="step-trust">
            <Form>
              <FormGroup label="SSH public key" fieldId="ssh">
                <TextArea id="ssh" rows={3} value={sshKey} onChange={(_, v) => setSshKey(v)} />
              </FormGroup>
              <FormGroup label="Enrollment token TTL" fieldId="ttl"><TextInput id="ttl" defaultValue="30m" /></FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Review & enroll" id="step-review">
            <div style={{ display: "grid", gap: 12 }}>
              <div className="osac-panel">
                <strong>Summary</strong>
                <ul style={{ margin: "8px 0 0 18px", color: "#5b6b7c" }}>
                  <li>{hostname} · {az} · <code>{hostType}</code></li>
                  <li>Network: {vnet} · Channel: {channel}</li>
                  <li>{autoJoin ? `Auto-join cluster ${cluster}` : "Manual cluster join"}</li>
                </ul>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Run on the target host</div>
                <ClipboardCopy isCode hoverTip="Copy" clickTip="Copied" variant={ClipboardCopyVariant.expansion}>
                  {enrollCmd}
                </ClipboardCopy>
              </div>
            </div>
          </WizardStep>
        </Wizard>
      </ModalBody>
    </Modal>
  );
}
