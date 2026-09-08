import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This automatically exposes your server to your local network
    port: 5178, // Optional: keeps your preferred port
  },
});
