import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3011,
    host: true, // Allow external connections
    allowedHosts: ["crm-abispro.abisibg.com", "localhost", "127.0.0.1"],

    // 🔥 Add proxy here
    proxy: {
      "/airtel-api": {
        target: "https://iqvoice.airtel.in",
        changeOrigin: true,
        secure: true, // if Airtel uses https with valid cert
        rewrite: (path) => path.replace(/^\/airtel-api/, ""),
      },
    },
  },
});
