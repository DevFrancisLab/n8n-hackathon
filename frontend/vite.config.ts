import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "src"),
      },
    },
    server: {
      port: 3000,
    },
    preview: {
      port: 3000,
    },
    define: {
      "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(
        env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
      ),
      "process.env.NEXT_PUBLIC_USE_API": JSON.stringify(env.NEXT_PUBLIC_USE_API ?? "false"),
    },
  };
});
