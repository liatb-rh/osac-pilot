import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Button, Label, Switch, Modal, ModalVariant, ModalHeader, ModalBody,
  Form, FormGroup, TextInput, TextArea, FormSelect, FormSelectOption,
  Wizard, WizardStep, Checkbox,
} from "@patternfly/react-core";
import { PlusCircleIcon } from "@patternfly/react-icons";

import { STORAGE_TIERS, tierHasData, type StorageTier } from "@/lib/storage-tiers-data";

export const Route = createFileRoute("/app/provider/storage-tiers/")({ component: StoragePage });

function StoragePage() {
  const [tiers, setTiers] = useState<StorageTier[]>(STORAGE_TIERS);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate({ from: "/app/provider/storage-tiers" });

  return (
    <>
      <PageHeader title="Storage Tiers" subtitle="Define and govern sovereign-cloud storage classes."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpen(true)}>New tier</Button>}
      />
      <div className="osac-panel" style={{ display: "grid", gap: 12 }}>
        {tiers.map((t) => {
          const clickable = tierHasData(t);
          const usedPct = Math.round((t.used_tib / t.capacity_tib) * 100);
          const row = (
            <div style={{
              display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1.2fr 1fr auto",
              gap: 12, alignItems: "center", padding: 14, border: "1px solid #e3e8ee", borderRadius: 8,
              cursor: clickable ? "pointer" : "default",
              background: clickable ? "white" : "#fafbfc",
            }}>
              <div>
                <strong>
                  {clickable ? (
                    <Link to="/app/provider/storage-tiers/$id" params={{ id: t.id }} style={{ color: "#0066cc" }}>
                      {t.name}
                    </Link>
                  ) : t.name}
                </strong>{" "}
                <Label isCompact color={t.enabled ? "green" : "grey"}>{t.enabled ? "available" : "disabled"}</Label>{" "}
                {t.is_default && <Label isCompact color="blue">default</Label>}
                <div style={{ fontSize: 12, color: "#5b6b7c", marginTop: 2 }}>{t.description}</div>
              </div>
              <div><span style={{ color: "#5b6b7c", fontSize: 12 }}>IOPS</span><div><strong>{t.iops}</strong></div></div>
              <div><span style={{ color: "#5b6b7c", fontSize: 12 }}>Latency</span><div><strong>{t.latency_ms} ms</strong></div></div>
              <div><span style={{ color: "#5b6b7c", fontSize: 12 }}>Media</span><div style={{ fontSize: 13 }}>{t.media}</div></div>
              <div>
                <span style={{ color: "#5b6b7c", fontSize: 12 }}>Used</span>
                <div style={{ fontSize: 13 }}>{t.used_tib} / {t.capacity_tib} TiB</div>
                <div style={{ height: 4, background: "#eef3f8", borderRadius: 2, marginTop: 4 }}>
                  <div style={{ width: `${usedPct}%`, height: "100%", background: usedPct > 80 ? "#c9190b" : "#0066cc", borderRadius: 2 }} />
                </div>
              </div>
              <Switch id={t.id} label="Available" isChecked={t.enabled}
                onChange={(_, v) => setTiers((p) => p.map((x) => x.id === t.id ? { ...x, enabled: v } : x))} />
            </div>
          );
          return (
            <div key={t.id}
              onClick={clickable ? (e) => {
                if ((e.target as HTMLElement).closest("button, input, a, label")) return;
                navigate({ to: "/app/provider/storage-tiers/$id", params: { id: t.id } });
              } : undefined}>
              {row}
            </div>
          );
        })}
      </div>

      <NewTierWizard isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NewTierWizard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [id, setId] = useState("titanium");
  const [name, setName] = useState("Titanium");
  const [media, setMedia] = useState("NVMe SSD RAID-10");
  const [vastCluster, setVastCluster] = useState("vast-prod-α");
  const [protocol, setProtocol] = useState("NFSv4.1");
  const [reclaim, setReclaim] = useState("Retain");
  const [binding, setBinding] = useState("WaitForFirstConsumer");
  const [expand, setExpand] = useState(true);
  const [encryption, setEncryption] = useState("AES-256 + per-tenant KMS");
  const [replication, setReplication] = useState("sync");
  const [isDefault, setIsDefault] = useState(false);

  return (
    <Modal variant={ModalVariant.large} isOpen={isOpen} onClose={onClose} aria-label="New storage tier">
      <ModalHeader title="Create storage tier"
        description="Tier API will provision per-tenant StorageClass + VolumeSnapshotClass when a CaaS cluster reaches Ready." />
      <ModalBody>
        <Wizard height={540} onClose={onClose} onSave={onClose}>
          <WizardStep name="Identity" id="s-id">
            <Form>
              <FormGroup label="Tier ID" fieldId="tid" isRequired>
                <TextInput id="tid" value={id} onChange={(_, v) => setId(v.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              </FormGroup>
              <FormGroup label="Display name" fieldId="tn" isRequired>
                <TextInput id="tn" value={name} onChange={(_, v) => setName(v)} />
              </FormGroup>
              <FormGroup label="Description" fieldId="td">
                <TextArea id="td" rows={2} defaultValue="Ultra-low-latency tier for HFT and real-time risk workloads." />
              </FormGroup>
              <FormGroup fieldId="tdef">
                <Checkbox id="tdef" label="Mark as default tier for new tenant clusters"
                  isChecked={isDefault} onChange={(_, v) => setIsDefault(v)} />
              </FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Performance" id="s-perf">
            <Form>
              <FormGroup label="Media" fieldId="tm">
                <FormSelect id="tm" value={media} onChange={(_, v) => setMedia(v)}>
                  {["NVMe SSD RAID-10", "NVMe SSD", "SATA SSD", "HDD (SMR)"].map((x) =>
                    <FormSelectOption key={x} value={x} label={x} />)}
                </FormSelect>
              </FormGroup>
              <FormGroup label="Target IOPS" fieldId="ti"><TextInput id="ti" defaultValue="300k" /></FormGroup>
              <FormGroup label="Throughput (GB/s)" fieldId="tt"><TextInput id="tt" defaultValue="60" /></FormGroup>
              <FormGroup label="Latency SLO (ms)" fieldId="tl"><TextInput id="tl" defaultValue="0.15" /></FormGroup>
              <FormGroup label="Capacity (TiB)" fieldId="tc"><TextInput id="tc" defaultValue="80" /></FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Backend" id="s-backend">
            <Form>
              <FormGroup label="VAST cluster" fieldId="vc">
                <FormSelect id="vc" value={vastCluster} onChange={(_, v) => setVastCluster(v)}>
                  {["vast-prod-α", "vast-prod-β", "vast-archive-γ"].map((x) =>
                    <FormSelectOption key={x} value={x} label={x} />)}
                </FormSelect>
              </FormGroup>
              <FormGroup label="View path prefix" fieldId="vp">
                <TextInput id="vp" defaultValue={`/tenants/{tenant}/${id}`} />
              </FormGroup>
              <FormGroup label="Protocol" fieldId="vproto">
                <FormSelect id="vproto" value={protocol} onChange={(_, v) => setProtocol(v)}>
                  {["NFSv4.1", "NFSv3", "S3"].map((x) =>
                    <FormSelectOption key={x} value={x} label={x} />)}
                </FormSelect>
              </FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="CSI / Kubernetes" id="s-csi">
            <Form>
              <FormGroup label="CSI driver" fieldId="cd"><TextInput id="cd" defaultValue="csi.vastdata.com" /></FormGroup>
              <FormGroup label="StorageClass template" fieldId="sct">
                <TextInput id="sct" defaultValue={`tenant-{tenant}-${id}`} />
              </FormGroup>
              <FormGroup label="VolumeSnapshotClass template" fieldId="vsc">
                <TextInput id="vsc" defaultValue={`tenant-{tenant}-${id}-snap`} />
              </FormGroup>
              <FormGroup label="Reclaim policy" fieldId="rp">
                <FormSelect id="rp" value={reclaim} onChange={(_, v) => setReclaim(v)}>
                  {["Delete", "Retain"].map((x) => <FormSelectOption key={x} value={x} label={x} />)}
                </FormSelect>
              </FormGroup>
              <FormGroup label="Volume binding mode" fieldId="vbm">
                <FormSelect id="vbm" value={binding} onChange={(_, v) => setBinding(v)}>
                  {["Immediate", "WaitForFirstConsumer"].map((x) => <FormSelectOption key={x} value={x} label={x} />)}
                </FormSelect>
              </FormGroup>
              <FormGroup fieldId="ave">
                <Checkbox id="ave" label="Allow volume expansion" isChecked={expand} onChange={(_, v) => setExpand(v)} />
              </FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Governance" id="s-gov">
            <Form>
              <FormGroup label="Encryption" fieldId="enc">
                <FormSelect id="enc" value={encryption} onChange={(_, v) => setEncryption(v)}>
                  {["AES-256 at rest", "AES-256 + per-tenant KMS"].map((x) => <FormSelectOption key={x} value={x} label={x} />)}
                </FormSelect>
              </FormGroup>
              <FormGroup label="Replication" fieldId="rep">
                <FormSelect id="rep" value={replication} onChange={(_, v) => setReplication(v)}>
                  {["none", "async", "sync"].map((x) => <FormSelectOption key={x} value={x} label={x} />)}
                </FormSelect>
              </FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Review" id="s-review">
            <div className="osac-panel">
              <strong>{name} ({id})</strong>{" "}
              {isDefault && <Label isCompact color="blue">default</Label>}
              <ul style={{ margin: "8px 0 0 18px", color: "#5b6b7c", fontSize: 13 }}>
                <li>{media} · target {/* eslint-disable-next-line */}IOPS, replication {replication}</li>
                <li>Backend: {vastCluster} · {protocol}</li>
                <li>CSI: csi.vastdata.com · reclaim {reclaim} · binding {binding}{expand ? " · expandable" : ""}</li>
                <li>Encryption: {encryption}</li>
              </ul>
              <div style={{ marginTop: 10, fontSize: 12, color: "#5b6b7c" }}>
                Tier will be reconciled into <code>TenantStorage</code> CRs the next time a CaaS cluster reaches <code>ClusterOrderPhaseReady</code>.
              </div>
            </div>
          </WizardStep>
        </Wizard>
      </ModalBody>
    </Modal>
  );
}
