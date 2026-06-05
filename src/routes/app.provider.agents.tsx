import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/provider/agents")({
  component: () => <Outlet />,
});
