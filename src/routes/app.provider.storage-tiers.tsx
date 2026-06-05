import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/provider/storage-tiers")({
  component: () => <Outlet />,
});
