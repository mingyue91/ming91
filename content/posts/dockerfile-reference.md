---
title: "Dockerfile 指令详解"
description: "从 FROM 到 SHELL——17 个 Dockerfile 指令完整参考手册"
date: 2026-05-27T00:00:00+08:00
slug: dockerfile-reference
categories: ["容器Docker"]
tags: ["docker", "dockerfile", "入门"]
draft: false
---

## 概述

Dockerfile 是 Docker 构建镜像的"配方文件"。每个指令生成一个镜像层，理解每个指令的行为是写出高效、安全 Dockerfile 的关键。

---

## FROM —— 指定基础镜像

必须是 Dockerfile 的**第一条非注释指令**（除了 `ARG` 可放在 `FROM` 前）。

```dockerfile
FROM node:18-alpine
FROM python:3.11-slim AS builder    # 命名阶段，用于多阶段构建
FROM scratch                         # 空镜像，用于静态编译语言
```

| 变体 | 说明 |
|------|------|
| `FROM image:tag` | 指定版本标签（推荐） |
| `FROM image@digest` | 按摘要锁定，最安全 |
| `FROM image:tag AS name` | 命名阶段，多阶段构建引用 |

---

## LABEL —— 镜像元数据

以键值对形式添加元数据。替代已弃用的 `MAINTAINER`。

```dockerfile
LABEL maintainer="min9"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/user/repo"
```

```dockerfile
# 一行多个标签
LABEL version="1.0.0" description="My app"
```

查看标签：

```bash
docker inspect --format='{{json .Config.Labels}}' myimage
```

---

## RUN —— 执行构建命令

在构建过程中执行命令，结果提交为新镜像层。

### 两种格式

```dockerfile
# Shell 格式（默认 /bin/sh -c）
RUN apt-get update && apt-get install -y curl

# Exec 格式（不经过 shell）
RUN ["pip", "install", "-r", "requirements.txt"]
```

### 最佳实践：合并 RUN

```dockerfile
# ❌ 3 层
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# ✅ 1 层
RUN apt-get update && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*
```

---

## CMD —— 默认容器启动命令

容器启动时执行的命令，**可被 `docker run` 后参数覆盖**。

```dockerfile
# Exec 格式（推荐）
CMD ["node", "app.js"]

# Shell 格式
CMD node app.js

# 作为 ENTRYPOINT 的默认参数
CMD ["--port", "8080"]
```

```bash
docker run myimage                 # 执行 CMD
docker run myimage node server.js  # 覆盖 CMD
```

---

## ENTRYPOINT —— 容器主命令

与 `CMD` 类似，但**不可被 `docker run` 后参数覆盖**（除非 `--entrypoint`）。

```dockerfile
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
```

```bash
docker run myimage            # nginx -g "daemon off;"
docker run myimage -t         # nginx -t（CMD 被覆盖，ENTRYPOINT 保留）
```

### CMD vs ENTRYPOINT

| | CMD | ENTRYPOINT |
|--|-----|------------|
| `docker run` 参数覆盖 | ✅ | ❌（除非 `--entrypoint`） |
| 典型用途 | 默认参数 | 固定主程序 |
| 配合使用 | ENTRYPOINT + CMD（CMD 作默认参数） | ENTRYPOINT + CMD |

---

## EXPOSE —— 声明端口

**仅文档用途**，不自动发布端口。

```dockerfile
EXPOSE 80
EXPOSE 443/tcp
EXPOSE 53/udp
```

真正发布仍需 `-p`：

```bash
docker run -p 8080:80 myimage
docker run -P myimage         # 自动映射所有 EXPOSE 端口
```

---

## ENV —— 设置环境变量

构建时和运行时都可用。

```dockerfile
ENV NODE_ENV=production
ENV APP_HOME=/app \
    DB_HOST=localhost
```

运行时覆盖：

```bash
docker run -e NODE_ENV=development myimage
```

---

## WORKDIR —— 设置工作目录

设置后续指令的工作目录，**目录不存在则自动创建**。

```dockerfile
WORKDIR /app
WORKDIR src          # 实际变为 /app/src
WORKDIR utils        # 实际变为 /app/src/utils
```

影响 `RUN`、`CMD`、`ENTRYPOINT`、`COPY`、`ADD` 的工作路径。

---

## COPY —— 复制文件（推荐）

将构建上下文中的文件/目录复制到镜像。

```dockerfile
COPY package.json /app/
COPY --from=builder /app/dist /app/dist    # 多阶段构建
COPY --chown=node:node . /app              # 修改所有者
```

---

## ADD —— 高级复制

比 `COPY` 多了**自动解压 tar** 和**远程 URL** 支持。

```dockerfile
ADD app.tar.gz /app/          # 自动解压
ADD https://example.com/file.tar.gz /tmp/   # 不推荐
```

> **安全警告**：`ADD` 远程 URL 使构建不可复现。推荐用 `RUN curl` 替代。

### COPY vs ADD

| | COPY | ADD |
|--|------|-----|
| 复制本地文件 | ✅ | ✅ |
| 自动解压 | ❌ | ✅ |
| 远程 URL | ❌ | ⚠️ |
| 推荐度 | ⭐ 推荐 | 仅解压时使用 |

---

## ARG —— 构建参数

仅在构建过程中有效，**不写入最终镜像**。

```dockerfile
ARG VERSION=latest
FROM node:${VERSION}-alpine
ARG BUILD_ENV
RUN echo "Building for $BUILD_ENV"
```

```bash
docker build --build-arg VERSION=18 --build-arg BUILD_ENV=prod -t myapp .
```

### 预定义 ARG

```dockerfile
ARG TARGETPLATFORM     # linux/amd64, linux/arm64
ARG TARGETOS           # linux, windows
ARG TARGETARCH         # amd64, arm64
```

### ARG vs ENV

| | ARG | ENV |
|--|-----|-----|
| 构建时可用 | ✅ | ✅ |
| 运行时可用 | ❌ | ✅ |
| 持久化到镜像 | ❌ | ✅ |

---

## USER —— 切换用户

指定后续指令的运行用户。**生产镜像请使用非 root 用户**。

```dockerfile
FROM node:18-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --chown=appuser:appgroup . .
CMD ["node", "app.js"]
```

官方镜像预置用户：

| 镜像 | 用户 |
|------|------|
| `node` | `node` |
| `nginx` | `nginx` |
| `python` | 需手动创建 |

---

## VOLUME —— 数据卷

声明挂载点，在运行时自动创建匿名 volume。

```dockerfile
VOLUME /data
VOLUME ["/var/log", "/var/lib/mysql"]
```

> **陷阱**：`VOLUME` 之后的写入在容器启动时会被新 volume 覆盖。需初始化数据的场景，用 `ENTRYPOINT` 脚本在运行时处理。

---

## HEALTHCHECK —— 健康检查

定义 Docker 如何判断容器是否"健康"。

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:3000/health || exit 1
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--interval` | 30s | 检查间隔 |
| `--timeout` | 30s | 单次超时 |
| `--retries` | 3 | 连续失败次数 |
| `--start-period` | 0s | 启动等待期 |

```bash
docker ps                     # 看 healthy/unhealthy
docker inspect --format='{{json .State.Health}}' mycontainer
```

禁用：`HEALTHCHECK NONE`

---

## ONBUILD —— 构建触发器

当该镜像被用作其他 Dockerfile 的 `FROM` 时，触发器自动执行。

```dockerfile
FROM node:18-alpine
ONBUILD COPY package.json /app/
ONBUILD RUN npm install
```

> **限制**：不能递归、不能用于 `scratch`。官方已推荐多阶段构建代替 `ONBUILD`。

---

## STOPSIGNAL —— 停止信号

设置发送给容器主进程的退出信号。

```dockerfile
STOPSIGNAL SIGQUIT    # Nginx 优雅退出
STOPSIGNAL SIGTERM    # 默认值
```

---

## SHELL —— 覆盖默认 Shell

修改 Shell 格式指令所使用的默认 shell。

```dockerfile
SHELL ["/bin/bash", "-c"]       # Linux 切换到 bash
SHELL ["powershell", "-Command"] # Windows 容器
```

---

## 完整示例：生产级 Dockerfile

```dockerfile
FROM node:18-alpine AS builder
LABEL maintainer="min9"
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=2 \
    CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["node", "dist/server.js"]
```

---

## 指令速查表

| 指令 | 用途 | 构建时 | 运行时 | 备注 |
|------|------|--------|--------|------|
| `FROM` | 基础镜像 | ✅ | — | 必须是第一条 |
| `LABEL` | 元数据 | ✅ | ✅ | 替代 MAINTAINER |
| `RUN` | 执行命令 | ✅ | — | 产生新镜像层 |
| `CMD` | 默认启动命令 | — | ✅ | 可覆盖 |
| `ENTRYPOINT` | 固定启动命令 | — | ✅ | 不可覆盖 |
| `EXPOSE` | 声明端口 | — | ✅ | 文档用途 |
| `ENV` | 环境变量 | ✅ | ✅ | 持久化到镜像 |
| `WORKDIR` | 工作目录 | ✅ | ✅ | 自动创建 |
| `COPY` | 复制文件 | ✅ | — | 推荐 |
| `ADD` | 高级复制 | ✅ | — | 自动解压 |
| `ARG` | 构建参数 | ✅ | ❌ | `--build-arg` 传入 |
| `USER` | 切换用户 | ✅ | ✅ | 用非 root |
| `VOLUME` | 数据卷 | — | ✅ | 自动创建匿名 volume |
| `HEALTHCHECK` | 健康检查 | — | ✅ | 可定义检查命令 |
| `ONBUILD` | 触发器 | ✅ | — | 子构建触发 |
| `STOPSIGNAL` | 停止信号 | — | ✅ | 自定义退出信号 |
| `SHELL` | 覆盖 Shell | ✅ | ✅ | 默认 /bin/sh |
