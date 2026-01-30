import path from "node:path";
import * as dotenv from "@dotenvx/dotenvx";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Expose only vars starting with VITE_
const viteEnv = Object.keys(process.env)
  .filter((k) => k.startsWith("VITE_"))
  .reduce<Record<string, string>>((a, k) => {
    a[k] = process.env[k] ?? "";
    return a;
  }, {});

export default defineConfig({
  base: "/",
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
  optimizeDeps: {
    include: ["@headlessui/react", "@heroicons/react"],
  },
  server: {
    port: 5573,
    proxy: {
      // Chat 联调：可选直连 chat-service（VITE_CHAT_API_DIRECT=true 时）
      // 用于快速联调，无需启动 api-gateway 和 Nacos
      ...(viteEnv.VITE_CHAT_API_DIRECT === "true"
        ? {
            "/api/chat": {
              target: "http://localhost:8003",
              changeOrigin: true,
            },
          }
        : {}),
      // 代理 /api 请求到后端 API 网关
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
