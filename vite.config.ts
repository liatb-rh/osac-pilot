import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const base = process.env.VITE_BASE_URL ?? "/";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    base,
    ssr: {
      noExternal: [/^@patternfly\//],
    },
    // lightningcss cannot resolve relative url() inside CSS custom properties
    // (a known PF base.css issue). Switch to postcss which handles it correctly.
    css: {
      transformer: "postcss",
    },
  },
});
