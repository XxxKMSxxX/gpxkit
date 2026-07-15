import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom", // @we-gold/gpxjs's parseGPX relies on window.DOMParser
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./", import.meta.url).pathname,
    },
  },
});
