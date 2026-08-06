# 算栗工坊 · 静态站 + Decap CMS 后台

仿 lvy-neko 视觉、棕黄主题（取自 suanlilog-rspress-blog）的个人 wiki。
支持：围绕头像的漂浮卡片、音乐/时钟/随手记、最新文章时间排序、文章专题分类、[新文章]/[有更新]标签、**网页端写作发布（Decap CMS）**。

---

## 一、本地预览（不依赖 Node）

```bash
cd lvy-neko-clone
python scripts/build.py        # 生成文章页和索引（首次或改了文章后跑）
python -m http.server 8765     # 起本地服务
```
浏览器开 http://localhost:8765 （必须 http，不能用 file://）。

> 没装 Python 也行，任意静态服务器皆可。文章靠 fetch 读 json，必须 http 访问。

---

## 二、上线 + 接 Decap CMS（网页端写作）

⚠️ 这部分涉及 GitHub/Netlify 账号登录，需你本人操作。以下手把手。

### 步骤 1：推到 GitHub

```bash
cd lvy-neko-clone
git init
git add .
git commit -m "init: 算栗工坊静态站 + Decap CMS"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```
（仓库先在 GitHub 网页 New repository 建一个，不要勾 README，建成空仓库。）

### 步骤 2：连 Netlify（自动发布）

1. 注册/登录 https://app.netlify.com
2. 「Add new site」→「Import an existing project」→ 选 GitHub → 选刚才的仓库
3. 构建配置（netlify.toml 已写好，一般会自动识别）：
   - Build command: `python scripts/build.py`
   - Publish directory: `.`
   - 若提示需要 Python，在 Netlify 站点设置里设环境变量 `PYTHON_VERSION=3.12`
4. Deploy。完成后拿到一个 `xxx.netlify.app` 域名，打开能看到站点。

### 步骤 3：建 GitHub OAuth App

1. 打开 https://github.com/settings/developers → **New OAuth App**
2. 填：
   - Application name：`suanli-cms`（随意）
   - Homepage URL：`https://你的Netlify域名`（如 `https://suanligongfang.netlify.app`）
   - Authorization callback URL：`https://你的OAuth代理域名/callback`
     （代理域名下一步部署，先填或建完补，见步骤4）
3. 建完拿到 **Client ID**；在该页点 **Generate a new client secret** 拿到 **Client Secret**

### 步骤 4：部署 OAuth 代理（Cloudflare Worker，免费）

Netlify 新版 Identity 不可用，改用自建 OAuth 代理。代码在 `scripts/oauth-worker.js`。

1. 注册/登录 https://dash.cloudflare.com → Workers & Pages → Create Worker
2. 把 `scripts/oauth-worker.js` 内容粘进编辑器。不要在代码里填写凭据。
3. Worker → Settings → Variables and Secrets 中设置：
   - `GITHUB_CLIENT_ID`：步骤3的 Client ID（普通变量即可）
   - `GITHUB_CLIENT_SECRET`：步骤3的 Client Secret（选择 **Secret**）
   - `SITE_URL`：`https://你的站点域名`（普通变量即可）
4. Deploy。得到代理域名，如 `https://suanli-oauth.你的子域.workers.dev`
5. 回到 GitHub OAuth App（步骤3），把 Authorization callback URL 改成
   `https://你的代理域名/callback`
6. 回到 `admin/config.yml`，把 `base_url` 改成你的代理域名（不带尾斜杠）

### 步骤 5：登录后台写作

1. 打开 `https://你的Netlify域名/admin/`
2. 点登录 → 跳 GitHub 授权 → 回调拿 token
3. 「文章」→「新增文章」→ 填标题/分类/标签/摘要/发布日期/正文 → 「发布」
4. CMS 自动推 md 到 GitHub → Netlify 检测到 push 自动跑 build.py → 发布上线
5. 首页自动出现新文章，带「新文章」标签 ✅

> 构建链路：CMS 推 md → Netlify 构建。登录走 GitHub OAuth（Worker 代理）。

### 「有更新」标签怎么触发
在后台编辑已有文章时，把「更新日期」改晚于「发布日期」→ 首页该文章显示橙色「有更新」。
两日期相同 → 显示红色「新文章」。

---

## 三、目录结构

```
lvy-neko-clone/
├── index.html              首页（漂浮卡片 + 文章列表 + 专题）
├── admin/
│   ├── index.html          Decap CMS 后台入口
│   └── config.yml          CMS 配置（字段/登录/集合）
├── posts/                  ★ 你写的文章（Markdown + frontmatter）
├── scripts/
│   ├── build.py            构建脚本：md → posts.json + 文章页
│   └── template.html       文章页模板
├── assets/                 样式/脚本/头像/光标/上传图
├── .gitignore              忽略构建产物
└── netlify.toml            Netlify 部署配置（构建+发布）
```

## 四、文章 frontmatter 模板

```markdown
---
title: 文章标题
slug: english-slug           # URL 标识，英文短横线
category: 工具教程            # Agent / Python教程 / 工具教程 / 生活
tags:
  - 标签1
  - 标签2
summary: 一句话摘要
published: 2026-07-30
updated: 2026-07-30          # 改动时更新；与 published 不同则显「有更新」
---

正文（Markdown）……
```

## 五、注意事项

- `post-*.html` 和 `assets/posts.json` 是构建产物，已在 `.gitignore` 忽略，**不要手动改**，改文章改 `posts/*.md` 即可。
- Decap CMS 的 `local_backend` 本地调试：先 `npx decap-server`，再 config.yml 设 `local_backend: true`，开 `localhost:8765/admin`。（需 Node，可选）
- 音乐播放器音频源在 `assets/home.js` 的 `AUDIO_SRC`，换自己乐曲改这里。
- 随手记内容存浏览器 localStorage，换设备/浏览器不保留。
