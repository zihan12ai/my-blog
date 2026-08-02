#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
算栗工坊 构建脚本：
扫描 posts/*.md -> 生成 assets/posts.json（首页索引）+ 每篇文章静态页 post-<slug>.html
本地运行：  python scripts/build.py
线上运行：  GitHub Action 调用同一脚本
零第三方依赖（仅标准库）。
"""
import os, re, json, sys, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
POSTS_DIR = os.path.join(ROOT, 'posts')
OUT_JSON = os.path.join(ROOT, 'assets', 'posts.json')
TEMPLATE = os.path.join(ROOT, 'scripts', 'template.html')

ICON = {'Python教程': '🐍', '工具教程': '🛠️', 'Agent': '🤖', '生活': '🌿'}
DESC = {
    'Python教程': '工具链、环境配置与数据分析实践',
    '工具教程': '日常开发与生活常用工具教程',
    'Agent': '大模型智能体开发实践与范式笔记',
    '生活': '记录生活的碎碎念',
}

def parse_frontmatter(raw):
    m = re.match(r'^---\n(.*?)\n---\n?(.*)$', raw, re.S)
    if not m:
        return {}, raw
    fm, body = m.group(1), m.group(2)
    data = {}
    cur_key = None
    for line in fm.split('\n'):
        kv = re.match(r'^([A-Za-z_]+):\s*(.*)$', line)
        if kv:
            key, val = kv.group(1), kv.group(2).strip()
            if val == '[]':
                data[key] = []
                cur_key = None
            elif val.startswith('[') and val.endswith(']'):
                data[key] = [s.strip().strip('"\'') for s in val[1:-1].split(',') if s.strip()]
                cur_key = None
            elif val == '':
                data[key] = []
                cur_key = key  # 多行 list
            else:
                data[key] = val.strip('"\'')
                cur_key = None
        elif re.match(r'^\s*-\s+', line) and cur_key:
            data[cur_key].append(re.sub(r'^\s*-\s+', '', line).strip())
    return data, body

def md_to_html(md):
    md = md.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    md = re.sub(r'```(\w*)\n([\s\S]*?)```', lambda m: f'<pre><code>{m.group(2).strip()}</code></pre>', md)
    md = re.sub(r'`([^`]+)`', r'<code>\1</code>', md)
    md = re.sub(r'^### (.+)$', r'<h3>\1</h3>', md, flags=re.M)
    md = re.sub(r'^## (.+)$', r'<h2>\1</h2>', md, flags=re.M)
    md = re.sub(r'^# (.+)$', r'<h1>\1</h1>', md, flags=re.M)
    md = re.sub(r'^&gt; (.+)$', r'<blockquote>\1</blockquote>', md, flags=re.M)
    # 无序列表块
    md = re.sub(r'(?:^|\n)((?:- .+\n?)+)', lambda m: '<ul>' + ''.join(
        f'<li>{re.sub(r"^- ", "", l)}</li>' for l in m.group(1).strip().split('\n') if l.strip()
    ) + '</ul>', md)
    # 段落
    out = []
    for p in re.split(r'\n{2,}', md):
        p = p.strip()
        if not p:
            continue
        if re.match(r'^<(h\d|ul|pre|blockquote)', p):
            out.append(p)
        else:
            out.append(f'<p>{p.replace(chr(10), "<br>")}</p>')
    return '\n'.join(out)

def main():
    if not os.path.isdir(POSTS_DIR):
        print('posts 目录不存在'); sys.exit(1)
    files = sorted(glob.glob(os.path.join(POSTS_DIR, '*.md')))
    index = []
    template = ''
    if os.path.exists(TEMPLATE):
        template = open(TEMPLATE, encoding='utf-8').read()

    for f in files:
        raw = open(f, encoding='utf-8').read()
        data, body = parse_frontmatter(raw)
        slug = data.get('slug') or os.path.splitext(os.path.basename(f))[0]
        pub = data.get('published', '')
        upd = data.get('updated') or pub
        index.append({
            'title': data.get('title', slug),
            'slug': slug,
            'category': data.get('category', '未分类'),
            'tags': data.get('tags', []),
            'summary': data.get('summary', ''),
            'published': pub,
            'updated': upd,
        })
        # 生成单篇文章页
        if template:
            is_new = upd > pub
            badge = ('updated', '有更新') if is_new else ('new', '新文章')
            info = (f'分类：{data.get("category","")} · 发布于 {pub}'
                    + (f' · 更新于 {upd}' if upd and upd != pub else '')
                    + f' · <span class="badge {badge[0]}">{badge[1]}</span>')
            html = template
            html = re.sub(r'<title>[^<]*</title>', f'<title>{data.get("title",slug)} · 算栗工坊</title>', html, count=1)
            html = re.sub(r'<h1>[^<]*</h1>', f'<h1>{data.get("title",slug)}</h1>', html, count=1)
            html = re.sub(r'<div class="article-info">[\s\S]*?</div>', f'<div class="article-info">{info}</div>', html, count=1)
            html = re.sub(r'<div class="article-body">[\s\S]*?</div>', f'<div class="article-body">{md_to_html(body)}</div>', html, count=1)
            with open(os.path.join(ROOT, f'post-{slug}.html'), 'w', encoding='utf-8') as w:
                w.write(html)

    index.sort(key=lambda x: x.get('updated') or x.get('published'), reverse=True)
    with open(OUT_JSON, 'w', encoding='utf-8') as w:
        json.dump(index, w, ensure_ascii=False, indent=2)
    print(f'[build] OK: {len(index)} posts -> assets/posts.json + {len(index)} article pages')

if __name__ == '__main__':
    main()
