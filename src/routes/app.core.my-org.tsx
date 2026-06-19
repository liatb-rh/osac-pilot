import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi, StatusDot } from "@/components/osac/Primitives";
import { Button, Label, Alert, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { KeyIcon, ShieldAltIcon, BuildingIcon, LockIcon } from "@patternfly/react-icons";
import { useState } from "react";
import { useSession, TENANTS } from "@/lib/session";

export const Route = createFileRoute("/app/core/my-org")({ component: MyOrgPage });

/**
 * Mirrors osac.iam.v1 models: Organization, IdentityProvider (oidc_config | ldap_config),
 * AuthnCapabilities.trusted_token_issuers, BreakGlassCredentials, User.
 */
type IdpKind = "OIDC" | "LDAP" | "SAML";
type Phase = "running" | "progressing" | "failed";

type OrgFixture = {
  // Organization
  org: {
    id: string;
    metadata: {
      name: string;
      tenant: string;
      creator: string;
      creation_timestamp: string;
      version: string;
      labels: Record<string, string>;
    };
    realm: string;
  };
  // IdentityProvider
  idp: {
    name: string;
    metadata: { creation_timestamp: string; version: string };
    spec: {
      title: string;
      enabled: boolean;
      kind: IdpKind;
      oidc_config?: {
        issuer: string;
        authorization_url: string;
        token_url: string;
        jwks_url: string;
        logout_url: string;
        client_id: string;
        client_secret: string; // masked
      };
      ldap_config?: {
        connection_url: string;
        bind_dn: string;
        bind_credential: string; // masked
        users_dn: string;
        username_ldap_attribute: string;
        vendor: string;
      };
    };
    status: { phase: Phase; message: string; last_probe: string };
  };
  // AuthnCapabilities
  authn: { trusted_token_issuers: string[] };
  // BreakGlassCredentials
  breakGlass: { username: string; last_rotated: string }[];
  users: { count: number; phase_ready: number };
};

const FIXTURES: Record<string, OrgFixture> = {
  northstar: {
    org: {
      id: "org-northstar",
      metadata: {
        name: "northstar", tenant: "northstar", creator: "avery.chen@osac.io",
        creation_timestamp: "2025-11-14T09:12:00Z", version: "v7",
        labels: { "osac.io/region": "eu-west", "osac.io/tier": "gold" },
      },
      realm: "northstar.osac",
    },
    idp: {
      name: "northstar-corp-ldap",
      metadata: { creation_timestamp: "2025-11-14T09:18:00Z", version: "v3" },
      spec: {
        title: "Northstar Corp LDAP", enabled: true, kind: "LDAP",
        ldap_config: {
          connection_url: "ldaps://ldap.northstar.internal:636",
          bind_dn: "cn=osac-svc,ou=service,dc=northstar,dc=bank",
          bind_credential: "••••••••••••",
          users_dn: "ou=people,dc=northstar,dc=bank",
          username_ldap_attribute: "uid",
          vendor: "rh-ds",
        },
      },
      status: { phase: "running", message: "Bind successful · 42 users discovered", last_probe: "2m ago" },
    },
    authn: { trusted_token_issuers: ["https://auth.osac.internal/realms/northstar.osac"] },
    breakGlass: [
      { username: "bg-admin-1", last_rotated: "2026-04-02T08:00:00Z" },
      { username: "bg-admin-2", last_rotated: "2026-04-02T08:00:00Z" },
    ],
    users: { count: 48, phase_ready: 46 },
  },
  evergreen: {
    org: {
      id: "org-bluestone",
      metadata: {
        name: "bluestone", tenant: "evergreen", creator: "priya.raman@osac.io",
        creation_timestamp: "2025-12-03T11:40:00Z", version: "v4",
        labels: { "osac.io/region": "eu-north", "osac.io/tier": "silver" },
      },
      realm: "bluestone.osac",
    },
    idp: {
      name: "bluestone-azure-oidc",
      metadata: { creation_timestamp: "2025-12-03T11:50:00Z", version: "v2" },
      spec: {
        title: "Bluestone Azure AD (OIDC)", enabled: true, kind: "OIDC",
        oidc_config: {
          issuer: "https://login.microsoftonline.com/bluestone/v2.0",
          authorization_url: "https://login.microsoftonline.com/bluestone/oauth2/v2.0/authorize",
          token_url: "https://login.microsoftonline.com/bluestone/oauth2/v2.0/token",
          jwks_url: "https://login.microsoftonline.com/bluestone/discovery/v2.0/keys",
          logout_url: "https://login.microsoftonline.com/bluestone/oauth2/v2.0/logout",
          client_id: "osac-bluestone-prod",
          client_secret: "••••••••••••",
        },
      },
      status: { phase: "running", message: "JWKS fetched · token exchange OK", last_probe: "4m ago" },
    },
    authn: { trusted_token_issuers: ["https://auth.osac.internal/realms/bluestone.osac"] },
    breakGlass: [
      { username: "bg-admin-1", last_rotated: "2026-03-18T08:00:00Z" },
      { username: "bg-admin-2", last_rotated: "2026-03-18T08:00:00Z" },
    ],
    users: { count: 32, phase_ready: 32 },
  },
  vertexa: {
    org: {
      id: "org-vertexa",
      metadata: {
        name: "vertexa", tenant: "vertexa", creator: "marcus.webb@osac.io",
        creation_timestamp: "2026-02-09T14:22:00Z", version: "v2",
        labels: { "osac.io/region": "eu-central", "osac.io/tier": "silver" },
      },
      realm: "vertexa.osac",
    },
    idp: {
      name: "vertexa-keycloak-oidc",
      metadata: { creation_timestamp: "2026-02-09T14:30:00Z", version: "v1" },
      spec: {
        title: "Vertexa Customer Keycloak (OIDC)", enabled: true, kind: "OIDC",
        oidc_config: {
          issuer: "https://auth.vertexa.cloud/realms/employees",
          authorization_url: "https://auth.vertexa.cloud/realms/employees/protocol/openid-connect/auth",
          token_url: "https://auth.vertexa.cloud/realms/employees/protocol/openid-connect/token",
          jwks_url: "https://auth.vertexa.cloud/realms/employees/protocol/openid-connect/certs",
          logout_url: "https://auth.vertexa.cloud/realms/employees/protocol/openid-connect/logout",
          client_id: "osac-vertexa",
          client_secret: "••••••••••••",
        },
      },
      status: { phase: "progressing", message: "JWKS retry 1/3 · 503 upstream", last_probe: "1m ago" },
    },
    authn: { trusted_token_issuers: ["https://auth.osac.internal/realms/vertexa.osac"] },
    breakGlass: [{ username: "bg-admin-1", last_rotated: "2026-02-09T14:30:00Z" }],
    users: { count: 18, phase_ready: 17 },
  },
};

function MyOrgPage() {
  const { tenant } = useSession();
  const [tab, setTab] = useState<string | number>("identity");
  if (!tenant) return null;
  const t = TENANTS[tenant];
  const fx = FIXTURES[tenant] ?? FIXTURES.northstar;
  const { org, idp, authn, breakGlass, users } = fx;

  return (
    <>
      <PageHeader
        title={t.name}
        subtitle={`Organization ${org.id} · realm ${org.realm} · osac.iam.v1`}
        actions={
          <>
            <Button variant="secondary">Test IdP connection</Button>
            <Button variant="primary">Rotate break-glass</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Kpi label="IdP kind" value={idp.spec.kind} hint={idp.spec.enabled ? "enabled" : "disabled"} />
        <Kpi
          label="IdP phase"
          value={idp.status.phase === "running" ? "READY" : idp.status.phase.toUpperCase()}
          tone={idp.status.phase === "running" ? "success" : "warning"}
          hint={`probe ${idp.status.last_probe}`}
        />
        <Kpi label="Users (phase READY)" value={`${users.phase_ready} / ${users.count}`} />
        <Kpi label="Break-glass credentials" value={breakGlass.length} hint="emergency admins" tone="warning" />
      </div>

      <Tabs activeKey={tab} onSelect={(_, k) => setTab(k)}>
        <Tab eventKey="identity" title={<TabTitleText>Identity provider</TabTitleText>}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
            <div className="osac-panel" style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BuildingIcon /><strong>Organization</strong>
                <Label isCompact style={{ marginLeft: "auto" }}>{org.metadata.version}</Label>
              </div>
              <KV k="id" v={<code>{org.id}</code>} />
              <KV k="metadata.name" v={<code>{org.metadata.name}</code>} />
              <KV k="metadata.tenant" v={<code>{org.metadata.tenant}</code>} />
              <KV k="metadata.creator" v={<code>{org.metadata.creator}</code>} />
              <KV k="metadata.creation_timestamp" v={<code>{org.metadata.creation_timestamp}</code>} />
              <KV k="realm" v={<code>{org.realm}</code>} />
              <KV
                k="metadata.labels"
                v={
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {Object.entries(org.metadata.labels).map(([k, v]) => (
                      <Label key={k} isCompact><code style={{ fontSize: 11 }}>{k}={v}</code></Label>
                    ))}
                  </div>
                }
              />
            </div>

            <div className="osac-panel" style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <KeyIcon /><strong>IdentityProvider</strong>
                <Label isCompact color="blue" style={{ marginLeft: "auto" }}>{idp.spec.kind}</Label>
              </div>
              <KV k="name" v={<code>{idp.name}</code>} />
              <KV k="spec.title" v={idp.spec.title} />
              <KV k="spec.enabled" v={<Label isCompact color={idp.spec.enabled ? "green" : "grey"}>{String(idp.spec.enabled)}</Label>} />
              <KV
                k="status.phase"
                v={<><StatusDot status={idp.status.phase} /> <span>{idp.status.phase}</span></>}
              />
              <KV k="status.message" v={<span style={{ fontSize: 12 }}>{idp.status.message}</span>} />
            </div>

            <div className="osac-panel" style={{ display: "grid", gap: 10, gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <KeyIcon /><strong>spec.{idp.spec.kind === "OIDC" ? "oidc_config" : "ldap_config"}</strong>
              </div>
              {idp.spec.oidc_config && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <KV k="issuer" v={<code>{idp.spec.oidc_config.issuer}</code>} />
                  <KV k="client_id" v={<code>{idp.spec.oidc_config.client_id}</code>} />
                  <KV k="authorization_url" v={<code>{idp.spec.oidc_config.authorization_url}</code>} />
                  <KV k="token_url" v={<code>{idp.spec.oidc_config.token_url}</code>} />
                  <KV k="jwks_url" v={<code>{idp.spec.oidc_config.jwks_url}</code>} />
                  <KV k="logout_url" v={<code>{idp.spec.oidc_config.logout_url}</code>} />
                  <KV k="client_secret" v={<code>{idp.spec.oidc_config.client_secret}</code>} />
                </div>
              )}
              {idp.spec.ldap_config && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <KV k="connection_url" v={<code>{idp.spec.ldap_config.connection_url}</code>} />
                  <KV k="vendor" v={<code>{idp.spec.ldap_config.vendor}</code>} />
                  <KV k="bind_dn" v={<code>{idp.spec.ldap_config.bind_dn}</code>} />
                  <KV k="bind_credential" v={<code>{idp.spec.ldap_config.bind_credential}</code>} />
                  <KV k="users_dn" v={<code>{idp.spec.ldap_config.users_dn}</code>} />
                  <KV k="username_ldap_attribute" v={<code>{idp.spec.ldap_config.username_ldap_attribute}</code>} />
                </div>
              )}
            </div>
          </div>
        </Tab>

        <Tab eventKey="authn" title={<TabTitleText>Authn capabilities</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAltIcon /><strong>AuthnCapabilities</strong>
              <Label isCompact style={{ marginLeft: "auto" }}>discovery</Label>
            </div>
            <div style={{ fontSize: 13, color: "#5b6b7c" }}>
              Issuers below are trusted by Authorino at the Kuadrant gateway. Tokens signed by any other issuer
              are rejected before reaching any OSAC API.
            </div>
            <div className="osac-panel" style={{ padding: 0, overflow: "hidden", background: "#fff" }}>
              <Table variant="compact">
                <Thead><Tr><Th>trusted_token_issuers[]</Th><Th>Algorithm</Th><Th>JWKS cache</Th></Tr></Thead>
                <Tbody>
                  {authn.trusted_token_issuers.map((iss) => (
                    <Tr key={iss}>
                      <Td><code style={{ fontSize: 12 }}>{iss}</code></Td>
                      <Td><code>RS256</code></Td>
                      <Td>10m</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>

        <Tab eventKey="bg" title={<TabTitleText>Break-glass</TabTitleText>}>
          <div className="osac-panel" style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LockIcon /><strong>BreakGlassCredentials</strong>
              <Label isCompact color="orange" style={{ marginLeft: "auto" }}>emergency only</Label>
            </div>
            <div style={{ fontSize: 13, color: "#5b6b7c" }}>
              Local realm accounts independent of the external IdP. Use only when{" "}
              <code>{idp.name}</code> is unavailable. Every login is audited as an{" "}
              <code>Event</code> of type <code>BREAK_GLASS_USED</code>.
            </div>
            <div className="osac-panel" style={{ padding: 0, overflow: "hidden", background: "#fff" }}>
              <Table variant="compact">
                <Thead><Tr><Th>username</Th><Th>password</Th><Th>last_rotated</Th><Th /></Tr></Thead>
                <Tbody>
                  {breakGlass.map((b) => (
                    <Tr key={b.username}>
                      <Td><code>{b.username}</code></Td>
                      <Td><code>•••••••• (write-only)</code></Td>
                      <Td><code style={{ fontSize: 12 }}>{b.last_rotated}</code></Td>
                      <Td isActionCell><Button variant="link" isInline>Rotate</Button></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </div>
        </Tab>
      </Tabs>

      <Alert
        variant="info"
        isInline
        isPlain
        title={
          <>
            <code>User</code> records are sourced from your IdP and reconciled by the onboarding pipeline.
            Add or remove users at the source; <code>status.phase</code> moves to READY within ~30s.
          </>
        }
        style={{ marginTop: 16 }}
      />
    </>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, alignItems: "baseline", fontSize: 13 }}>
      <code style={{ fontSize: 12, color: "#5b6b7c" }}>{k}</code>
      <div>{v}</div>
    </div>
  );
}
