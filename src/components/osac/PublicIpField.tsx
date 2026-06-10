import { useState } from "react";
import {
  FormGroup, Switch, Select, SelectOption, SelectList, MenuToggle, TextInput,
} from "@patternfly/react-core";
import { useSession } from "@/lib/session";
import { eligiblePools, ipsForTenant } from "@/lib/public-ip-data";

/**
 * "Assign a public IP" toggle + pool / pre-allocated IP picker.
 * Shared by the Create VM, Create Cluster, and Create Bare Metal wizards
 * (Networking step). Disabled when no pool is available to the user's group.
 * Bare metal supports multiple public IPs (one per NIC) via `multiNic`.
 */
export function PublicIpField({ multiNic = false }: { multiNic?: boolean }) {
  const { tenant } = useSession();
  const pools = eligiblePools(tenant);
  const preallocated = ipsForTenant(tenant).filter((ip) => ip.state === "allocated");
  const disabled = pools.length === 0;

  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("auto");
  const [count, setCount] = useState("1");

  const choiceLabel =
    choice === "auto"
      ? "Auto-allocate from an eligible pool"
      : `Pre-allocated · ${preallocated.find((ip) => ip.id === choice)?.address ?? choice}`;

  return (
    <>
      <FormGroup fieldId="pub-ip-toggle">
        <Switch
          id="pub-ip-toggle"
          label="Assign a public IP"
          isChecked={enabled && !disabled}
          isDisabled={disabled}
          onChange={(_, v) => setEnabled(v)}
        />
        {disabled && (
          <div style={{ fontSize: 12, color: "#5b6b7c", marginTop: 4 }}>
            No public IP pool is available to your user group. Contact your tenant admin.
          </div>
        )}
      </FormGroup>

      {enabled && !disabled && (
        <FormGroup label="Public IP source" fieldId="pub-ip-src">
          <Select
            isOpen={open}
            onOpenChange={setOpen}
            toggle={(ref) => (
              <MenuToggle ref={ref} onClick={() => setOpen((v) => !v)} isExpanded={open}>
                {choiceLabel}
              </MenuToggle>
            )}
            onSelect={(_, v) => { setChoice(String(v)); setOpen(false); }}
          >
            <SelectList>
              <SelectOption value="auto" description={`Eligible pools: ${pools.map((p) => p.name).join(", ")}`}>
                Auto-allocate from an eligible pool
              </SelectOption>
              {preallocated.map((ip) => (
                <SelectOption key={ip.id} value={ip.id} description={`from ${ip.poolId}`}>
                  {ip.address}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
          <div style={{ fontSize: 12, color: "#5b6b7c", marginTop: 4 }}>
            The IP is attached automatically once the workload reaches Running.
          </div>
        </FormGroup>
      )}

      {enabled && !disabled && multiNic && (
        <FormGroup label="Public IP count (one per NIC)" fieldId="pub-ip-count">
          <TextInput
            id="pub-ip-count"
            type="number"
            value={count}
            onChange={(_, v) => setCount(v)}
            style={{ maxWidth: 120 }}
          />
        </FormGroup>
      )}
    </>
  );
}
