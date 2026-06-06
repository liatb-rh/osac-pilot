import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession, TENANTS } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { ROLES, can, type PermissionId } from "@/lib/rbac";
import {
  Page, Masthead, MastheadMain, MastheadBrand, MastheadContent, MastheadToggle,
  PageSidebar, PageSidebarBody, Nav, NavList, NavItem, NavGroup,
  Toolbar, ToolbarContent, ToolbarItem,
  Dropdown, DropdownItem, DropdownList, MenuToggle,
  Brand, Avatar, Badge, PageToggleButton,
} from "@patternfly/react-core";
import {
  BarsIcon, BellIcon, CloudIcon, ThIcon, ServerIcon, NetworkIcon, UsersIcon,
  CubesIcon, DatabaseIcon, BuildingIcon, ListIcon, KeyIcon, ShieldAltIcon,
  CogIcon, OutlinedClockIcon, MoonIcon, SunIcon,
} from "@patternfly/react-icons";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

interface NavLink { to: string; label: string; icon: any; perm: PermissionId; group?: string; }

const ALL_LINKS: NavLink[] = [
  // Tenant user
  { to: "/app", label: "Dashboard", icon: ThIcon, perm: "view_dashboard", group: "Workloads" },
  { to: "/app/vms", label: "Virtual Machines", icon: ServerIcon, perm: "view_my_vms", group: "Workloads" },
  { to: "/app/catalog", label: "Template Catalog", icon: CubesIcon, perm: "view_catalog", group: "Workloads" },
  { to: "/app/clusters", label: "Clusters", icon: CloudIcon, perm: "view_clusters", group: "Workloads" },
  // Tenant admin
  { to: "/app/admin", label: "Tenant Overview", icon: BuildingIcon, perm: "view_tenant_admin_dashboard", group: "Administration" },
  { to: "/app/admin/users", label: "Users & Access", icon: UsersIcon, perm: "manage_users", group: "Administration" },
  { to: "/app/admin/quota", label: "Quota", icon: DatabaseIcon, perm: "view_quota", group: "Administration" },
  { to: "/app/admin/networks", label: "Networks", icon: NetworkIcon, perm: "view_topology", group: "Administration" },
  { to: "/app/admin/cluster-offerings", label: "Cluster Offerings", icon: ListIcon, perm: "manage_cluster_offerings", group: "Administration" },
  // Provider admin
  { to: "/app/provider", label: "Provider Overview", icon: ShieldAltIcon, perm: "view_provider_dashboard", group: "Platform" },
  { to: "/app/provider/tenants", label: "Tenant Organizations", icon: BuildingIcon, perm: "manage_tenants", group: "Platform" },
  { to: "/app/provider/infrastructure", label: "Infrastructure", icon: NetworkIcon, perm: "view_infrastructure", group: "Platform" },
  { to: "/app/provider/agents", label: "Infrastructure Agents", icon: CogIcon, perm: "view_agents", group: "Platform" },
  { to: "/app/provider/storage-tiers", label: "Storage Tiers", icon: DatabaseIcon, perm: "view_storage_tiers", group: "Platform" },
  { to: "/app/provider/templates", label: "Global Templates", icon: CubesIcon, perm: "manage_global_templates", group: "Platform" },
  { to: "/app/provider/clusters", label: "All Clusters", icon: CloudIcon, perm: "view_clusters", group: "Platform" },
  { to: "/app/provider/vms", label: "All Virtual Machines", icon: ServerIcon, perm: "view_infrastructure", group: "Platform" },
  // Core platform services
  { to: "/app/provider/organizations", label: "Organizations & IdP", icon: BuildingIcon, perm: "manage_organizations", group: "Core Platform" },
  { to: "/app/provider/rbac", label: "RBAC", icon: KeyIcon, perm: "manage_rbac", group: "Core Platform" },
  { to: "/app/provider/onboarding", label: "Tenant Onboarding", icon: ShieldAltIcon, perm: "onboard_tenants", group: "Core Platform" },
  { to: "/app/provider/catalog-items", label: "Catalog Items", icon: CubesIcon, perm: "manage_catalog_items", group: "Core Platform" },
  { to: "/app/provider/ansible", label: "Ansible Collection", icon: CogIcon, perm: "view_ansible_collection", group: "Core Platform" },
  // Common
  { to: "/app/activity", label: "Recent Activity", icon: OutlinedClockIcon, perm: "view_recent_activities", group: "Account" },
];

function AppShell() {
  const { role, tenant, user, signedIn, signOut, hydrated } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (hydrated && (!signedIn || !role || !tenant)) navigate({ to: "/" });
  }, [hydrated, signedIn, role, tenant, navigate]);

  if (!hydrated || !signedIn || !role || !tenant) return null;

  const tenantInfo = TENANTS[tenant];
  const roleInfo = ROLES[role];

  const visible = ALL_LINKS.filter((l) => can(role, l.perm));
  const groups = Array.from(new Set(visible.map((l) => l.group ?? "Main")));

  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton variant="plain" aria-label="Toggle nav" onClick={() => setSidebarOpen((v) => !v)}>
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
          <Brand alt="OSAC" heights={{ default: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg,#0066cc,#143b66)",
                display: "grid", placeItems: "center", color: "white",
              }}>
                <CloudIcon />
              </div>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>OSAC</div>
                <div style={{ fontSize: 11, color: "#5b6b7c" }}>Sovereign AI Cloud</div>
              </div>
            </div>
          </Brand>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Badge isRead style={{ background: "#e7f1fb", color: "#0b3a6a", fontWeight: 600 }}>
                Mode: mock
              </Badge>
            </ToolbarItem>
            <ToolbarItem align={{ default: "alignEnd" }}>
              <Link to="/app/activity" aria-label="Recent activity"
                style={{ display: "inline-flex", alignItems: "center", padding: 8, color: "#0b1b2b" }}>
                <BellIcon />
              </Link>
            </ToolbarItem>
            <ToolbarItem>
              <Dropdown
                isOpen={userMenuOpen}
                onOpenChange={setUserMenuOpen}
                toggle={(ref) => (
                  <MenuToggle ref={ref} onClick={() => setUserMenuOpen((v) => !v)} variant="plainText">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Avatar src="" alt="" size="sm" />
                      <span style={{ textAlign: "left", lineHeight: 1.1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                        <div style={{ fontSize: 11, color: "#5b6b7c" }}>{roleInfo.label} · {tenantInfo.short}</div>
                      </span>
                    </span>
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem key="account" onClick={(e) => e.preventDefault()}>Account settings</DropdownItem>
                  <DropdownItem key="keys" icon={<KeyIcon />} onClick={(e) => e.preventDefault()}>API keys</DropdownItem>
                  <DropdownItem key="logout" onClick={() => { signOut(); navigate({ to: "/" }); }}>
                    Log out
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        <Nav>
          {groups.map((g) => (
            <NavGroup key={g} title={g}>
              <NavList>
                {visible.filter((l) => (l.group ?? "Main") === g).map((l) => {
                  const Icon = l.icon;
                  const active = pathname === l.to || (l.to !== "/app" && pathname.startsWith(l.to));
                  return (
                    <NavItem key={l.to} isActive={active}>
                      <Link to={l.to} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 16px", textDecoration: "none",
                        color: active ? "#0066cc" : "#0b1b2b", fontWeight: active ? 600 : 500,
                      }}>
                        <Icon /> {l.label}
                      </Link>
                    </NavItem>
                  );
                })}
              </NavList>
            </NavGroup>
          ))}
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page masthead={masthead} sidebar={sidebarOpen ? sidebar : undefined}>
      <div className="osac-trust-strip">
        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 50, background: tenantInfo.accent }} />
        <span>
          Tenant scope: <strong>{tenantInfo.name}</strong> · Role: <strong>{roleInfo.label}</strong> ·
          Issuer trust verified.
        </span>
      </div>
      <div style={{ padding: 24 }}>
        <Outlet />
      </div>
    </Page>
  );
}
