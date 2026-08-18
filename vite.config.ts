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
    // The code below enables dev tools like taking screenshots of your site
    // while it is being developed on chef.convex.dev.
    // Feel free to remove this code if you're no longer developing your app with Chef.
    mode === "development"
      ? {
          name: "inject-chef-dev",
          transform(code: string, id: string) {
            if (id.includes("main.tsx")) {
              return {
                code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
    // End of code for taking screenshots on chef.convex.dev.
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
}));
