import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/osac/Primitives";
import {
  Button, Label, Modal, ModalVariant, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, TextInput, Select, SelectOption, SelectList, MenuToggle,
  Checkbox,
} from "@patternfly/react-core";
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
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <>
      <PageHeader title="Users & Access" subtitle="Tenant-scoped identity and role bindings."
        actions={<Button variant="primary" icon={<UserPlusIcon />} onClick={() => setInviteOpen(true)}>Invite user</Button>}
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

      <InviteUserModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}

function InviteUserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"tenantUser" | "tenantAdmin">("tenantUser");
  const [roleOpen, setRoleOpen] = useState(false);
  const [requireMfa, setRequireMfa] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  return (
    <Modal variant={ModalVariant.medium} isOpen={isOpen} onClose={onClose} aria-label="Invite user">
      <ModalHeader title="Invite user" description="Send an invitation to join this tenant workspace." />
      <ModalBody>
        <Form>
          <FormGroup label="Full name" isRequired fieldId="iname"><TextInput id="iname" value={name} onChange={(_, v) => setName(v)} placeholder="Jane Doe" /></FormGroup>
          <FormGroup label="Work email" isRequired fieldId="iemail"><TextInput id="iemail" type="email" value={email} onChange={(_, v) => setEmail(v)} placeholder="jane@northstar.example" /></FormGroup>
          <FormGroup label="Role" fieldId="irole">
            <Select isOpen={roleOpen} onOpenChange={setRoleOpen}
              toggle={(ref) => <MenuToggle ref={ref} onClick={() => setRoleOpen((v) => !v)} isExpanded={roleOpen}>{role}</MenuToggle>}
              onSelect={(_, v) => { setRole(v as any); setRoleOpen(false); }}
            >
              <SelectList>
                <SelectOption value="tenantUser">tenantUser — operate VM workloads</SelectOption>
                <SelectOption value="tenantAdmin">tenantAdmin — manage users, quota, network</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup fieldId="mfa"><Checkbox id="mfa" label="Require MFA enrollment on first sign-in" isChecked={requireMfa} onChange={(_, v) => setRequireMfa(v)} /></FormGroup>
          <FormGroup fieldId="mail"><Checkbox id="mail" label="Send invitation email now" isChecked={sendEmail} onChange={(_, v) => setSendEmail(v)} /></FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose} isDisabled={!email || !name}>Send invite</Button>
        <Button variant="link" onClick={onClose}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
}
