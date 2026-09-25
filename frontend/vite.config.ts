import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Backend CORS defaults to http://localhost:3000; set CORS_ORIGINS for another dev origin.
// VITE_MOCK=true enables hash routing and bundles the preview build into one HTML file.
const isPreview = process.env.VITE_MOCK === "true";

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(isPreview ? [viteSingleFile()] : [])],
  server: { port: 3000, strictPort: true },
});
