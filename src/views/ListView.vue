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
        v-for="b in books"
        :key="b.id"
        class="bcard"
        :to="`/book/${encodeURIComponent(b.id)}`"
      >
        <div class="cov">
          <img :src="coverWide(b.id)" :alt="b.title" loading="lazy" />
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

    <footer class="site-foot">
      笔记内容为公开核心观点整理，非原文逐字转载；版权归各书原作者及出版方所有。
    </footer>
  </div>
</template>

<script setup>
import { books, coverWide } from '../data'
</script>
