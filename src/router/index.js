import { createRouter, createWebHashHistory } from 'vue-router'
import ListView from '../views/ListView.vue'
import BookDetail from '../views/BookDetail.vue'

export default createRouter({
  // hash 模式：dist 丢到任何静态目录 / 子路径都能直接刷新，不用配服务端 rewrite
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: ListView },
    { path: '/book/:id', component: BookDetail },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
