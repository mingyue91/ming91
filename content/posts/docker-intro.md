---
title: "Docker 入门：从零理解容器化技术"
description: "镜像、容器、Dockerfile、Compose——一次性搞懂 Docker 核心概念与实践"
date: 2026-05-19T00:00:00+08:00
slug: docker-intro
categories: ["容器Docker"]
tags: ["docker", "容器", "入门"]
draft: false
---

## 为什么需要 Docker？

你肯定遇到过这个问题：代码在自己电脑上跑得好好的，同事一拉就报错；按文档一步步配环境，就是跑不起来。

Docker 的解决思路很简单——**把应用连同环境一起打包**，确保在任何机器上运行结果一致。核心理念是"一次构建，随处运行"。

## 核心概念

用做饭来类比，理解起来很直观。

### 镜像（Image）：菜谱

镜像是一个**只读模板**，包含运行应用所需的一切：代码、运行时、依赖库、配置文件。

```
Node.js 镜像（基础）
  ├── Python 3.11-slim（更小的基础）
  │   └── pip install -r requirements.txt（装依赖）
  │       └── COPY app.py（放代码）
  └── 最终镜像
```

- 镜像是**静态的**，构建后不可变
- 镜像**分层存储**，可以复用已有镜像作为基础

### 容器（Container）：做好的菜

容器是镜像的**运行实例**。按照菜谱做好一道菜，装在独立的盘子里。

```
同一个镜像 → 多个容器（互不干扰）
  ├── 容器 A（端口 8080）
  ├── 容器 B（端口 8081）
  └── 容器 C（端口 8082）
```

- 容器是**动态的**，可启动、停止、删除
- 每个容器**进程级隔离**，有自己的文件系统和网络

### 仓库（Registry）：图书馆

存放和分享镜像的地方。最常用的是 **Docker Hub**，里面有海量官方镜像（Node.js、Python、MySQL、Nginx 等）。

```
docker pull nginx:latest      # 从 Docker Hub 拉取镜像
docker push myapp:1.0         # 推送自己的镜像到仓库
```

### Dockerfile：菜谱手稿

Dockerfile 是一个文本文件，定义如何构建镜像。

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

## Docker vs 虚拟机

| 特性 | 虚拟机 | Docker 容器 |
|------|--------|-------------|
| 隔离级别 | 硬件级虚拟化 | 进程级隔离 |
| 操作系统 | 每个 VM 有完整 OS | 共享宿主机内核 |
| 启动时间 | 分钟级 | 秒级 |
| 镜像大小 | GB 级 | MB 级 |
| 性能开销 | 较大 | 接近原生 |

```
虚拟机：
┌──────────┐ ┌──────────┐
│  App A   │ │  App B   │
│  Guest OS│ │  Guest OS│ ← 每个 VM 自带完整 OS
├──────────┤ ├──────────┤
│  Hypervisor              │
├──────────────────────────┤
│  Host OS                 │
└──────────────────────────┘

Docker：
┌──────────┐ ┌──────────┐
│  App A   │ │  App B   │
│  Libs    │ │  Libs    │
├──────────┤ ├──────────┤
│  Docker Engine           │ ← 共享内核
├──────────────────────────┤
│  Host OS                 │
└──────────────────────────┘
```

## 安装 Docker

| 平台 | 方式 |
|------|------|
| Windows | Docker Desktop（需 WSL2）|
| macOS | Docker Desktop |
| Linux | 包管理器安装 `docker.io` 或 `docker-ce` |

验证安装：

```bash
docker --version
docker run hello-world
```

## 常用命令

### 镜像管理

```bash
docker images                  # 列出本地镜像
docker pull nginx:latest       # 拉取镜像
docker rmi nginx               # 删除镜像
docker build -t myapp:1.0 .    # 构建镜像
```

### 容器管理

```bash
docker ps                      # 查看运行中的容器
docker ps -a                   # 查看所有容器
docker run -d -p 8080:80 nginx # 后台运行并映射端口
docker stop <容器ID>           # 停止容器
docker start <容器ID>          # 启动已停止的容器
docker rm <容器ID>             # 删除容器
docker logs -f <容器ID>        # 查看日志
docker exec -it <容器ID> sh    # 进入容器内部
```

## 实战：构建一个 Web 应用

### 1. 创建应用

创建 `app.py`：

```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello from Docker!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

创建 `requirements.txt`：

```
flask==3.1.0
```

### 2. 编写 Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

### 3. 构建并运行

```bash
docker build -t my-flask-app .
docker run -d -p 5000:5000 --name my-app my-flask-app
```

访问 `http://localhost:5000` 即可看到页面。

### 4. 常用管理

```bash
docker stop my-app
docker rm my-app
docker run -d -p 5000:5000 --name my-app my-flask-app
```

## Docker Compose：编排多容器

当应用需要多个服务（前端 + 后端 + 数据库）时，手动管理每个容器很繁琐。**Docker Compose** 通过一个 YAML 文件定义整个应用栈。

创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=db
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d      # 启动所有服务
docker compose down       # 停止并清理
docker compose logs -f    # 查看所有服务日志
```

## 数据持久化：Volumes

容器删除后，内部数据也会消失。**Volume** 是 Docker 推荐的数据持久化方式：

```bash
docker run -v mydata:/data myapp    # 命名卷，Docker 管理
docker run -v $(pwd)/data:/data myapp  # 绑定挂载
```

```yaml
# docker-compose.yml 中的 volumes
volumes:
  pgdata:
```

## 镜像体积优化

| 实践 | 效果 |
|------|------|
| 使用 `-alpine` 或 `-slim` 基础镜像 | 从 GB 级降到 MB 级 |
| 多阶段构建（Multi-stage Build）| 只保留运行所需文件 |
| 合并 `RUN` 命令 | 减少层数 |
| 清理缓存 | `apt clean`、`npm cache clean` |

### 多阶段构建示例

```dockerfile
# 第一阶段：编译
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o myapp

# 第二阶段：运行（极小镜像）
FROM alpine:latest
COPY --from=builder /app/myapp .
CMD ["./myapp"]
```

最终镜像只包含编译好的二进制文件，没有 Go 编译器等多余内容。

## 生产最佳实践

| 实践 | 说明 |
|------|------|
| 使用具体版本标签 | 不用 `latest`，用 `nginx:1.27-alpine` |
| 以非 root 用户运行 | 创建专用用户运行容器进程 |
| 健康检查 | 在 Dockerfile 中添加 `HEALTHCHECK` 指令 |
| 资源限制 | `docker run --memory=512m --cpus=1` |
| 日志管理 | 容器日志输出到 stdout/stderr，由 Docker 收集 |
| 安全扫描 | `docker scan` 或 Trivy 扫描镜像漏洞 |

## 总结

| 概念 | 一句话 |
|------|--------|
| 镜像（Image） | 只读模板，包含应用和环境 |
| 容器（Container）| 镜像的运行实例，隔离的进程 |
| Dockerfile | 定义如何构建镜像 |
| Compose | 定义多容器应用栈 |
| Volume | 持久化数据 |
| Registry | 存储和分发镜像 |

Docker 是现代软件交付的基石技术。掌握它，就能彻底告别"在我机器上能跑"的问题。
