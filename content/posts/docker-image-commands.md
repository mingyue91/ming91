---
title: "Docker 镜像管理命令详解"
description: "images、search、pull、push、build、tag、rmi、save、load、history、login、logout——Docker 镜像全生命周期命令"
date: 2026-05-27T00:00:00+08:00
slug: docker-image-commands
categories: ["容器Docker"]
tags: ["docker", "镜像", "进阶"]
draft: false
---

## 概述

镜像（Image）是容器的只读模板。本文覆盖镜像从拉取、构建、管理到分发的**全部命令**。

---

## docker images —— 列出本地镜像

```bash
docker images
docker image ls                   # 等效

REPOSITORY    TAG       IMAGE ID       CREATED       SIZE
nginx         alpine    123abc...      2 weeks ago   23MB
myapp         latest    456def...      5 days ago    150MB
```

### 常用参数

```bash
docker images -a                   # 显示所有层（含中间层）
docker images -q                   # 仅 ID
docker images --filter "dangling=true"   # 悬空镜像（<none>:<none>）
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

---

## docker search —— 搜索镜像

从 Docker Hub 搜索镜像。

```bash
docker search nginx
docker search --limit 10 --filter "is-official=true" nginx
```

| 参数 | 说明 |
|------|------|
| `--limit` | 最大结果数 |
| `--filter stars=1000` | 星数过滤 |
| `--filter is-official=true` | 仅官方镜像 |
| `--filter is-automated=true` | 仅自动构建 |

---

## docker pull —— 拉取镜像

从仓库拉取镜像到本地。

```bash
docker pull nginx:alpine             # 拉取指定标签
docker pull ubuntu                   # 不写标签默认 latest
docker pull myregistry.com/myapp:1.0 # 从私有仓库拉取
docker pull node@sha256:abc123...    # 按摘要拉取（最安全）
```

---

## docker push —— 推送镜像

将本地镜像推送到仓库。

```bash
docker push myapp:1.0
docker push myregistry.com/myapp:1.0    # 推送到私有仓库
```

需要先登录：

```bash
docker login
docker tag myapp:latest username/myapp:1.0
docker push username/myapp:1.0
```

---

## docker build —— 构建镜像

从 Dockerfile 构建镜像。

```bash
docker build -t myapp:1.0 .                  # 从当前目录构建
docker build -f Dockerfile.prod -t myapp .   # 指定 Dockerfile
docker build --no-cache -t myapp .           # 禁用缓存
docker build --build-arg VERSION=18 -t myapp .  # 传构建参数
```

### 常用参数

| 参数 | 说明 |
|------|------|
| `-t` | 镜像名:标签 |
| `-f` | 指定 Dockerfile 路径 |
| `--no-cache` | 禁用构建缓存 |
| `--build-arg` | 传递构建参数 |
| `--target` | 多阶段构建停到某阶段 |
| `--platform` | 指定目标平台 |

```bash
# 多平台构建（需 buildx）
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:1.0 .
```

---

## docker tag —— 标记镜像

为镜像添加标签（相当于别名）。

```bash
docker tag myapp:latest myapp:1.0
docker tag myapp:latest registry.example.com/myapp:1.0
docker tag 123abc456def myapp:1.0       # 按 IMAGE ID 标记
```

---

## docker rmi —— 删除镜像

```bash
docker rmi myapp:1.0                      # 删除指定标签
docker rmi 123abc456def                   # 按 IMAGE ID 删除
docker rmi -f myapp                       # 强制删除
docker image prune                        # 删除悬空镜像
docker image prune -a                     # 删除所有未使用的镜像
```

---

## docker save —— 保存镜像为 tar 文件

将镜像保存为 tar 存档（含所有层和元数据）。

```bash
docker save -o myapp.tar myapp:1.0
docker save myapp:1.0 > myapp.tar
docker save myapp:1.0 nginx:alpine > images.tar    # 多个镜像
```

---

## docker load —— 从 tar 文件加载镜像

```bash
docker load -i myapp.tar
docker load < myapp.tar
```

典型离线传输场景：

```bash
# 在有网络的机器上
docker save -o myapp.tar myapp:1.0

# 复制到离线机器
scp myapp.tar offline-server:/tmp/

# 在离线机器上加载
docker load -i /tmp/myapp.tar
```

---

## docker history —— 查看镜像构建历史

显示镜像层和创建命令。

```bash
docker history myapp:1.0
docker history --no-trunc myapp:1.0    # 不截断输出

IMAGE          CREATED       CREATED BY                                      SIZE
456def...      2 hours ago   CMD ["node" "app.js"]                           0B
345cde...      2 hours ago   COPY . /app/                                    1.2MB
234bcd...      2 hours ago   RUN npm install                                 45MB
123abc...      2 hours ago   COPY package.json /app/                         50kB
```

可用于排查镜像臃肿原因：

```bash
docker history --no-trunc myapp | sort -k5 -h   # 按大小排序
```

---

## docker login / logout —— 仓库认证

```bash
docker login                        # 交互式登录 Docker Hub
docker login -u username -p token   # 非交互（CI 使用）
docker login myregistry.com         # 登录私有仓库
docker logout                       # 登出
```

CI 环境建议使用 access token 而非密码：

```bash
echo $ACCESS_TOKEN | docker login -u username --password-stdin
```

---

## 进阶技巧

### 多架构镜像

```bash
# 查看镜像支持的架构
docker inspect --format='{{.Architecture}}' nginx:alpine

# 拉取特定架构（Docker Desktop 自动适配）
docker pull --platform linux/arm64 nginx:alpine
```

### 镜像大小优化参考

```bash
# 查看镜像各层大小
docker history --no-trunc myapp

# 清理悬空镜像
docker image prune -f

# 清理全部未使用镜像（含已标记的）
docker image prune -a -f
```

---

## 命令速查表

| 命令 | 作用 | 常用参数 |
|------|------|---------|
| `images` | 列出本地镜像 | `-a`, `-q`, `--filter` |
| `search` | 搜索 Docker Hub | `--limit`, `--filter` |
| `pull` | 拉取镜像 | — |
| `push` | 推送镜像 | — |
| `build` | 构建镜像 | `-t`, `-f`, `--no-cache`, `--build-arg` |
| `tag` | 标记镜像 | — |
| `rmi` | 删除镜像 | `-f` |
| `save` | 保存为 tar | `-o` |
| `load` | 从 tar 加载 | `-i` |
| `history` | 查看构建历史 | `--no-trunc` |
| `login` | 登录仓库 | `-u` |
| `logout` | 登出仓库 | — |
| `image prune` | 清理未使用镜像 | `-a`, `-f` |
