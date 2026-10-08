import { createApp } from 'vue'
import router from './router'
import './style.css'
import App from './App.vue'

// 旧 hash 链接（/#/book/xxx）转到 history 路径，避免改版后外链 404
if (location.hash.startsWith('#/')) {
  history.replaceState(null, '', location.hash.slice(1) || '/')
}

createApp(App).use(router).mount('#app')
