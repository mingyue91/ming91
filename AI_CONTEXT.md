# AI Context — min9's Blog

> 给 AI 助手（和未来的自己）看的项目速查。最后更新：2026-11-22。

## 项目概况

- **Hugo v0.161.0（extended）** 静态博客，主题 [hugo-theme-stack](https://github.com/CaiJimmy/hugo-theme-stack) **v4.0.2**（Git submodule，位于 `themes/stack`）
- 线上地址：https://mingyue91.github.io/ming91/
- 仓库：`git@github.com:mingyue91/ming91.git`（本地 remote 目前是带 token 的 HTTPS 形式），默认分支 `main`
- 部署：push 到 `main` → GitHub Actions 构建 → GitHub Pages
- 作者：min9 (mingyue91)｜语言：zh-cn｜每页 10 篇

## 目录速览

```
.
├── hugo.toml                  # 站点配置：菜单、侧边栏、组件、分类法、高亮、图片处理
├── content/
│   ├── posts/                 # 23 篇文章
│   ├── docker/                # Docker 学习路径：_index.md + _content.gotmpl（自动生成课程页）
│   └── page/                  # 独立页：search（html+json）/ archives（按年归档）/ about
├── data/
│   └── docker/curriculum.yaml # 课程/测验/等级/徽章的唯一数据源
├── i18n/zh.toml               # 覆盖主题中文词条（新增 widget.series.title）
├── layouts/                   # 覆盖主题的模板（首页 / 404 / 卡片 / 侧边栏 / PDF 按钮 / 课程页）
│   ├── docker/                # section.html（课程首页）、page.html（关卡页）
│   ├── _markup/               # render-codeblock（代码块增强）
│   └── _partials/docker/      # course-data（注入课程 JSON）
├── assets/
│   ├── scss/custom.scss       # 1300+ 行定制样式（并 import docker-course.scss）
│   ├── scss/docker-course.scss
│   ├── ts/custom.ts           # 站点脚本入口（代码块 + 课程）
│   ├── ts/docker-course.ts    # 游戏化逻辑（XP/徽章/连击/测验）
│   ├── ts/gallery.ts          # 覆盖主题 gallery，兼容 <picture>
│   ├── icons/copy.svg
│   └── jsconfig.json          # TS 路径别名指向主题 assets
├── static/
│   ├── avatar.jpg             # 400px 压缩版，侧边栏头像
│   ├── favicon.ico            # 16/32/48 多尺寸
│   ├── apple-touch-icon.png   # 180px
│   ├── og-default.jpg         # 1200×630 默认分享卡片
│   └── js/                    # home-filter / code-copy
├── themes/stack/              # 主题子模块（勿手改，升级用 git submodule update）
├── .github/workflows/deploy.yml
└── public/                    # 构建产物（gitignore）
```

## 内容结构（23 篇，2026-05-17 ~ 2026-07-27）

| 文件 | 日期 | 分类 | 标题 |
|---|---|---|---|
| `aws-alb-intro.md` | 2026-07-27 | 云计算 | AWS ALB 入门：应用负载均衡器核心架构指南 |
| `python-list-comprehension.md` | 2026-07-03 | 编程与工具 | Python 列表推导式详解 |
| `dockerfile-basics.md` | 2026-06-10 | 容器技术 | Dockerfile 基础概念、用法与扩展 |
| `docker-run-parameters.md` | 2026-06-08 | 容器技术 | Docker run 启动参数详解 |
| `dockerfile-reference.md` | 2026-05-27 | 容器技术 | Dockerfile 指令详解 |
| `docker-container-commands.md` | 2026-05-27 | 容器技术 | Docker 容器管理命令详解 |
| `docker-image-commands.md` | 2026-05-27 | 容器技术 | Docker 镜像管理命令详解 |
| `docker-storage-network.md` | 2026-05-27 | 容器技术 | Docker 存储与网络命令详解 |
| `docker-compose-commands.md` | 2026-05-27 | 容器技术 | Docker Compose 命令详解 |
| `docker-advanced-usage.md` | 2026-05-26 | 容器技术 | Docker 高级用法：入门之后该学什么 |
| `docker-volume-bind-mount.md` | 2026-05-26 | 容器技术 | Docker 数据持久化：Volume 与 Bind Mount 实战 |
| `docker-add-user-to-group.md` | 2026-05-25 | 容器技术 | 如何将当前用户添加到 Docker 组？ |
| `docker-mysql-deploy.md` | 2026-05-25 | 容器技术 | Docker 部署 MySQL 完整指南 |
| `opencode-github-push.md` | 2026-05-25 | 编程与工具 | 如何使用 OpenCode 连接 GitHub 仓库并完成推送 |
| `aws-2026-updates.md` | 2026-05-22 | 云计算 | AWS 2026 年度更新汇总（截至 5 月） |
| `aws-database-rds-dynamodb.md` | 2026-05-22 | 云计算 | AWS 数据库服务详解：RDS 与 DynamoDB |
| `aws-s3-intro.md` | 2026-05-22 | 云计算 | Amazon S3 入门：对象存储基础 |
| `aws-storage-overview.md` | 2026-05-22 | 云计算 | AWS 存储服务全景（**置顶** `pinned: true`） |
| `docker-intro.md` | 2026-05-19 | 容器技术 | Docker 入门：从零理解容器化技术 |
| `aws-iam-intro.md` | 2026-05-18 | 云计算 | AWS IAM 入门：身份与访问管理基础 |
| `aws-iam-policy.md` | 2026-05-18 | 云计算 | AWS IAM 策略完全指南 |
| `aws-s3-policy-examples.md` | 2026-05-18 | 云计算 | Amazon S3 策略示例：从入门到进阶 |
| `cloud-intro.md` | 2026-05-17 | 云计算 | 云计算入门 |

统计：`云计算` 9 篇 ｜ `容器技术` 12 篇 ｜ `编程与工具` 2 篇

两个系列（`series` 分类法 + `series_weight` 排序）：
- `Docker从入门到实战` 12 篇：入门 → 用户组权限 → Dockerfile 基础 → 指令详解 → 镜像 → 容器 → run 参数 → 存储网络 → 数据持久化 → Compose → MySQL 实战 → 进阶
- `AWS从入门到实战` 9 篇：云计算入门 → 存储全景 → S3 → S3 策略 → IAM → IAM 策略 → 数据库 → ALB → 年度更新

## Front Matter 规范

```yaml
---
title: "文章标题"
description: "摘要（会显示在卡片副标题上）"
date: 2026-07-27T00:00:00+08:00
slug: kebab-case-name
categories: ["容器技术"]         # 单分类，取第一个作为卡片分类
tags: ["dockerfile", "镜像"]
series: ["Docker从入门到实战"]   # 可选；系列名不写空格，避免 URL 编码
series_weight: 3                 # 可选；系列内阅读顺序，从 1 开始
pinned: true                     # 可选，置顶到列表最前
draft: false
---
```

## 分类与标签

| 分类 | 导语（写在分类 `_index.md` 的 `description`） |
|---|---|
| 云计算 | AWS 入门与常用服务：IAM、S3、RDS / DynamoDB、ALB、存储选型 |
| 容器技术 | Docker 从入门到实战：Dockerfile、镜像与容器命令、存储与网络、Compose |
| 编程与工具 | Python 等语言笔记，以及 OpenCode 这类效率工具 |

标签约定：**不使用 `入门` / `进阶` / `docker` / `aws` / `工具` 这类噪音标签**（几乎每篇都打 = 没有检索价值）；同义词统一（`mysql` 不写 `MySQL`，`security` 并入 `安全`）；`容器` 只保留在讲容器本身的那两篇。

## 自定义功能（相对原主题的改动）

| 功能 | 相关文件 |
|---|---|
| **首页搜索框 + 分类 Tab**（分类由 `.Site.Taxonomies.categories` 自动生成） | `layouts/home.html`、`static/js/home-filter.js`、`assets/scss/custom.scss` |
| 客户端筛选：分类 + 标题/摘要/标签关键词实时过滤，置顶优先，筛选时隐藏分页 | `static/js/home-filter.js` |
| **独立搜索页**（Hugo 输出 `search/index.json`，前端 `search.tsx` 检索） | `content/page/search/index.md`（`outputs: html + json`）、`layouts/page/search.html` |
| **萌系 404** + 搜索框回退 | `layouts/404.html` |
| 侧边栏覆盖（头像/菜单/主题切换/语言切换） | `layouts/_partials/sidebar/left.html` |
| 文章卡片覆盖（更新徽章、分类色块、标签） | `layouts/_partials/article/components/details.html` |
| 文章页覆盖（桌面端 TOC 侧栏） | `layouts/_partials/article/article.html` |
| 文章底部**「打印 / 导出 PDF」**按钮：直接 `window.print()`，由 `@media print` 样式排版（矢量文字、可选中；2026-10-24 起不再依赖 html2pdf） | `layouts/_partials/article/components/footer.html`、`assets/scss/custom.scss` |
| **代码块复制按钮**（SVG 图标 + Toast 提示） | `static/js/code-copy.js`、`assets/icons/copy.svg`、`assets/scss/custom.scss` |
| 全局脚本注入 | `layouts/_partials/head/custom.html` |
| 图标与默认社交卡片：favicon(16/32/48)、apple-touch-icon(180)、og:image(1200×630) | `layouts/_partials/head/custom.html`、`static/favicon.ico`、`static/apple-touch-icon.png`、`static/og-default.jpg` |
| RSS 只输出摘要；tag/category 不再各自生成 RSS | `layouts/rss.xml`、`hugo.toml`（`[services.rss] limit = 10`、`[outputs] term = ["HTML"]`） |
| 文章页 JSON-LD `BlogPosting`（标题/描述/时间/作者/封面/标签） | `layouts/_partials/head/custom.html` |
| `robots.txt`（放行全部并指向 sitemap） | `layouts/robots.txt`、`hugo.toml`（`enableRobotsTXT = true`） |
| 首页底部外链（AWS 控制台 / Qwen / gal.saop.cc） | `layouts/home.html` |
| 独立页：归档（主题 `archives` 布局，按年份分组）/ 关于 | `content/page/archives/index.md`、`content/page/about/index.md` |
| **文章系列**：文章页顶部显示「系列 · 第 N / M 篇 · 上一篇 / 下一篇」，系列落地页 `/series/<名称>/` | `layouts/_partials/article/components/series.html`、`layouts/_partials/article/article.html`、`content/series/*/_index.md`、`assets/scss/custom.scss` |
| **毛玻璃视觉**：`body` 三团柔光渐变（fixed）+ 中间板块 `backdrop-filter`；浅色/暗色两套 `--glass-*` 变量，移动端降低模糊半径，打印时强制白底 | `assets/scss/custom.scss` |
| **点状分页**：底部页码改为居中小圆点（当前页为长条），去掉数字页码与跳转弹窗；页数 >5 时中间只留当前页附近 3 个并显示省略条 | `layouts/_partials/pagination.html`、`assets/scss/custom.scss` |
| **代码块增强**：语言标签、>6 行自动行号（Chroma 表格）、复制按钮、>30 行折叠；`noClasses = false` 让浅色模式用浅色代码配色 | `layouts/_markup/render-codeblock.html`、`assets/ts/custom.ts`、`assets/scss/custom.scss`、`hugo.toml` |
| **系列聚合页 + 侧边栏 Widget**：`/series/` 系列卡片；首页侧边栏按文章数显示系列 | `layouts/series/taxonomy.html`、`layouts/_partials/widget/series.html`、`i18n/zh.toml` |
| **图片优化**：AVIF → WebP → JPG 的 `<picture>` srcset；LQIP blur-up 占位（CSS 变量 `--lqip`）；GIF 跳过转码 | `layouts/_partials/helper/responsive-image.html`、`layouts/_partials/helper/image-placeholder.html`、`layouts/_partials/article/components/header.html`、`assets/ts/gallery.ts`、`hugo.toml`（`[imaging]`） |
| **Docker 学习路径**：12 关游戏化课程，见下节 | `data/docker/curriculum.yaml`、`content/docker/*`、`layouts/docker/*`、`assets/ts/docker-course.ts`、`assets/scss/docker-course.scss` |
| 定制样式（搜索框、分类胶囊、卡片 hover、PDF 按钮、打印样式、系列卡片、移动端适配） | `assets/scss/custom.scss`（1300+ 行） |

主菜单（`hugo.toml`）：首页 `/`、Docker 学习 `/docker/`、归档 `/archives/`、关于 `/about/`，均带图标。
分类页的导语取自分类 `_index.md` 的 `description` 字段（主题 `list.html` 不渲染 `.Content`）。

`hugo.toml` 中的关键参数：`paginate = 10`、侧边栏头像 `/avatar.jpg`、副标题「二次元 & 技术」、首页组件 `categories` + `series` + `tag-cloud`、文章页组件 `toc`、配色 `scheme = "auto"`；`[markup.highlight] noClasses = false`；`[imaging]` 配置 AVIF/WebP/JPEG 质量。

## Docker 学习路径（游戏化课程）

- **入口**：`/docker/`（主菜单 + 首页顶部横幅）。课程页是「导读 + 自测 + 正文链接」，正文仍留在 `/posts/<slug>/`，两套 URL 互不冲突。
- **唯一数据源**：`data/docker/curriculum.yaml`（章节、关卡、XP、难度、目标、测验、等级、徽章）。改结构只改这个文件。
- **自动建页**：`content/docker/_content.gotmpl` 是 Hugo Content Adapter，按 YAML 生成 `/docker/<lesson-id>/` 页面并计算上一关/下一关；不要手建这些 `*.md`。
- **模板**：`layouts/docker/section.html`（课程首页）、`layouts/docker/page.html`（关卡页）；`_partials/docker/course-data.html` 把课程 JSON 注入页面（`hugo.Data`）。
- **游戏化规则**（`assets/ts/docker-course.ts`）：
  - 通关 +50 XP；自测全对额外 +20 XP（历史最佳不倒退）
  - 等级：0 新手上路 / 120 容器学徒 / 300 镜像工匠 / 500 编排达人 / 700 云原生船长
  - 徽章：初次启航、地基完成、命令达人、编排大师、满分学者、三日不辍、全通关
  - 进度存 `localStorage`（键 `docker-course-v1`），首页可「重置进度」
- **新增一关**：在 YAML 对应章节的 `lessons` 里加 `id / title / post / xp / minutes / level / difficulty / summary / objectives / quiz`，构建即生效；`level` 取值 `starter|core|pro`（对应 chip 样式）。
- **更新正文引用**：`post` 填 `content/posts` 里的 slug（不含 `.md`），页面会链到 `/posts/<post>/`。
- **搜索**：`layouts/page/search.json` 已把 `docker` section 纳入索引，课程页也能被站内搜索到。

## 部署

`.github/workflows/deploy.yml`：push `main`（或手动 dispatch）→ checkout（`submodules: recursive`）→ `peaceiris/actions-hugo@v3`（0.161.0 extended）→ `hugo` → `actions/upload-pages-artifact@v3`（`./public`）→ `actions/deploy-pages@v4`。

## 常用命令

```powershell
hugo server --buildDrafts      # 本地预览（含草稿）
hugo server                    # 本地预览（仅发布）
hugo                           # 生产构建（不要加 --minify，见下）
git add .; git commit -m "msg"; git push
```

## 已知问题 / 注意事项

1. **Hugo 0.161.0 的 `--minify` 有 bug**，构建只用 `hugo`，CI 里也是不带 minify 的。
2. **中文 `.Summary` 陷阱**：Hugo 按空格分词，中文整段算一个"词"，`.Summary` 会退化成全文（修复前 RSS 单条达 26,000 字符）。生成 RSS/摘要一律用 `description` 或 `| truncate`，别直接用 `.Summary`。
3. **凭据（2026-11-17 已整改）**：remote URL 已改为无 token 的 `https://github.com/mingyue91/ming91.git`，git push 认证交给 Git Credential Manager（全局 `credential.helper = manager`）托管；已删除 `.github/config/github_token`，`setup-git.ps1` 不再注入 token（仅设置干净 HTTPS）。旧 token `ghp_7DD4…7GIg` 已于 2026-11-17 在 GitHub 网页吊销（整改前只存在于本地，未进 Git 历史、未进文章）；首次 push 如提示登录按 GCM 浏览器流程重新认证。审计命令：`git remote -v`、`git config --get credential.helper`。
4. `i18n/zh.toml` 只新增/覆盖少量词条（如 `widget.series.title`），其余仍由主题 `themes/stack/i18n/zh.toml` 提供（Hugo 会合并，不用复制整份）。
5. `public/`、`resources/_gen/`、`.hugo_build.lock` 已被 gitignore，不要提交。
6. **不要手建 `content/docker/*.md` 课程页**：它们由 `_content.gotmpl` 生成，手建会与适配器页面冲突（用 `hugo --printPathWarnings` 可查冲突）。
7. **图片处理缓存**：默认缓存在系统临时目录；若在受限环境里报 `mkdir ... Access is denied`，设置 `$env:HUGO_CACHEDIR` 到项目内再构建（CI 不受影响）。

## 已修复（留档）

- **目录权限（2026-10-24）**：`D:\git库\ming91` 曾属于 `Administrators` 且当前用户无「更改权限」，导致 DSH 沙盒报 `grantWrite(...)` 失败。已用管理员 PowerShell 修正：
  ```powershell
  icacls "D:\git库\ming91" /reset
  icacls "D:\git库\ming91" /grant "*S-1-5-21-1705561848-4019212562-1595756290-1001:(OI)(CI)F"
  ```
  坑：写成 `"${env:USERNAME}:(OI)(CI)F"` 要带花括号；写成 `"$env:USERNAME:..."` 时 PowerShell 会把冒号并入变量名，只剩 `(OI)(CI)F` 传给 icacls，报「无效参数」。
- 根目录孤立图片 `2abd9be97317adcd.webp`、Qoder 占位站点 `task-site/` 已于 2026-10-24 删除。

## 更新记录

- **2026-11-22（Docker 学习路径）**：新增 `/docker/` 游戏化课程（12 关，Curriculum YAML + Content Adapter 自动建页，XP/等级/徽章/连击/自测全部前端 localStorage）；主菜单与首页横幅入口；站内搜索纳入课程页。
- **2026-11-22（内容/模板优化）**：代码块增强（语言标签、行号、复制、折叠）；系列聚合页 `/series/` 与侧边栏 Widget；图片 AVIF/WebP `<picture>` + LQIP 占位；修复首页无标签文章 `delimit` 报错；`[markup.highlight]` 改为 class 输出。
- **2026-11-17（安全）**：移除明文 token —— remote URL 改为无 token HTTPS、删除 `github_token` 文件、`setup-git.ps1` 停止注入 token；旧 token 已在 GitHub 网页吊销。
- **2026-11-09（清理）**：删掉 `home.html` 里没人用的 `window.__articles` 数组（保留 `window.searchURL`）。
- **2026-10-27（社交）**：侧边栏新增 Bilibili 图标（`assets/icons/brand-bilibili.svg`，取自 Tabler Icons，线条风格与 GitHub 图标一致），关于页补 Bilibili 链接。
- **2026-10-27（视觉：点状分页）**：底部页码从「数字 + 跳转弹窗」改为居中小圆点，当前页显示为长条；`home-filter.js` 依赖的 `.pagination` 类名保留。
- **2026-10-27（视觉：毛玻璃）**：新增柔光渐变背景与中间板块的 `backdrop-filter` 玻璃效果，浅色/暗色各一套变量；打印时回退为白底。
- **2026-10-24（批次 D：分类重构 + 系列）**：分类合并为 云计算 / 容器技术 / 编程与工具，删除「其他」与 `hello-world.md`；新增 `series` 分类法与文章页系列导航；标签清掉 `入门`/`进阶`/`docker`/`aws`/`工具` 并合并同义词；旧分类 URL 用 `aliases` 重定向。
- **2026-10-24（批次 C：信息架构）**：新增「归档」页（按年份分组）与「关于」页；主菜单改为 首页 / 归档 / 关于并加图标。
- **2026-10-24（批次 B：清理与 SEO）**：移除 html2pdf（885 KB）与 `pdf-export.js`，PDF 导出改为 `window.print()`；搜索框补 `<label for>` / `aria-label`；新增 robots.txt 与文章页 JSON-LD。
- **2026-10-24（批次 A：性能与分享）**：RSS 改为只输出摘要（4.6 MB → 27 KB，52 个源 → 6 个）；头像 421 KB → 48 KB；新增 favicon / apple-touch-icon / 1200×630 默认 og:image。
- **2026-10-24**：重写本文件，校准为实际状态（24 篇 / 分类统计 / 自定义功能与文件对应关系 / 已知问题）。
- **2026-07-27**：新增 `aws-alb-intro.md`。
- **2026-07-03**：新增 `python-list-comprehension.md`；修复脚本加载、Favicon、Widgets 与 PDF 导出问题（`a5752f4`）。
- **2026-06-10**：新增 `dockerfile-basics.md`。
- **2026-06-08**：新增 `docker-run-parameters.md`。
- **2026-05-27**：新增 5 篇 Docker 命令系列 + 文章导出 PDF 功能（`static/js/html2pdf.bundle.min.js`、`static/js/pdf-export.js`、`assets/scss/custom.scss` 打印样式）。
