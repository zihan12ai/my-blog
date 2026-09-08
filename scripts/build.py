#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
算栗工坊 构建脚本：
扫描 posts/*.md -> 生成 docs/assets/posts.json（首页索引）+ 每篇文章静态页 docs/post-<slug>.html
本地运行：  python scripts/build.py
线上运行：  GitHub Action 调用同一脚本
零第三方依赖（仅标准库）。
"""
import os, re, json, sys, glob, html

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# 发布物（手写页面 + assets + 构建产物）统一落在 docs/
OUT_DIR = os.path.join(ROOT, 'docs')
OUT_ASSETS = os.path.join(OUT_DIR, 'assets')
POSTS_DIR = os.path.join(ROOT, 'posts')
OUT_JSON = os.path.join(OUT_ASSETS, 'posts.json')
TOPICS_DIR = os.path.join(ROOT, 'content', 'topics')
MAPS_DIR = os.path.join(ROOT, 'content', 'maps')
OUT_TOPICS_JSON = os.path.join(OUT_ASSETS, 'topics.json')
OUT_MAPS_JSON = os.path.join(OUT_ASSETS, 'maps.json')
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
    list_item = None
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
            list_item = None
        elif cur_key:
            object_start = re.match(r'^\s*-\s*([A-Za-z_]+):\s*(.*)$', line)
            object_field = re.match(r'^\s+([A-Za-z_]+):\s*(.*)$', line)
            list_value = re.match(r'^\s*-\s+(.+)$', line)
            if object_start:
                key, val = object_start.groups()
                list_item = {key: val.strip().strip('"\'')}
                data[cur_key].append(list_item)
            elif object_field and isinstance(list_item, dict):
                key, val = object_field.groups()
                list_item[key] = val.strip().strip('"\'')
            elif list_value:
                data[cur_key].append(list_value.group(1).strip())
                list_item = None
    return data, body

def md_to_html(md):
    """渲染本博客所需的常用 Markdown，且不依赖第三方包。"""
    def safe_url(url):
        url = url.strip()
        return url if re.match(r'^(https?://|mailto:|/|\./|\.\./)', url, re.I) else '#'

    def inline(text):
        text = html.escape(text, quote=False)
        protected = []
        def hold(fragment):
            protected.append(fragment)
            return f'\x00{len(protected) - 1}\x00'
        text = re.sub(r'`([^`]+)`', lambda m: hold(f'<code>{m.group(1)}</code>'), text)
        text = re.sub(r'!\[([^]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)', lambda m: hold(f'<img src="{safe_url(m.group(2))}" alt="{m.group(1)}" loading="lazy">'), text)
        text = re.sub(r'(?<!!)\[([^]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)', lambda m: hold(f'<a href="{safe_url(m.group(2))}" target="_blank" rel="noopener noreferrer">{m.group(1)}</a>'), text)
        text = re.sub(r'\*\*(.+?)\*\*|__(.+?)__', lambda m: f'<strong>{m.group(1) or m.group(2)}</strong>', text)
        text = re.sub(r'(?<!\*)\*([^*\n]+)\*(?!\*)|(?<!_)_([^_\n]+)_(?!_)', lambda m: f'<em>{m.group(1) or m.group(2)}</em>', text)
        return re.sub(r'\x00(\d+)\x00', lambda m: protected[int(m.group(1))], text)

    lines, out, paragraph, index, heading_index = md.replace('\r\n', '\n').split('\n'), [], [], 0, 0
    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            out.append(f'<p>{"<br>".join(inline(line) for line in paragraph)}</p>')
            paragraph = []

    while index < len(lines):
        line = lines[index]
        if not line.strip():
            flush_paragraph(); index += 1; continue
        if line.startswith('```'):
            flush_paragraph()
            language = re.sub(r'[^\w-]', '', line[3:].strip())
            index += 1; code = []
            while index < len(lines) and not lines[index].startswith('```'):
                code.append(lines[index]); index += 1
            class_name = f' class="language-{language}"' if language else ''
            out.append(f'<pre><code{class_name}>{html.escape("\\n".join(code))}</code></pre>')
            index += 1; continue
        directive = re.match(r'^:::(example|details|key|pitfall)\s*(.*)$', line)
        if directive:
            flush_paragraph()
            kind, title = directive.groups()
            index += 1; nested = []
            while index < len(lines) and lines[index].strip() != ':::':
                nested.append(lines[index]); index += 1
            # 未闭合时保留原文，避免一次手误吞掉后续正文。
            if index >= len(lines):
                paragraph.append(line)
                paragraph.extend(nested)
                break
            index += 1
            defaults = {
                'example': '展开例子',
                'details': '展开补充',
                'key': '重点',
                'pitfall': '易错点',
            }
            label = title or defaults[kind]
            nested_md = chr(10).join(nested)
            open_attr = ' open' if kind in ('key', 'pitfall') else ''
            out.append(f'<details class="learning-details {kind}"{open_attr}><summary>{inline(label)}</summary>{md_to_html(nested_md)}</details>')
            continue
        heading = re.match(r'^(#{1,3})\s+(.+)$', line)
        if heading:
            flush_paragraph(); level = len(heading.group(1)); heading_index += 1
            out.append(f'<h{level} id="heading-{heading_index}">{inline(heading.group(2))}</h{level}>')
            index += 1; continue
        if re.match(r'^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$', line):
            flush_paragraph(); out.append('<hr>'); index += 1; continue
        if line.startswith('> '):
            flush_paragraph(); quotes = []
            while index < len(lines) and lines[index].startswith('> '):
                quotes.append(lines[index][2:]); index += 1
            out.append(f'<blockquote>{"<br>".join(inline(q) for q in quotes)}</blockquote>'); continue
        table_separator = index + 1 < len(lines) and '|' in line and re.match(r'^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$', lines[index + 1])
        if table_separator:
            flush_paragraph()
            cells = lambda value: [cell.strip() for cell in value.strip().strip('|').split('|')]
            headers = cells(line); index += 2; rows = []
            while index < len(lines) and '|' in lines[index] and lines[index].strip():
                rows.append(cells(lines[index])); index += 1
            head = ''.join(f'<th>{inline(cell)}</th>' for cell in headers)
            body = ''.join('<tr>' + ''.join(f'<td>{inline(cell)}</td>' for cell in row) + '</tr>' for row in rows)
            out.append(f'<div class="table-wrap"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'); continue
        list_match = re.match(r'^\s*([-*+])\s+(.+)$', line)
        ordered_match = re.match(r'^\s*\d+[.)]\s+(.+)$', line)
        if list_match or ordered_match:
            flush_paragraph(); ordered = bool(ordered_match); items = []
            while index < len(lines):
                match = re.match(r'^\s*\d+[.)]\s+(.+)$', lines[index]) if ordered else re.match(r'^\s*[-*+]\s+(.+)$', lines[index])
                if not match: break
                items.append(f'<li>{inline(match.group(1))}</li>'); index += 1
            tag = 'ol' if ordered else 'ul'; out.append(f'<{tag}>{"".join(items)}</{tag}>'); continue
        paragraph.append(line)
        index += 1
    flush_paragraph()
    return '\n'.join(out)

def build_toc(md):
    """从正文标题构建目录；围栏代码块内的 # 不应成为目录项。"""
    items, in_code, in_directive, heading_index = [], False, False, 0
    for line in md.replace('\r\n', '\n').split('\n'):
        if line.startswith('```'):
            in_code = not in_code
            continue
        if in_code:
            continue
        if re.match(r'^:::(example|details|key|pitfall)\s*', line):
            in_directive = True
            continue
        if in_directive:
            if line.strip() == ':::':
                in_directive = False
            continue
        heading = re.match(r'^(#{1,3})\s+(.+?)\s*$', line)
        if not heading:
            continue
        heading_index += 1
        level = len(heading.group(1))
        title = re.sub(r'[`*_]+', '', heading.group(2)).strip()
        items.append(f'<li class="toc-level-{level}"><a href="#heading-{heading_index}">{html.escape(title)}</a></li>')
    return '<ol>' + ''.join(items) + '</ol>' if items else '<p class="toc-empty">本篇暂无目录</p>'

def main():
    if not os.path.isdir(POSTS_DIR):
        print('posts 目录不存在'); sys.exit(1)
    os.makedirs(OUT_ASSETS, exist_ok=True)
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
            info = (f'分类：{data.get("category","")} · 发布于 {pub}'
                    + (f' · 更新于 {upd}' if upd and upd != pub else ''))
            html = template
            html = re.sub(r'<title>[^<]*</title>', f'<title>{data.get("title",slug)} · 算栗工坊</title>', html, count=1)
            html = re.sub(r'<h1>[^<]*</h1>', f'<h1>{data.get("title",slug)}</h1>', html, count=1)
            html = re.sub(r'<div class="article-info">[\s\S]*?</div>', f'<div class="article-info">{info}</div>', html, count=1)
            article_body = f'<div class="article-body">{md_to_html(body)}</div>'
            # 使用函数替换，避免 Markdown 代码块中的反斜杠被 re.sub 当作转义序列。
            html = re.sub(r'<div class="article-body">[\s\S]*?</div>', lambda _: article_body, html, count=1)
            html = html.replace('__TOC__', build_toc(body))
            with open(os.path.join(OUT_DIR, f'post-{slug}.html'), 'w', encoding='utf-8') as w:
                w.write(html)

    index.sort(key=lambda x: x.get('updated') or x.get('published'), reverse=True)
    with open(OUT_JSON, 'w', encoding='utf-8') as w:
        json.dump(index, w, ensure_ascii=False, indent=2)

    def sort_order(item):
        try:
            return int(item.get('order', 999))
        except (TypeError, ValueError):
            return 999

    topics = []
    for f in sorted(glob.glob(os.path.join(TOPICS_DIR, '*.md'))):
        data, _ = parse_frontmatter(open(f, encoding='utf-8').read())
        slug = data.get('slug') or os.path.splitext(os.path.basename(f))[0]
        topics.append({
            'title': data.get('title', slug),
            'slug': slug,
            'icon': data.get('icon', '🗂️'),
            'description': data.get('description', ''),
            'order': sort_order(data),
        })
    topics.sort(key=sort_order)
    with open(OUT_TOPICS_JSON, 'w', encoding='utf-8') as w:
        json.dump(topics, w, ensure_ascii=False, indent=2)

    maps = []
    for f in sorted(glob.glob(os.path.join(MAPS_DIR, '*.md'))):
        data, _ = parse_frontmatter(open(f, encoding='utf-8').read())
        slug = data.get('slug') or os.path.splitext(os.path.basename(f))[0]
        nodes = [node for node in data.get('nodes', []) if isinstance(node, dict)]
        maps.append({
            'title': data.get('title', slug),
            'slug': slug,
            'icon': data.get('icon', '🧠'),
            'status': data.get('status', 'IN PROGRESS'),
            'description': data.get('description', ''),
            'order': sort_order(data),
            'featured': str(data.get('featured', '')).lower() == 'true',
            'nodes': nodes,
        })
    maps.sort(key=sort_order)
    with open(OUT_MAPS_JSON, 'w', encoding='utf-8') as w:
        json.dump(maps, w, ensure_ascii=False, indent=2)

    print(f'[build] OK: {len(index)} posts, {len(topics)} topics, {len(maps)} maps')

if __name__ == '__main__':
    main()
