import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/osac/Primitives";

export const Route = createFileRoute("/app/provider/infrastructure")({ component: InfraPage });

const NODES = [
  { id: "region", x: 30, y: 110, label: "eu-sov-1", sub: "Sovereign region" },
  { id: "az1", x: 220, y: 30, label: "AZ-α", sub: "12 racks" },
  { id: "az2", x: 220, y: 110, label: "AZ-β", sub: "14 racks" },
  { id: "az3", x: 220, y: 190, label: "AZ-γ", sub: "10 racks" },
  { id: "n1", x: 440, y: 5, label: "Network class A", sub: "10 Gbit" },
  { id: "n2", x: 440, y: 55, label: "Network class B", sub: "25 Gbit" },
  { id: "s1", x: 440, y: 115, label: "Storage gold", sub: "NVMe" },
  { id: "s2", x: 440, y: 165, label: "Storage silver", sub: "SSD" },
  { id: "a1", x: 440, y: 215, label: "Agents (208)", sub: "208 / 212 healthy" },
];

function InfraPage() {
  return (
    <>
      <PageHeader title="Infrastructure" subtitle="Sovereign region topology, network classes, storage and agents." />
      <div className="osac-topology" style={{ minHeight: 360 }}>
        <svg width="100%" height="280" style={{ position: "absolute", left: 0, top: 60, pointerEvents: "none" }}>
          {[
            ["100,140", "230,55"],
            ["100,140", "230,135"],
            ["100,140", "230,215"],
            ["340,55", "440,30"],
            ["340,55", "440,80"],
            ["340,135", "440,140"],
            ["340,135", "440,190"],
            ["340,215", "440,240"],
          ].map(([a, b], i) => {
            const [x1, y1] = a.split(",").map(Number);
            const [x2, y2] = b.split(",").map(Number);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cfe1f5" strokeWidth="2" />;
          })}
        </svg>
        {NODES.map((n) => (
          <div key={n.id} className="osac-topo-node" style={{ left: n.x, top: n.y + 50 }}>
            <span style={{ width: 8, height: 8, background: "#143b66", borderRadius: 50 }} />
            <div>
              <div>{n.label}</div>
              <small>{n.sub}</small>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
