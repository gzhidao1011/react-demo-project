import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@/*": path.resolve(__dirname, "app/*"),
      "@/core/*": path.resolve(__dirname, "core/*"),
    },
    dedupe: ["react", "react-dom", "@headlessui/react"],
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()],
});
