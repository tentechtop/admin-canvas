import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const authProxyTarget = env.VITE_AUTH_PROXY_TARGET || "http://192.168.121.225:8011";
  const bizProxyTarget = env.VITE_BIZ_PROXY_TARGET || "http://192.168.121.225:8090";
  const bizPrefixes = [
    "/admin",
    "/affiliate",
    "/audit",
    "/count",
    "/rs",
    "/kol_user",
    "/kol_performance",
    "/bd_performance",
    "/payment",
    "/payment_summary",
    "/campaign_application",
    "/performance_application",
    "/report",
    "/customer",
  ];

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: authProxyTarget,
          changeOrigin: true,
        },
        ...Object.fromEntries(
          bizPrefixes.map((prefix) => [
            prefix,
            {
              target: bizProxyTarget,
              changeOrigin: true,
            },
          ]),
        ),
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
