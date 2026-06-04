import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { PageHeader } from "@/components/osac/Primitives";

export const Route = createFileRoute("/app/console")({
  validateSearch: z.object({ vm: z.string().optional() }),
  component: ConsolePage,
});

function ConsolePage() {
  const { vm } = useSearch({ from: "/app/console" });
  const name = vm ?? "bnk-app-01";
  return (
    <>
      <PageHeader title={`Console — ${name}`} subtitle="Read-only demo serial console" />
      <div className="osac-console">
        <div>[ OSAC sovereign cloud serial console · {name} ]</div>
        <div>Mode: mock · keystrokes are not sent.</div>
        <div>--</div>
        <div>[  0.000000] Booting OSAC virtual machine...</div>
        <div>[  0.012412] CPU0: AMD EPYC vCPU 4 cores online</div>
        <div>[  0.083900] Memory: 16384 MiB / 16384 MiB ECC OK</div>
        <div>[  0.521304] Sovereign attestation: PASS (issuer=osac-root-ca)</div>
        <div>[  0.812121] systemd: Reached target multi-user.target</div>
        <div>[  1.024333] sshd: Server listening on 0.0.0.0:22</div>
        <div style={{ marginTop: 12 }}>
          Red Hat Enterprise Linux 9.4 (Plow)
        </div>
        <div>{name} login: <span style={{ background: "#b6f0c8", color: "#0b1220" }}>_</span></div>
      </div>
    </>
  );
}
