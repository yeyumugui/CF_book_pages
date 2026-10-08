# -*- coding: utf-8 -*-
"""
把工作区里「每本书一个文件夹」的精读笔记同步进 Vue 项目。

用法：
    python CF_book_pages/tools/sync_notes.py

做三件事：
1. 复制  书名/*_精读笔记.md          -> public/notes/书名.md
2. 复制  书名/*_公众号封面_1800x766.png  -> public/books/书名/cover-wide.png
3. 复制  书名/*_公众号封面_1080x1080.png -> public/books/书名/cover-square.png
4. 若 src/data/books/书名.json 不存在，用 md 头部信息生成最小条目并打上 _todo 标记

已有 JSON 一律不动（人工/AI 写好的元数据优先）。
"""
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # 工作区根
APP = Path(__file__).resolve().parents[1]           # CF_book_pages
NOTES_DIR = APP / "public" / "notes"
COVER_DIR = APP / "public" / "books"
DATA_DIR = APP / "src" / "data" / "books"

SKIP = {".workbuddy", ".git", ".vscode", "node_modules", "public", "src", "tools", "dist"}

report = []


def pick(folder: Path, pattern: str):
    hit = sorted(folder.glob(pattern))
    return hit[0] if hit else None


def minimal_json(title: str, md_path: Path) -> dict:
    """从 md 头部抓一点信息，生成一个待补全的条目。"""
    text = md_path.read_text(encoding="utf-8", errors="ignore")[:2000]
    en = ""
    m = re.search(r"^\*(.+?)\*\s*$", text, re.M)
    if m:
        en = m.group(1).strip()
    author = ""
    m = re.search(r"作者[：:]\s*(.+)", text)
    if m:
        author = m.group(1).strip()
    return {
        "title": title,
        "en": en,
        "author": author,
        "field": "",
        "year": "",
        "honor": "",
        "rating": "",
        "rank": "",
        "tags": [],
        "oneLiner": "",
        "date": date.today().isoformat(),
        "_todo": True,
    }


def main():
    NOTES_DIR.mkdir(parents=True, exist_ok=True)
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    folders = [p for p in ROOT.iterdir()
               if p.is_dir() and p.name not in SKIP and not p.name.startswith(("_", "."))]

    for folder in sorted(folders, key=lambda p: p.name):
        md = pick(folder, "*_精读笔记.md")
        if not md:
            continue
        title = folder.name

        dst_md = NOTES_DIR / f"{title}.md"
        if not dst_md.exists() or md.stat().st_mtime > dst_md.stat().st_mtime:
            shutil.copy2(md, dst_md)
            report.append(f"[md] {title}  <- {md.name}")

        wide = pick(folder, "*_公众号封面_1800x766.png")
        square = pick(folder, "*_公众号封面_1080x1080.png")
        if wide:
            d = COVER_DIR / title
            d.mkdir(parents=True, exist_ok=True)
            shutil.copy2(wide, d / "cover-wide.png")
            report.append(f"[cover-wide] {title}")
        if square:
            d = COVER_DIR / title
            d.mkdir(parents=True, exist_ok=True)
            shutil.copy2(square, d / "cover-square.png")
            report.append(f"[cover-square] {title}")

        jf = DATA_DIR / f"{title}.json"
        if not jf.exists():
            jf.write_text(json.dumps(minimal_json(title, md), ensure_ascii=False, indent=2) + "\n",
                          encoding="utf-8")
            report.append(f"[json-todo] {title}  (src/data/books/{title}.json 待补全)")

    books = sorted(DATA_DIR.glob("*.json"))
    report.append("")
    report.append(f"books in app: {len(books)} -> " + ", ".join(b.stem for b in books))
    print("\n".join(report))


if __name__ == "__main__":
    main()

