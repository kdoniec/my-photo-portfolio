// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  env: {
    schema: {
      ENV_NAME: envField.enum({
        context: "server",
        access: "public",
        values: ["local", "integration", "production"],
        default: "local",
      }),
    },
  },
  integrations: [react(), sitemap()],
  server: { port: 3000, host: true },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["msw", "@mswjs/interceptors"],
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
