import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "http://localhost:4321",
  output: "server",
  adapter: vercel(),
  integrations: [tailwind()],
});
