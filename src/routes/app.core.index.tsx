import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import { Button, Label } from "@patternfly/react-core";
import {
  KeyIcon, ShieldAltIcon, UsersIcon, CubesIcon, CogIcon, BuildingIcon,
} from "@patternfly/react-icons";
import { useSession, TENANTS } from "@/lib/session";
import type { RoleId } from "@/lib/rbac";

export const Route = createFileRoute("/app/core/")({ component: CoreOverview });

type Pillar = {
  key: string;
  title: string;
  desc: string;
  icon: any;
  stats: { label: string; value: string | number }[];
  status: "ready" | "progressing" | "failed";
  to: string;
  cta: string;
};

function pillarsForRole(role: RoleId, tenantShort: string): Pillar[] {
  if (role === "providerAdmin") {
    return [
      {
        key: "orgs", title: "Organizations & Authentication", icon: KeyIcon,
        desc: "Keycloak realms per tenant, federated to customer IdPs (LDAP/AD/OIDC/SAML) with break-glass admins.",
        stats: [{ label: "Organizations", value: 4 }, { label: "Healthy IdPs", value: "3 / 4" }, { label: "Break-glass", value: 7 }],
        status: "ready", to: "/app/provider/organizations", cta: "Manage organizations",
      },
      {
        key: "rbac", title: "RBAC", icon: ShieldAltIcon,
        desc: "System and org roles mapped from Keycloak groups, enforced at the gateway by Authorino.",
        stats: [{ label: "System roles", value: 2 }, { label: "Org roles", value: 3 }, { label: "Mappings", value: 5 }],
        status: "ready", to: "/app/provider/rbac", cta: "Open RBAC",
      },
      {
        key: "onboard", title: "Tenant Onboarding", icon: UsersIcon,
        desc: "Automated pipeline from organization → IdP → roles → OpenShift projects → storage.",
        stats: [{ label: "In progress", value: 2 }, { label: "Ready", value: 2 }, { label: "Median time", value: "14m" }],
        status: "progressing", to: "/app/provider/onboarding", cta: "Open onboarding",
      },
      {
        key: "catalog", title: "Catalog & Templates", icon: CubesIcon,
        desc: "Publish pre-configured offerings backed by versioned Ansible roles. Tenants order from a curated catalog.",
        stats: [{ label: "Items published", value: 12 }, { label: "VM offerings", value: 6 }, { label: "Cluster offerings", value: 4 }],
        status: "ready", to: "/app/provider/catalog-items", cta: "Manage catalog",
      },
      {
        key: "ansible", title: "Modular Ansible Collection", icon: CogIcon,
        desc: "Atomic, versioned roles with a standard contract (Pre-hook → Core → Post-hook) and granular status reporting.",
        stats: [{ label: "Roles", value: 7 }, { label: "Version", value: "2.4.0" }, { label: "Healthy", value: "6 / 7" }],
        status: "progressing", to: "/app/provider/ansible", cta: "View collection",
      },
    ];
  }
  if (role === "tenantAdmin") {
    return [
      {
        key: "myorg", title: "My Organization & IdP", icon: BuildingIcon,
        desc: `${tenantShort}'s Keycloak realm, federated identity provider, and break-glass admins.`,
        stats: [{ label: "Realm", value: "1" }, { label: "IdP health", value: "OK" }, { label: "Break-glass", value: 2 }],
        status: "ready", to: "/app/core/my-org", cta: "Open organization",
      },
      {
        key: "roles", title: "Roles & Members", icon: ShieldAltIcon,
        desc: "Tenant-scoped roles (tenant-admin, tenant-reader, tenant-user) mapped from Keycloak groups.",
        stats: [{ label: "Roles", value: 3 }, { label: "Members", value: 42 }, { label: "Groups", value: 4 }],
        status: "ready", to: "/app/admin/users", cta: "Manage members",
      },
      {
        key: "onboard", title: "Onboarding Status", icon: UsersIcon,
        desc: "Last onboarding pipeline run for your organization and current stage health.",
        stats: [{ label: "Last run", value: "3d ago" }, { label: "Stage", value: "Ready" }, { label: "Smoke test", value: "OK" }],
        status: "ready", to: "/app/provider/onboarding", cta: "View pipeline",
      },
      {
        key: "catalog", title: "Catalog", icon: CubesIcon,
        desc: "Order pre-approved VM, cluster, and bare-metal offerings published by the platform.",
        stats: [{ label: "Available", value: 12 }, { label: "VM", value: 6 }, { label: "Cluster", value: 4 }],
        status: "ready", to: "/app/admin/catalog-items", cta: "Browse catalog",
      },
    ];
  }
  // tenantUser
  return [
    {
      key: "catalog", title: "Catalog", icon: CubesIcon,
      desc: "Browse and order pre-approved VM, cluster, and bare-metal offerings.",
      stats: [{ label: "Available", value: 12 }, { label: "VM", value: 6 }, { label: "Cluster", value: 4 }],
      status: "ready", to: "/app/catalog", cta: "Browse catalog",
    },
    {
      key: "myroles", title: "My Roles", icon: ShieldAltIcon,
      desc: "Effective roles you hold in this organization, the Keycloak groups behind them, and what they let you do.",
      stats: [{ label: "Roles", value: 1 }, { label: "Groups", value: 1 }, { label: "Scope", value: "org" }],
      status: "ready", to: "/app/core/my-roles", cta: "View my roles",
    },
  ];
}

function CoreOverview() {
  const { role, tenant } = useSession();
  if (!role || !tenant) return null;
  const tenantShort = TENANTS[tenant].short;
  const pillars = pillarsForRole(role, tenantShort);

  const subtitle =
    role === "providerAdmin"
      ? "Identity, access, onboarding, catalog, and the Ansible automation contract — the foundation every workload depends on."
      : role === "tenantAdmin"
      ? `Your organization's identity, access, onboarding, and catalog within ${tenantShort}.`
      : "Your access and the catalog of offerings you can request.";

  return (
    <>
      <PageHeader title="OSAC Core" subtitle={subtitle} />

      {role !== "tenantUser" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {role === "providerAdmin" ? (
            <>
              <Kpi label="Organizations" value={4} hint="across all realms" />
              <Kpi label="Healthy IdPs" value="3 / 4" tone="success" />
              <Kpi label="Onboardings (30d)" value={6} tone="default" />
              <Kpi label="Catalog items" value={12} hint="VM · cluster · BM" />
            </>
          ) : (
            <>
              <Kpi label="Realm" value="1" hint={tenantShort} />
              <Kpi label="IdP health" value="OK" tone="success" />
              <Kpi label="Members" value={42} />
              <Kpi label="Catalog items" value={12} />
            </>
          )}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}>
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.key} className="osac-panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: "#e7f1fb", color: "#0066cc",
                  display: "grid", placeItems: "center",
                }}><Icon /></div>
                <strong style={{ fontSize: 15 }}>{p.title}</strong>
                <span style={{ marginLeft: "auto" }}><StatusDot status={p.status} /></span>
              </div>
              <div style={{ fontSize: 13, color: "#5b6b7c", lineHeight: 1.5, minHeight: 60 }}>
                {p.desc}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {p.stats.map((s) => (
                  <Label key={s.label} isCompact>
                    <span style={{ color: "#5b6b7c" }}>{s.label}:</span>&nbsp;<strong>{s.value}</strong>
                  </Label>
                ))}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 4 }}>
                <Link to={p.to}><Button variant="secondary">{p.cta}</Button></Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
