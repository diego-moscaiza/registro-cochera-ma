import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";


// https://astro.build/config
export default defineConfig({
  site: "http://localhost:4321",
  output: "server",
  adapter: vercel(),
  integrations: [tailwind()]
});
