import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import {
  CatalogItemPicker, DynamicParamFields, dynamicDefaults, type DynamicValues,
} from "@/components/osac/CatalogItemPicker";
import { tenantVisibleItems, type CatalogItem } from "@/lib/catalog-data";
import {
  Button, Modal, ModalVariant, ModalHeader, ModalBody, Wizard, WizardStep,
  Form, FormGroup, TextInput, TextArea, Select, SelectOption, SelectList, MenuToggle,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon } from "@patternfly/react-icons";

import { CLUSTERS, clusterSimpleStatus } from "@/lib/osac-api";

export const Route = createFileRoute("/app/clusters/")({
  component: ClustersPage,
  validateSearch: (search: Record<string, unknown>): { catalogItem?: string } => ({
    catalogItem: typeof search.catalogItem === "string" ? search.catalogItem : undefined,
  }),
});

interface Cluster { name: string; version: string; status: "ready" | "progressing" | "upgrading" | "failed"; nodes: number; }

const SEED: Cluster[] = CLUSTERS.map((c) => {
  const s = clusterSimpleStatus(c.status.state);
  const version = (c.spec.release_image ?? "").split(":").pop()?.replace("-multi", "") ?? "—";
  const nodes = Object.values(c.spec.node_sets).reduce((a, ns) => a + ns.size, 0);
  const progressing = c.status.conditions.find((x) => x.type === "CLUSTER_CONDITION_TYPE_PROGRESSING" && x.status === "CONDITION_STATUS_TRUE");
  const ui: Cluster["status"] = progressing ? "upgrading" : s === "ready" ? "ready" : s === "failed" ? "failed" : "progressing";
  return { name: c.metadata.name, version, status: ui, nodes };
});

const NODE_SETS = [
  { id: "compact-3", label: "Compact · 3 workers" },
  { id: "standard-6", label: "Standard · 6 workers" },
  { id: "large-12", label: "Large · 12 workers" },
];

function ClustersPage() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { catalogItem } = Route.useSearch();

  useEffect(() => {
    if (catalogItem) setOpen(true);
  }, [catalogItem]);

  const closeWizard = () => {
    setOpen(false);
    if (catalogItem) navigate({ to: "/app/clusters", search: {}, replace: true });
  };

  return (
    <>
      <PageHeader title="Clusters" subtitle="OpenShift clusters provisioned for this tenant organization."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpen(true)}>Create cluster</Button>}
      />
      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead>
            <Tr><Th>Name</Th><Th>Status</Th><Th>OCP Version</Th><Th>Nodes</Th><Th screenReaderText="Actions" /></Tr>
          </Thead>
          <Tbody>
            {SEED.map((c) => (
              <Tr key={c.name} isClickable onRowClick={() => navigate({ to: "/app/clusters/$name", params: { name: c.name } })}>
                <Td>
                  <Link to="/app/clusters/$name" params={{ name: c.name }} style={{ color: "#0066cc", fontWeight: 600 }}>
                    {c.name}
                  </Link>
                </Td>
                <Td><span className="osac-status-dot" data-s={c.status} /><span style={{ textTransform: "capitalize" }}>{c.status}</span></Td>
                <Td>{c.version}</Td>
                <Td>{c.nodes} workers</Td>
                <Td isActionCell onClick={(e) => e.stopPropagation()}>
                  <ActionsColumn items={[
                    { title: "Scale nodes" },
                    { title: "Upgrade" },
                    { title: "Download kubeconfig" },
                    { isSeparator: true },
                    { title: "Delete" },
                  ]} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      <Modal variant={ModalVariant.large} isOpen={open} onClose={closeWizard} aria-label="Create cluster">
        <ModalHeader title="Create OpenShift cluster" description="Provision a managed cluster from a catalog item." />
        <ModalBody style={{ minHeight: 460 }}>
          <CreateClusterWizard onDone={closeWizard} initialItemId={catalogItem} />
        </ModalBody>
      </Modal>
    </>
  );
}

function CreateClusterWizard({ onDone, initialItemId }: { onDone: () => void; initialItemId?: string }) {
  const items = tenantVisibleItems("cluster");
  const initial = initialItemId && items.some((i) => i.id === initialItemId) ? initialItemId : items[0]?.id ?? "";
  const [itemId, setItemId] = useState(initial);
  const item = items.find((i) => i.id === itemId);

  const [name, setName] = useState("prod-ocp-02");
  const [nodeSet, setNodeSet] = useState(NODE_SETS[1].id);
  const [nsOpen, setNsOpen] = useState(false);
  const [sshKey, setSshKey] = useState("ops-default");
  const [sshOpen, setSshOpen] = useState(false);
  const [pullSecret, setPullSecret] = useState("");
  const [ocpVersion, setOcpVersion] = useState(item?.fixedDefaults.ocpVersion ?? "4.17.3");
  const [dyn, setDyn] = useState<DynamicValues>(dynamicDefaults(item?.paramSchema));

  const hasDyn = !!item?.paramSchema && Object.keys(item.paramSchema.properties).length > 0;
  const nodeSetLabel = NODE_SETS.find((n) => n.id === nodeSet)?.label ?? nodeSet;

  const selectItem = (i: CatalogItem) => {
    setItemId(i.id);
    setOcpVersion(i.fixedDefaults.ocpVersion ?? "4.17.3");
    setDyn(dynamicDefaults(i.paramSchema));
  };

  return (
    <Wizard onClose={onDone} onSave={onDone} height={460}>
      <WizardStep name="Catalog item" id="item">
        <CatalogItemPicker type="cluster" selectedId={itemId} onSelect={selectItem} />
      </WizardStep>
      <WizardStep name="Basic parameters" id="basic">
        <Form>
          <FormGroup label="Cluster name" fieldId="cn" isRequired>
            <TextInput id="cn" value={name} onChange={(_, v) => setName(v)} />
          </FormGroup>
          <FormGroup label="Node set" fieldId="ns">
            <Select isOpen={nsOpen} onOpenChange={setNsOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setNsOpen((v) => !v)} isExpanded={nsOpen}>{nodeSetLabel}</MenuToggle>
              )}
              onSelect={(_, v) => { setNodeSet(String(v)); setNsOpen(false); }}
            >
              <SelectList>
                {NODE_SETS.map((n) => <SelectOption key={n.id} value={n.id}>{n.label}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup label="SSH key" fieldId="ssh">
            <Select isOpen={sshOpen} onOpenChange={setSshOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setSshOpen((v) => !v)} isExpanded={sshOpen}>{sshKey}</MenuToggle>
              )}
              onSelect={(_, v) => { setSshKey(String(v)); setSshOpen(false); }}
            >
              <SelectList>
                {["ops-default", "team-app", "personal-ed25519"].map((k) => <SelectOption key={k} value={k}>{k}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup label="Pull secret" fieldId="ps">
            <TextArea id="ps" rows={2} value={pullSecret} onChange={(_, v) => setPullSecret(v)} placeholder='{"auths": …}' />
          </FormGroup>
          <FormGroup label="OCP version" fieldId="cv">
            <TextInput id="cv" value={ocpVersion} onChange={(_, v) => setOcpVersion(v)} />
            <div style={{ fontSize: 12, color: "#5b6b7c", marginTop: 4 }}>
              Pre-filled from the selected catalog item.
            </div>
          </FormGroup>
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
      <WizardStep name="Review" id="review" footer={{ nextButtonText: "Provision" }}>
        <div className="osac-panel">
          <div style={{ marginBottom: 8 }}><strong>Catalog item:</strong> {item?.title ?? "—"}</div>
          <div style={{ marginBottom: 8 }}><strong>Name:</strong> {name}</div>
          <div style={{ marginBottom: 8 }}><strong>Node set:</strong> {nodeSetLabel}</div>
          <div style={{ marginBottom: 8 }}><strong>OCP version:</strong> {ocpVersion}</div>
          <div style={{ marginBottom: 8 }}><strong>SSH key:</strong> {sshKey}</div>
          <div style={{ marginBottom: 8 }}><strong>Pull secret:</strong> {pullSecret.trim() ? "provided" : "not provided"}</div>
          {hasDyn && (
            <div style={{ marginBottom: 8 }}>
              <strong>Dynamic parameters:</strong>{" "}
              {Object.entries(dyn).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#5b6b7c" }}>
            Networking is managed by Cluster-as-a-Service and not configured here.
          </div>
        </div>
      </WizardStep>
    </Wizard>
  );
}
