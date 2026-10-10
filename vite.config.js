import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/osu-token': {
        target: 'https://osu.ppy.sh',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/osu-token', '/oauth/token')
      },
      '/api/osu-v2': {
        target: 'https://osu.ppy.sh',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/osu-v2', '/api/v2')
      }
    }
  }
})