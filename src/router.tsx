import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // During SSR prerender Nitro crawls '/', not '/osac-pilot/'.
    // Use '/' as basepath on the server so prerender matches the root route.
    // On the client, use the real base so navigation under /osac-pilot/ works.
    basepath: typeof window === 'undefined' ? '/' : (import.meta.env.BASE_URL ?? '/'),
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
