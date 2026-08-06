---
title: "从零搭建MkDocs博客"
slug: build-mkdocs-blog
category: "工具教程"
tags:
  - "打造个人品牌"
  - "MkDocs"
  - "博客搭建"
summary: "从零部署 MkDocs 博客的完整记录与常用命令。"
published: 2026-06-05
updated: 2026-06-05
---
之前用过 Hexo + Fluid 主题写博客，也试过 VitePress，但总感觉不太满意。Hexo 的 Node.js 生态太重，VitePress 更适合写文档而不是博客。最终选择了 **MkDocs + Material for MkDocs**，搭建过程记录如下。

## 为什么选 MkDocs Material

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| Hexo + Fluid | 中文社区成熟，主题好看 | Node.js 依赖重，构建慢 |
| VitePress | Vue 生态，构建快 | 文档风格，不适合博客 |
| **MkDocs Material** | Python 生态，博客功能开箱即用，暗色模式 | 需要 Python 环境 |

## 环境准备

### 安装 uv

`uv` 是 Rust 写的 Python 包管理器，速度极快。

Windows（PowerShell）：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Linux / macOS：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

验证安装：

```bash
uv --version
```

### 初始化项目

```bash
mkdir my-blog
cd my-blog
uv init --python 3.12
uv add mkdocs-material mkdocs-literate-nav mkdocs-git-revision-date-localized-plugin
```

- `mkdocs-material` 会自动安装 `mkdocs` 本体和所有依赖
- `mkdocs-literate-nav` 支持用 glob 语法自动生成导航
- `mkdocs-git-revision-date-localized-plugin` 自动从 git 提取文章的创建和更新日期

## 项目结构

```text
my-blog/
├── mkdocs.yml
├── docs/
│   ├── index.md                        # 首页
│   ├── assets/
│   │   ├── images/
│   │   │   └── chestnut.png            # Logo 和 Favicon
│   │   └── stylesheets/
│   │       └── extra.css               # 自定义样式
│   ├── overrides/                      # 主题覆盖
│   │   └── partials/
│   │       ├── header.html             # 导航栏社媒链接
│   │       └── source-file.html        # 日期显示覆盖
│   ├── Python教程/
│   │   ├── index.md                    # 分类首页（只写简介）
│   │   ├── 从conda转uv快速上手.md      # 文章（文件名=标题）
│   │   └── 数据分析/
│   │       ├── index.md
│   │       └── Pandas快速入门.md
│   ├── Agent开发/
│   │   ├── index.md
│   │   └── ...
│   └── 工具教程/
│       ├── index.md
│       └── ...
```

关键设计：

- **全中文命名**：文件夹名和文件名就是导航标题，不需要写 `#` 标题或 `title` 字段
- **自动导航**：`mkdocs.yml` 里用 `**` glob 自动扫描所有文件，不需要维护 SUMMARY.md
- **overrides/**：覆盖 Material 主题模板，用于自定义导航栏和日期显示
- **index.md**：每个分类目录的首页，只写简介，配合 `navigation.indexes` 作为分类落地页

## 写作规范

### 新增文章

只需要两步：

1. 在对应分类文件夹里放一个中文命名的 `.md` 文件
2. 写 frontmatter 和正文

```yaml
---
date: 2026-05-22
---
```

- 不需要写 `# 标题`，文件名就是标题
- 不需要写 `tags`，分类由目录结构决定
- `date` 是文章创建日期，用于底部日期显示
- 正文从 `##` 二级标题开始写

### 新增分类

新建一个中文命名的文件夹，里面放一个 `index.md`：

```markdown
分类简介写在这里，不需要 frontmatter。
```

不需要 `title` 字段，文件夹名就是分类名。

### 文章摘要

在正文中插入 `<!-- more -->`，它之前的内容会作为摘要显示。

## 配置文件

所有设置都在 `mkdocs.yml` 中。

### 完整配置

```yaml
site_name: 算栗工坊
site_description: 大模型是工作，算栗是生活。
site_url: https://suanlilog.com
repo_url: https://github.com/suanlilog
repo_name: suanlilog

theme:
  name: material
  custom_dir: docs/overrides
  language: zh
  logo: assets/images/chestnut.png
  favicon: assets/images/chestnut.png
  icon:
    repo: fontawesome/brands/github
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-7
        name: 切换到暗色模式
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: 切换到亮色模式
  font:
    text: Noto Sans SC
    code: Fira Code
  features:
    - navigation.tabs
    - navigation.tabs.sticky
    - navigation.indexes
    - navigation.top
    - navigation.instant
    - navigation.instant.progress
    - navigation.footer
    - navigation.tracking
    - search.suggest
    - search.highlight
    - search.share
    - content.code.copy
    - content.code.annotate
    - content.tabs.link
    - content.tooltips
    - toc.follow

nav:
  - index.md
  - "**"

extra_css:
  - assets/stylesheets/extra.css

plugins:
  - search
  - literate-nav
  - git-revision-date-localized:
      type: date
      enable_creation_date: true
      exclude:
        - index.md

markdown_extensions:
  - admonition
  - attr_list
  - def_list
  - footnotes
  - tables
  - toc:
      permalink: true
  - pymdownx.details
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - pymdownx.superfences
  - pymdownx.tabbed:
      alternate_style: true
  - pymdownx.tasklist:
      custom_checkbox: true
```

### 关键配置说明

| 配置项 | 作用 |
| --- | --- |
| `nav: - index.md - "**"` | 自动扫描所有文件生成导航，不需要 SUMMARY.md |
| `navigation.indexes` | 目录的 `index.md` 作为分类落地页 |
| `navigation.tabs` | 顶部显示分类标签页 |
| `navigation.instant` | 页面间切换无刷新 |
| `content.code.copy` | 代码块右上角复制按钮 |
| `git-revision-date-localized` | 自动从 git 提取创建/更新日期 |
| `literate-nav` | 支持 `**` glob 自动导航 |

## 主题覆盖

### 导航栏社媒链接

在 `docs/overrides/partials/header.html` 中覆盖主题的 header 模板，在搜索图标和仓库链接之间注入社媒图标。

图标使用 Simple Icons 的 SVG（24x24 viewBox）：

```html
<div class="md-header__social">
  <a class="md-icon" href="https://github.com/..." target="_blank" rel="noopener" title="GitHub">
    <svg viewBox="0 0 496 512">...</svg>
  </a>
  <a class="md-icon" href="https://www.zhihu.com/..." target="_blank" rel="noopener" title="知乎">
    <svg viewBox="0 0 24 24">...</svg>
  </a>
  <a class="md-icon" href="https://xhslink.com/..." target="_blank" rel="noopener" title="小红书">
    <svg viewBox="0 0 24 24">...</svg>
  </a>
</div>
```

样式写在 `docs/assets/stylesheets/extra.css` 中：

```css
.md-header__social {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  margin-left: 0.2rem;
}
.md-header__social a.md-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--md-default-fg-color--light);
  transition: color 0.2s ease;
  opacity: 0.7;
}
.md-header__social a.md-icon:hover {
  color: var(--md-primary-fg-color);
  opacity: 1;
}
.md-header__social a.md-icon svg {
  width: 1rem;
  height: 1rem;
  fill: currentColor;
}
```

SVG 图标来源：

| 平台 | 来源 |
| --- | --- |
| GitHub | Font Awesome Free |
| 知乎、小红书等 | [Simple Icons](https://simpleicons.org/) |

### 日期显示覆盖

在 `docs/overrides/partials/source-file.html` 中覆盖主题的日期模板，实现：

- 创建日期优先使用 frontmatter 的 `date` 字段，没有则用 git 首次提交日期
- 更新日期使用 git 最后提交日期
- 创建日期在前，更新日期在后（默认是反过来的）

```html
{% if page.meta %}
  {% if page.meta.date %}
    {% set created = page.meta.date %}
  {% elif page.meta.git_creation_date_localized %}
    {% set created = page.meta.git_creation_date_localized %}
  {% endif %}
  {% if page.meta.git_revision_date_localized %}
    {% set updated = page.meta.git_revision_date_localized %}
  {% endif %}
{% endif %}
```

## 常用命令

```bash
# 本地预览（自动刷新）
uv run mkdocs serve

# 构建静态文件（输出到 site/ 目录）
uv run mkdocs build

# 部署到 GitHub Pages
uv run mkdocs gh-deploy
```

## 部署到 GitHub Pages

1. 在 GitHub 创建仓库（比如 `username.github.io`）
2. 在仓库 Settings -> Pages，Source 选择 `gh-pages` 分支
3. 本地执行：

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/username/username.github.io.git
git push -u origin main
uv run mkdocs gh-deploy
```

`gh-deploy` 会自动构建并推送到 `gh-pages` 分支，几分钟后就能访问了。

## 写作排版技巧

### 告示框

```markdown
!!! note "注意事项"
    这是一个注意提示框。

!!! warning "警告"
    这是一个警告提示框。

??? tip "点击展开"
    折叠内容...
```

### 代码块

````markdown
```python title="hello.py" hl_lines="2"
def hello():
    name = "算栗工坊"
    print(f"Hello, {name}!")
```
````

### 标签页

```markdown
=== "Python"

    ```python
    print("Hello")
    ```

=== "JavaScript"

    ```javascript
    console.log("Hello");
    ```
```

### 表格

```markdown
| 功能     | 说明           |
| -------- | -------------- |
| 暗色模式 | 右上角切换     |
| 代码复制 | 代码块右上角按钮 |
```

## 踩坑记录

### VitePress 中文文件名问题

之前用 VitePress 时踩的坑：VitePress 对中文文件名支持有问题，构建时会报 `Cannot read properties of undefined (reading 'imports')`。MkDocs 没有这个问题，中文文件名随便用。

### Material 图标语法不渲染

Material for MkDocs 的图标语法（如 `:material-clock-fast:`）需要配置 `pymdownx.emoji` 扩展才能渲染。如果不想折腾，直接用纯文字或 emoji 就好。

### Blog 插件不适合分类博客

最初尝试用 MkDocs Material 的 blog 插件，但发现它会自动排除 `blog/` 目录下非 `posts/` 的 markdown 文件，导致分类页面无法正常工作。

最终方案：**放弃 blog 插件，改用目录组织**。文章按分类放入对应中文目录，每个目录一个 `index.md` 作为分类首页，配合 `navigation.indexes` 特性实现分类导航。结构更简单，也不需要折腾插件。

### 首页模板报错

不要在 frontmatter 里写 `template: home.html`，Material for MkDocs 没有这个模板。

## 总结

MkDocs Material 搭建博客非常省心。全中文文件名 = 导航标题，不用写 `#` 标题和 `title` 字段；`**` glob 自动导航，不用维护 SUMMARY.md；git 插件自动提取日期，不用手动管理。相比 Hexo 少了很多折腾，相比 VitePress 更适合写博客。
