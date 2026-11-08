/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

// One self-contained HTML file: opened from disk (file://) by Chrome on the tablet.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: "chrome109", // last Chrome available on Windows 8.1
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
