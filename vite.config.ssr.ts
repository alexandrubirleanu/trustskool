import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// Dedicated SSR build: project root as base, production mode, no dev tooling
// plugins (jsxLoc / manus-runtime / debug collector). The NODE_ENV=production
// prefix on the build command is what actually controls the JSX runtime;
// mode/define here are defense-in-depth.
export default defineConfig({
  root: import.meta.dirname,
  mode: "production",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  build: {
    ssr: path.resolve(import.meta.dirname, "client/src/entry-server.tsx"),
    outDir: path.resolve(import.meta.dirname, "dist/server-ssr"),
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "entry-server.js" } },
  },
});
