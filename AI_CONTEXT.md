# AI Context — min9's Blog

## 项目概况
- Hugo v0.161.0 静态博客，主题 [hugo-theme-stack v4](https://github.com/CaiJimmy/hugo-theme-stack)
- 部署：GitHub Pages + GitHub Actions（`.github/workflows/deploy.yml`）
- 地址：https://mingyue91.github.io/ming91/
- 作者：min9 (mingyue91)
- 语言：zh-cn

## Git 配置
- 远程仓库：`git@github.com:mingyue91/ming91.git`（SSH）
- 默认分支：`main`
- 推送即触发 GitHub Actions 自动构建部署

## 内容结构
```
content/posts/
├── hello-world.md                    # 2026-05-18 | 其他
├── cloud-intro.md                    # 2026-05-17 | 云计算
├── aws-iam-intro.md                  # 2026-05-18 | 云计算
├── aws-iam-policy.md                 # 2026-05-18 | 云计算
├── aws-s3-policy-examples.md         # 2026-05-18 | 云计算
├── docker-intro.md                   # 2026-05-19 | 容器Docker
├── aws-2026-updates.md               # 2026-05-22 | 云计算
├── aws-database-rds-dynamodb.md      # 2026-05-22 | 云计算
├── aws-s3-intro.md                   # 2026-05-22 | 云计算
├── aws-storage-overview.md           # 2026-05-22 | 云计算（置顶）
├── docker-add-user-to-group.md       # 2026-05-25 | 容器Docker
├── dockerfile-reference.md           # 2026-05-27 | 容器Docker
├── docker-container-commands.md      # 2026-05-27 | 容器Docker
├── docker-image-commands.md          # 2026-05-27 | 容器Docker
├── docker-storage-network.md         # 2026-05-27 | 容器Docker
└── docker-compose-commands.md        # 2026-05-27 | 容器Docker
```
共 17 篇文章，主要分类：`云计算`(8), `容器Docker`(7), `python`(1), `其他`(1)

## 文章 Front Matter 规范
```yaml
---
title: "文章标题"
description: "摘要"
date: 2026-05-25T00:00:00+08:00
slug: kebab-case-name
categories: ["分类名"]
tags: ["标签1", "标签2"]
draft: false
---
```

## 分类与标签
| 分类 | 常用标签 |
|------|----------|
| 云计算 | aws, cloud, s3, iam, ec2, 存储, 安全, 数据库, 入门 |
| 容器Docker | docker, 容器, dockerfile, linux, 权限, 入门, 进阶, 运维, compose, volume, 网络, 镜像 |
| python | python, 入门 |
| 其他 | blog, hello |

## 自定义功能
- **首页分类筛选**：`layouts/home.html` — 纯 JS 实现分类 Tab 切换（全部/云计算/后端/AI/容器Docker/其他），云计算有子分类下拉
- **自定义 404**：`layouts/404.html` — 萌系报错 + 搜索框
- **自定义侧边栏**：`layouts/_partials/sidebar/left.html`
- **文章卡片样式**：`layouts/_partials/article/components/details.html`
- **自定义 CSS**：`assets/scss/custom.scss` — 分类 Tab、卡片 hover 效果、置顶标记

## 常用命令
```powershell
hugo server --buildDrafts          # 本地预览（含草稿）
hugo server                         # 本地预览（仅发布）
hugo --minify                       # 生产构建
git add .; git commit -m "msg"; git push  # 发布
```

## 安全注意事项
- 不提交 `.env`、密钥、token
- 不在代码中硬编码凭据

## 上次会话（2026-05-27）
- 新增 5 篇 Docker 命令系列文章：
  - `dockerfile-reference.md` — Dockerfile 全部 17 个指令详解
  - `docker-container-commands.md` — 容器生命周期管理（create/run/stop/exec/logs/cp/inspect 等 22 个命令）
  - `docker-image-commands.md` — 镜像管理（pull/push/build/tag/save/load/history 等 13 个命令）
  - `docker-storage-network.md` — volume、network、system 三大子系统
  - `docker-compose-commands.md` — Compose V2 全部子命令
- 新增文章导出 PDF 功能
  - 每篇文章底部添加"导出 PDF"按钮
  - 使用本地托管 html2pdf.bundle.min.js（零 CDN 依赖）
  - html2pdf 失败自动降级到浏览器 `window.print()`
  - `@media print` 打印样式隐藏侧边栏、导航等无关元素
- 新文件：
  - `static/js/html2pdf.bundle.min.js`
  - `static/js/pdf-export.js`
  - `layouts/_partials/article/article.html`（覆盖主题，添加按钮）
- 修改文件：
  - `assets/scss/custom.scss`（PDF 按钮样式 + 打印样式）
  - `themes/stack/layouts/_partials/head/custom.html`（引入脚本）
- 注意：Hugo v0.161.0 `--minify` 有 bug，不可用
