// OSAC RBAC manifest — derived from osac-rbac v1
export type RoleId = "providerAdmin" | "tenantAdmin" | "tenantUser";

export type PermissionId =
  | "choose_persona"
  | "use_theme_toggle"
  | "submit_sign_in"
  | "switch_institution"
  | "view_shell"
  | "navigate_shell_sections"
  | "logout"
  | "view_recent_activities"
  | "view_dashboard"
  | "open_create_vm"
  | "view_catalog"
  | "create_from_template"
  | "use_vm_wizard"
  | "provision_vm"
  | "view_my_vms"
  | "operate_vm_power"
  | "clone_vm"
  | "launch_console"
  | "view_tenant_admin_dashboard"
  | "manage_users"
  | "view_quota"
  | "view_topology"
  | "open_vm_from_topology"
  | "view_provider_dashboard"
  | "manage_tenants"
  | "manage_resource_allocation"
  | "manage_global_templates"
  | "view_infrastructure"
  | "view_clusters"
  | "open_create_cluster"
  | "view_cluster_catalog_items"
  | "scale_cluster_nodes"
  | "delete_cluster"
  | "upgrade_cluster"
  | "download_kubeconfig"
  | "manage_cluster_offerings"
  | "view_agents"
  | "manage_agents"
  | "view_storage_tiers"
  | "manage_storage_tiers"
  | "manage_organizations"
  | "manage_rbac"
  | "onboard_tenants"
  | "manage_catalog_items"
  | "view_ansible_collection";

export const ROLES: Record<RoleId, { label: string; description: string }> = {
  providerAdmin: {
    label: "Provider Admin",
    description:
      "Manages platform services, tenant organizations, and provider-wide policies.",
  },
  tenantAdmin: {
    label: "Tenant Admin",
    description:
      "Manages users, quota, network topology, and tenant-scoped workspace operations.",
  },
  tenantUser: {
    label: "Tenant User",
    description: "Operates VM workload lifecycle within a tenant organization workspace.",
  },
};

const tenantUserGrants: PermissionId[] = [
  "choose_persona","use_theme_toggle","submit_sign_in","switch_institution",
  "view_shell","navigate_shell_sections","logout","view_recent_activities",
  "view_dashboard","open_create_vm","view_catalog","create_from_template",
  "use_vm_wizard","provision_vm","view_my_vms","operate_vm_power","clone_vm",
  "launch_console","view_clusters","open_create_cluster","view_cluster_catalog_items",
  "scale_cluster_nodes","delete_cluster","upgrade_cluster","download_kubeconfig",
];

const tenantAdminGrants: PermissionId[] = [
  ...tenantUserGrants.filter((p) => !["view_clusters","open_create_cluster","view_cluster_catalog_items","scale_cluster_nodes","delete_cluster","upgrade_cluster","download_kubeconfig"].includes(p)),
  "view_tenant_admin_dashboard","manage_users","view_quota","view_topology",
  "open_vm_from_topology","manage_cluster_offerings",
];

const providerAdminGrants: PermissionId[] = [
  "choose_persona","use_theme_toggle","submit_sign_in","switch_institution",
  "view_shell","navigate_shell_sections","logout","view_recent_activities",
  "view_provider_dashboard","manage_tenants","manage_resource_allocation",
  "manage_global_templates","view_infrastructure","view_topology","view_clusters",
  "view_cluster_catalog_items","manage_cluster_offerings","view_agents",
  "manage_agents","view_storage_tiers","manage_storage_tiers",
  "manage_organizations","manage_rbac","onboard_tenants","manage_catalog_items",
  "view_ansible_collection",
];

export const ROLE_PERMISSIONS: Record<RoleId, Set<PermissionId>> = {
  providerAdmin: new Set(providerAdminGrants),
  tenantAdmin: new Set(tenantAdminGrants),
  tenantUser: new Set(tenantUserGrants),
};

export function can(role: RoleId | null, permission: PermissionId): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].has(permission);
}
