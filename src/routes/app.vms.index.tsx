import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import { PublicIpField, type PublicIpSelection } from "@/components/osac/PublicIpField";
import {
  CatalogItemPicker, DynamicParamFields, dynamicDefaults, type DynamicValues,
} from "@/components/osac/CatalogItemPicker";
import { tenantVisibleItems, type CatalogItem } from "@/lib/catalog-data";
import {
  listInstanceTypes, findInstanceType, formatInstanceType, CATEGORY_LABELS,
} from "@/lib/instance-types-data";
import {
  Button, SearchInput, ToggleGroup, ToggleGroupItem, Modal, ModalVariant,
  ModalHeader, ModalBody, Wizard, WizardStep, Form, FormGroup,
  TextInput, Select, SelectOption, SelectList, SelectGroup, MenuToggle, Label,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon } from "@patternfly/react-icons";

import { COMPUTE_INSTANCES, vmSimpleStatus } from "@/lib/osac-api";

export const Route = createFileRoute("/app/vms/")({
  component: VmsPage,
  validateSearch: (search: Record<string, unknown>): { catalogItem?: string } => ({
    catalogItem: typeof search.catalogItem === "string" ? search.catalogItem : undefined,
  }),
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
  const { catalogItem } = Route.useSearch();
  const [filter, setFilter] = useState<"all" | "running" | "stopped">("all");
  const [q, setQ] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (catalogItem) setWizardOpen(true);
  }, [catalogItem]);

  const closeWizard = () => {
    setWizardOpen(false);
    if (catalogItem) navigate({ to: "/app/vms", search: {}, replace: true });
  };

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

      <Modal variant={ModalVariant.large} isOpen={wizardOpen} onClose={closeWizard} aria-label="Create VM">
        <ModalHeader title="Create virtual machine" description="Provision a new workload from a catalog item in this tenant workspace." />
        <ModalBody style={{ minHeight: 460 }}>
          <CreateVmWizard onDone={closeWizard} initialItemId={catalogItem} />
        </ModalBody>
      </Modal>
    </>
  );
}

const OS_OPTIONS = [
  { value: "rhel-9.4", label: "Red Hat Enterprise Linux 9.4" },
  { value: "rhel-8.10", label: "Red Hat Enterprise Linux 8.10" },
  { value: "ubuntu-22.04", label: "Ubuntu 22.04 LTS" },
  { value: "ubuntu-24.04", label: "Ubuntu 24.04 LTS" },
  { value: "windows-2022", label: "Windows Server 2022" },
];

const SECURITY_GROUPS = ["sg-app-tier", "sg-db-tier", "sg-edge", "sg-mgmt", "sg-default"];
const SSH_KEYS = ["ops-default", "team-app", "personal-ed25519"];

function CreateVmWizard({ onDone, initialItemId }: { onDone: () => void; initialItemId?: string }) {
  const items = tenantVisibleItems("vm");
  const initial = initialItemId && items.some((i) => i.id === initialItemId) ? initialItemId : items[0]?.id ?? "";
  const [itemId, setItemId] = useState(initial);
  const item = items.find((i) => i.id === itemId);

  const [name, setName] = useState("bnk-app-05");
  const [os, setOs] = useState("rhel-9.4");
  const [osOpen, setOsOpen] = useState(false);
  const [sshKey, setSshKey] = useState(SSH_KEYS[0]);
  const [sshOpen, setSshOpen] = useState(false);
  const [instanceTypeId, setInstanceTypeId] = useState<string>(
    item?.fixedDefaults.instanceTypeId ?? "it-small"
  );
  const [itOpen, setItOpen] = useState(false);
  const [dyn, setDyn] = useState<DynamicValues>(dynamicDefaults(item?.paramSchema));
  const [sgs, setSgs] = useState<string[]>(["sg-app-tier"]);
  const [sgOpen, setSgOpen] = useState(false);
  const [pubIp, setPubIp] = useState<PublicIpSelection | null>(null);

  const instanceTypes = listInstanceTypes();
  const instanceType = findInstanceType(instanceTypeId) ?? instanceTypes[0];
  const cpu = instanceType?.cpu ?? 2;
  const ram = instanceType?.memoryGib ?? 8;
  const disk = instanceType?.bootDiskGib ?? 64;

  const hasDyn = !!item?.paramSchema && Object.keys(item.paramSchema.properties).length > 0;
  const osLabel = OS_OPTIONS.find((o) => o.value === os)?.label ?? os;

  const selectItem = (i: CatalogItem) => {
    setItemId(i.id);
    if (i.fixedDefaults.instanceTypeId) setInstanceTypeId(i.fixedDefaults.instanceTypeId);
    setDyn(dynamicDefaults(i.paramSchema));
  };

  const grouped = instanceTypes.reduce<Record<string, typeof instanceTypes>>((acc, it) => {
    (acc[it.category] ||= []).push(it);
    return acc;
  }, {});

  const toggleSg = (v: string) =>
    setSgs((prev) => (prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]));

  return (
    <Wizard onClose={onDone} onSave={onDone} height={460}>
      <WizardStep name="Catalog item" id="item">
        <CatalogItemPicker type="vm" selectedId={itemId} onSelect={selectItem} />
      </WizardStep>
      <WizardStep name="Basic parameters" id="basic">
        <Form>
          <FormGroup label="VM name" fieldId="n" isRequired>
            <TextInput id="n" value={name} onChange={(_, v) => setName(v)} />
          </FormGroup>
          <FormGroup label="Operating System" fieldId="os">
            <Select isOpen={osOpen} onOpenChange={setOsOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setOsOpen((v) => !v)} isExpanded={osOpen}>{osLabel}</MenuToggle>
              )}
              onSelect={(_, v) => { setOs(String(v)); setOsOpen(false); }}
            >
              <SelectList>
                {OS_OPTIONS.map((o) => (
                  <SelectOption key={o.value} value={o.value}>{o.label}</SelectOption>
                ))}
              </SelectList>
            </Select>
            <div style={{ fontSize: 12, color: "#5b6b7c", marginTop: 4 }}>
              Temporary field (v0.1) — will be derived from the catalog item's image once image catalog integration lands.
            </div>
          </FormGroup>
          <FormGroup label="SSH key" fieldId="ssh">
            <Select isOpen={sshOpen} onOpenChange={setSshOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setSshOpen((v) => !v)} isExpanded={sshOpen}>{sshKey}</MenuToggle>
              )}
              onSelect={(_, v) => { setSshKey(String(v)); setSshOpen(false); }}
            >
              <SelectList>
                {SSH_KEYS.map((k) => <SelectOption key={k} value={k}>{k}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
        </Form>
      </WizardStep>
      <WizardStep name="Instance type" id="res">
        <Form>
          <FormGroup label="Instance type" fieldId="it" isRequired>
            <Select
              isOpen={itOpen} onOpenChange={setItOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setItOpen((v) => !v)} isExpanded={itOpen} style={{ minWidth: 360 }}>
                  {instanceType ? formatInstanceType(instanceType) : "Select instance type"}
                </MenuToggle>
              )}
              selected={instanceTypeId}
              onSelect={(_, v) => { setInstanceTypeId(String(v)); setItOpen(false); }}
            >
              <SelectList>
                {Object.entries(grouped).map(([cat, list]) => (
                  <SelectGroup key={cat} label={CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}>
                    {list.map((it) => (
                      <SelectOption key={it.id} value={it.id} description={it.description}>
                        {formatInstanceType(it)}
                      </SelectOption>
                    ))}
                  </SelectGroup>
                ))}
              </SelectList>
            </Select>
            <div style={{ fontSize: 12, color: "#5b6b7c", marginTop: 6 }}>
              CPU, memory, and boot disk are determined by the selected instance type.
            </div>
          </FormGroup>
          <div className="osac-panel" style={{ display: "flex", gap: 18, fontSize: 13 }}>
            <div><strong>{cpu}</strong> vCPU</div>
            <div><strong>{ram}</strong> GiB RAM</div>
            <div><strong>{disk}</strong> GiB boot disk</div>
          </div>
        </Form>
      </WizardStep>
      <WizardStep name="Dynamic parameters" id="dyn" isHidden={!hasDyn}>
        <Form>
          <DynamicParamFields
            schema={item?.paramSchema}
            values={dyn}
            onChange={(k, v) => setDyn((prev) => ({ ...prev, [k]: v }))}
          />
        </Form>
      </WizardStep>
      <WizardStep name="Networking" id="net">
        <Form>
          <FormGroup label="Virtual network" fieldId="vn"><TextInput id="vn" defaultValue="vn-prod" /></FormGroup>
          <FormGroup label="Subnet" fieldId="sn"><TextInput id="sn" defaultValue="sn-app (10.10.4.0/24)" /></FormGroup>
          <FormGroup label="Security groups" fieldId="sg">
            <Select role="menu" isOpen={sgOpen} onOpenChange={setSgOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setSgOpen((v) => !v)} isExpanded={sgOpen}>
                  {sgs.length > 0 ? `${sgs.length} selected` : "Select security groups"}
                </MenuToggle>
              )}
              onSelect={(_, v) => toggleSg(String(v))}
            >
              <SelectList>
                {SECURITY_GROUPS.map((sg) => (
                  <SelectOption key={sg} value={sg} hasCheckbox isSelected={sgs.includes(sg)}>
                    {sg}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
            {sgs.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {sgs.map((sg) => <Label key={sg} color="blue" onClose={() => toggleSg(sg)}>{sg}</Label>)}
              </div>
            )}
          </FormGroup>
          <PublicIpField onChange={setPubIp} />
        </Form>
      </WizardStep>
      <WizardStep name="Review" id="review" footer={{ nextButtonText: "Provision" }}>
        <div className="osac-panel">
          <div style={{ marginBottom: 8 }}><strong>Catalog item:</strong> {item?.title ?? "—"}</div>
          <div style={{ marginBottom: 8 }}><strong>Name:</strong> {name}</div>
          <div style={{ marginBottom: 8 }}><strong>Operating System:</strong> {osLabel}</div>
          <div style={{ marginBottom: 8 }}><strong>SSH key:</strong> {sshKey}</div>
          <div style={{ marginBottom: 8 }}><strong>Instance type:</strong> {instanceType?.displayName ?? "—"} · {cpu} vCPU · {ram} GiB RAM · {disk} GiB boot disk</div>
          {hasDyn && (
            <div style={{ marginBottom: 8 }}>
              <strong>Dynamic parameters:</strong>{" "}
              {Object.entries(dyn).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
            </div>
          )}
          <div style={{ marginBottom: 8 }}><strong>Network:</strong> vn-prod / sn-app</div>
          <div style={{ marginBottom: 8 }}>
            <strong>Security groups:</strong> {sgs.length > 0 ? sgs.join(", ") : "None"}
          </div>
          <div>
            <strong>Public IP:</strong>{" "}
            {pubIp?.enabled ? pubIp.label : "None"}
            {pubIp?.enabled && pubIp.choice === "auto" && (
              <span style={{ fontSize: 12, color: "#5b6b7c", marginLeft: 8 }}>
                (attached automatically once the VM reaches Running)
              </span>
            )}
          </div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
