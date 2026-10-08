/**
 * 纯数据层：算出每个页面该有的 title / description / canonical / OG / JSON-LD。
 * 不 import 任何 data（那样会把 import.meta.glob 带进 node 环境），
 * 客户端（SPA 运行时）和 tools/prerender.mjs 共用同一份结果。
 */

export function bookPath(id) {
  return `/book/${encodeURIComponent(id)}/`
}

export function coverPath(id) {
  return `/books/${encodeURIComponent(id)}/cover-wide.png`
}

function abs(site, p) {
  return site.url.replace(/\/+$/, '') + p
}

function clip(s, n = 155) {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}

function bookDescription(b) {
  const head = `《${b.title}》精读笔记`
  const body = b.oneLiner || (b.tags || []).join(' · ')
  return clip(`${head}：${body} 作者${b.author}。含核心框架、全书脉络、关键概念与金句。`)
}

export function buildMeta(site, { book = null, books = [] } = {}) {
  if (!book) {
    const desc = clip(`${site.description} 已收录 ${books.length} 本，含《${books[0]?.title || ''}》等。`)
    return {
      title: `${site.name} · 每本书一份精读笔记（${books.length} 本）`,
      description: desc,
      keywords: '读书笔记,精读,书评,书籍拆解,全书脉络,书单,读书心得',
      siteName: site.name,
      url: abs(site, '/'),
      image: books[0] ? abs(site, coverPath(books[0].id)) : '',
      jsonLd: [
        {
          '@type': 'WebSite',
          '@id': abs(site, '/#website'),
          url: abs(site, '/'),
          name: site.name,
          description: site.description,
          inLanguage: 'zh-CN',
          author: { '@type': 'Person', name: site.author },
        },
        {
          '@type': 'ItemList',
          name: site.name,
          itemListElement: books.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: abs(site, bookPath(b.id)),
            name: `《${b.title}》精读笔记`,
          })),
        },
      ],
    }
  }

  const url = abs(site, bookPath(book.id))
  const image = abs(site, coverPath(book.id))
  const title = `《${book.title}》精读笔记 · ${book.author} ｜ ${site.name}`
  return {
    title,
    description: bookDescription(book),
    keywords: [book.title, book.author, book.field, ...(book.tags || [])].filter(Boolean).join(','),
    siteName: site.name,
    url,
    image,
    jsonLd: [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.name, item: abs(site, '/') },
          { '@type': 'ListItem', position: 2, name: `《${book.title}》精读笔记`, item: url },
        ],
      },
      {
        '@type': 'Book',
        name: book.title,
        url,
        image,
        description: book.oneLiner || '',
        inLanguage: 'zh-CN',
        keywords: (book.tags || []).join(','),
        ...(book.author ? { author: { '@type': 'Person', name: book.author } } : {}),
        ...(book.year && book.year !== '—' ? { datePublished: book.year } : {}),
      },
      {
        '@type': 'Article',
        headline: title,
        description: bookDescription(book),
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        image,
        url,
        inLanguage: 'zh-CN',
        ...(book.date ? { datePublished: book.date, dateModified: book.date } : {}),
        author: { '@type': 'Person', name: site.author },
        publisher: { '@type': 'Organization', name: site.name, url: abs(site, '/') },
      },
    ],
  }
}
