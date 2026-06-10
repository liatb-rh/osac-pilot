import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Button, SearchInput, ToggleGroup, ToggleGroupItem, Modal, ModalVariant,
  ModalHeader, ModalBody, Wizard, WizardStep, Form, FormGroup,
  TextInput, Select, SelectOption, SelectList, MenuToggle, Switch,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon } from "@patternfly/react-icons";
import {
  BARE_METAL_INSTANCES, BARE_METAL_HOSTS, BM_FLAVORS, BM_IMAGES,
  bmSimpleStatus, findBmHost,
} from "@/lib/bare-metal-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/app/bare-metal/")({ component: BareMetalIndex });

function BareMetalIndex() {
  const navigate = useNavigate();
  const { tenant } = useSession();
  const [filter, setFilter] = useState<"all" | "active" | "progressing">("all");
  const [q, setQ] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const mine = BARE_METAL_INSTANCES.filter((i) => !tenant || i.tenant === tenant);
  const rows = mine.filter((i) => {
    if (filter === "active" && i.provisioningState !== "active") return false;
    if (filter === "progressing" && i.provisioningState === "active") return false;
    return i.name.includes(q);
  });

  return (
    <>
      <PageHeader
        title="My Bare Metal"
        subtitle="Dedicated physical servers provisioned in your tenant workspace."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setWizardOpen(true)}>Request bare metal</Button>}
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <SearchInput placeholder="Filter by name" value={q} onChange={(_, v) => setQ(v)} onClear={() => setQ("")} style={{ minWidth: 260 }} />
        <ToggleGroup>
          <ToggleGroupItem text="All" isSelected={filter === "all"} onChange={() => setFilter("all")} />
          <ToggleGroupItem text="Active" isSelected={filter === "active"} onChange={() => setFilter("active")} />
          <ToggleGroupItem text="In progress" isSelected={filter === "progressing"} onChange={() => setFilter("progressing")} />
        </ToggleGroup>
      </div>

      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table aria-label="Bare metal list">
          <Thead>
            <Tr>
              <Th>Name</Th><Th>Status</Th><Th>Flavor</Th><Th>Image</Th>
              <Th>Host</Th><Th>Network</Th><Th>IP</Th><Th />
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((i) => {
              const host = findBmHost(i.hostRef);
              const s = bmSimpleStatus(i.provisioningState, host?.powerState ?? "on");
              return (
                <Tr
                  key={i.id}
                  isClickable
                  onRowClick={() => navigate({ to: "/app/bare-metal/$name", params: { name: i.name } })}
                >
                  <Td><Link to="/app/bare-metal/$name" params={{ name: i.name }} style={{ color: "#0066cc", fontWeight: 600 }}>{i.name}</Link></Td>
                  <Td><span className="osac-status-dot" data-s={s} /><span style={{ textTransform: "capitalize" }}>{i.provisioningState}</span></Td>
                  <Td><code>{i.flavor}</code></Td>
                  <Td>{i.image}</Td>
                  <Td>{host ? <code>{host.hostname}</code> : "—"}</Td>
                  <Td>{i.vnet} / {i.subnet} <span style={{ color: "#5b6b7c" }}>· VLAN {i.vlan}</span></Td>
                  <Td><code>{i.ip}</code></Td>
                  <Td isActionCell onClick={(e) => e.stopPropagation()}>
                    <ActionsColumn items={[
                      { title: host?.powerState === "on" ? "Power off" : "Power on" },
                      { title: "Reboot" },
                      { isSeparator: true },
                      { title: "Launch BMC console" },
                      { isSeparator: true },
                      { title: "Release host" },
                    ]} />
                  </Td>
                </Tr>
              );
            })}
            {rows.length === 0 && (
              <Tr><Td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#5b6b7c" }}>No bare metal instances match.</Td></Tr>
            )}
          </Tbody>
        </Table>
      </div>

      <Modal variant={ModalVariant.large} isOpen={wizardOpen} onClose={() => setWizardOpen(false)} aria-label="Request bare metal">
        <ModalHeader title="Request bare metal" description="Provision a dedicated physical server for this tenant workspace." />
        <ModalBody style={{ minHeight: 460 }}>
          <RequestBareMetalWizard onDone={() => setWizardOpen(false)} />
        </ModalBody>
      </Modal>
    </>
  );
}

function RequestBareMetalWizard({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("ns-bm-05");
  const [flavor, setFlavor] = useState(BM_FLAVORS[1].id);
  const [flavorOpen, setFlavorOpen] = useState(false);
  const [image, setImage] = useState(BM_IMAGES[0]);
  const [imageOpen, setImageOpen] = useState(false);
  const [secureBoot, setSecureBoot] = useState(true);

  const availableCount = BARE_METAL_HOSTS.filter((h) => h.discoveryState === "available").length;

  return (
    <Wizard onClose={onDone} onSave={onDone} height={460}>
      <WizardStep name="Flavor" id="flavor">
        <Form>
          <FormGroup label="Hardware flavor" fieldId="flavor">
            <Select isOpen={flavorOpen} onOpenChange={setFlavorOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setFlavorOpen((v) => !v)} isExpanded={flavorOpen}>
                  {BM_FLAVORS.find((f) => f.id === flavor)?.label}
                </MenuToggle>
              )}
              onSelect={(_, v) => { setFlavor(String(v)); setFlavorOpen(false); }}
            >
              <SelectList>
                {BM_FLAVORS.map((f) => <SelectOption key={f.id} value={f.id}>{f.label}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
          <div style={{ color: "#5b6b7c", fontSize: 13 }}>
            {availableCount} matching hosts currently available in inventory.
          </div>
        </Form>
      </WizardStep>
      <WizardStep name="Image" id="image">
        <Form>
          <FormGroup label="Boot image" fieldId="image">
            <Select isOpen={imageOpen} onOpenChange={setImageOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setImageOpen((v) => !v)} isExpanded={imageOpen}>{image}</MenuToggle>
              )}
              onSelect={(_, v) => { setImage(String(v)); setImageOpen(false); }}
            >
              <SelectList>
                {BM_IMAGES.map((img) => <SelectOption key={img} value={img}>{img}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup label="Secure boot" fieldId="sb">
            <Switch id="sb" isChecked={secureBoot} onChange={(_, v) => setSecureBoot(v)} label="Enabled" labelOff="Disabled" />
          </FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Details" id="details">
        <Form>
          <FormGroup label="Instance name" fieldId="n" isRequired>
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
          <FormGroup label="VLAN" fieldId="vlan"><TextInput id="vlan" type="number" defaultValue="410" /></FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Review" id="review" footer={{ nextButtonText: "Submit request" }}>
        <div className="osac-panel">
          <div style={{ marginBottom: 8 }}><strong>Name:</strong> {name}</div>
          <div style={{ marginBottom: 8 }}><strong>Flavor:</strong> {flavor}</div>
          <div style={{ marginBottom: 8 }}><strong>Image:</strong> {image}</div>
          <div style={{ marginBottom: 8 }}><strong>Secure boot:</strong> {secureBoot ? "enabled" : "disabled"}</div>
          <div><strong>Network:</strong> vn-prod / sn-app · VLAN 410</div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
