import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSession, TENANTS } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import {
  Button, Form, FormGroup, TextInput, Checkbox, Alert,
} from "@patternfly/react-core";
import { LockIcon } from "@patternfly/react-icons";

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [{ title: "OSAC — Institutional sign-in" }] }),
  component: SignInPage,
});

function SignInPage() {
  const { role, tenant, setPersona, signIn } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!role || !tenant) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Alert variant="warning" title="No persona selected">
          Choose a persona on the welcome page first.
        </Alert>
        <div style={{ marginTop: 16 }}>
          <Link to="/">Back to welcome</Link>
        </div>
      </div>
    );
  }

  const tenantInfo = TENANTS[tenant];
  const roleInfo = ROLES[role];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      signIn({
        name: email.split("@")[0] || roleInfo.label,
        email: email || `${role}@${tenant}.osac.local`,
      });
      navigate({ to: "/app" });
    }, 600);
  };

  return (
    <div className="osac-signin-wrap">
      <div className="osac-signin-brand" style={{
        background: `linear-gradient(135deg, #0b1b2b 0%, ${tenantInfo.accent} 140%)`,
      }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.8 }}>
            Institutional sign-in
          </div>
          <h2>{tenantInfo.name}</h2>
          <p>
            You are signing in as <strong>{roleInfo.label}</strong>. Your session will be
            scoped to this organization, and your access is governed by the OSAC role-based
            policy manifest.
          </p>
        </div>
        <div style={{ opacity: 0.75, fontSize: 13 }}>
          <div>Issuer: {tenant}.idp.osac.local</div>
          <div>Mode: mock (no real IdP exchange)</div>
        </div>
      </div>

      <div className="osac-signin-form">
        <div className="osac-signin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <LockIcon style={{ color: tenantInfo.accent }} />
            <strong>Sign in to {tenantInfo.short}</strong>
          </div>
          <p style={{ color: "#5b6b7c", fontSize: 13, marginTop: 0 }}>
            Continue as {roleInfo.label}.
          </p>
          <Form onSubmit={handleSubmit}>
            <FormGroup label="Institutional email" fieldId="email" isRequired>
              <TextInput
                id="email" type="email" value={email}
                onChange={(_, v) => setEmail(v)}
                placeholder={`you@${tenant}.example`}
              />
            </FormGroup>
            <FormGroup label="Password" fieldId="password">
              <TextInput
                id="password" type="password" value={password}
                onChange={(_, v) => setPassword(v)}
              />
            </FormGroup>
            <Checkbox id="remember" label="Trust this device for 30 days" />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Button type="submit" variant="primary" isLoading={loading} isBlock>
                Sign in
              </Button>
            </div>
          </Form>
          <div style={{ marginTop: 16, fontSize: 13 }}>
            <button
              onClick={() => { setPersona(role, tenant); navigate({ to: "/" }); }}
              style={{ background: "none", border: "none", color: "#0066cc", cursor: "pointer", padding: 0 }}
            >
              ← Return to institution chooser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
