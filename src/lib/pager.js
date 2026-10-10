/**
 * 列表分页：Vue 运行时与预渲染脚本共用同一套规则，避免两处算法漂移。
 * 纯 JS，不依赖 vue / import.meta，node 端可直接 import。
 */
export const PAGE_SIZE = 12
/** 窄屏（手机单列）每页少一些，否则单列 12 张卡仍然要滚很久 */
export const PAGE_SIZE_NARROW = 6
export const NARROW_QUERY = '(max-width: 720px)'

export function totalPages(count, size = PAGE_SIZE) {
  return Math.max(1, Math.ceil(count / size))
}

export function clampPage(page, count, size = PAGE_SIZE) {
  const n = Number(page) || 1
  return Math.min(Math.max(1, Math.trunc(n)), totalPages(count, size))
}

export function pageSlice(list, page, size = PAGE_SIZE) {
  const total = totalPages(list.length, size)
  const p = clampPage(page, list.length, size)
  return {
    page: p,
    total,
    items: list.slice((p - 1) * size, p * size),
  }
}
