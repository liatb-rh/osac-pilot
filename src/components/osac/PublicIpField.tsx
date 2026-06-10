import { useState } from "react";
import {
  FormGroup, Switch, Select, SelectOption, SelectList, MenuToggle, TextInput,
} from "@patternfly/react-core";
import { useSession } from "@/lib/session";
import { eligiblePools, ipsForTenant } from "@/lib/public-ip-data";

/** Selection reported to the parent wizard (e.g. for the Review step). */
export interface PublicIpSelection {
  enabled: boolean;
  /** "auto" or a pre-allocated IP id */
  choice: string;
  /** Human-readable summary, e.g. "Auto-allocate from an eligible pool" or "203.0.113.10" */
  label: string;
  /** Number of public IPs (only > 1 when multiNic) */
  count: number;
}

/**
 * "Assign a public IP" toggle + pool / pre-allocated IP picker.
 * Shared by the Create VM, Create Cluster, and Create Bare Metal wizards
 * (Networking step). Disabled when no pool is available to the user's group.
 * Bare metal supports multiple public IPs (one per NIC) via `multiNic`.
 * Pass `onChange` to receive the current selection (for review steps).
 */
export function PublicIpField({
  multiNic = false,
  onChange,
}: {
  multiNic?: boolean;
  onChange?: (sel: PublicIpSelection) => void;
}) {
  const { tenant } = useSession();
  const pools = eligiblePools(tenant);
  const preallocated = ipsForTenant(tenant).filter((ip) => ip.state === "allocated");
  const disabled = pools.length === 0;

  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("auto");
  const [count, setCount] = useState("1");

  const labelFor = (c: string) =>
    c === "auto"
      ? "Auto-allocate from an eligible pool"
      : `Pre-allocated · ${preallocated.find((ip) => ip.id === c)?.address ?? c}`;

  const choiceLabel = labelFor(choice);

  const emit = (next: { enabled?: boolean; choice?: string; count?: string }) => {
    const e = next.enabled ?? enabled;
    const c = next.choice ?? choice;
    const n = next.count ?? count;
    onChange?.({
      enabled: e && !disabled,
      choice: c,
      label: labelFor(c),
      count: Math.max(1, parseInt(n, 10) || 1),
    });
  };

  return (
    <>
      <FormGroup fieldId="pub-ip-toggle">
        <Switch
          id="pub-ip-toggle"
          label="Assign a public IP"
          isChecked={enabled && !disabled}
          isDisabled={disabled}
          onChange={(_, v) => { setEnabled(v); emit({ enabled: v }); }}
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
            onSelect={(_, v) => { setChoice(String(v)); setOpen(false); emit({ choice: String(v) }); }}
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
            onChange={(_, v) => { setCount(v); emit({ count: v }); }}
            style={{ maxWidth: 120 }}
          />
        </FormGroup>
      )}
    </>
  );
}
