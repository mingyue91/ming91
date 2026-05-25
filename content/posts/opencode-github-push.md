---
title: "如何使用 OpenCode 连接 GitHub 仓库并完成推送"
description: "在终端中用 AI 助手完成 Git 操作的完整教程"
date: 2026-05-25T00:00:00+08:00
slug: opencode-github-push
categories: ["其他"]
tags: ["opencode", "git", "github", "ai", "工具"]
draft: false
---

[OpenCode](https://opencode.ai) 是一个终端内的 AI 编程助手，能直接执行 Shell 命令、读写文件、操作 Git。本文介绍如何用 OpenCode 完成 GitHub 仓库的代码推送。

## 前置准备

确保系统已安装：

- **Git** — `git --version` 验证
- **OpenCode** — 终端运行 `opencode` 进入会话
- **GitHub 账号** 及一个已创建的仓库

## 一、克隆已有仓库

在 OpenCode 中直接告诉它：

```
克隆 https://github.com/用户名/仓库名.git 到本地
```

OpenCode 会自动执行 `git clone`。如果是私有仓库，需要提前配好认证（见下文）。

## 二、认证方式

### 方式 1：SSH 密钥（推荐）

```bash
# 生成密钥
ssh-keygen -t ed25519 -C "your-email@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

将输出的公钥添加到 GitHub：**Settings → SSH and GPG keys → New SSH key**。

告诉 OpenCode：

```
把远程地址改为 SSH 并推送
```

它会执行：

```bash
git remote set-url origin git@github.com:用户名/仓库名.git
git push
```

### 方式 2：Personal Access Token (HTTPS)

在 GitHub 创建 classic token：**Settings → Developer settings → Personal access tokens → Tokens (classic)**，勾选 `repo` 权限。

在 OpenCode 中：

```
git remote set-url origin https://用户名:你的token@github.com/用户名/仓库名.git
git push
```

推送完成后再把远程地址改回无凭据的 URL：

```
git remote set-url origin https://github.com/用户名/仓库名.git
```

## 三、在 OpenCode 中完成完整工作流

### 新建文件并推送

```
在 content/posts/ 下创建一篇新博客，front matter 格式如下：
---
title: "标题"
date: 2026-05-25T00:00:00+08:00
slug: my-post
categories: ["分类"]
tags: ["标签"]
draft: false
---

内容写 Docker 入门教程...
然后帮我提交并推送到 GitHub
```

OpenCode 会依次执行：创建文件 → `git add` → `git commit` → `git push`。

### 修改文件并推送

```
把 content/posts/my-post.md 的第二段改一下，然后提交推送
```

### 查看状态

```
查看 git 状态和最近的提交记录
```

## 四、常见问题

| 问题 | 解决 |
|------|------|
| `Permission denied (publickey)` | SSH 密钥未配置或未添加到 GitHub |
| `403` / `Access denied` | Token 权限不足，检查 `repo` 是否勾选 |
| `Connection refused` | 网络无法访问 GitHub，配置代理或检查网络 |
| `Host key verification failed` | 首次连接 SSH，OpenCode 会自动处理 `accept-new` |

## 五、安全建议

- **不要**在对话中明文输入 Token，通过 `git remote set-url` 临时嵌入 URL 并事后清理
- SSH 密钥比 Token 更适合长期使用
- 提交前检查 `git diff`，避免意外提交敏感文件
- 可在项目根目录创建 `.gitignore` 排除构建产物和凭据文件

## 总结

OpenCode 把 Git 操作变成了自然语言对话。你只需要描述意图——"提交并推送"、"回滚上次提交"、"查看分支"——它就会自动执行对应的 Git 命令。配合 SSH 密钥或 Token 认证，就能在纯终端环境中完成完整的代码协作流程。
