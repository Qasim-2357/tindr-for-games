import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Backend CORS only allows http://localhost:3000, so the dev server MUST run on 3000.
// `npm run build:preview` (VITE_MOCK=true) bundles everything into one HTML file.
const isPreview = process.env.VITE_MOCK === "true";

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(isPreview ? [viteSingleFile()] : [])],
  server: { port: 3000, strictPort: true },
});
