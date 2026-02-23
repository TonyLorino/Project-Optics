import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api/ado': {
          target: 'https://dev.azure.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/ado/, `/${env.VITE_ADO_ORGANIZATION}`),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const pat = env.VITE_ADO_PAT
              if (pat) {
                proxyReq.setHeader(
                  'Authorization',
                  `Basic ${Buffer.from(`:${pat}`).toString('base64')}`
                )
              }
            })
          },
        },
      },
    },
  }
})
