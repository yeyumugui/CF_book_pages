import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径打包：dist 丢到任意子目录/静态托管都能直接打开（配合 hash 路由）
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
