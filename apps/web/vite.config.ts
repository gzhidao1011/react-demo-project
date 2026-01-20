import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
import devtoolsJson from "vite-plugin-devtools-json";
import * as dotenv from "@dotenvx/dotenvx";
import { joinUrlPath } from "@repo/utils";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Expose only vars starting with VITE_
const viteEnv = Object.keys(process.env)
  .filter((k) => k.startsWith("VITE_"))
  .reduce<Record<string, string>>((a, k) => {
    a[k] = process.env[k] ?? "";
    return a;
  }, {});

const basePath = joinUrlPath(process.env.VITE_ADMIN_BASE_PATH ?? "", "/") ?? "/";

export default defineConfig({
  base: basePath,
  define: {
    "process.env": JSON.stringify(viteEnv),
  },
  resolve: {
    alias: {
      "@/*": path.resolve(__dirname, "app/*"),
      "@/core/*": path.resolve(__dirname, "core/*"),
    },
    dedupe: ["react", "react-dom", "@headlessui/react"],
    preserveSymlinks: false,
    extensions: [".ts", ".tsx", ".mjs", ".js", ".jsx", ".json"],
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] }),
    devtoolsJson(),
  ],
});
