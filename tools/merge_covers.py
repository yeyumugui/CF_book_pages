# -*- coding: utf-8 -*-
"""
把一本书的两张公众号封面拼接成一张 PNG（预览/挑选用）。

布局（总宽 1080）：
  ┌ 首图 2.35:1  → 缩放到 1080 宽（缩放不放大，保持清晰）
  ├ 说明条        「书名 · 首图 2.35:1 · 微信推文题图」
  ├ 次图 1:1     → 原尺寸 1080×1080
  └ 说明条        「书名 · 次图 1:1 · 朋友圈/转发缩略图」

用法：
  python merge_covers.py               # 增量：给所有缺合图的书生成
  python merge_covers.py 书名          # 只做指定的书
  python merge_covers.py --all         # 全量重算（覆盖已存在的合图）

原尺寸封面不会被改动或删除 —— 上传微信仍用那两张。
"""
import sys, pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent   # 工作区根目录
FONT_PATH = r"C:\Windows\Fonts\NotoSerifSC-VF.ttf"
W = 1080
GAP = 40
BG = (239, 231, 215)      # 纸感色
INK = (107, 95, 76)


def cfont(size, weight=500):
    f = ImageFont.truetype(FONT_PATH, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def bar(title, text):
    img = Image.new("RGB", (W, GAP), BG)
    d = ImageDraw.Draw(img)
    d.text((26, GAP // 2), f"{title} · {text}", font=cfont(19, 500), fill=INK, anchor="lm")
    return img


def merge(book_dir: pathlib.Path, force=False) -> str:
    name = book_dir.name
    wide = book_dir / f"{name}_公众号封面_1800x766.png"
    square = book_dir / f"{name}_公众号封面_1080x1080.png"
    out = book_dir / f"{name}_公众号封面_合图.png"

    if out.exists() and not force:
        return "skip"
    if not wide.exists() or not square.exists():
        return "missing"

    a = Image.open(wide).convert("RGB")
    aw = int(a.height * W / a.width)
    a = a.resize((W, aw), Image.LANCZOS)

    b = Image.open(square).convert("RGB")
    bw = int(b.height * W / b.width)   # 保持比例，通常已是 1080 宽
    b = b.resize((W, bw), Image.LANCZOS)

    total = a.height + GAP + b.height + GAP
    canvas = Image.new("RGB", (W, total), BG)
    canvas.paste(a, (0, 0))
    canvas.paste(bar(name, "首图 2.35:1 · 微信推文题图"), (0, a.height))
    canvas.paste(b, (0, a.height + GAP))
    canvas.paste(bar(name, "次图 1:1 · 朋友圈/转发缩略图"), (0, a.height + GAP + b.height))

    canvas.save(out, "PNG", optimize=True)
    return "ok"


def main():
    args = sys.argv[1:]
    force = "--all" in args or "-f" in args
    target = next((a for a in args if not a.startswith("-")), None)

    if target:
        dirs = [ROOT / target]
    else:
        dirs = [d for d in sorted(ROOT.iterdir())
                if d.is_dir() and d.name not in ("CF_book_pages", ".workbuddy")
                and not d.name.startswith("_")]

    stat = {"ok": 0, "skip": 0, "missing": 0}
    miss = []
    for d in dirs:
        if not d.exists():
            continue
        r = merge(d, force=force)
        stat[r] += 1
        if r == "missing":
            miss.append(d.name)
        elif r == "ok":
            print(f"[merge] {d.name}")

    print(f"\ndone: new={stat['ok']} skip={stat['skip']} missing={stat['missing']}")
    if miss:
        print("缺少封面,未处理:", "、".join(miss))


if __name__ == "__main__":
    main()
