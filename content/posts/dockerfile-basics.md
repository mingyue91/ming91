
---
title: "Dockerfile 基础概念、用法与扩展"
description: "从零理解 Dockerfile——镜像构建原理、常用指令、最佳实践到进阶扩展"
date: 2026-06-10T00:00:00+08:00
slug: dockerfile-basics
categories: ["容器Docker"]
tags: ["docker", "dockerfile", "入门", "进阶"]
draft: false
---

## 基础概念

### 什么是 Dockerfile？

Dockerfile 是一个文本文件，包含一系列指令，Docker 引擎按顺序执行这些指令来**自动构建镜像**。相当于把你在终端手动配置环境的过程，写成可重复执行的"脚本"。

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["node", "index.js"]
```

### 镜像层（Layer）原理

每个指令生成一个**只读层**，层叠构成最终的镜像：

```text
+-------------------+
|   CMD             |   ← 可写容器层（运行后上方）
+-------------------+
|   COPY . .        |   ← 第 4 层
+-------------------+
|   RUN npm install |   ← 第 3 层
+-------------------+
|   COPY package.json | ← 第 2 层
+-------------------+
|   FROM node:18    |   ← 第 1 层（基础镜像）
+-------------------+
```

**层复用**：构建时若某层未变化，Docker 直接使用缓存层，大幅加速构建。

### 构建流程

```bash
# 在当前目录找 Dockerfile
docker build -t myapp:latest .

# 指定 Dockerfile 路径
docker build -f ./prod.Dockerfile -t myapp:prod .
```

```text
docker build 执行流程：
1. 发送上下文（. 目录）到 Docker daemon
2. 逐条解析 Dockerfile 指令
3. 每条指令检查缓存 → 命中则复用，否则执行
4. 生成最终镜像
```

---

## 常用指令详解

### FROM——基础镜像

```dockerfile
FROM node:18-alpine
FROM python:3.11-slim AS builder    # 命名阶段
FROM scratch                         # 空镜像
```

| 变体 | 说明 |
|------|------|
| `FROM image:tag` | 指定版本（推荐） |
| `FROM image@digest` | 按摘要锁定，最安全 |
| `FROM image AS name` | 命名阶段，用于多阶段构建 |

### WORKDIR——工作目录

```dockerfile
WORKDIR /app
RUN pwd    # 输出 /app
```

所有后续指令（`RUN`、`CMD`、`COPY` 等）都在此目录下执行。**建议始终使用**，避免根目录文件混乱。

### COPY / ADD——复制文件

```dockerfile
COPY package.json /app/
COPY . .

# ADD 额外功能：自动解压 tar、支持 URL
ADD app.tar.gz /app/
```

| 指令 | 特点 |
|------|------|
| `COPY` | 纯文件复制，更明确 |
| `ADD` | 支持自动解压 + URL 下载，但行为隐式 |

**原则**：文件复制用 `COPY`，真需要自动解压才用 `ADD`。

### RUN——执行构建命令

```dockerfile
# Shell 格式（有变量展开、管道等）
RUN apt-get update && apt-get install -y curl

# Exec 格式（无 shell，更安全）
RUN ["pip", "install", "-r", "requirements.txt"]
```

### CMD + ENTRYPOINT——启动命令

```dockerfile
ENTRYPOINT ["nginx"]       # 主命令（不可覆盖）
CMD ["-g", "daemon off;"]   # 默认参数（可覆盖）
```

```bash
docker run myimage           # nginx -g "daemon off;"
docker run myimage -t        # nginx -t（CMD 覆盖）
docker run --entrypoint sh   # 强制覆盖 ENTRYPOINT
```

### ENV / ARG——变量

```dockerfile
# ENV：构建时 + 运行时都生效
ENV NODE_ENV=production

# ARG：仅构建时生效，可通过 --build-arg 传入
ARG APP_VERSION=1.0
RUN echo "Building version $APP_VERSION"
```

```bash
docker build --build-arg APP_VERSION=2.0 -t myapp .
```

### EXPOSE——声明端口

```dockerfile
EXPOSE 3000
EXPOSE 80/tcp 443/udp
```

**纯文档作用**，并不实际发布端口。运行时仍需 `-p` 映射。

---

## 最佳实践

### 1. 优化层缓存

```dockerfile
# ❌ 每次改代码都重装依赖
COPY . .
RUN npm install

# ✅ 先复制依赖文件，安装后再复制源码
COPY package.json package-lock.json ./
RUN npm install
COPY . .
```

依赖文件变化频率远低于源码，这样能最大化缓存命中。

### 2. 合并 RUN 减少层数

```dockerfile
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*
```

清理缓存放在**同一层**，避免镜像膨胀。

### 3. 使用 .dockerignore

```text
node_modules
.git
*.md
.gitignore
```

类似 `.gitignore`，排除不必要文件传入 Docker daemon，加速构建。

### 4. 多阶段构建

用多个 `FROM`，最终只拷贝需要的产物：

```dockerfile
# 阶段 1：编译
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o server .

# 阶段 2：运行（极小镜像）
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/server /server
CMD ["/server"]
```

最终镜像只包含二进制文件和运行时依赖，**不含 Go 编译器、源码**。

### 5. 选择合适的基础镜像

| 镜像 | 大小 | 适用场景 |
|------|------|----------|
| `alpine` | ~5MB | 通用轻量 |
| `slim` | ~50MB | Python/Node 官方减量版 |
| `distroless` | ~20MB | Google 维护，仅运行时 |
| `scratch` | 0B | 静态编译语言（Go、Rust） |

### 6. 以非 root 运行

```dockerfile
FROM node:18-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --chown=appuser:appgroup . .
CMD ["node", "server.js"]
```

---

## 扩展：进阶用法

### 使用 BuildKit

Docker 新版构建引擎，提供更快的并发构建和更好的安全性：

```bash
DOCKER_BUILDKIT=1 docker build -t myapp .
```

特性：
- 并发执行无关指令
- 构建密钥安全传递（`--secret`）
- 缓存导出到远程仓库

### 多架构构建

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest --push .
```

在 CI/CD 中一次构建即可覆盖 AMD64 和 ARM64 架构。

### 结合 Docker Compose

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
```

### 健康检查

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### 元数据标签

```dockerfile
LABEL org.opencontainers.image.source="https://github.com/user/repo"
LABEL org.opencontainers.image.description="My application"
```

OCI 标准标签，便于镜像管理和审计。

---

## 常见错误

| 问题 | 原因 | 解决 |
|------|------|------|
| 镜像过大 | 每层都生成新文件 | 合并 RUN、使用 .dockerignore、多阶段构建 |
| 缓存未命中 | 不稳定层在前 | 变化慢的指令放前面 |
| COPY 无效 | 上下文路径不对 | 确认 `docker build` 的 context 目录正确 |
| 端口不通 | 只写了 EXPOSE 没映射 | 运行时加 `-p` |
| 权限拒绝 | 默认 root 运行 | 用 `USER` 切换普通用户 |

## 总结

```text
Dockerfile = 基础设施即代码

基础：FROM / COPY / RUN / CMD / ENTRYPOINT
进阶：多阶段构建 / .dockerignore / 缓存优化
扩展：BuildKit / 多架构 / Compose / 健康检查
```

写 Dockerfile 的核心思路：
1. **小**——基础镜像小、产物小
2. **快**——利用缓存、并发构建
3. **安全**——非 root、distroless、密钥不落地
4. **可复现**——固定 tag 和 digest