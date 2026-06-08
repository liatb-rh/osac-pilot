import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Button, Label, Switch, Modal, ModalVariant, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, TextInput, TextArea, FormSelect, FormSelectOption,
  Wizard, WizardStep, Checkbox, Tooltip, Alert, Progress, ProgressSize,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import {
  PlusCircleIcon, FireIcon, SunIcon, SnowflakeIcon, CubesIcon, ArchiveIcon,
  OutlinedQuestionCircleIcon, InfoCircleIcon, BoltIcon,
} from "@patternfly/react-icons";

import {
  STORAGE_TIERS, LIFECYCLE_RULES, REHYDRATION_JOBS, TEMPERATURE_META,
  tierHasData, type StorageTier, type Temperature, type LifecycleRule, type RehydrationJob,
} from "@/lib/storage-tiers-data";

export const Route = createFileRoute("/app/provider/storage-tiers/")({ component: StoragePage });

const TEMP_ICON: Record<Temperature, React.ComponentType<{ style?: React.CSSProperties }>> = {
  hot: FireIcon, warm: SunIcon, cool: SnowflakeIcon, cold: CubesIcon, archive: ArchiveIcon,
};

const TEMP_ORDER: Temperature[] = ["hot", "warm", "cool", "cold", "archive"];

function fmtUsd(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
}

function tierStyle(temp: Temperature): React.CSSProperties {
  const meta = TEMPERATURE_META[temp];
  return {
    // CSS variables consumed by .osac-tier-card / .osac-temp-pill
    ["--tier-tone" as any]: `var(--osac-temp-${temp})`,
    ["--tier-tone-soft" as any]: `var(--osac-temp-${temp}-soft)`,
    // fallback for inline use
    color: meta.tone,
  };
}

function StoragePage() {
  const [tiers, setTiers] = useState<StorageTier[]>(STORAGE_TIERS);
  const [openNewTier, setOpenNewTier] = useState(false);
  const [openNewRule, setOpenNewRule] = useState(false);
  const [filter, setFilter] = useState<Temperature | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [rehydrateTier, setRehydrateTier] = useState<StorageTier | null>(null);
  const [rules, setRules] = useState<LifecycleRule[]>(LIFECYCLE_RULES);
  const [jobs, setJobs] = useState<RehydrationJob[]>(REHYDRATION_JOBS);

  const visibleTiers = useMemo(
    () => (filter === "all" ? tiers : tiers.filter((t) => t.temperature === filter)),
    [tiers, filter],
  );

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <PageHeader
        title="Storage Tiers"
        subtitle="Classify data by temperature, govern lifecycle, and surface true cost-vs-speed trade-offs."
        actions={
          <>
            <Button variant="secondary" icon={<BoltIcon />} onClick={() => setOpenNewRule(true)}>
              New lifecycle rule
            </Button>
            <Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setOpenNewTier(true)}>
              New tier
            </Button>
          </>
        }
      />

      {/* Temperature filter strip */}
      <div className="osac-temp-strip">
        <div
          className="osac-temp-chip"
          data-active={filter === "all"}
          onClick={() => setFilter("all")}
          style={{ ["--tier-tone" as any]: "var(--osac-accent)", ["--tier-tone-soft" as any]: "var(--osac-accent-soft)" }}
        >
          <span className="dot" /> All tiers
        </div>
        {TEMP_ORDER.map((t) => {
          const Icon = TEMP_ICON[t];
          const count = tiers.filter((x) => x.temperature === t).length;
          return (
            <div
              key={t}
              className="osac-temp-chip"
              data-active={filter === t}
              onClick={() => setFilter(t)}
              style={tierStyle(t)}
            >
              <Icon style={{ fontSize: 14 }} />
              {TEMPERATURE_META[t].label}
              <span style={{ opacity: 0.7, fontWeight: 500 }}>· {count}</span>
            </div>
          );
        })}
      </div>

      {/* Tier cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {visibleTiers.map((t) => (
          <TierCard
            key={t.id}
            tier={t}
            selected={selected.includes(t.id)}
            onToggleSelect={() => toggleSelect(t.id)}
            onToggleEnabled={(v) =>
              setTiers((p) => p.map((x) => (x.id === t.id ? { ...x, enabled: v } : x)))
            }
            onRehydrate={() => setRehydrateTier(t)}
          />
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="osac-bulk-bar" style={{ marginTop: 16 }}>
          <strong>{selected.length} tier{selected.length > 1 ? "s" : ""} selected</strong>
          <span style={{ opacity: 0.8, fontSize: 13 }}>
            Bulk re-tier moves all consumer data to the chosen target tier. Penalties from minimum-retention windows are surfaced before confirmation.
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Button variant="primary" onClick={() => alert(`Bulk move scheduled for: ${selected.join(", ")}`)}>
              Move data…
            </Button>
            <Button variant="link" style={{ color: "#fff" }} onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Cost & penalty comparison */}
      <h2 className="osac-section-title" style={{ marginTop: 32, marginBottom: 12 }}>
        Cost & penalty comparison
      </h2>
      <CostComparisonTable tiers={tiers} />

      {/* Lifecycle rules */}
      <h2 className="osac-section-title" style={{ marginTop: 32, marginBottom: 12 }}>
        Lifecycle automation
      </h2>
      <LifecycleRulesPanel rules={rules} setRules={setRules} onNew={() => setOpenNewRule(true)} />

      {/* Rehydration jobs */}
      <h2 className="osac-section-title" style={{ marginTop: 32, marginBottom: 12 }}>
        Rehydration jobs
      </h2>
      <RehydrationPanel jobs={jobs} />

      <NewTierWizard isOpen={openNewTier} onClose={() => setOpenNewTier(false)} />
      <NewRuleWizard
        isOpen={openNewRule}
        onClose={() => setOpenNewRule(false)}
        tiers={tiers}
        onCreate={(r) => setRules((p) => [r, ...p])}
      />
      <RehydrateModal
        tier={rehydrateTier}
        onClose={() => setRehydrateTier(null)}
        onSubmit={(j) => {
          setJobs((p) => [j, ...p]);
          setRehydrateTier(null);
        }}
      />
    </>
  );
}

/* ───────────────── Tier card ───────────────── */

function TierCard({
  tier, selected, onToggleSelect, onToggleEnabled, onRehydrate,
}: {
  tier: StorageTier;
  selected: boolean;
  onToggleSelect: () => void;
  onToggleEnabled: (v: boolean) => void;
  onRehydrate: () => void;
}) {
  const meta = TEMPERATURE_META[tier.temperature];
  const Icon = TEMP_ICON[tier.temperature];
  const usedPct = Math.round((tier.used_tib / tier.capacity_tib) * 100);
  const clickable = tierHasData(tier);
  const isColdish = tier.temperature === "cold" || tier.temperature === "archive";

  return (
    <div className="osac-tier-card" data-selected={selected} style={tierStyle(tier.temperature)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox
          id={`sel-${tier.id}`}
          aria-label={`Select ${tier.name}`}
          isChecked={selected}
          onChange={onToggleSelect}
        />
        <span className="osac-temp-pill">
          <Icon style={{ fontSize: 12 }} /> {meta.label}
        </span>
        {tier.is_default && <Label isCompact color="blue">default</Label>}
        <div style={{ marginLeft: "auto" }}>
          <Switch
            id={`en-${tier.id}`}
            label="Available"
            isChecked={tier.enabled}
            onChange={(_, v) => onToggleEnabled(v)}
          />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--osac-ink)" }}>
          {clickable ? (
            <Link
              to="/app/provider/storage-tiers/$id"
              params={{ id: tier.id }}
              style={{ color: "var(--osac-ink)" }}
            >
              {tier.name}
            </Link>
          ) : (
            tier.name
          )}
        </div>
        <div className="osac-card-sub" style={{ marginTop: 2 }}>{meta.blurb}</div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div className="osac-cost-row">
          <span style={{ color: "var(--osac-muted)" }}>Storage</span>
          <span className="num">{fmtUsd(tier.cost_storage_per_tib_month)}<span style={{ color: "var(--osac-muted)", fontWeight: 400, fontSize: 12 }}> /TiB·mo</span></span>
        </div>
        <div className="osac-cost-row">
          <span style={{ color: "var(--osac-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            Retrieval
            <Tooltip content={tier.cost_retrieval_per_tib === 0
              ? "No retrieval fee — data is always online."
              : `Reading data out of ${tier.name} costs $${tier.cost_retrieval_per_tib}/TiB and takes ${tier.rehydration_eta}.`}>
              <OutlinedQuestionCircleIcon style={{ fontSize: 12, color: "var(--osac-muted)" }} />
            </Tooltip>
          </span>
          <span className="num">
            {tier.cost_retrieval_per_tib === 0
              ? <span style={{ color: "var(--osac-success)" }}>free</span>
              : <>+{fmtUsd(tier.cost_retrieval_per_tib)}<span style={{ color: "var(--osac-muted)", fontWeight: 400, fontSize: 12 }}> /TiB</span></>}
          </span>
        </div>
        <div className="osac-cost-row">
          <span style={{ color: "var(--osac-muted)" }}>ETA</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{tier.rehydration_eta}</span>
        </div>
      </div>

      {tier.min_retention_days > 0 && (
        <div
          style={{
            fontSize: 11, padding: "6px 8px", borderRadius: 6,
            background: "var(--tier-tone-soft)", color: "var(--tier-tone)",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <InfoCircleIcon style={{ fontSize: 12 }} />
          Min retention {tier.min_retention_days}d · early-delete ${tier.early_delete_fee_per_tib}/TiB
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--osac-muted)" }}>
          <span>Used</span>
          <span>{tier.used_tib} / {tier.capacity_tib} TiB · {usedPct}%</span>
        </div>
        <div style={{ height: 6, background: "var(--osac-border)", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${usedPct}%`, height: "100%",
              background: usedPct > 80 ? "var(--osac-danger)" : "var(--tier-tone)",
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        {clickable && (
          <Link to="/app/provider/storage-tiers/$id" params={{ id: tier.id }}>
            <Button variant="secondary" size="sm">Details</Button>
          </Link>
        )}
        {isColdish && (
          <Button variant="link" size="sm" onClick={onRehydrate}>Start rehydration</Button>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Cost comparison table ───────────────── */

function CostComparisonTable({ tiers }: { tiers: StorageTier[] }) {
  return (
    <div className="osac-panel" style={{ padding: 0 }}>
      <Table aria-label="Cost & penalty comparison">
        <Thead>
          <Tr>
            <Th>Tier</Th>
            <Th>Temperature</Th>
            <Th>Storage $/TiB·mo</Th>
            <Th>Retrieval $/TiB</Th>
            <Th>Min retention</Th>
            <Th>Early-delete fee</Th>
            <Th>Latency</Th>
            <Th>Replication</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tiers.map((t) => {
            const meta = TEMPERATURE_META[t.temperature];
            const Icon = TEMP_ICON[t.temperature];
            return (
              <Tr key={t.id}>
                <Td><strong>{t.name}</strong></Td>
                <Td>
                  <span className="osac-temp-pill" style={tierStyle(t.temperature)}>
                    <Icon style={{ fontSize: 11 }} /> {meta.label}
                  </span>
                </Td>
                <Td>{fmtUsd(t.cost_storage_per_tib_month)}</Td>
                <Td>
                  {t.cost_retrieval_per_tib === 0 ? (
                    <span style={{ color: "var(--osac-success)" }}>free</span>
                  ) : (
                    <Tooltip content={`Pulling data out of ${t.name} takes ${t.rehydration_eta} and costs $${t.cost_retrieval_per_tib} per TiB.`}>
                      <span style={{ borderBottom: "1px dotted", cursor: "help" }}>+{fmtUsd(t.cost_retrieval_per_tib)}</span>
                    </Tooltip>
                  )}
                </Td>
                <Td>
                  {t.min_retention_days === 0 ? (
                    <span style={{ color: "var(--osac-muted)" }}>—</span>
                  ) : (
                    <Tooltip content={`Files moved into ${t.name} must remain at least ${t.min_retention_days} days, or an early-delete fee applies.`}>
                      <span style={{ borderBottom: "1px dotted", cursor: "help" }}>{t.min_retention_days}d</span>
                    </Tooltip>
                  )}
                </Td>
                <Td>{t.early_delete_fee_per_tib === 0 ? "—" : `$${t.early_delete_fee_per_tib}/TiB`}</Td>
                <Td>{t.latency_ms} ms</Td>
                <Td>{t.replication}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </div>
  );
}

/* ───────────────── Lifecycle rules ───────────────── */

function LifecycleRulesPanel({
  rules, setRules, onNew,
}: {
  rules: LifecycleRule[];
  setRules: React.Dispatch<React.SetStateAction<LifecycleRule[]>>;
  onNew: () => void;
}) {
  return (
    <div className="osac-panel" style={{ display: "grid", gap: 10 }}>
      <Alert variant="info" isInline isPlain title="Automate so users don't have to remember to re-tier data" />
      {rules.map((r) => (
        <div
          key={r.id}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto auto auto",
            gap: 12, alignItems: "center",
            padding: 12,
            border: "1px solid var(--osac-border)",
            borderRadius: 8,
            background: "var(--osac-surface)",
          }}
        >
          <BoltIcon style={{ color: "var(--osac-warning)" }} />
          <div>
            <div style={{ fontWeight: 600, color: "var(--osac-ink)" }}>{r.name}</div>
            <div style={{ fontSize: 12, color: "var(--osac-muted)" }}>
              <code>{r.filter}</code> — moves from <strong>{r.source_tier}</strong> → <strong>{r.target_tier}</strong>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--osac-success)", fontWeight: 600 }}>
            ≈ ${r.est_monthly_savings_usd.toLocaleString()}/mo saved
          </div>
          <Label isCompact color={r.enabled ? "green" : "grey"}>{r.enabled ? "active" : "paused"}</Label>
          <Switch
            id={`rule-${r.id}`}
            aria-label="Toggle rule"
            isChecked={r.enabled}
            onChange={(_, v) =>
              setRules((p) => p.map((x) => (x.id === r.id ? { ...x, enabled: v } : x)))
            }
          />
        </div>
      ))}
      <div>
        <Button variant="link" icon={<PlusCircleIcon />} onClick={onNew}>
          New lifecycle rule
        </Button>
      </div>
    </div>
  );
}

/* ───────────────── Rehydration jobs ───────────────── */

function RehydrationPanel({ jobs }: { jobs: RehydrationJob[] }) {
  if (jobs.length === 0) {
    return <div className="osac-empty">No active rehydration jobs.</div>;
  }
  return (
    <div className="osac-panel" style={{ display: "grid", gap: 12 }}>
      {jobs.map((j) => {
        const variant: "success" | "warning" | "danger" | undefined =
          j.status === "ready" ? "success" : j.status === "failed" ? "danger" : undefined;
        return (
          <div
            key={j.id}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1.2fr 1fr 2fr auto",
              gap: 12, alignItems: "center",
            }}
          >
            <code style={{ fontSize: 12, color: "var(--osac-muted)" }}>{j.id}</code>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {j.source_tier} → {j.target_tier}
              </div>
              <div style={{ fontSize: 11, color: "var(--osac-muted)" }}>
                requested by {j.requested_by} · {j.started_at}
              </div>
            </div>
            <div style={{ fontSize: 13 }}>{j.size_tib} TiB</div>
            <Progress
              value={j.progress_pct}
              title={j.status === "ready" ? "Ready to read" : "Thawing"}
              size={ProgressSize.sm}
              label={j.eta}
              valueText={j.eta}
              variant={variant}
            />
            <Label isCompact color={j.status === "ready" ? "green" : j.status === "failed" ? "red" : "orange"}>
              {j.status}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────── New lifecycle rule wizard ───────────────── */

function NewRuleWizard({
  isOpen, onClose, tiers, onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  tiers: StorageTier[];
  onCreate: (r: LifecycleRule) => void;
}) {
  const [name, setName] = useState("Archive logs older than 90d");
  const [src, setSrc] = useState(tiers[1]?.id ?? "gold");
  const [tgt, setTgt] = useState(tiers[tiers.length - 1]?.id ?? "glacier");
  const [filter, setFilter] = useState("age > 90d AND label=logs");
  const [sizeTib, setSizeTib] = useState("50");

  const sTier = tiers.find((t) => t.id === src);
  const tTier = tiers.find((t) => t.id === tgt);
  const sizeN = Math.max(0, parseFloat(sizeTib) || 0);
  const savings =
    sTier && tTier
      ? Math.max(0, (sTier.cost_storage_per_tib_month - tTier.cost_storage_per_tib_month) * sizeN)
      : 0;
  const retrievalCostIfReverted = tTier ? tTier.cost_retrieval_per_tib * sizeN : 0;

  const submit = () => {
    onCreate({
      id: `r-${Math.random().toString(36).slice(2, 7)}`,
      name,
      source_tier: src,
      target_tier: tgt,
      filter,
      enabled: true,
      est_monthly_savings_usd: Math.round(savings),
    });
    onClose();
  };

  return (
    <Modal variant={ModalVariant.medium} isOpen={isOpen} onClose={onClose} aria-label="New lifecycle rule">
      <ModalHeader title="New lifecycle rule" description="Automatically move data between tiers based on age, size, or labels." />
      <ModalBody>
        <Wizard height={460} onClose={onClose} onSave={submit}>
          <WizardStep name="Source & filter" id="r-src">
            <Form>
              <FormGroup label="Rule name" fieldId="rn" isRequired>
                <TextInput id="rn" value={name} onChange={(_, v) => setName(v)} />
              </FormGroup>
              <FormGroup label="Source tier" fieldId="rs">
                <FormSelect id="rs" value={src} onChange={(_, v) => setSrc(v)}>
                  {tiers.map((t) => <FormSelectOption key={t.id} value={t.id} label={t.name} />)}
                </FormSelect>
              </FormGroup>
              <FormGroup label="Filter expression" fieldId="rf">
                <TextInput id="rf" value={filter} onChange={(_, v) => setFilter(v)} />
              </FormGroup>
            </Form>
          </WizardStep>
          <WizardStep name="Target tier" id="r-tgt">
            <Form>
              <FormGroup label="Move to" fieldId="rt">
                <FormSelect id="rt" value={tgt} onChange={(_, v) => setTgt(v)}>
                  {tiers.map((t) => <FormSelectOption key={t.id} value={t.id} label={t.name} />)}
                </FormSelect>
              </FormGroup>
              {tTier && tTier.min_retention_days > 0 && (
                <Alert variant="warning" isInline title={`${tTier.name} has a ${tTier.min_retention_days}-day minimum retention`}>
                  Data moved into {tTier.name} cannot be deleted for {tTier.min_retention_days} days without paying a ${tTier.early_delete_fee_per_tib}/TiB early-delete fee.
                </Alert>
              )}
            </Form>
          </WizardStep>
          <WizardStep name="What-if savings" id="r-savings">
            <Form>
              <FormGroup label="Estimated affected data (TiB)" fieldId="rsz">
                <TextInput id="rsz" value={sizeTib} onChange={(_, v) => setSizeTib(v)} />
              </FormGroup>
              <div className="osac-panel" style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--osac-muted)" }}>Current monthly cost</span>
                  <strong>${sTier ? (sTier.cost_storage_per_tib_month * sizeN).toLocaleString() : "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--osac-muted)" }}>After moving to {tTier?.name ?? "—"}</span>
                  <strong>${tTier ? (tTier.cost_storage_per_tib_month * sizeN).toLocaleString() : "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--osac-border)", paddingTop: 8 }}>
                  <span style={{ color: "var(--osac-success)", fontWeight: 700 }}>Estimated monthly savings</span>
                  <strong style={{ color: "var(--osac-success)" }}>${Math.round(savings).toLocaleString()}</strong>
                </div>
                {retrievalCostIfReverted > 0 && (
                  <div style={{ fontSize: 12, color: "var(--osac-muted)" }}>
                    Note: re-reading this dataset from {tTier?.name} would cost ${Math.round(retrievalCostIfReverted).toLocaleString()} in retrieval fees.
                  </div>
                )}
              </div>
            </Form>
          </WizardStep>
        </Wizard>
      </ModalBody>
    </Modal>
  );
}

/* ───────────────── Rehydration modal ───────────────── */

function RehydrateModal({
  tier, onClose, onSubmit,
}: {
  tier: StorageTier | null;
  onClose: () => void;
  onSubmit: (j: RehydrationJob) => void;
}) {
  const [size, setSize] = useState("0.5");
  const [target, setTarget] = useState("gold");
  if (!tier) return null;
  const sizeN = Math.max(0, parseFloat(size) || 0);
  const cost = sizeN * tier.cost_retrieval_per_tib;

  return (
    <Modal variant={ModalVariant.small} isOpen onClose={onClose} aria-label="Rehydrate data">
      <ModalHeader title={`Rehydrate from ${tier.name}`} description={`Restore data to a warmer tier. Estimated time: ${tier.rehydration_eta}.`} />
      <ModalBody>
        <Form>
          <FormGroup label="Amount to thaw (TiB)" fieldId="rsz">
            <TextInput id="rsz" value={size} onChange={(_, v) => setSize(v)} />
          </FormGroup>
          <FormGroup label="Restore to tier" fieldId="rtg">
            <FormSelect id="rtg" value={target} onChange={(_, v) => setTarget(v)}>
              {STORAGE_TIERS.filter((t) => t.id !== tier.id).map((t) => (
                <FormSelectOption key={t.id} value={t.id} label={t.name} />
              ))}
            </FormSelect>
          </FormGroup>
          <Alert variant="warning" isInline title={`Retrieval fee: $${cost.toFixed(2)}`}>
            Reading {sizeN} TiB out of {tier.name} costs ${tier.cost_retrieval_per_tib}/TiB and takes {tier.rehydration_eta}.
          </Alert>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() =>
            onSubmit({
              id: `rh-${Math.random().toString(36).slice(2, 6)}`,
              source_tier: tier.id,
              target_tier: target,
              size_tib: sizeN,
              progress_pct: 2,
              eta: tier.rehydration_eta,
              status: "queued",
              requested_by: "you",
              started_at: new Date().toISOString().slice(0, 16).replace("T", " "),
            })
          }
        >
          Start rehydration
        </Button>
        <Button variant="link" onClick={onClose}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
}

/* ───────────────── New tier wizard (preserved, with temperature step) ───────────────── */

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
  const [temperature, setTemperature] = useState<Temperature>("hot");
  const [storageCost, setStorageCost] = useState("300");
  const [retrievalCost, setRetrievalCost] = useState("0");
  const [minRetention, setMinRetention] = useState("0");

  return (
    <Modal variant={ModalVariant.large} isOpen={isOpen} onClose={onClose} aria-label="New storage tier">
      <ModalHeader
        title="Create storage tier"
        description="Tier API will provision per-tenant StorageClass + VolumeSnapshotClass when a CaaS cluster reaches Ready."
      />
      <ModalBody>
        <Wizard height={560} onClose={onClose} onSave={onClose}>
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
                <Checkbox
                  id="tdef"
                  label="Mark as default tier for new tenant clusters"
                  isChecked={isDefault}
                  onChange={(_, v) => setIsDefault(v)}
                />
              </FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Temperature & economics" id="s-temp">
            <Form>
              <FormGroup label="Temperature class" fieldId="tt">
                <FormSelect id="tt" value={temperature} onChange={(_, v) => setTemperature(v as Temperature)}>
                  {TEMP_ORDER.map((t) => (
                    <FormSelectOption key={t} value={t} label={`${TEMPERATURE_META[t].label} — ${TEMPERATURE_META[t].blurb}`} />
                  ))}
                </FormSelect>
              </FormGroup>
              <FormGroup label="Storage cost ($/TiB·month)" fieldId="tsc">
                <TextInput id="tsc" value={storageCost} onChange={(_, v) => setStorageCost(v)} />
              </FormGroup>
              <FormGroup label="Retrieval cost ($/TiB)" fieldId="trc">
                <TextInput id="trc" value={retrievalCost} onChange={(_, v) => setRetrievalCost(v)} />
              </FormGroup>
              <FormGroup label="Minimum retention (days)" fieldId="tmr">
                <TextInput id="tmr" value={minRetention} onChange={(_, v) => setMinRetention(v)} />
              </FormGroup>
            </Form>
          </WizardStep>

          <WizardStep name="Performance" id="s-perf">
            <Form>
              <FormGroup label="Media" fieldId="tm">
                <FormSelect id="tm" value={media} onChange={(_, v) => setMedia(v)}>
                  {["NVMe SSD RAID-10", "NVMe SSD", "SATA SSD", "HDD (SMR)", "Tape library + erasure-coded HDD"].map((x) =>
                    <FormSelectOption key={x} value={x} label={x} />)}
                </FormSelect>
              </FormGroup>
              <FormGroup label="Target IOPS" fieldId="ti"><TextInput id="ti" defaultValue="300k" /></FormGroup>
              <FormGroup label="Throughput (GB/s)" fieldId="tt2"><TextInput id="tt2" defaultValue="60" /></FormGroup>
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
              <span className="osac-temp-pill" style={tierStyle(temperature)}>
                {TEMPERATURE_META[temperature].label}
              </span>{" "}
              {isDefault && <Label isCompact color="blue">default</Label>}
              <ul style={{ margin: "8px 0 0 18px", color: "var(--osac-muted)", fontSize: 13 }}>
                <li>{media} · replication {replication}</li>
                <li>Cost: ${storageCost}/TiB·mo storage · ${retrievalCost}/TiB retrieval · {minRetention}d min retention</li>
                <li>Backend: {vastCluster} · {protocol}</li>
                <li>CSI: csi.vastdata.com · reclaim {reclaim} · binding {binding}{expand ? " · expandable" : ""}</li>
                <li>Encryption: {encryption}</li>
              </ul>
            </div>
          </WizardStep>
        </Wizard>
      </ModalBody>
    </Modal>
  );
}
