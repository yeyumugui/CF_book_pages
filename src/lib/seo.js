/** 运行时把 buildMeta() 的结果写进 document.head（SPA 内跳转时同步更新） */
export function applyMeta(meta) {
  if (typeof document === 'undefined') return

  document.title = meta.title
  tag('meta', { name: 'description' }, { content: meta.description })
  tag('meta', { name: 'keywords' }, { content: meta.keywords })
  tag('meta', { property: 'og:title' }, { content: meta.title })
  tag('meta', { property: 'og:description' }, { content: meta.description })
  tag('meta', { property: 'og:type' }, { content: meta.jsonLd.some((x) => x['@type'] === 'Article') ? 'article' : 'website' })
  tag('meta', { property: 'og:url' }, { content: meta.url })
  tag('meta', { property: 'og:image' }, { content: meta.image })
  tag('meta', { property: 'og:site_name' }, { content: meta.siteName || '' })
  tag('meta', { property: 'og:locale' }, { content: 'zh_CN' })
  tag('meta', { name: 'twitter:card' }, { content: 'summary_large_image' })
  tag('link', { rel: 'canonical' }, { href: meta.url })

  let ld = document.getElementById('ld-json')
  if (!ld) {
    ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.id = 'ld-json'
    document.head.appendChild(ld)
  }
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': meta.jsonLd })
}

function tag(name, keyAttrs, valueAttrs) {
  const sel = `${name}[${Object.keys(keyAttrs)[0]}="${Object.values(keyAttrs)[0]}"]`
  let el = document.head.querySelector(sel)
  if (!el) {
    el = document.createElement(name)
    Object.entries(keyAttrs).forEach(([k, v]) => el.setAttribute(k, v))
    document.head.appendChild(el)
  }
  Object.entries(valueAttrs).forEach(([k, v]) => el.setAttribute(k, v))
}
