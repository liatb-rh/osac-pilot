import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession, TENANTS, type TenantId } from "@/lib/session";
import { ROLES, type RoleId } from "@/lib/rbac";
import { useTheme } from "@/lib/theme";
import { CloudIcon, BuildingIcon, ShieldAltIcon, UserIcon, MoonIcon, SunIcon } from "@patternfly/react-icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Open Sovereign AI Cloud — Welcome" },
      { name: "description", content: "Choose a persona to enter the OSAC control plane." },
    ],
  }),
  component: WelcomePage,
});

interface Persona {
  id: string;
  badge: string;
  name: string;
  role: RoleId;
  tenant: TenantId;
  tone: "provider" | "northstar" | "bluestone";
  desc: string;
}

const PERSONAS: Persona[] = [
  {
    id: "provider-admin",
    badge: "Platform Operator",
    name: "Vertexa Cloud Services",
    role: "providerAdmin",
    tenant: "vertexa",
    tone: "provider",
    desc: "Govern sovereign infrastructure, tenant organizations, storage tiers and global templates.",
  },
  {
    id: "northstar-admin",
    badge: "Tenant Organization",
    name: "Northstar Bank",
    role: "tenantAdmin",
    tenant: "northstar",
    tone: "northstar",
    desc: "Administer users, quota, networks, and cluster offerings for a regulated institution.",
  },
  {
    id: "northstar-user",
    badge: "Tenant Organization",
    name: "Northstar Bank",
    role: "tenantUser",
    tenant: "northstar",
    tone: "northstar",
    desc: "Provision VMs, manage workloads and provision OpenShift clusters as a workspace operator.",
  },
  {
    id: "bluestone-admin",
    badge: "Tenant Organization",
    name: "Bluestone Financial Group",
    role: "tenantAdmin",
    tenant: "evergreen",
    tone: "bluestone",
    desc: "Administer users, quota, networks, and cluster offerings for Bluestone teams.",
  },
  {
    id: "bluestone-user",
    badge: "Tenant Organization",
    name: "Bluestone Financial Group",
    role: "tenantUser",
    tenant: "evergreen",
    tone: "bluestone",
    desc: "Operate the VM and cluster lifecycle inside the Bluestone workspace.",
  },
];

function WelcomePage() {
  const { setPersona } = useSession();
  const navigate = useNavigate();

  const choose = (p: Persona) => {
    setPersona(p.role, p.tenant);
    navigate({ to: "/sign-in" });
  };

  return (
    <div className="osac-welcome">
      <div className="osac-welcome-inner">
        <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg,#0066cc,#143b66)",
              display: "grid", placeItems: "center", color: "white",
            }}
          >
            <CloudIcon />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#0b1b2b" }}>OSAC</div>
            <div style={{ fontSize: 12, color: "#5b6b7c" }}>Open Sovereign AI Cloud</div>
          </div>
        </header>

        <div className="osac-eyebrow">OSAC Prototypes</div>
        <h1 className="osac-hero-title">Choose how you want to enter the cloud.</h1>
        <p className="osac-hero-sub">
          Every persona below applies a tenant and role, then routes through institutional
          sign-in. Permissions, navigation, and capabilities are derived from the canonical
          OSAC role-based access matrix.
        </p>

        <div className="osac-persona-grid" role="list">
          {PERSONAS.map((p) => {
            const Icon = p.role === "providerAdmin" ? ShieldAltIcon
              : p.role === "tenantAdmin" ? BuildingIcon : UserIcon;
            return (
              <button
                key={p.id}
                className="osac-persona-card"
                data-tone={p.tone}
                onClick={() => choose(p)}
                role="listitem"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="osac-persona-badge">{p.badge}</span>
                  <Icon style={{ color: TENANTS[p.tenant].accent }} />
                </div>
                <div className="osac-persona-name">{p.name}</div>
                <div className="osac-persona-role">{ROLES[p.role].label}</div>
                <div className="osac-persona-desc">{p.desc}</div>
                <div style={{ marginTop: "auto", fontSize: 12, color: "#0066cc", fontWeight: 600 }}>
                  Continue to sign-in →
                </div>
              </button>
            );
          })}
        </div>

        <footer style={{ marginTop: 48, fontSize: 12, color: "#5b6b7c" }}>
          Mock demo environment · OSAC_API_MODE=mock · No real institutional credentials are used.
        </footer>
      </div>
    </div>
  );
}
