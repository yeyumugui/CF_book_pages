/**
 * 构建后预渲染：把列表页和每个详情页写成真实静态 HTML。
 * 目的：不执行 JS 的爬虫（百度、多数 AI 抓取器）也能拿到完整正文与 meta。
 * 用法：node tools/prerender.mjs（已接在 npm run build 后面）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderNote } from '../src/lib/note.js'
import { buildMeta, bookPath, coverPath } from '../src/lib/meta.js'
import { PAGE_SIZE, pageSlice } from '../src/lib/pager.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const site = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'))
const base = site.url.replace(/\/+$/, '')

/** 与 src/data/index.js 保持同一套发现 + 排序规则 */
const books = fs
  .readdirSync(path.join(root, 'src/data/books'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ id: f.replace(/\.json$/, ''), ...JSON.parse(fs.readFileSync(path.join(root, 'src/data/books', f), 'utf8')) }))
  .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))

const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function inject(shellHtml, meta, bodyHtml) {
  const head = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="keywords" content="${esc(meta.keywords)}" />`,
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    `<meta property="og:type" content="${meta.jsonLd.some((x) => x['@type'] === 'Article') ? 'article' : 'website'}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    `<meta property="og:image" content="${esc(meta.image)}" />`,
    `<meta property="og:site_name" content="${esc(meta.siteName)}" />`,
    `<meta property="og:locale" content="${esc(site.locale || 'zh_CN')}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': meta.jsonLd }).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')

  return shellHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/\s*<meta\s+name="(?:description|keywords)"[^>]*>/g, '')
    .replace(/\s*<meta\s+(?:property|name)="(?:og:|twitter:)[^"]*"[^>]*>/g, '')
    .replace(/\s*<link\s+rel="canonical"[^>]*>/g, '')
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="app"></div>', `<div id="app">${bodyHtml}</div>`)
}

const foot = '笔记内容为公开核心观点整理，非原文逐字转载；版权归原作者及出版方所有。'

/** 与 ListView 的分页条保持同构：无 JS 时也能看到第 1 页与页码链接 */
function pagerHtml(page, total) {
  if (total <= 1) return ''
  const href = (n) => (n <= 1 ? '/' : `/?page=${n}`)
  const nums = Array.from({ length: total }, (_, i) => {
    const n = i + 1
    return `<a class="num${n === page ? ' on' : ''}" href="${href(n)}">${n}</a>`
  }).join('')
  const prevOff = page <= 1 ? ' off' : ''
  const nextOff = page >= total ? ' off' : ''

  return `
    <nav class="pager">
      <a class="nav${prevOff}" href="${href(page - 1)}">← 上一页</a>
      ${nums}
      <a class="nav${nextOff}" href="${href(page + 1)}">下一页 →</a>
      <span class="info">第 ${page} / ${total} 页 · 每页 ${PAGE_SIZE} 本</span>
    </nav>`
}

function listHtml() {
  // 预渲染只写第 1 页：一是与客户端首屏一致（避免加载完突然缩水），二是首页别背 29 张大图
  const { items, page, total } = pageSlice(books, 1, PAGE_SIZE)
  const cards = items
    .map(
      (b) => `      <a class="bcard" href="${esc(bookPath(b.id))}">
        <div class="cov">
          <img src="${esc(coverPath(b.id))}" alt="《${esc(b.title)}》精读笔记封面" loading="lazy" />
          ${b.rank ? `<span class="rank">${esc(b.rank)}</span>` : ''}
          ${b._todo ? '<span class="todo">待补全</span>' : ''}
        </div>
        <div class="body">
          <h2>${esc(b.title)}</h2>
          <div class="meta">${esc(b.author)}${b.field ? ` · ${esc(b.field)}` : ''}</div>
          <p class="one">${esc(b.oneLiner || '（简介待补全）')}</p>
          <div class="tags">${(b.tags || []).slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
          <div class="go">读笔记 →</div>
        </div>
      </a>`,
    )
    .join('\n')

  return `
    <header class="hero">
      <div class="kicker">CLOSE READING · SHELF</div>
      <h1>精读书架</h1>
      <div class="en">Reading notes, one folder per book</div>
      <p class="desc">每本书一份精读笔记：核心框架 · 关键概念 · 全书脉络 · 金句 · 行动启发</p>
      <div class="count">已收录 ${books.length} 本</div>
    </header>

    <main class="shelf">
${cards}
    </main>${pagerHtml(page, total)}

    <footer class="site-foot">${foot}</footer>`
}

function detailHtml(b, noteHtml) {
  const rows = [
    ['作者', b.author],
    ['领域', b.field],
    ['出版', b.year !== '—' ? b.year : ''],
    ['荣誉', b.honor !== '—' ? b.honor : ''],
    ['推荐值', b.rating !== '—' ? b.rating : ''],
    ['榜单', b.rank],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `          <dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join('\n')

  return `
    <div class="detail">
      <a class="back" href="/">← 回到书架</a>
      <div class="d-hero">
        <img src="${esc(coverPath(b.id))}" alt="《${esc(b.title)}》精读笔记封面" />
      </div>
      <div class="d-head">
        <h1>${esc(b.title)}</h1>
        ${b.en ? `<div class="en">${esc(b.en)}</div>` : ''}
        <dl class="meta">
${rows}
        </dl>
      </div>
      <div class="md-body">${noteHtml}</div>
      <footer class="site-foot">${foot}</footer>
    </div>`
}

// ---- 列表页 ----
fs.writeFileSync(path.join(dist, 'index.html'), inject(shell, buildMeta(site, { books }), listHtml()))

// ---- 详情页 ----
const bookRoot = path.join(dist, 'book')
// dist 由 vite 每次清空重建，book/ 正常情况下不存在；存在时才清，且失败不中断构建
if (fs.existsSync(bookRoot)) {
  try {
    fs.rmSync(bookRoot, { recursive: true, force: true })
  } catch (e) {
    console.warn('prerender: 清理旧 book/ 失败（忽略）', e?.message || e)
  }
}
let done = 0
for (const b of books) {
  const mdPath = path.join(root, 'public/notes', `${b.id}.md`)
  const noteHtml = fs.existsSync(mdPath) ? renderNote(fs.readFileSync(mdPath, 'utf8')) : ''
  const dir = path.join(bookRoot, b.id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), inject(shell, buildMeta(site, { book: b }), detailHtml(b, noteHtml)))
  done++
}

// ---- sitemap.xml ----
const today = new Date().toISOString().slice(0, 10)
const urls = [
  { loc: `${base}/`, lastmod: books[0]?.date || today, priority: '1.0' },
  ...books.map((b) => ({
    loc: base + bookPath(b.id),
    lastmod: b.date || today,
    priority: '0.8',
  })),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)

// ---- robots.txt ----
fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`,
)

console.log(`prerender: 首页 1 + 详情页 ${done} 页，sitemap ${urls.length} 条 → ${base}`)
