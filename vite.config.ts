import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Plugin: يستبدل __BUILD_TIMESTAMP__ في sw-custom.js بـ timestamp حقيقي عند كل build
function swTimestampPlugin() {
  const ts = Date.now().toString();
  return {
    name: "sw-timestamp",
    writeBundle() {
      const swPath = path.resolve(__dirname, "dist/sw-custom.js");
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, "utf-8");
        content = content.replace(/__BUILD_TIMESTAMP__/g, ts);
        fs.writeFileSync(swPath, content);
      }
    },
    // في وضع dev: استبدل في الملف المصدر مؤقتاً عبر transform
    transform(code: string, id: string) {
      if (id.includes("sw-custom.js")) {
        return { code: code.replace(/__BUILD_TIMESTAMP__/g, ts), map: null };
      }
      return null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    swTimestampPlugin(),

  ].filter(Boolean),
  server: {
    host: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],

          svga: ["svga.lite"],
        },
      },
    },
  },
}));
