import { createRouter, createWebHistory } from 'vue-router'
import ListView from '../views/ListView.vue'
import BookDetail from '../views/BookDetail.vue'

export default createRouter({
  // history 模式：详情页有独立 URL，才能被搜索引擎收录（hash 模式爬虫抓不到）
  history: createWebHistory(),
  routes: [
    { path: '/', component: ListView },
    { path: '/book/:id', component: BookDetail },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
