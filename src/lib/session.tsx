import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { RoleId } from "./rbac";

export type TenantId = "vertexa" | "northstar" | "evergreen";

export const TENANTS: Record<TenantId, { name: string; short: string; accent: string }> = {
  vertexa: { name: "Vertexa Cloud Services", short: "Vertexa", accent: "#0066CC" },
  northstar: { name: "Northstar Bank", short: "Northstar", accent: "#003F87" },
  evergreen: { name: "Bluestone Financial Group", short: "Bluestone", accent: "#1F7A4D" },
};

export interface Session {
  role: RoleId | null;
  tenant: TenantId | null;
  user: { name: string; email: string } | null;
  signedIn: boolean;
}

interface SessionCtx extends Session {
  setPersona: (role: RoleId, tenant: TenantId) => void;
  signIn: (user: { name: string; email: string }) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);
const KEY = "osac.session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Session>({ role: null, tenant: null, user: null, signedIn: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }, [s]);

  const value: SessionCtx = {
    ...s,
    setPersona: (role, tenant) => setS((p) => ({ ...p, role, tenant, signedIn: false })),
    signIn: (user) => setS((p) => ({ ...p, user, signedIn: true })),
    signOut: () => setS({ role: null, tenant: null, user: null, signedIn: false }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
