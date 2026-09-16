<template>
  <div class="detail">
    <router-link class="back" to="/">← 回到书架</router-link>

    <template v-if="book">
      <div class="d-hero">
        <img :src="coverWide(book.id)" :alt="book.title" />
      </div>

      <div class="d-head">
        <h1>{{ book.title }}</h1>
        <div class="en" v-if="book.en">{{ book.en }}</div>
        <dl class="meta">
          <template v-if="book.author"><dt>作者</dt><dd>{{ book.author }}</dd></template>
          <template v-if="book.field"><dt>领域</dt><dd>{{ book.field }}</dd></template>
          <template v-if="book.year && book.year !== '—'"><dt>出版</dt><dd>{{ book.year }}</dd></template>
          <template v-if="book.honor && book.honor !== '—'"><dt>荣誉</dt><dd>{{ book.honor }}</dd></template>
          <template v-if="book.rating && book.rating !== '—'"><dt>推荐值</dt><dd>{{ book.rating }}</dd></template>
          <template v-if="book.rank"><dt>榜单</dt><dd>{{ book.rank }}</dd></template>
        </dl>
      </div>

      <div v-if="loading" class="loading">正在载入笔记…</div>
      <div v-else-if="error" class="err">{{ error }}</div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else class="md-body" v-html="html"></div>
    </template>

    <div v-else class="err">没有找到这本书：{{ id }}</div>

    <footer class="site-foot">
      笔记内容为公开核心观点整理，非原文逐字转载；版权归原作者及出版方所有。
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { getBook, coverWide, noteUrl } from '../data'

const md = new MarkdownIt({ html: true, linkify: true, breaks: false })
const route = useRoute()

const id = computed(() => decodeURIComponent(route.params.id || ''))
const book = computed(() => getBook(id.value))

const html = ref('')
const loading = ref(true)
const error = ref('')

/** 去掉 md 开头的 YAML frontmatter，避免被当成正文/表格渲染出来 */
function stripFrontmatter(text) {
  const m = /^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text)
  return m ? text.slice(m[0].length) : text
}

async function loadNote(bookId) {
  loading.value = true
  error.value = ''
  html.value = ''
  try {
    const res = await fetch(noteUrl(bookId))
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const text = await res.text()
    html.value = md.render(stripFrontmatter(text))
  } catch (e) {
    error.value = '笔记载入失败：' + e.message
  } finally {
    loading.value = false
  }
}

watch(id, (v) => v && loadNote(v), { immediate: true })
</script>
