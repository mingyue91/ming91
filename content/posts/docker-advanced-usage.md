---
title: "Docker 高级用法：入门之后该学什么"
description: "网络、数据卷、Dockerfile 优化、Compose——从会跑到会飞"
date: 2026-05-26T00:00:00+08:00
slug: docker-advanced-usage
categories: ["容器Docker"]
tags: ["docker", "容器", "进阶", "compose", "网络"]
draft: false
---

如果你已经会用 `docker run`、`docker ps` 这些基础命令，但对 Docker 的理解还停留在"跑个容器"的阶段，这篇文章就是为你准备的。

下面这些技能是日常开发中最实用的，不涉及 K8s 或 Swarm，学完马上能用。

## 一、Dockerfile 优化

### 1. 减少镜像层数

Dockerfile 里每个 `RUN`、`COPY`、`ADD` 都会产生一层。层数越多镜像越大，构建也越慢。

**不推荐（每步一层）：**

```dockerfile
RUN apt-get update
RUN apt-get install -y python3
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*
```

**推荐（合并成一层）：**

```dockerfile
RUN apt-get update && apt-get install -y python3 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
```

### 2. 利用构建缓存

Docker 构建时会逐层检查缓存。把**不经常变的东西放前面**，可以大幅加速构建。

```dockerfile
# 先拷贝依赖描述文件（很少变）
COPY package.json requirements.txt ./
RUN npm install    # 利用缓存，只要 package.json 没变就不重装

# 再拷贝源码（经常变）
COPY . .
```

这样改了代码后重新构建，只重新执行最后几步，省掉了 `npm install` 的时间。

### 3. 多阶段构建

这是最实用的进阶技巧。一个 Dockerfile 里写多个 `FROM`，前面的用来编译，后面的只取编译产物，最终镜像极小。

```dockerfile
# 第一阶段：编译
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o myapp

# 第二阶段：运行
FROM alpine:latest
COPY --from=builder /app/myapp .
CMD ["./myapp"]
```

最终镜像只有几 MB（alpine + 二进制文件），不包含 Go 编译器等多余内容。

### 4. 使用更小的基础镜像

| 基础镜像 | 大小 | 适用场景 |
|----------|------|----------|
| `ubuntu:22.04` | ~77MB | 需要完整系统工具 |
| `debian:slim` | ~80MB | 比 ubuntu 精简一点 |
| `alpine` | ~5MB | 极致精简，但包管理器不同 |
| `scratch` | 0MB | 纯静态二进制，啥都没有 |

选择指南：
- 用 Go、Rust 等编译型语言 → `alpine` 或 `scratch`
- 用 Python、Node 等解释型语言 → 官方带 `-slim` 标签的镜像
- 不确定 → 先用官方镜像，运行正常再换 `-slim`

## 二、自定义网络

Docker 默认有三种网络：`bridge`、`host`、`none`。但更常用的是**自定义网络**。

### 为什么要自定义网络？

默认情况下，容器通过 IP 地址通信。但容器重启后 IP 会变。自定义网络支持**容器名解析**——你可以用名字代替 IP。

```bash
# 创建自定义网络
docker network create my-network

# 启动两个容器，都连到同一个网络
docker run -d --name web --network my-network nginx
docker run -d --name db --network my-network mysql:8.0

# web 容器里可以直接 ping "db"，不需要 IP
docker exec web ping db
```

这对于微服务和 Docker Compose 来说非常重要。

### 常用网络命令

```bash
# 查看所有网络
docker network ls

# 查看某个网络的详情（有哪些容器）
docker network inspect my-network

# 将已有容器连到网络
docker network connect my-network web

# 断开
docker network disconnect my-network web
```

## 三、数据卷进阶

你大概已经知道 `-v` 挂载数据卷来持久化数据。但数据卷还有更多用法。

### 命名卷 vs 绑定挂载

```bash
# 命名卷（Docker 管理，推荐）
docker run -v mydata:/data myapp

# 绑定挂载（你指定路径）
docker run -v /宿主机/路径:/data myapp
```

命名卷的优点：
- 不用关心路径在哪
- `docker volume prune` 可以清理无用卷
- 跨平台可移植

绑定挂载的优点：
- 方便查看和修改数据
- 适合开发时热更新代码

### 数据卷容器（Volume Container）

```bash
# 创建一个只存放数据的容器
docker create -v /data --name data-container busybox

# 其他容器共享这个容器的数据卷
docker run --volumes-from data-container nginx
```

现在已经不太常用（Docker Compose 的 `volumes_from` 能做得更好），但老项目中可能遇到。

### 只读挂载

防止容器修改宿主机的配置文件：

```bash
docker run -v /宿主机/config:/config:ro myapp
```

`:ro` 表示只读（read-only），容器只能读不能写。

### tmpfs 挂载（内存中读写）

适合存放临时文件（如缓存、session），速度快且不持久化：

```bash
docker run --tmpfs /tmp myapp
```

## 四、dockerignore

类似 `.gitignore`，在构建镜像时排除不必要的文件，减小镜像体积。

创建 `.dockerignore`：

```
node_modules
.git
*.log
.env
.gitignore
Dockerfile
.dockerignore
README.md
```

效果：
- 构建上下文变小，构建速度提升
- 不会把 `node_modules` 或 `.env` 打包进镜像

## 五、健康检查

Docker 可以定期检查容器是否"健康"。如果挂了，可以自动重启或通知你。

### 在 Dockerfile 中声明

```dockerfile
FROM nginx
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost/ || exit 1
```

参数含义：

| 参数 | 默认值 | 作用 |
|------|--------|------|
| `--interval=30s` | 30s | 每隔多久检查一次 |
| `--timeout=3s` | 30s | 单次检查超时时间 |
| `--retries=3` | 3 | 连续失败多少次视为不健康 |
| `--start-period=5s` | 0s | 容器启动后多久开始检查 |

### 在 docker run 中指定

```bash
docker run --health-cmd="curl -f http://localhost/ || exit 1" \
           --health-interval=30s \
           --health-retries=3 \
           nginx
```

### 查看健康状态

```bash
docker ps
# STATUS 列会显示 healthy 或 unhealthy

docker inspect --format='{{json .State.Health}}' 容器名
```

## 六、资源限制

限制容器能使用的 CPU 和内存，防止某个容器占满宿主机。

```bash
# 限制内存为 512MB，CPU 使用 1.5 核
docker run --memory=512m --cpus=1.5 myapp
```

```bash
# 限制 CPU 权重（默认 1024），数字越高优先级越高
docker run --cpu-shares=2048 myapp

# 限制内存+swap 总量
docker run --memory=256m --memory-swap=512m myapp
```

在 Docker Compose 中：

```yaml
services:
  myapp:
    image: myapp
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

## 七、环境变量与 .env

### 多环境变量注入

```bash
# 逐个设置
docker run -e DB_HOST=localhost -e DB_PORT=3306 myapp

# 从文件读取（每行 KEY=VALUE）
docker run --env-file ./prod.env myapp
```

### Docker Compose 中使用 .env

创建 `.env` 文件（不要提交到 Git）：

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
```

在 `docker-compose.yml` 中引用：

```yaml
services:
  myapp:
    image: myapp
    environment:
      - DB_HOST=${DB_HOST}
      - DB_PASSWORD=${DB_PASSWORD}
```

创建 `.env.example` 提交到 Git，让别人知道需要哪些变量：

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
```

## 八、日志管理

容器日志默认输出到 stdout/stderr，由 Docker 收集。

```bash
# 查看实时日志
docker logs -f myapp

# 查看最近 100 行
docker logs --tail 100 myapp

# 查看带时间戳的日志
docker logs -t myapp
```

### 限制日志大小

不限制的话，日志可能撑爆磁盘。

```bash
docker run --log-opt max-size=10m --log-opt max-file=3 myapp
```

- `max-size=10m`：每个日志文件最大 10MB
- `max-file=3`：保留最近 3 个日志文件

Docker Compose 中：

```yaml
services:
  myapp:
    image: myapp
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

## 九、docker system 命令

```bash
# 查看磁盘使用情况（镜像、容器、数据卷各占多少）
docker system df

# 一键清理未使用的资源
docker system prune

# 清理所有未使用的资源，包括数据卷
docker system prune -a --volumes
```

## 十、实用小技巧

### 1. 进入容器查看文件

```bash
docker exec -it myapp sh
# 或使用 bash（如果容器有 bash）
docker exec -it myapp bash
```

### 2. 复制文件到/从容器

```bash
# 从宿主机复制到容器
docker cp /宿主机/文件.txt myapp:/容器路径/

# 从容器复制到宿主机
docker cp myapp:/容器路径/文件.txt /宿主机/
```

### 3. 查看容器内进程

```bash
docker top myapp
```

### 4. 查看容器端口映射

```bash
docker port myapp
```

### 5. 给容器起别名（标签）

```bash
docker tag myapp:latest myapp:1.0.0
```

### 6. 清理所有停止的容器

```bash
docker container prune
```

### 7. 一次性清理所有

```bash
docker system prune -a
```

这会删除所有停止的容器、未使用的网络、 dangling 镜像和构建缓存。

## 总结

| 知识点 | 一句话 |
|--------|--------|
| 多阶段构建 | 只保留运行所需文件，镜像极小 |
| 自定义网络 | 容器之间用名字通信，不用 IP |
| 命名卷 | Docker 管理数据，方便迁移 |
| 健康检查 | 自动检测容器是否正常 |
| 资源限制 | 防止某个容器占用全部资源 |
| .env 文件 | 环境变量和配置分离 |
| 日志限制 | 防止日志撑爆磁盘 |
| docker system prune | 一键清理垃圾 |

掌握了这些，你就不再只是"会用 Docker 跑命令"，而是能写出生产级 Dockerfile、编排多容器应用、管理资源的 Docker 用户了。
