import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 站点部署在域名根目录，资源用绝对路径：预渲染页在 /book/xxx/ 下才不会解析错资源
  base: '/',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
