import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

// Versão única no package.json (npm version patch|minor|major).
const { version } = JSON.parse(readFileSync("package.json", "utf8"));

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "Financ",
        short_name: "Financ",
        description: "Sistema de Gestão Financeira Pessoal",
        theme_color: "#0f172a",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    // Em dev o app chama /api no próprio servidor do Vite: o cookie refreshToken fica first-party.
    proxy: {
      "/api": {
        target: "https://localhost:7147",
        changeOrigin: true,
        secure: false, // certificado de desenvolvimento do .NET
      },
    },
  },
});
