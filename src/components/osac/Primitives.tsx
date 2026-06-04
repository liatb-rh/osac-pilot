import { useSession, TENANTS } from "@/lib/session";
import { ROLES } from "@/lib/rbac";

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      gap: 16, marginBottom: 20, flexWrap: "wrap",
    }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
        {subtitle && <p style={{ color: "#5b6b7c", margin: "6px 0 0" }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );
}

export function ScopeBadge() {
  const { role, tenant } = useSession();
  if (!role || !tenant) return null;
  return (
    <span style={{
      fontSize: 12, color: "#5b6b7c", background: "#eef3f8",
      padding: "4px 10px", borderRadius: 999,
    }}>
      {TENANTS[tenant].short} · {ROLES[role].label}
    </span>
  );
}

export function Kpi({ label, value, hint, tone = "default" }: {
  label: string; value: string | number; hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  return (
    <div className="osac-kpi" data-tone={tone === "default" ? undefined : tone}>
      <div className="osac-kpi-label">{label}</div>
      <div className="osac-kpi-value">{value}</div>
      {hint && <div className="osac-kpi-hint">{hint}</div>}
    </div>
  );
}

export function StatusDot({ status }: { status: "running" | "stopped" | "ready" | "progressing" | "upgrading" | "failed" }) {
  return (
    <span>
      <span className="osac-status-dot" data-s={status} />
      <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{status}</span>
    </span>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="osac-empty">
      <div style={{ fontWeight: 600, color: "#0b1b2b", marginBottom: 4 }}>{title}</div>
      {body && <div style={{ fontSize: 13 }}>{body}</div>}
    </div>
  );
}
