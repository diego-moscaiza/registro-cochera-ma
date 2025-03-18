import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";
import authMiddleware from "./src/middleware/index.ts";


// https://astro.build/config
export default defineConfig({
  site: "http://localhost:4321",
  output: "server",
  adapter: vercel(),
  integrations: [tailwind()],
  middleware: [authMiddleware]
});
