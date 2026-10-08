# CF_book_pages · 精读书架

把「每本书一个文件夹」的精读笔记，渲染成一个可浏览的网页书架。

## 技术栈

Vite 8 + Vue 3 + vue-router 4（history 模式）+ markdown-it

## 常用命令

```bash
npm install
npm run dev      # 本地开发
npm run build    # 构建到 dist/，并预渲染出每本书的静态 HTML + sitemap + robots
npm run preview  # 预览 dist/
npm run sync     # 把工作区各书文件夹里的笔记 md 和封面同步进 public/
```

> `npm run sync` 用的是 `tools/sync_notes.py`，需要 Python + 无额外依赖。

## 目录结构

```
site.config.json   站点级配置：域名、站名、描述（sitemap/canonical/og 都从这里取）
src/
  data/
    books/*.json     每本书一份元数据（自动发现，新增即上架）
    index.js         import.meta.glob 扫描 + 资源路径工具
  lib/
    note.js          md → html（客户端与预渲染脚本共用同一份渲染）
    meta.js          计算每页的 title/description/canonical/OG/JSON-LD
    seo.js           运行时把 meta 写进 document.head
  views/
    ListView.vue     书架列表页
    BookDetail.vue   笔记详情页（fetch md → markdown-it 渲染）
  router/index.js    /  和  /book/:id
public/
  notes/{书名}.md        笔记正文（同步脚本写入）
  books/{书名}/cover-wide.png    2.35:1 封面
  books/{书名}/cover-square.png  1:1 封面
  _redirects            Cloudflare Pages 路由兜底（尾斜杠规范化 + SPA fallback）
tools/
  sync_notes.py     同步脚本
  prerender.mjs     构建后预渲染每页静态 HTML，并生成 sitemap.xml / robots.txt
```

## 新增一本书要做什么

1. 在工作区根目录建 `书名/` 文件夹，按约定放好 5 件套（精读笔记 html / md、公众号正文、两张封面）。
2. 跑 `npm run sync` —— 自动把 md 和封面复制进 `public/`，缺元数据时会生成一份带 `_todo: true` 的占位 JSON。
3. 补全 `src/data/books/{书名}.json`（去掉 `_todo` 字段）。
4. `npm run build` 验证。

全程不需要改任何 Vue 代码：列表页自动扫描 `src/data/books/*.json`，详情页按书名 fetch 对应 md。

## 设计约定

- 米色纸感背景 `#f6f1e7`、衬线标题、朱红 `#b5322c` 强调色，与各笔记网页版同一视觉语言
- `base: '/'` + history 路由：详情页有独立 URL（`/book/书名/`），才能被搜索引擎收录
- 详情页会自动剥离 md 开头的 YAML frontmatter，并去掉与页面标题重复的正文 h1

## SEO

- **预渲染**：`npm run build` 后 `tools/prerender.mjs` 会把首页和 28 个详情页写成含完整正文的真实静态 HTML，不执行 JS 的爬虫（百度、多数 AI 抓取器）也能读到全文。
- **每页 meta**：title / description / keywords / canonical / OG / Twitter Card 由 `src/lib/meta.js` 统一生成，SPA 内跳转时由 `src/lib/seo.js` 同步更新。
- **结构化数据**：首页 WebSite + ItemList，详情页 BreadcrumbList + Book + Article。
- **换域名**：只改 `site.config.json` 的 `url` 一个字段，sitemap、canonical、og:url 全部跟着变。
- **部署**：Cloudflare Pages 构建命令 `npm run build`，输出目录 `dist`；`public/_redirects` 负责尾斜杠规范化和未预渲染路径的兜底。
- **提交收录**（改域名或首次上线后做一次）：
  - Google Search Console：提交 `https://book.yeyumugui.cc.cd/sitemap.xml`
  - 百度搜索资源平台：提交同样的 sitemap（百度对纯 JS 站点抓取差，预渲染正是为此）
  - Bing Webmaster Tools：可直接导入 Google 的 sitemap
