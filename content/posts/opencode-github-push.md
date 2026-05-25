---
title: "如何使用 OpenCode 连接 GitHub 仓库并完成推送"
description: "从创建仓库到代码推送，图形化操作 + AI 协作完整指南"
date: 2026-05-25T00:00:00+08:00
slug: opencode-github-push
categories: ["其他"]
tags: ["opencode", "git", "github", "ai", "工具"]
draft: false
---

[OpenCode](https://opencode.ai) 是一个终端内的 AI 编程助手。本文从零开始，用图形化方式完成 GitHub 仓库的创建与认证配置，再配合 OpenCode 完成代码推送。

## 一、在 GitHub 网页上创建仓库

1. 打开 https://github.com/new
2. 填写 **Repository name**（如 `my-blog`）
3. 选择 **Public**（公开）或 **Private**（私有）
4. 勾选 **Add a README file** 初始化仓库
5. 点击 **Create repository**

创建完成后会看到仓库主页，复制地址栏的 URL（`https://github.com/用户名/仓库名.git`）。

## 二、配置认证（图形化方式）

### 方式 1：生成 SSH 密钥并添加到 GitHub

**在本地生成密钥：**

如果你用 OpenCode，直接告诉它：

```
帮我生成一个 SSH 密钥
```

OpenCode 会执行：

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

一路回车即可。查看公钥：

```bash
cat ~/.ssh/id_ed25519.pub
```

**在 GitHub 网页上添加公钥：**

1. 打开 https://github.com/settings/keys
2. 点击 **New SSH key**
3. Title 随便填（如 `My Laptop`）
4. Key Type 选择 **Authentication Key**
5. 把刚才的公钥粘贴进去
6. 点击 **Add SSH key**

完成后回到终端，OpenCode 就能用 SSH 推送到你的仓库了。

### 方式 2：创建 Personal Access Token（网页操作）

1. 打开 https://github.com/settings/tokens
2. 点击 **Generate new token → Generate new token (classic)**
3. 填写 **Note**（如 `opencode`）
4. **Expiration** 选择 `No expiration`
5. **Scopes** 勾选 `repo`（完整仓库控制权限）
6. 拉到页面底部点击 **Generate token**
7. **立即复制生成的 token**（以 `ghp_` 开头），关闭页面后无法再次查看

## 三、在 OpenCode 中克隆仓库

打开终端，进入想存放代码的目录，运行：

```bash
opencode
```

进入对话后输入：

```
克隆 https://github.com/用户名/仓库名.git 到当前目录
```

OpenCode 会自动检测认证方式并执行克隆。如果提示输入凭据，输入 GitHub 用户名和刚才创建的 token（密码处粘贴 token）即可。

## 四、用 OpenCode 完成推送

### 场景 1：创建新文件并推送

告诉 OpenCode：

```
在仓库根目录创建一个 README.md，内容为 "# 我的项目"，然后 git add、commit、push
```

它会依次执行：

```bash
echo "# 我的项目" > README.md
git add README.md
git commit -m "add README"
git push
```

### 场景 2：已有本地仓库，关联远程

如果你在本地已有代码：

```
把当前目录初始化为 git 仓库，添加远程地址并推送
```

OpenCode 会执行：

```bash
git init
git add .
git commit -m "初始提交"
git remote add origin git@github.com:用户名/仓库名.git
git push -u origin main
```

### 场景 3：修改文件后推送

```
修改 README.md，在末尾加一行"由 OpenCode 自动修改"，然后提交推送
```

## 五、在 GitHub 网页上验证结果

推送完成后，刷新浏览器中的仓库页面，就能看到代码和提交记录。

几个常用的网页操作：

| 操作 | 位置 |
|------|------|
| 查看文件 | 仓库首页直接浏览 |
| 查看提交历史 | 点击仓库名下方的 **Commits** |
| 创建 Pull Request | **Pull requests** tab → **New pull request** |
| 管理分支 | **Branches** 页面查看所有分支 |
| 发布 Release | **Releases** → **Create a new release** |

## 六、常见问题

### SSH 方式推送报错

```
git@github.com: Permission denied (publickey)
```

回到 https://github.com/settings/keys 确认公钥已添加。或者告诉 OpenCode：

```
检查 SSH 密钥是否已添加到 GitHub
```

### Token 方式推送报 403

- 确认 token 以 `ghp_` 开头（classic token）
- 确认勾选了 `repo` 权限
- 重新生成一个再试

### 推送被拒（non-fast-forward）

远程有本地没有的提交，先拉取再推送。告诉 OpenCode：

```
拉取远程更新，解决冲突后再推送
```

### 网络连不上 GitHub

如果有代理软件（如 Clash、V2Ray），在 OpenCode 中：

```
帮我配置 Git 走代理，端口 7890
```

## 七、安全提醒

- Token 泄露后立即到 https://github.com/settings/tokens 删除
- 不要在公开文档或对话中贴出完整 Token
- SSH 密钥比 Token 更适合长期使用
- 推送前告诉 OpenCode `查看 git diff`，确认没有误提交敏感文件

## 总结

整个流程分成两步：**网页上配好仓库和认证**，**终端里交给 OpenCode 操作代码**。不需要记 Git 命令，用自然语言告诉 OpenCode 你想做什么，剩下的由它自动执行。
