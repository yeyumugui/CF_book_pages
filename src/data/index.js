/**
 * 自动发现：src/data/books/ 下每新增一份 .json，列表页就会多一本书。
 * 定时任务生成新笔记时，只要往这个目录放一份 json，页面自动收录，无需改代码。
 */
const modules = import.meta.glob('./books/*.json', { eager: true })

export const books = Object.entries(modules)
  .map(([path, mod]) => {
    const id = path.split('/').pop().replace(/\.json$/, '')
    const data = mod.default || mod
    return { id, ...data }
  })
  .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))

export function getBook(id) {
  return books.find((b) => b.id === id)
}

/** 兼容子路径部署（vite base 不是根时也能取到资源） */
export function asset(p) {
  const base = import.meta.env.BASE_URL || '/'
  return (base + String(p).replace(/^\//, '')).replace(/\/{2,}/g, '/')
}

export const coverWide = (id) => asset(`/books/${id}/cover-wide.png`)
export const coverSquare = (id) => asset(`/books/${id}/cover-square.png`)
export const noteUrl = (id) => asset(`/notes/${id}.md`)
