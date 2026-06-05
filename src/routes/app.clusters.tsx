import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import { Button, Modal, ModalVariant, ModalHeader, ModalBody, Form, FormGroup, TextInput } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon, DownloadIcon } from "@patternfly/react-icons";

export const Route = createFileRoute("/app/clusters")({ component: ClustersPage });

interface Cluster { name: string; version: string; status: "ready" | "progressing" | "upgrading" | "failed"; nodes: number; }

const SEED: Cluster[] = [
  { name: "prod-ocp", version: "4.17.3", status: "upgrading", nodes: 9 },
  { name: "stg-ocp", version: "4.17.1", status: "ready", nodes: 6 },
  { name: "dev-ocp", version: "4.16.8", status: "ready", nodes: 3 },
];

function ClustersPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader title="Clusters" subtitle="OpenShift clusters provisioned for this tenant organization."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpen(true)}>Create cluster</Button>}
      />
      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead>
            <Tr><Th>Name</Th><Th>Status</Th><Th>OCP Version</Th><Th>Nodes</Th><Th /></Tr>
          </Thead>
          <Tbody>
            {SEED.map((c) => (
              <Tr key={c.name}>
                <Td><Link to="/app/clusters/$name" params={{ name: c.name }} style={{ color: "#0066cc", fontWeight: 600 }}>{c.name}</Link></Td>
                <Td><span className="osac-status-dot" data-s={c.status} /><span style={{ textTransform: "capitalize" }}>{c.status}</span></Td>
                <Td>{c.version}</Td>
                <Td>{c.nodes} workers</Td>
                <Td isActionCell>
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

      <Modal variant={ModalVariant.medium} isOpen={open} onClose={() => setOpen(false)}>
        <ModalHeader title="Create OpenShift cluster" description="A worker node set will be provisioned in your tenant network." />
        <ModalBody>
          <Form>
            <FormGroup label="Cluster name" fieldId="cn" isRequired><TextInput id="cn" defaultValue="prod-ocp-02" /></FormGroup>
            <FormGroup label="OCP version" fieldId="cv"><TextInput id="cv" defaultValue="4.17.3" /></FormGroup>
            <FormGroup label="Workers" fieldId="cw"><TextInput id="cw" defaultValue="3" /></FormGroup>
            <FormGroup label="Virtual network" fieldId="cnet"><TextInput id="cnet" defaultValue="vn-prod" /></FormGroup>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <Button variant="primary" onClick={() => setOpen(false)}>Provision</Button>
              <Button variant="link" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </>
  );
}
