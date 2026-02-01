// @ts-check
/* global process */
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// Get mode from --mode flag or environment
const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex !== -1 ? process.argv[modeIndex + 1] : process.env.MODE || "development";
const env = loadEnv(mode, process.cwd(), "");

// Override process.env so Astro uses our loaded values
process.env.SUPABASE_URL = env.SUPABASE_URL;
process.env.SUPABASE_KEY = env.SUPABASE_KEY;

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000, host: true },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["msw", "@mswjs/interceptors"],
    },
    define: {
      "import.meta.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "import.meta.env.SUPABASE_KEY": JSON.stringify(env.SUPABASE_KEY),
    },
  },
  adapter: cloudflare(),
});
