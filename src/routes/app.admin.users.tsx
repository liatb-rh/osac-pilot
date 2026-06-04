import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";
import { Button, Label } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td, ActionsColumn } from "@patternfly/react-table";
import { UserPlusIcon } from "@patternfly/react-icons";

export const Route = createFileRoute("/app/admin/users")({ component: UsersPage });

const USERS = [
  { n: "Alice Renner", e: "alice@northstar.example", r: "tenantAdmin", mfa: true },
  { n: "Carl Yates", e: "carl@northstar.example", r: "tenantUser", mfa: true },
  { n: "Priya Shah", e: "priya@northstar.example", r: "tenantUser", mfa: false },
  { n: "Tomas Lund", e: "tomas@northstar.example", r: "tenantUser", mfa: true },
  { n: "Mei Watanabe", e: "mei@northstar.example", r: "tenantUser", mfa: false },
];

function UsersPage() {
  return (
    <>
      <PageHeader title="Users & Access" subtitle="Tenant-scoped identity and role bindings."
        actions={<Button variant="primary" icon={<UserPlusIcon />}>Invite user</Button>}
      />
      <div className="osac-panel" style={{ padding: 0, overflow: "hidden" }}>
        <Table>
          <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>MFA</Th><Th /></Tr></Thead>
          <Tbody>
            {USERS.map((u) => (
              <Tr key={u.e}>
                <Td><strong>{u.n}</strong></Td>
                <Td><code>{u.e}</code></Td>
                <Td><Label color={u.r === "tenantAdmin" ? "blue" : "grey"}>{u.r}</Label></Td>
                <Td>{u.mfa ? <Label color="green" isCompact>Enrolled</Label> : <Label color="orange" isCompact>Pending</Label>}</Td>
                <Td isActionCell><ActionsColumn items={[{ title: "Change role" }, { title: "Reset password" }, { isSeparator: true }, { title: "Remove" }]} /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </>
  );
}
