import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/cluster-offerings")({
  component: () => <Outlet />,
});

export const OFFERINGS = [
  { id: "ocp-417", name: "OpenShift 4.17 — Standard", desc: "GA OpenShift cluster offering for production workloads.", risk: "stable", minNodes: 3, gpu: false, ocp: "4.17.3" },
  { id: "ocp-416", name: "OpenShift 4.16 — Standard", desc: "Previous OCP release; supported until next quarter.", risk: "stable", minNodes: 3, gpu: false, ocp: "4.16.8" },
  { id: "ocp-ai", name: "OpenShift AI — GPU enabled", desc: "Includes NVIDIA operator and GPU-accelerated node pools.", risk: "preview", minNodes: 2, gpu: true, ocp: "4.17.3" },
  { id: "rosa-ha", name: "OCP HA — Multi-zone", desc: "3 control plane nodes spread across availability zones.", risk: "stable", minNodes: 6, gpu: false, ocp: "4.17.3" },
];
