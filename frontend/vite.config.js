import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true, // ngrok ka random domain allow karne ke liye
    proxy: {
      "/api": "http://localhost:5000", // frontend ki /api calls backend ko forward
    },
  },
});