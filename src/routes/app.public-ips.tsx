import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Modal, ModalVariant, ModalHeader, ModalBody, Form, FormGroup,
  Select, SelectOption, SelectList, MenuToggle, Label, Alert,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon } from "@patternfly/react-icons";
import {
  PUBLIC_IPS, eligiblePools, findPool, ipDotStatus, ipsForTenant, nextIpAddress,
  TRANSITIONAL_STATES, WORKLOAD_LABEL, type PublicIp, type WorkloadType,
} from "@/lib/public-ip-data";
import { COMPUTE_INSTANCES, CLUSTERS } from "@/lib/osac-api";
import { BARE_METAL_INSTANCES, findBmHost } from "@/lib/bare-metal-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/app/public-ips")({ component: PublicIpsPage });

function PublicIpsPage() {
  const { tenant, user } = useSession();
  const [ips, setIps] = useState<PublicIp[]>(() => ipsForTenant(tenant));
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [attachTarget, setAttachTarget] = useState<PublicIp | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<PublicIp | null>(null);

  const pools = eligiblePools(tenant);

  const patch = (id: string, p: Partial<PublicIp>) =>
    setIps((prev) => prev.map((ip) => (ip.id === id ? { ...ip, ...p } : ip)));

  const allocate = (poolId: string) => {
    const pool = findPool(poolId);
    if (!pool || !tenant) return;
    const taken = ips.map((ip) => ip.address);
    const ip: PublicIp = {
      id: `pip-${Math.random().toString(36).slice(2, 8)}`,
      address: nextIpAddress(pool, taken),
      poolId, tenant, state: "pending",
      owner: user?.email ?? "you",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setIps((prev) => [ip, ...prev]);
    setAllocateOpen(false);
    setTimeout(() => patch(ip.id, { state: "allocated" }), 1800);
  };

  const attach = (ip: PublicIp, workloadType: WorkloadType, workloadId: string, nic?: string) => {
    patch(ip.id, { state: "attaching", workloadType, workloadId, nic });
    setAttachTarget(null);
    setTimeout(() => patch(ip.id, { state: "attached" }), 1800);
  };

  const detach = (ip: PublicIp) => {
    patch(ip.id, { state: "attaching" });
    setTimeout(() => patch(ip.id, { state: "allocated", workloadType: undefined, workloadId: undefined, nic: undefined }), 1500);
  };

  const release = (ip: PublicIp) => {
    patch(ip.id, { state: "releasing" });
    setReleaseTarget(null);
    setTimeout(() => setIps((prev) => prev.filter((x) => x.id !== ip.id)), 1800);
  };

  const attached = ips.filter((ip) => ip.state === "attached").length;
  const available = ips.filter((ip) => ip.state === "allocated").length;
  const transitional = ips.filter((ip) => TRANSITIONAL_STATES.includes(ip.state)).length;

  return (
    <>
      <PageHeader
        title="Public IPs"
        subtitle="Allocate public IPs from pools assigned to your user group and attach them to VMs, clusters, or bare metal nodes."
        actions={
          <Button variant="primary" icon={<PlusCircleIcon />} isDisabled={pools.length === 0} onClick={() => setAllocateOpen(true)}>
            Allocate IP
          </Button>
        }
      />

      {pools.length === 0 && (
        <Alert variant="info" isInline title="No public IP pool is available to your user group" style={{ marginBottom: 16 }}>
          Ask your tenant admin to assign a pool to one of your user groups.
        </Alert>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Attached" value={attached} hint="serving traffic" />
        <Kpi label="Available" value={available} hint="allocated · unattached" />
        <Kpi label="In transition" value={transitional} hint="pending / attaching / releasing" tone={transitional > 0 ? "warning" : "default"} />
        <Kpi label="Eligible pools" value={pools.length} hint={pools.map((p) => p.name).join(", ") || "—"} />
      </div>

      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table aria-label="Public IPs">
          <Thead>
            <Tr>
              <Th>Address</Th><Th>State</Th><Th>Pool</Th><Th>Attached to</Th><Th>Owner</Th><Th>Created</Th><Th screenReaderText="Actions" />
            </Tr>
          </Thead>
          <Tbody>
            {ips.map((ip) => {
              const pool = findPool(ip.poolId);
              const busy = TRANSITIONAL_STATES.includes(ip.state);
              return (
                <Tr key={ip.id}>
                  <Td><code style={{ fontWeight: 600 }}>{ip.address}</code></Td>
                  <Td>
                    <span className="osac-status-dot" data-s={ipDotStatus(ip.state)} />
                    <span style={{ textTransform: "capitalize" }}>{ip.state}</span>
                  </Td>
                  <Td><code>{pool?.name ?? ip.poolId}</code></Td>
                  <Td>
                    {ip.workloadId ? (
                      <span>
                        <Label isCompact color={ip.workloadType === "vm" ? "blue" : ip.workloadType === "cluster" ? "purple" : "orange"} style={{ marginRight: 6 }}>
                          {WORKLOAD_LABEL[ip.workloadType ?? "vm"]}
                        </Label>
                        {ip.workloadId}
                        {ip.nic && <span style={{ color: "#5b6b7c" }}> · {ip.nic}</span>}
                      </span>
                    ) : "—"}
                  </Td>
                  <Td>{ip.owner}</Td>
                  <Td>{ip.createdAt}</Td>
                  <Td isActionCell>
                    <ActionsColumn items={[
                      { title: "Attach to resource", isDisabled: ip.state !== "allocated", onClick: () => setAttachTarget(ip) },
                      { title: "Detach", isDisabled: ip.state !== "attached", onClick: () => detach(ip) },
                      { isSeparator: true },
                      { title: "Release", isDisabled: busy || ip.state === "attached", onClick: () => setReleaseTarget(ip) },
                    ]} />
                  </Td>
                </Tr>
              );
            })}
            {ips.length === 0 && (
              <Tr><Td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#5b6b7c" }}>No public IPs allocated yet.</Td></Tr>
            )}
          </Tbody>
        </Table>
      </div>

      <AllocateModal isOpen={allocateOpen} onClose={() => setAllocateOpen(false)} onAllocate={allocate} poolIds={pools.map((p) => p.id)} />
      {attachTarget && <AttachModal ip={attachTarget} onClose={() => setAttachTarget(null)} onAttach={attach} />}

      <Modal variant={ModalVariant.small} isOpen={!!releaseTarget} onClose={() => setReleaseTarget(null)} aria-label="Release public IP">
        <ModalHeader title="Release public IP" titleIconVariant="warning" />
        <ModalBody>
          <p style={{ marginBottom: 16 }}>
            Release <code>{releaseTarget?.address}</code> back to pool <code>{findPool(releaseTarget?.poolId ?? "")?.name}</code>?
            This cannot be undone — the address may be reallocated to another user.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="danger" onClick={() => releaseTarget && release(releaseTarget)}>Release</Button>
            <Button variant="link" onClick={() => setReleaseTarget(null)}>Cancel</Button>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
}

function AllocateModal({ isOpen, onClose, onAllocate, poolIds }: {
  isOpen: boolean; onClose: () => void; onAllocate: (poolId: string) => void; poolIds: string[];
}) {
  const [poolId, setPoolId] = useState(poolIds[0] ?? "");
  const [open, setOpen] = useState(false);
  const pool = findPool(poolId || poolIds[0] || "");
  return (
    <Modal variant={ModalVariant.small} isOpen={isOpen} onClose={onClose} aria-label="Allocate public IP">
      <ModalHeader title="Allocate public IP" description="A new address will be carved from the selected pool." />
      <ModalBody>
        <Form>
          <FormGroup label="Pool" fieldId="alloc-pool" isRequired>
            <Select isOpen={open} onOpenChange={setOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setOpen((v) => !v)} isExpanded={open}>
                  {pool ? `${pool.name} · ${pool.cidr}` : "Select a pool"}
                </MenuToggle>
              )}
              onSelect={(_, v) => { setPoolId(String(v)); setOpen(false); }}
            >
              <SelectList>
                {poolIds.map((id) => {
                  const p = findPool(id)!;
                  return <SelectOption key={id} value={id} description={p.zone}>{p.name} · {p.cidr}</SelectOption>;
                })}
              </SelectList>
            </Select>
          </FormGroup>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="primary" isDisabled={!pool} onClick={() => pool && onAllocate(pool.id)}>Allocate</Button>
            <Button variant="link" onClick={onClose}>Cancel</Button>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  );
}

function AttachModal({ ip, onClose, onAttach }: {
  ip: PublicIp;
  onClose: () => void;
  onAttach: (ip: PublicIp, type: WorkloadType, id: string, nic?: string) => void;
}) {
  const [type, setType] = useState<WorkloadType>("vm");
  const [typeOpen, setTypeOpen] = useState(false);
  const [resource, setResource] = useState("");
  const [resOpen, setResOpen] = useState(false);
  const [nic, setNic] = useState("");
  const [nicOpen, setNicOpen] = useState(false);

  const options =
    type === "vm" ? COMPUTE_INSTANCES.map((c) => c.metadata.name)
    : type === "cluster" ? CLUSTERS.map((c) => c.metadata.name)
    : BARE_METAL_INSTANCES.map((b) => b.name);

  const bmInstance = type === "baremetal" ? BARE_METAL_INSTANCES.find((b) => b.name === resource) : undefined;
  const nics = bmInstance ? (findBmHost(bmInstance.hostRef)?.nics ?? []) : [];

  return (
    <Modal variant={ModalVariant.small} isOpen onClose={onClose} aria-label="Attach public IP">
      <ModalHeader title={`Attach ${ip.address}`} description="A public IP is attached to exactly one compute resource at a time. Bare metal nodes support one public IP per NIC." />
      <ModalBody>
        <Form>
          <FormGroup label="Workload type" fieldId="att-type">
            <Select isOpen={typeOpen} onOpenChange={setTypeOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setTypeOpen((v) => !v)} isExpanded={typeOpen}>
                  {WORKLOAD_LABEL[type]}
                </MenuToggle>
              )}
              onSelect={(_, v) => { setType(v as WorkloadType); setResource(""); setNic(""); setTypeOpen(false); }}
            >
              <SelectList>
                <SelectOption value="vm">VM</SelectOption>
                <SelectOption value="cluster">Cluster</SelectOption>
                <SelectOption value="baremetal">Bare Metal</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup label="Resource" fieldId="att-res" isRequired>
            <Select isOpen={resOpen} onOpenChange={setResOpen}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setResOpen((v) => !v)} isExpanded={resOpen}>
                  {resource || "Select a resource"}
                </MenuToggle>
              )}
              onSelect={(_, v) => { setResource(String(v)); setResOpen(false); }}
            >
              <SelectList>
                {options.map((o) => <SelectOption key={o} value={o}>{o}</SelectOption>)}
              </SelectList>
            </Select>
          </FormGroup>
          {type === "baremetal" && nics.length > 0 && (
            <FormGroup label="NIC" fieldId="att-nic" isRequired>
              <Select isOpen={nicOpen} onOpenChange={setNicOpen}
                toggle={(ref) => (
                  <MenuToggle ref={ref} onClick={() => setNicOpen((v) => !v)} isExpanded={nicOpen}>
                    {nic || "Select a NIC"}
                  </MenuToggle>
                )}
                onSelect={(_, v) => { setNic(String(v)); setNicOpen(false); }}
              >
                <SelectList>
                  {nics.map((n) => <SelectOption key={n.name} value={n.name}>{n.name} · {n.speedGbps} Gbps</SelectOption>)}
                </SelectList>
              </Select>
            </FormGroup>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="primary"
              isDisabled={!resource || (type === "baremetal" && nics.length > 0 && !nic)}
              onClick={() => onAttach(ip, type, resource, type === "baremetal" ? nic || undefined : undefined)}
            >
              Attach
            </Button>
            <Button variant="link" onClick={onClose}>Cancel</Button>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  );
}
