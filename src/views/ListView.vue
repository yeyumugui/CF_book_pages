<template>
  <div>
    <header class="hero">
      <div class="kicker">CLOSE READING · SHELF</div>
      <h1>精读书架</h1>
      <div class="en">Reading notes, one folder per book</div>
      <p class="desc">每本书一份精读笔记：核心框架 · 关键概念 · 全书脉络 · 金句 · 行动启发</p>
      <div class="count">已收录 {{ books.length }} 本</div>
    </header>

    <main class="shelf">
      <router-link
        v-for="b in view.items"
        :key="b.id"
        class="bcard"
        :to="bookPath(b.id)"
      >
        <div class="cov">
          <img :src="coverWide(b.id)" :alt="`《${b.title}》精读笔记封面`" loading="lazy" />
          <span v-if="b.rank" class="rank">{{ b.rank }}</span>
          <span v-if="b._todo" class="todo">待补全</span>
        </div>
        <div class="body">
          <h2>{{ b.title }}</h2>
          <div class="meta">{{ b.author }}<span v-if="b.field"> · {{ b.field }}</span></div>
          <p class="one">{{ b.oneLiner || '（简介待补全）' }}</p>
          <div class="tags">
            <span v-for="t in (b.tags || []).slice(0, 4)" :key="t">{{ t }}</span>
          </div>
          <div class="go">读笔记 →</div>
        </div>
      </router-link>
    </main>

    <nav v-if="view.total > 1" class="pager">
      <button class="nav" :class="{ off: view.page === 1 }" :disabled="view.page === 1" @click="go(view.page - 1)">
        ← 上一页
      </button>
      <button
        v-for="n in view.total"
        :key="n"
        class="num"
        :class="{ on: n === view.page }"
        @click="go(n)"
      >{{ n }}</button>
      <button class="nav" :class="{ off: view.page === view.total }" :disabled="view.page === view.total" @click="go(view.page + 1)">
        下一页 →
      </button>
      <span class="info">第 {{ view.page }} / {{ view.total }} 页 · 每页 {{ size }} 本</span>
    </nav>

    <footer class="site-foot">
      笔记内容为公开核心观点整理，非原文逐字转载；版权归各书原作者及出版方所有。
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { books, coverWide } from '../data'
import site from '../../site.config.json'
import { buildMeta, bookPath } from '../lib/meta'
import { applyMeta } from '../lib/seo'
import { NARROW_QUERY, PAGE_SIZE, PAGE_SIZE_NARROW, clampPage, pageSlice } from '../lib/pager'

applyMeta(buildMeta(site, { books }))

const route = useRoute()
const router = useRouter()

const narrow = ref(false)
const size = computed(() => (narrow.value ? PAGE_SIZE_NARROW : PAGE_SIZE))
const page = ref(clampPage(route.query.page, books.length, PAGE_SIZE))

const view = computed(() => pageSlice(books, page.value, size.value))

// 每页数量随屏宽变化，页码可能越界，收敛回合法范围
watch([size, () => books.length], () => {
  page.value = clampPage(page.value, books.length, size.value)
})

// 支持前进/后退与直接分享 ?page=2
watch(
  () => route.query.page,
  (v) => {
    const n = clampPage(v, books.length, size.value)
    if (n !== page.value) page.value = n
  },
)

function go(n) {
  const next = clampPage(n, books.length, size.value)
  if (next === page.value) return
  page.value = next
  router.replace({ path: '/', query: next > 1 ? { page: String(next) } : {} })
}

function syncNarrow() {
  if (typeof window === 'undefined' || !window.matchMedia) return
  narrow.value = window.matchMedia(NARROW_QUERY).matches
}

onMounted(() => {
  syncNarrow()
  window.addEventListener('resize', syncNarrow)
})
onBeforeUnmount(() => window.removeEventListener('resize', syncNarrow))
</script>
