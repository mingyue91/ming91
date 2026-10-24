# AI Context — min9's Blog

> 给 AI 助手（和未来的自己）看的项目速查。最后更新：2026-10-24。

## 项目概况

- **Hugo v0.161.0（extended）** 静态博客，主题 [hugo-theme-stack](https://github.com/CaiJimmy/hugo-theme-stack) **v4.0.2**（Git submodule，位于 `themes/stack`）
- 线上地址：https://mingyue91.github.io/ming91/
- 仓库：`git@github.com:mingyue91/ming91.git`（本地 remote 目前是带 token 的 HTTPS 形式），默认分支 `main`
- 部署：push 到 `main` → GitHub Actions 构建 → GitHub Pages
- 作者：min9 (mingyue91)｜语言：zh-cn｜每页 10 篇

## 目录速览

```
.
├── hugo.toml                  # 站点配置：菜单、侧边栏、组件、分类法
├── content/
│   ├── posts/                 # 24 篇文章
│   └── page/                  # 独立页：search（html+json）/ archives（按年归档）/ about
├── layouts/                   # 覆盖主题的模板（首页 / 404 / 卡片 / 侧边栏 / PDF 按钮）
├── assets/
│   ├── scss/custom.scss       # 446 行定制样式
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
| 定制样式（搜索框、分类胶囊、卡片 hover、PDF 按钮、打印样式、系列卡片、移动端适配） | `assets/scss/custom.scss`（512 行） |

主菜单（`hugo.toml`）：首页 `/`、归档 `/archives/`、关于 `/about/`，均带图标。
分类页的导语取自分类 `_index.md` 的 `description` 字段（主题 `list.html` 不渲染 `.Content`）。

`hugo.toml` 中的关键参数：`paginate = 10`、侧边栏头像 `/avatar.jpg`、副标题「二次元 & 技术」、首页组件 `categories` + `tag-cloud`（各 10 条）、文章页组件 `toc`、配色 `scheme = "auto"`。

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
3. **凭据**：`.git/config` 的 remote URL 里内嵌了明文 GitHub token；`.github/config/github_token` 也存了一份（已 gitignore）。建议 `git remote set-url origin https://github.com/mingyue91/ming91.git`，token 只留在被忽略的文件里；如果该目录曾外传，去 GitHub 吊销重建。
4. `layouts/home.html` 里生成的 `window.__articles` 数组前端没有用到（`window.searchURL` 有用），属于遗留代码，可删。
5. `i18n/` 为空目录。
6. `public/`、`resources/_gen/`、`.hugo_build.lock` 已被 gitignore，不要提交。

## 已修复（留档）

- **目录权限（2026-10-24）**：`D:\git库\ming91` 曾属于 `Administrators` 且当前用户无「更改权限」，导致 DSH 沙盒报 `grantWrite(...)` 失败。已用管理员 PowerShell 修正：
  ```powershell
  icacls "D:\git库\ming91" /reset
  icacls "D:\git库\ming91" /grant "*S-1-5-21-1705561848-4019212562-1595756290-1001:(OI)(CI)F"
  ```
  坑：写成 `"${env:USERNAME}:(OI)(CI)F"` 要带花括号；写成 `"$env:USERNAME:..."` 时 PowerShell 会把冒号并入变量名，只剩 `(OI)(CI)F` 传给 icacls，报「无效参数」。
- 根目录孤立图片 `2abd9be97317adcd.webp`、Qoder 占位站点 `task-site/` 已于 2026-10-24 删除。

## 更新记录

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
