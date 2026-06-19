import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import { Button, Label, Alert } from "@patternfly/react-core";
import { KeyIcon, ShieldAltIcon, BuildingIcon } from "@patternfly/react-icons";
import { useSession, TENANTS } from "@/lib/session";

export const Route = createFileRoute("/app/core/my-org")({ component: MyOrgPage });

const ORG_BY_TENANT: Record<string, { realm: string; idp: string; idpHost: string; idpStatus: "running" | "progressing" | "failed"; users: number; breakGlass: number; lastProbe: string; }> = {
  northstar: { realm: "northstar.osac", idp: "LDAP", idpHost: "ldap.northstar.internal", idpStatus: "running", users: 48, breakGlass: 2, lastProbe: "2m ago" },
  evergreen: { realm: "bluestone.osac", idp: "SAML", idpHost: "sso.bluestone.fi", idpStatus: "running", users: 32, breakGlass: 2, lastProbe: "4m ago" },
  vertexa: { realm: "vertexa.osac", idp: "OIDC", idpHost: "auth.vertexa.cloud", idpStatus: "progressing", users: 18, breakGlass: 1, lastProbe: "1m ago" },
};

function MyOrgPage() {
  const { tenant } = useSession();
  if (!tenant) return null;
  const t = TENANTS[tenant];
  const org = ORG_BY_TENANT[tenant];

  return (
    <>
      <PageHeader
        title={`${t.name}`}
        subtitle="Your organization's Keycloak realm and federated identity provider."
        actions={
          <>
            <Button variant="secondary">Test IdP connection</Button>
            <Button variant="primary">Rotate break-glass</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="IdP type" value={org.idp} />
        <Kpi label="IdP health" value={org.idpStatus === "running" ? "OK" : org.idpStatus} tone={org.idpStatus === "running" ? "success" : "warning"} hint={`probe ${org.lastProbe}`} />
        <Kpi label="Active users" value={org.users} />
        <Kpi label="Break-glass" value={org.breakGlass} hint="emergency admins" tone="warning" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="osac-panel" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><BuildingIcon /><strong>Realm</strong></div>
          <div style={{ fontSize: 13, color: "#5b6b7c", display: "grid", gap: 6 }}>
            <div>Name: <code>{org.realm}</code></div>
            <div>Issuer: <code>https://auth.osac.internal/realms/{org.realm}</code></div>
            <div>Algorithm: RS256 · JWKS cached 10m</div>
            <div>Created via OSAC Core onboarding pipeline.</div>
          </div>
        </div>

        <div className="osac-panel" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><KeyIcon /><strong>External identity provider</strong></div>
          <div style={{ fontSize: 13, color: "#5b6b7c", display: "grid", gap: 6 }}>
            <div>Type: <Label isCompact color="blue">{org.idp}</Label></div>
            <div>Host: <code>{org.idpHost}</code></div>
            <div>Status: <StatusDot status={org.idpStatus} /></div>
            <div>Last health probe: {org.lastProbe}</div>
          </div>
        </div>

        <div className="osac-panel" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><ShieldAltIcon /><strong>Break-glass admins</strong></div>
          <div style={{ fontSize: 13, color: "#5b6b7c" }}>
            {org.breakGlass} emergency admin account{org.breakGlass === 1 ? "" : "s"} provisioned in the local realm. Use only when the external IdP is unavailable. Rotations are audited.
          </div>
        </div>

        <div className="osac-panel" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><ShieldAltIcon /><strong>Gateway enforcement</strong></div>
          <div style={{ fontSize: 13, color: "#5b6b7c" }}>
            Authorino validates Keycloak tokens at the Kuadrant gateway and maps the <code>groups</code> claim to your tenant roles. Deny-by-default; only explicitly allowed routes are reachable.
          </div>
        </div>
      </div>

      <Alert variant="info" isInline isPlain title="Members are sourced from your IdP. Add or remove users at the source — mappings sync within ~30s." style={{ marginTop: 16 }} />
    </>
  );
}
