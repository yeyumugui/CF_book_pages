import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: true, linkify: true, breaks: false })

// 表格套一层可横向滚动的容器：窄屏上宽表格在容器内滚动，不把整页撑出横向滚动条
const rules = md.renderer.rules
rules.table_open = (tokens, idx, opts, env, self) =>
  '<div class="tw">' + self.renderToken(tokens, idx, opts)
rules.table_close = (tokens, idx, opts, env, self) =>
  self.renderToken(tokens, idx, opts) + '</div>'

/** 去掉 md 开头的 YAML frontmatter，避免被当成正文/表格渲染出来 */
export function stripFrontmatter(text) {
  const m = /^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text)
  return m ? text.slice(m[0].length) : text
}

/** 正文开头的 h1 与页面标题重复，去掉它，保证一页只有一个 h1 */
export function renderNote(text) {
  return md.render(stripFrontmatter(text)).replace(/^\s*<h1>[\s\S]*?<\/h1>\s*/, '')
}
