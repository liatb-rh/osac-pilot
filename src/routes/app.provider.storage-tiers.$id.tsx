import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Tabs, Tab, TabTitleText, Breadcrumb, BreadcrumbItem,
  Label, LabelGroup, Card, CardBody, CardTitle, ClipboardCopy, ClipboardCopyVariant,
  DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription,
  Tooltip, Progress, ProgressSize, Alert,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { EditIcon, TrashIcon, OutlinedQuestionCircleIcon, BoltIcon } from "@patternfly/react-icons";

import { findTier, TEMPERATURE_META, LIFECYCLE_RULES, REHYDRATION_JOBS } from "@/lib/storage-tiers-data";

export const Route = createFileRoute("/app/provider/storage-tiers/$id")({ component: TierDetail });

function TierDetail() {
  const { id } = Route.useParams();
  const t = findTier(id);
  const [tab, setTab] = useState<string | number>("overview");

  if (!t) {
    return (
      <>
        <Breadcrumb style={{ marginBottom: 12 }}>
          <BreadcrumbItem><Link to="/app/provider/storage-tiers">Storage Tiers</Link></BreadcrumbItem>
          <BreadcrumbItem isActive>{id}</BreadcrumbItem>
        </Breadcrumb>
        <PageHeader title={id} subtitle="Tier not found." />
      </>
    );
  }

  const usedPct = Math.round((t.used_tib / t.capacity_tib) * 100);
  const totalPvcs = t.consumers.reduce((a, c) => a + c.pvcs, 0);
  const sampleTenant = t.consumers[0]?.tenant ?? "northstar";
  const sc = t.storage_class_template.replace("{tenant}", sampleTenant);
  const vsc = t.snapshot_class_template.replace("{tenant}", sampleTenant);
  const view = t.vast_view_prefix.replace("{tenant}", sampleTenant);

  const scYaml = `apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ${sc}
provisioner: ${t.csi_driver}
reclaimPolicy: ${t.reclaim_policy}
volumeBindingMode: ${t.volume_binding_mode}
allowVolumeExpansion: ${t.allow_volume_expansion}
parameters:
  view_policy: ${t.id}
  protocol: ${t.protocol}
  vast_cluster: ${t.vast_cluster}
  view: ${view}`;

  return (
    <>
      <Breadcrumb style={{ marginBottom: 12 }}>
        <BreadcrumbItem><Link to="/app/provider/storage-tiers">Storage Tiers</Link></BreadcrumbItem>
        <BreadcrumbItem isActive>{t.name}</BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        title={t.name}
        subtitle={`${t.description}`}
        actions={
          <>
            <Button variant="secondary" icon={<EditIcon />}>Edit tier</Button>
            <Button variant="danger" icon={<TrashIcon />} isDisabled={t.consumers.length > 0}>Retire</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Kpi label="Status" value={<Label color={t.enabled ? "green" : "grey"}>{t.enabled ? "available" : "disabled"}</Label> as any} />
        <Kpi label="IOPS" value={t.iops} hint="per view" />
        <Kpi label="Throughput" value={`${t.throughput_gbps} GB/s`} hint="sustained" />
        <Kpi label="Latency" value={`${t.latency_ms} ms`} hint="p99" />
        <Kpi label="Capacity" value={`${t.used_tib} / ${t.capacity_tib} TiB`} hint={`${usedPct}% used`} tone={usedPct > 80 ? "warning" : "default"} />
        <Kpi label="Consumers" value={totalPvcs} hint={`${t.consumers.length} tenants`} />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)} aria-label="Tier detail tabs">
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Card><CardTitle>Specification</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>Tier ID</DescriptionListTerm><DescriptionListDescription><code>{t.id}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Media</DescriptionListTerm><DescriptionListDescription>{t.media}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Default</DescriptionListTerm><DescriptionListDescription>{t.is_default ? "Yes — assigned to new tenant clusters" : "No"}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Encryption</DescriptionListTerm><DescriptionListDescription>{t.encryption}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Replication</DescriptionListTerm><DescriptionListDescription>{t.replication}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Labels</DescriptionListTerm><DescriptionListDescription>
                  <LabelGroup>
                    <Label color="blue">media={t.media.split(" ")[0].toLowerCase()}</Label>
                    <Label color="purple">protocol={t.protocol}</Label>
                    <Label color="grey">backend={t.vast_cluster}</Label>
                  </LabelGroup>
                </DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>

            <Card><CardTitle>Tier API conditions</CardTitle><CardBody>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
                {[
                  { t: "TIER_CONDITION_BACKEND_HEALTHY", ok: true },
                  { t: "TIER_CONDITION_CSI_INSTALLED", ok: true },
                  { t: "TIER_CONDITION_STORAGECLASS_RECONCILED", ok: t.consumers.length > 0 },
                  { t: "TIER_CONDITION_QUOTA_AVAILABLE", ok: usedPct < 90 },
                ].map((c) => (
                  <li key={c.t} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e3e8ee" }}>
                    <code style={{ fontSize: 12 }}>{c.t}</code>
                    <Label isCompact color={c.ok ? "green" : "red"}>{c.ok ? "True" : "False"}</Label>
                  </li>
                ))}
              </ul>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="backend" title={<TabTitleText>Backend</TabTitleText>}>
          <div style={{ paddingTop: 16 }}>
            <Card><CardTitle>VAST view binding</CardTitle><CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup><DescriptionListTerm>VAST cluster</DescriptionListTerm><DescriptionListDescription><code>{t.vast_cluster}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Protocol</DescriptionListTerm><DescriptionListDescription>{t.protocol}</DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>View prefix</DescriptionListTerm><DescriptionListDescription><code>{t.vast_view_prefix}</code></DescriptionListDescription></DescriptionListGroup>
                <DescriptionListGroup><DescriptionListTerm>Example view</DescriptionListTerm><DescriptionListDescription><code>{view}</code></DescriptionListDescription></DescriptionListGroup>
              </DescriptionList>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="csi" title={<TabTitleText>CSI / StorageClass</TabTitleText>}>
          <div style={{ paddingTop: 16, display: "grid", gap: 16 }}>
            <Card><CardTitle>Per-tenant manifest (example: <code>{sampleTenant}</code>)</CardTitle><CardBody>
              <ClipboardCopy isCode hoverTip="Copy" clickTip="Copied" variant={ClipboardCopyVariant.expansion}>
                {scYaml}
              </ClipboardCopy>
              <div style={{ marginTop: 12, fontSize: 13, color: "#5b6b7c" }}>
                VolumeSnapshotClass installed alongside: <code>{vsc}</code>
              </div>
            </CardBody></Card>
          </div>
        </Tab>

        <Tab eventKey="consumers" title={<TabTitleText>Consumers</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>Tenant</Th><Th>Clusters</Th><Th>PVCs</Th><Th>Used</Th><Th>StorageClass</Th></Tr></Thead>
              <Tbody>
                {t.consumers.map((c) => (
                  <Tr key={c.tenant}>
                    <Td><strong>{c.tenant}</strong></Td>
                    <Td>{c.clusters.join(", ")}</Td>
                    <Td>{c.pvcs}</Td>
                    <Td>{c.used_tib} TiB</Td>
                    <Td><code>{t.storage_class_template.replace("{tenant}", c.tenant)}</code></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="activity" title={<TabTitleText>Activity</TabTitleText>}>
          <div style={{ paddingTop: 16 }} className="osac-panel">
            <Table>
              <Thead><Tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Result</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>2026-06-05 09:14</Td><Td>system</Td><Td>Reconciled StorageClass on dev-ocp</Td><Td><Label color="green" isCompact>success</Label></Td></Tr>
                <Tr><Td>2026-06-03 17:02</Td><Td>platform@osac</Td><Td>Increased capacity by 80 TiB</Td><Td><Label color="green" isCompact>success</Label></Td></Tr>
                <Tr><Td>2026-05-22 11:30</Td><Td>platform@osac</Td><Td>Installed CSI driver {t.csi_driver}</Td><Td><Label color="green" isCompact>success</Label></Td></Tr>
              </Tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
