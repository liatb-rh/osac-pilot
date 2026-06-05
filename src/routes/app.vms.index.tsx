import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Button, SearchInput, ToggleGroup, ToggleGroupItem, Modal, ModalVariant,
  ModalHeader, ModalBody, Wizard, WizardStep, Form, FormGroup,
  TextInput, Select, SelectOption, SelectList, MenuToggle,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon } from "@patternfly/react-icons";

import { COMPUTE_INSTANCES, vmSimpleStatus } from "@/lib/osac-api";

export const Route = createFileRoute("/app/vms/")({
  component: VmsPage,
});

interface VM { name: string; status: "running" | "stopped" | "progressing" | "failed"; os: string; cpu: number; ram: number; ip: string; }

const SEED: VM[] = COMPUTE_INSTANCES.map((ci) => {
  const s = vmSimpleStatus(ci.status.state);
  const ui: VM["status"] = s === "ready" ? "running" : s === "stopped" ? "stopped" : s === "failed" ? "failed" : "progressing";
  const osRef = ci.spec.image?.source_ref ?? "";
  const os = osRef.includes("ubuntu") ? "Ubuntu 22" : "RHEL 9";
  return {
    name: ci.metadata.name,
    status: ui,
    os,
    cpu: ci.spec.cores,
    ram: ci.spec.memory_gib,
    ip: ci.status.internal_ip_address || "—",
  };
});

function VmsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "running" | "stopped">("all");
  const [q, setQ] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const rows = SEED.filter((v) => (filter === "all" || v.status === filter) && v.name.includes(q));

  return (
    <>
      <PageHeader
        title="My Virtual Machines"
        subtitle="Operate workload lifecycle in your tenant workspace."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setWizardOpen(true)}>Create VM</Button>}
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <SearchInput placeholder="Filter by name" value={q} onChange={(_, v) => setQ(v)} onClear={() => setQ("")} style={{ minWidth: 260 }} />
        <ToggleGroup>
          <ToggleGroupItem text="All" isSelected={filter === "all"} onChange={() => setFilter("all")} />
          <ToggleGroupItem text="Running" isSelected={filter === "running"} onChange={() => setFilter("running")} />
          <ToggleGroupItem text="Stopped" isSelected={filter === "stopped"} onChange={() => setFilter("stopped")} />
        </ToggleGroup>
      </div>

      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table aria-label="VM list">
          <Thead>
            <Tr>
              <Th>Name</Th><Th>Status</Th><Th>OS</Th><Th>vCPU</Th><Th>Memory</Th><Th>IP</Th><Th />
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((v) => (
              <Tr
                key={v.name}
                isClickable
                onRowClick={() => navigate({ to: "/app/vms/$name", params: { name: v.name } })}
              >
                <Td><Link to="/app/vms/$name" params={{ name: v.name }} style={{ color: "#0066cc", fontWeight: 600 }}>{v.name}</Link></Td>
                <Td><span className="osac-status-dot" data-s={v.status} /><span style={{ textTransform: "capitalize" }}>{v.status}</span></Td>
                <Td>{v.os}</Td>
                <Td>{v.cpu}</Td>
                <Td>{v.ram} GiB</Td>
                <Td><code>{v.ip}</code></Td>
                <Td isActionCell onClick={(e) => e.stopPropagation()}>
                  <ActionsColumn items={[
                    { title: v.status === "running" ? "Stop" : "Start" },
                    { title: "Restart" },
                    { title: "Clone" },
                    { isSeparator: true },
                    { title: "Launch console", onClick: () => { window.location.href = `/app/console?vm=${v.name}`; } },
                    { isSeparator: true },
                    { title: "Delete" },
                  ]} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      <Modal variant={ModalVariant.large} isOpen={wizardOpen} onClose={() => setWizardOpen(false)} aria-label="Create VM">
        <ModalHeader title="Create virtual machine" description="Provision a new workload in this tenant workspace." />
        <ModalBody style={{ minHeight: 420 }}>
          <CreateVmWizard onDone={() => setWizardOpen(false)} />
        </ModalBody>
      </Modal>
    </>
  );
}

function CreateVmWizard({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("bnk-app-05");
  const [tpl, setTpl] = useState("rhel-9-medium");
  const [tplOpen, setTplOpen] = useState(false);

  return (
    <Wizard onClose={onDone} onSave={onDone} height={420}>
      <WizardStep name="Template" id="tpl">
        <Form>
          <FormGroup label="Template" fieldId="tpl">
            <Select isOpen={tplOpen} onOpenChange={setTplOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setTplOpen((v) => !v)} isExpanded={tplOpen}>{tpl}</MenuToggle>
              )}
              onSelect={(_, v) => { setTpl(String(v)); setTplOpen(false); }}
            >
              <SelectList>
                <SelectOption value="rhel-9-small">rhel-9-small · 2 vCPU · 8 GiB</SelectOption>
                <SelectOption value="rhel-9-medium">rhel-9-medium · 4 vCPU · 16 GiB</SelectOption>
                <SelectOption value="ubuntu-22-large">ubuntu-22-large · 16 vCPU · 64 GiB</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Details" id="details">
        <Form>
          <FormGroup label="VM name" fieldId="n" isRequired>
            <TextInput id="n" value={name} onChange={(_, v) => setName(v)} />
          </FormGroup>
          <FormGroup label="Workspace tag" fieldId="tag">
            <TextInput id="tag" defaultValue="prod" />
          </FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Networking" id="net">
        <Form>
          <FormGroup label="Virtual network" fieldId="vn"><TextInput id="vn" defaultValue="vn-prod" /></FormGroup>
          <FormGroup label="Subnet" fieldId="sn"><TextInput id="sn" defaultValue="sn-app (10.10.4.0/24)" /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Review" id="review" footer={{ nextButtonText: "Provision" }}>
        <div className="osac-panel">
          <div style={{ marginBottom: 8 }}><strong>Name:</strong> {name}</div>
          <div style={{ marginBottom: 8 }}><strong>Template:</strong> {tpl}</div>
          <div><strong>Network:</strong> vn-prod / sn-app</div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
