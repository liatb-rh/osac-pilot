import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/public-ip-pools")({
  component: () => <Outlet />,
});
