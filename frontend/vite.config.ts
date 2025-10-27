import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      components: path.resolve(__dirname, "./src/components"),
      pages: path.resolve(__dirname, "./src/pages"),
      styles: path.resolve(__dirname, "./src/styles"),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },
  server: {
    port: 5001,
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "esnext",
  },
});
