import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // The proxy runs on the laptop, so localhost always reaches the backend.
  // Optional override in client/.env: VITE_PROXY_TARGET=http://localhost:5000
  const backendTarget = (env.VITE_PROXY_TARGET || 'http://localhost:5000').replace(/\/api\/?$/, '');

  return {
    plugins: [react()],
    server: {
      host: true,          // listen on all network interfaces (phone can connect)
      port: 5173,
      strictPort: true,    // fail loudly instead of silently moving to 5174
      allowedHosts: true,  // needed if you test through ngrok / Cloudflare Tunnel
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});