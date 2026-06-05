import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Kpi } from "@/components/osac/Primitives";
import {
  Button, Label, Modal, ModalVariant, ModalHeader, ModalBody,
  Wizard, WizardStep, Form, FormGroup, TextInput, TextArea, FormSelect, FormSelectOption,
  Switch, Checkbox, Alert, Slider, NumberInput,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { PlusCircleIcon, BuildingIcon } from "@patternfly/react-icons";
import { STORAGE_TIERS } from "@/lib/storage-tiers-data";

export const Route = createFileRoute("/app/provider/tenants/")({ component: TenantsPage });

type TenantRow = {
  n: string; id: string; users: number; vms: number; cl: number; status: "active" | "onboarding";
};

const SEED: TenantRow[] = [
  { n: "Northstar Bank", id: "northstar", users: 48, vms: 96, cl: 4, status: "active" },
  { n: "Bluestone Financial Group", id: "evergreen", users: 32, vms: 64, cl: 3, status: "active" },
  { n: "Aurora Health", id: "aurora", users: 21, vms: 42, cl: 2, status: "active" },
  { n: "Helix Logistics", id: "helix", users: 14, vms: 28, cl: 1, status: "onboarding" },
  { n: "Crestline Insurance", id: "crestline", users: 0, vms: 0, cl: 0, status: "onboarding" },
];

function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>(SEED);
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Tenant Organizations"
        subtitle="Onboard, suspend, or scope policy across sovereign tenants."
        actions={<Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpen(true)}>Onboard tenant</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="Tenants" value={tenants.length} />
        <Kpi label="Active" value={tenants.filter(t => t.status === "active").length} tone="success" />
        <Kpi label="Onboarding" value={tenants.filter(t => t.status === "onboarding").length} tone="warning" />
        <Kpi label="Total VMs" value={tenants.reduce((a, t) => a + t.vms, 0)} />
      </div>

      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead><Tr><Th>Organization</Th><Th>ID</Th><Th>Users</Th><Th>VMs</Th><Th>Clusters</Th><Th>Status</Th><Th /></Tr></Thead>
          <Tbody>
            {tenants.map((t) => (
              <Tr key={t.id}>
                <Td><strong>{t.n}</strong></Td>
                <Td><code>{t.id}</code></Td>
                <Td>{t.users}</Td>
                <Td>{t.vms}</Td>
                <Td>{t.cl}</Td>
                <Td><Label isCompact color={t.status === "active" ? "green" : "orange"}>{t.status}</Label></Td>
                <Td isActionCell><ActionsColumn items={[{ title: "View details" }, { title: "Edit quota" }, { title: "Audit log" }, { isSeparator: true }, { title: "Suspend" }]} /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      <OnboardTenantWizard
        isOpen={open}
        onClose={() => setOpen(false)}
        onCreate={(t) => { setTenants((p) => [...p, t]); setOpen(false); }}
      />
    </>
  );
}

function OnboardTenantWizard({
  isOpen, onClose, onCreate,
}: { isOpen: boolean; onClose: () => void; onCreate: (t: TenantRow) => void }) {
  // Identity
  const [name, setName] = useState("Crestline Insurance");
  const [id, setId] = useState("crestline");
  const [realm, setRealm] = useState("crestline.osac");
  const [description, setDescription] = useState("Regional insurance carrier — sovereign workloads.");

  // Identity Provider federation
  const [idp, setIdp] = useState("OIDC");
  const [idpHost, setIdpHost] = useState("auth.crestline.example");
  const [idpClientId, setIdpClientId] = useState("osac-portal");
  const [groupClaim, setGroupClaim] = useState("groups");

  // Quota
  const [cores, setCores] = useState(64);
  const [memGib, setMemGib] = useState(256);
  const [vmCount, setVmCount] = useState(50);
  const [clusterCount, setClusterCount] = useState(3);
  const [tiers, setTiers] = useState<Record<string, number>>({ gold: 5, silver: 20 });

  // RBAC seed
  const [adminEmail, setAdminEmail] = useState("admin@crestline.example");
  const [breakGlass, setBreakGlass] = useState(true);
  const [seedRoles, setSeedRoles] = useState(true);

  // Governance
  const [authPolicy, setAuthPolicy] = useState(true);
  const [auditExport, setAuditExport] = useState(true);
  const [networkIsolation, setNetworkIsolation] = useState<"strict" | "shared">("strict");

  const reset = () => {
    setName(""); setId(""); setRealm(""); setDescription("");
    setIdpHost(""); setIdpClientId(""); setAdminEmail("");
    setTiers({});
  };

  const submit = () => {
    onCreate({ n: name, id, users: 1, vms: 0, cl: 0, status: "onboarding" });
    reset();
  };

  const toggleTier = (tid: string) => {
    setTiers((p) => {
      const next = { ...p };
      if (tid in next) delete next[tid];
      else next[tid] = 5;
      return next;
    });
  };

  return (
    <Modal variant={ModalVariant.large} isOpen={isOpen} onClose={onClose} aria-label="Onboard tenant">
      <ModalHeader
        title="Onboard tenant organization"
        description="Provisions a Keycloak realm, federates the IdP, allocates quota, seeds RBAC, and emits Authorino AuthPolicies."
      />
      <ModalBody>
        <Wizard height={580} onClose={onClose} onSave={submit}>
          {/* ---------- Identity ---------- */}
          <WizardStep name="Identity" id="t-id">
            <Form>
              <FormGroup label="Organization name" isRequired fieldId="n">
                <TextInput id="n" value={name} onChange={(_, v) => setName(v)} />
              </FormGroup>
              <FormGroup label="Tenant ID" isRequired fieldId="tid"
               >
                <TextInput id="tid" value={id} onChange={(_, v) => setId(v.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              </FormGroup>
              <FormGroup label="Keycloak realm" isRequired fieldId="r">
                <TextInput id="r" value={realm} onChange={(_, v) => setRealm(v)} />
              </FormGroup>
              <FormGroup label="Description" fieldId="d">
                <TextArea id="d" value={description} onChange={(_, v) => setDescription(v)} rows={2} />
              </FormGroup>
              <Alert variant="info" isInline isPlain
                title={`Issuer will be https://auth.osac.internal/realms/${realm || "<realm>"}`} />
            </Form>
          </WizardStep>

          {/* ---------- IdP ---------- */}
          <WizardStep name="Identity provider" id="t-idp">
            <Form>
              <FormGroup label="Federation protocol" fieldId="proto">
                <FormSelect id="proto" value={idp} onChange={(_, v) => setIdp(v)}>
                  {["OIDC", "SAML", "LDAP", "AD"].map(o => <FormSelectOption key={o} value={o} label={o} />)}
                </FormSelect>
              </FormGroup>
              <FormGroup label="IdP endpoint / host" isRequired fieldId="h">
                <TextInput id="h" value={idpHost} onChange={(_, v) => setIdpHost(v)} />
              </FormGroup>
              <FormGroup label="Client ID / SP entity" fieldId="cid">
                <TextInput id="cid" value={idpClientId} onChange={(_, v) => setIdpClientId(v)} />
              </FormGroup>
              <FormGroup label="Group claim" fieldId="gc"
               >
                <TextInput id="gc" value={groupClaim} onChange={(_, v) => setGroupClaim(v)} />
              </FormGroup>
              <Alert variant="info" isInline isPlain
                title="A health probe will run against the IdP before the realm is marked Ready." />
            </Form>
          </WizardStep>

          {/* ---------- Quota ---------- */}
          <WizardStep name="Quota & resources" id="t-quota">
            <Form>
              <FormGroup label={`vCPU cores — ${cores}`} fieldId="cores">
                <Slider value={cores} min={8} max={512} step={8} onChange={(_, v) => setCores(v as number)} />
              </FormGroup>
              <FormGroup label={`Memory (GiB) — ${memGib}`} fieldId="mem">
                <Slider value={memGib} min={32} max={2048} step={32} onChange={(_, v) => setMemGib(v as number)} />
              </FormGroup>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FormGroup label="Max VM instances" fieldId="vmc">
                  <NumberInput value={vmCount} min={0} max={1000}
                    onMinus={() => setVmCount(v => Math.max(0, v - 5))}
                    onPlus={() => setVmCount(v => v + 5)}
                    onChange={(e) => setVmCount(Number((e.target as HTMLInputElement).value) || 0)} />
                </FormGroup>
                <FormGroup label="Max CaaS clusters" fieldId="cc">
                  <NumberInput value={clusterCount} min={0} max={50}
                    onMinus={() => setClusterCount(v => Math.max(0, v - 1))}
                    onPlus={() => setClusterCount(v => v + 1)}
                    onChange={(e) => setClusterCount(Number((e.target as HTMLInputElement).value) || 0)} />
                </FormGroup>
              </div>
              <FormGroup label="Storage tiers (TiB per tier)" fieldId="tiers"
               >
                <div style={{ display: "grid", gap: 8 }}>
                  {STORAGE_TIERS.map((t) => {
                    const enabled = t.id in tiers;
                    return (
                      <div key={t.id} style={{
                        display: "grid", gridTemplateColumns: "auto 1fr auto 120px",
                        gap: 12, alignItems: "center", padding: 10,
                        border: "1px solid #e3e8ee", borderRadius: 6,
                        background: enabled ? "#f6f9fc" : "white",
                      }}>
                        <Checkbox id={`tier-${t.id}`} isChecked={enabled} onChange={() => toggleTier(t.id)} />
                        <div>
                          <strong>{t.name}</strong>
                          <div style={{ fontSize: 12, color: "#5b6b7c" }}>{t.media} · {t.iops} IOPS · {t.latency_ms}ms</div>
                        </div>
                        <Label isCompact color="blue">{t.protocol}</Label>
                        <NumberInput value={tiers[t.id] ?? 0} min={0} max={500} unit="TiB"
                          isDisabled={!enabled}
                          onMinus={() => setTiers(p => ({ ...p, [t.id]: Math.max(0, (p[t.id] ?? 0) - 1) }))}
                          onPlus={() => setTiers(p => ({ ...p, [t.id]: (p[t.id] ?? 0) + 1 }))}
                          onChange={(e) => setTiers(p => ({ ...p, [t.id]: Number((e.target as HTMLInputElement).value) || 0 }))} />
                      </div>
                    );
                  })}
                </div>
              </FormGroup>
            </Form>
          </WizardStep>

          {/* ---------- RBAC ---------- */}
          <WizardStep name="RBAC & access" id="t-rbac">
            <Form>
              <FormGroup label="Initial Tenant Admin email" isRequired fieldId="ae"
               >
                <TextInput id="ae" type="email" value={adminEmail} onChange={(_, v) => setAdminEmail(v)} />
              </FormGroup>
              <FormGroup fieldId="seed">
                <Checkbox id="seed" label="Seed default role mappings (tenantAdmin, tenantUser)"
                  isChecked={seedRoles} onChange={(_, v) => setSeedRoles(v)} />
              </FormGroup>
              <FormGroup fieldId="bg">
                <Switch id="bg" label="Provision 2 break-glass accounts (recommended)"
                  isChecked={breakGlass} onChange={(_, v) => setBreakGlass(v)} />
              </FormGroup>
              <Alert variant="info" isInline isPlain
                title="ROLE_PERMISSIONS for tenantAdmin / tenantUser are imported from osac-rbac v1 — they cannot be edited here." />
            </Form>
          </WizardStep>

          {/* ---------- Governance ---------- */}
          <WizardStep name="Governance" id="t-gov">
            <Form>
              <FormGroup fieldId="ap">
                <Switch id="ap" label="Generate Authorino AuthPolicies for the new realm"
                  isChecked={authPolicy} onChange={(_, v) => setAuthPolicy(v)} />
              </FormGroup>
              <FormGroup fieldId="ax">
                <Switch id="ax" label="Forward audit events to provider SIEM"
                  isChecked={auditExport} onChange={(_, v) => setAuditExport(v)} />
              </FormGroup>
              <FormGroup label="Network isolation" fieldId="ni">
                <FormSelect id="ni" value={networkIsolation} onChange={(_, v) => setNetworkIsolation(v as any)}>
                  <FormSelectOption value="strict" label="Strict — dedicated VRF + NetworkPolicies deny-by-default" />
                  <FormSelectOption value="shared" label="Shared — provider VRF, tenant-scoped namespaces" />
                </FormSelect>
              </FormGroup>
            </Form>
          </WizardStep>

          {/* ---------- Review ---------- */}
          <WizardStep name="Review" id="t-review" footer={{ nextButtonText: "Onboard tenant" }}>
            <div style={{ display: "grid", gap: 14 }}>
              <ReviewCard title="Identity" icon={<BuildingIcon />}>
                <ReviewRow k="Name" v={name} />
                <ReviewRow k="Tenant ID" v={<code>{id}</code>} />
                <ReviewRow k="Realm" v={<code>{realm}</code>} />
                <ReviewRow k="Issuer" v={<code style={{ fontSize: 12 }}>https://auth.osac.internal/realms/{realm}</code>} />
              </ReviewCard>
              <ReviewCard title="Identity provider">
                <ReviewRow k="Protocol" v={<Label isCompact color="blue">{idp}</Label>} />
                <ReviewRow k="Host" v={<code>{idpHost}</code>} />
                <ReviewRow k="Client ID" v={<code>{idpClientId}</code>} />
                <ReviewRow k="Group claim" v={<code>{groupClaim}</code>} />
              </ReviewCard>
              <ReviewCard title="Quota">
                <ReviewRow k="Compute" v={`${cores} vCPU · ${memGib} GiB · up to ${vmCount} VMs · ${clusterCount} clusters`} />
                <ReviewRow k="Storage" v={
                  Object.keys(tiers).length === 0 ? <em style={{ color: "#5b6b7c" }}>none</em> : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {Object.entries(tiers).map(([t, q]) => (
                        <Label key={t} isCompact color="blue">{t}: {q} TiB</Label>
                      ))}
                    </div>
                  )
                } />
              </ReviewCard>
              <ReviewCard title="RBAC & governance">
                <ReviewRow k="Initial admin" v={<code>{adminEmail}</code>} />
                <ReviewRow k="Break-glass" v={breakGlass ? "2 accounts" : "none"} />
                <ReviewRow k="AuthPolicies" v={authPolicy ? "Generated" : "Skipped"} />
                <ReviewRow k="Audit export" v={auditExport ? "Enabled" : "Disabled"} />
                <ReviewRow k="Network isolation" v={networkIsolation} />
              </ReviewCard>
              <Alert variant="success" isInline
                title="Tenant will appear with status onboarding until the IdP health probe and storage reconcile complete." />
            </div>
          </WizardStep>
        </Wizard>
      </ModalBody>
    </Modal>
  );
}

function ReviewCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e3e8ee", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 600 }}>
        {icon} {title}
      </div>
      <div style={{ display: "grid", gap: 6 }}>{children}</div>
    </div>
  );
}

function ReviewRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, fontSize: 13 }}>
      <div style={{ color: "#5b6b7c" }}>{k}</div>
      <div>{v}</div>
    </div>
  );
}
