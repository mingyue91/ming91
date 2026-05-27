---
title: "Docker Compose 命令详解"
description: "up、down、logs、exec、build、pull、ps、config——Docker Compose 全部子命令完整参考"
date: 2026-05-27T00:00:00+08:00
slug: docker-compose-commands
categories: ["容器Docker"]
tags: ["docker", "compose", "进阶"]
draft: false
---

## 概述

Docker Compose 通过 YAML 文件定义和管理多容器应用。本文覆盖 Compose V2（`docker compose` 命令，而非 `docker-compose`）的**全部子命令**。

---

## docker compose up —— 创建并启动服务

最常用的 Compose 命令。

```bash
docker compose up                        # 前台运行，显示日志
docker compose up -d                     # 后台运行
docker compose up -d --build             # 启动前重新构建
docker compose up -d --scale web=3       # 扩容到 3 个副本
docker compose up -d web db              # 仅启动指定服务
```

| 参数 | 说明 |
|------|------|
| `-d` | 后台运行 |
| `--build` | 启动前重新构建镜像 |
| `--no-build` | 不构建，仅使用已有镜像 |
| `--force-recreate` | 强制重新创建容器 |
| `--no-recreate` | 不重新创建已存在的容器 |
| `--scale SERVICE=NUM` | 设置服务副本数 |
| `-t, --timeout` | 容器停止超时时间 |
| `--remove-orphans` | 移除未在 compose 中定义但存在的容器 |

---

## docker compose down —— 停止并清理

```bash
docker compose down                         # 停止容器，默认不删卷
docker compose down -v                      # 同时删除 volume
docker compose down --rmi all               # 同时删除镜像
docker compose down --remove-orphans        # 清理不在 compose 中的容器
```

| 参数 | 说明 |
|------|------|
| `-v` | 删除命名 volume |
| `--rmi all` | 删除所有镜像 |
| `--rmi local` | 仅删除自定义镜像 |
| `--remove-orphans` | 移除不属于该项目的容器 |

---

## docker compose start —— 启动已存在的服务

```bash
docker compose start                     # 启动所有服务
docker compose start web db              # 启动指定服务
```

---

## docker compose stop —— 停止运行中的服务

```bash
docker compose stop                      # 停止所有
docker compose stop web                  # 停止指定服务
docker compose stop -t 30                # 超时 30s
```

---

## docker compose restart —— 重启服务

```bash
docker compose restart                   # 重启所有
docker compose restart web               # 重启指定服务
docker compose restart -t 30             # 超时 30s
```

---

## docker compose pause / unpause —— 暂停/恢复

```bash
docker compose pause                     # 暂停所有服务
docker compose unpause web               # 恢复指定服务
```

---

## docker compose ps —— 列出服务状态

```bash
docker compose ps                        # 列出所有服务容器状态
docker compose ps -a                     # 包含已停止的
docker compose ps --filter "status=running"
docker compose ps -q                     # 仅输出 ID
```

---

## docker compose logs —— 查看服务日志

```bash
docker compose logs                      # 查看所有服务日志
docker compose logs -f                   # 实时跟踪
docker compose logs web                  # 仅查看 web 服务
docker compose logs --tail=100 web       # 仅最后 100 行
docker compose logs -t                   # 显示时间戳
docker compose logs --since "5m" web     # 最近 5 分钟
```

---

## docker compose exec —— 在运行中的服务中执行命令

```bash
docker compose exec web bash             # 进入 web 容器
docker compose exec -T db pg_dump -U postgres > backup.sql  # 非交互执行
docker compose exec -it web sh           # 交互模式
```

| 参数 | 说明 |
|------|------|
| `-i` | 交互式 |
| `-t` | 分配伪终端 |
| `-d` | 后台执行 |
| `-e KEY=value` | 设置环境变量 |
| `-T` | 禁用伪终端（适合管道重定向） |
| `--index` | 指定副本索引（有 scale 时） |

---

## docker compose run —— 启动一次性命令

在服务的新容器中执行命令。类似 `docker run`，但使用 compose 的服务配置。

```bash
docker compose run web npm test                    # 运行测试
docker compose run --rm web bash                   # 交互式 shell，退出后删除
docker compose run -e DEBUG=1 web node app.js      # 覆盖环境变量
docker compose run --no-deps web yarn install       # 不启动依赖服务
```

| 参数 | 说明 |
|------|------|
| `-d` | 后台运行 |
| `--rm` | 退出后自动删除容器 |
| `--no-deps` | 不启动依赖服务 |
| `-e` | 设置环境变量 |
| `-v` | 挂载卷 |
| `--service-ports` | 启用服务定义的端口映射 |

---

## docker compose build —— 构建服务镜像

```bash
docker compose build                     # 构建所有服务
docker compose build web                 # 仅构建 web 服务
docker compose build --no-cache          # 禁用缓存
docker compose build --pull              # 拉取最新基础镜像
```

---

## docker compose pull —— 拉取服务镜像

```bash
docker compose pull                      # 拉取所有服务的镜像
docker compose pull web                  # 仅拉取 web 服务
docker compose pull --ignore-buildable   # 忽略可构建的服务
docker compose pull -q                   # 静默模式
```

---

## docker compose push —— 推送服务镜像

```bash
docker compose push                      # 推送所有已构建的镜像
docker compose push web                  # 仅推送 web 服务
```

---

## docker compose config —— 验证和查看 Compose 配置

```bash
docker compose config                    # 验证并展开配置
docker compose config --services         # 列出所有服务名
docker compose config --volumes          # 列出所有卷
docker compose config --hash web         # 查看 web 服务配置的哈希
docker compose config -q                 # 仅验证（无输出，看退出码）
```

---

## docker compose create —— 创建服务容器（不启动）

```bash
docker compose create                    # 创建所有容器
docker compose create web                # 仅创建 web 容器
```

---

## docker compose rm —— 删除已停止的服务容器

```bash
docker compose rm                        # 删除已停止的服务容器
docker compose rm -f                     # 强制删除（含运行中的）
docker compose rm -v                     # 同时删除匿名卷
docker compose rm -s                     # 先 stop 再 rm
```

---

## docker compose top —— 查看服务进程

```bash
docker compose top                       # 查看所有服务进程
docker compose top web                   # 查看 web 服务进程
```

---

## docker compose events —— 实时服务事件

```bash
docker compose events                    # 所有服务的事件
docker compose events web                # 仅 web 服务事件
docker compose events --json             # JSON 格式输出
```

---

## docker compose images —— 查看服务使用的镜像

```bash
docker compose images                    # 列出所有服务使用的镜像
docker compose images -q                 # 仅镜像 ID
```

---

## docker compose kill —— 强制停止服务

```bash
docker compose kill                      # 强制停止所有（SIGKILL）
docker compose kill -s SIGINT web        # 发送指定信号
```

---

## docker compose port —— 查看端口映射

```bash
docker compose port web 80               # 查看 web 服务 80 端口映射
docker compose port --protocol udp web 53
```

---

## docker compose version —— 版本

```bash
docker compose version
docker compose version --short
```

---

## docker compose 实用技巧

### .env 文件

Compose 自动读取项目目录下的 `.env` 文件：

```bash
# .env
DB_PASSWORD=secret123
APP_ENV=production
```

```yaml
# docker-compose.yml
services:
  web:
    image: myapp
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
      - APP_ENV=${APP_ENV}
```

### profiles —— 按需启动服务

```yaml
services:
  web:
    image: nginx
  admin:
    image: admin
    profiles: ["debug"]
```

```bash
docker compose up                    # 仅启动 web
docker compose --profile debug up    # 启动 web + admin
```

### depends_on —— 控制启动顺序

```yaml
services:
  web:
    build: .
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD", "pg_isready"]
```

---

## 命令速查表

| 命令 | 作用 | 常用参数 |
|------|------|---------|
| `up` | 创建并启动 | `-d`, `--build`, `--scale` |
| `down` | 停止并清理 | `-v`, `--rmi` |
| `start` | 启动已有服务 | — |
| `stop` | 停止服务 | `-t` |
| `restart` | 重启服务 | `-t` |
| `pause` | 暂停服务 | — |
| `unpause` | 恢复服务 | — |
| `ps` | 列出状态 | `-a`, `-q` |
| `logs` | 查看日志 | `-f`, `--tail`, `--since` |
| `exec` | 执行命令 | `-it`, `-T`, `-e` |
| `run` | 运行一次性命令 | `--rm`, `--no-deps` |
| `build` | 构建镜像 | `--no-cache`, `--pull` |
| `pull` | 拉取镜像 | — |
| `push` | 推送镜像 | — |
| `config` | 验证配置 | `--services`, `--volumes` |
| `create` | 创建不启动 | — |
| `rm` | 删除容器 | `-f`, `-v` |
| `top` | 查看进程 | — |
| `events` | 实时事件 | `--json` |
| `images` | 查看镜像 | `-q` |
| `kill` | 强制停止 | `-s` |
| `port` | 查看端口映射 | — |
