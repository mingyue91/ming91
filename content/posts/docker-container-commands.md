---
title: "Docker 容器管理命令详解"
description: "create、run、start、stop、restart、pause、kill、rm、exec、logs、cp、inspect、stats——Docker 容器完整生命周期管理"
date: 2026-05-27T00:00:00+08:00
slug: docker-container-commands
categories: ["容器Docker"]
tags: ["docker", "容器", "入门"]
draft: false
---

## 概述

容器是 Docker 的核心运行单元。本文覆盖容器从创建到销毁的**全部生命周期命令**。

---

## docker create —— 创建容器

创建一个容器但不启动。

```bash
docker create --name myapp -p 8080:80 nginx:alpine
```

与 `docker run` 参数完全相同，区别仅在于不启动。常与 `docker start` 配合：

```bash
docker create -v mydata:/data --name backup alpine
docker start backup
```

---

## docker run —— 创建并启动容器（最常用）

`docker run = docker create + docker start`。

```bash
docker run -d --name web -p 8080:80 nginx:alpine
```

### 常用参数

| 参数 | 说明 |
|------|------|
| `-d` | 后台运行 |
| `--name` | 指定容器名 |
| `-p host:container` | 端口映射 |
| `-P` | 映射所有 EXPOSE 端口 |
| `-v host:container` | 挂载卷 |
| `-e KEY=value` | 环境变量 |
| `--network` | 指定网络 |
| `--restart always` | 重启策略 |
| `--rm` | 容器停止后自动删除 |
| `-it` | 交互模式（常与 `bash` 搭配） |
| `--memory=512m` | 内存限制 |
| `--cpus=1` | CPU 限制 |

```bash
docker run -it --rm ubuntu bash       # 交互式运行，退出即删
docker run -d --restart unless-stopped redis:alpine
```

---

## docker start / stop / restart —— 启停容器

```bash
docker start mycontainer
docker stop mycontainer        # 发送 SIGTERM，等待 10s 后 SIGKILL
docker stop -t 30 mycontainer  # 自定义等待时间
docker restart mycontainer     # 相当于 stop + start
```

`docker stop` 流程：

```
docker stop → STOPSIGNAL (默认 SIGTERM) → 等待 10s → SIGKILL
```

---

## docker pause / unpause —— 暂停容器

使用 cgroups freezer 暂停容器进程，**不释放资源**。

```bash
docker pause mycontainer       # 冻结所有进程
docker unpause mycontainer     # 恢复运行
```

与 `stop` 的区别：

| | stop | pause |
|--|------|-------|
| 进程状态 | 终止 | 冻结（内存保留） |
| 释放 CPU/内存 | ✅ | ❌ |
| 恢复方式 | start | unpause |

---

## docker kill —— 强制停止

直接发送指定信号（默认 SIGKILL）。

```bash
docker kill mycontainer
docker kill -s SIGUSR1 mycontainer   # 自定义信号
```

---

## docker rm —— 删除容器

```bash
docker rm mycontainer                 # 删除已停止的容器
docker rm -f mycontainer              # 强制删除运行中的
docker rm $(docker ps -aq)            # 删除所有容器
docker container prune                # 删除所有已停止的
```

| 参数 | 说明 |
|------|------|
| `-f` | 强制删除（先 SIGKILL） |
| `-v` | 同时删除匿名 volume |

---

## docker exec —— 在运行中的容器执行命令

```bash
docker exec -it mycontainer bash        # 进入容器
docker exec myapp cat /etc/hosts        # 查看文件
docker exec -d myapp touch /tmp/test    # 后台执行
```

| 参数 | 说明 |
|------|------|
| `-i` | 交互式 |
| `-t` | 分配伪终端 |
| `-d` | 后台执行 |
| `-e` | 设置环境变量 |
| `-w` | 指定工作目录 |

```bash
docker exec -it mysql mysql -uroot -p        # 连接数据库
docker exec -it -w /app node bash            # 指定工作目录进入
```

---

## docker logs —— 查看日志

```bash
docker logs mycontainer              # 查看全部日志
docker logs -f mycontainer           # 实时跟踪（类似 tail -f）
docker logs --tail 100 mycontainer   # 仅看最后 100 行
docker logs -t mycontainer           # 显示时间戳
docker logs --since 5m mycontainer   # 最近 5 分钟
docker logs --until 2026-05-27T10:00:00Z mycontainer
```

---

## docker ps —— 列出容器

```bash
docker ps                  # 仅运行中
docker ps -a               # 全部（含已停止）
docker ps -q               # 仅 ID（便于管道操作）
docker ps --filter "name=my" --filter "status=exited"
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### 常用 filter

```bash
docker ps -a --filter "name=web"          # 按名称
docker ps -a --filter "status=exited"     # 按状态
docker ps -a --filter "before=myapp"      # 在某容器之前创建
docker ps -a --filter "since=myapp"       # 在某容器之后创建
docker ps -a --filter "label=version=1"   # 按标签
```

---

## docker inspect —— 查看容器详细信息

返回 JSON 格式的完整元数据。

```bash
docker inspect mycontainer                        # 全部信息
docker inspect --format='{{.State.Status}}' my    # 只看状态
docker inspect --format='{{json .Mounts}}' my     # 查看挂载
docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my
```

---

## docker stats —— 实时资源监控

```bash
docker stats                    # 所有容器
docker stats my1 my2            # 指定容器
docker stats --no-stream        # 单次输出
```

输出 CPU、内存、网络 I/O、磁盘 I/O。

---

## docker top —— 查看容器进程

```bash
docker top mycontainer          # 列出容器内的进程
docker top mycontainer aux      # 类似 ps aux
```

---

## docker port —— 查看端口映射

```bash
docker port mycontainer         # 列出所有端口映射
docker port mycontainer 80      # 查看 80 映射到宿主机哪个端口
```

---

## docker cp —— 容器与宿主机之间复制文件

```bash
docker cp myapp:/app/log.txt ./            # 从容器复制到宿主机
docker cp ./config.yml myapp:/app/         # 从宿主机复制到容器
docker cp myapp:/app/logs ./logs/          # 复制目录
```

---

## docker diff —— 查看容器文件变化

列出容器文件系统与镜像的差异。

```bash
docker diff mycontainer

# 输出示例
C /app        # Changed
A /app/config.json   # Added
D /tmp/build        # Deleted
```

| 标记 | 含义 |
|------|------|
| `A` | 新增文件 |
| `D` | 删除文件 |
| `C` | 修改文件 |

---

## docker commit —— 从容器创建新镜像

将容器的当前状态保存为新镜像。

```bash
docker commit myapp myapp:snapshot-1
docker commit -m "Add debug tools" -a "min9" myapp myapp:debug
```

> **注意**：commit 创建的镜像不可复现，**不推荐**用于生产。应使用 Dockerfile 构建。

---

## docker export / import —— 导出/导入容器文件系统

```bash
docker export myapp > myapp.tar                     # 导出容器文件系统
docker import myapp.tar myapp:imported              # 导入为镜像
docker export myapp | gzip > myapp.tar.gz           # 压缩导出
```

与 `save/load` 的区别：

| | export/import | save/load |
|--|--------------|-----------|
| 对象 | 容器文件系统 | 镜像（含层+元数据） |
| 大小 | 较小（无历史层） | 较大（完整层级） |
| 恢复 | 创建新镜像（丢弃历史） | 完整恢复 |
| 场景 | 备份/迁移容器数据 | 镜像分发 |

---

## docker rename —— 重命名容器

```bash
docker rename old-name new-name
```

---

## docker wait —— 等待容器退出

阻塞直到容器退出，返回退出码。

```bash
docker wait mycontainer
# 容器退出后输出退出码 (0)
```

常用于脚本编排：

```bash
docker start myapp && docker wait myapp && docker rm myapp
```

---

## 命令速查表

| 命令 | 作用 | 常用参数 |
|------|------|---------|
| `create` | 创建容器不启动 | `--name`, `-p`, `-v`, `-e` |
| `run` | 创建并启动 | `-d`, `--name`, `-p`, `-it`, `--rm` |
| `start` | 启动已停止容器 | — |
| `stop` | 优雅停止 | `-t` 超时时间 |
| `restart` | 重启 | `-t` 超时时间 |
| `pause` | 暂停（冻结） | — |
| `unpause` | 恢复暂停 | — |
| `kill` | 强制停止 | `-s` 信号 |
| `rm` | 删除容器 | `-f`, `-v` |
| `exec` | 在容器内执行命令 | `-it`, `-d`, `-e`, `-w` |
| `logs` | 查看日志 | `-f`, `--tail`, `--since` |
| `ps` | 列出容器 | `-a`, `-q`, `--filter` |
| `inspect` | 查看详细信息 | `--format` |
| `stats` | 实时资源监控 | `--no-stream` |
| `top` | 查看进程 | — |
| `port` | 查看端口映射 | — |
| `cp` | 复制文件 | — |
| `diff` | 查看文件变更 | — |
| `commit` | 从容器创建镜像 | `-m`, `-a` |
| `export` | 导出文件系统 | — |
| `import` | 导入为镜像 | — |
| `rename` | 重命名 | — |
| `wait` | 等待退出 | — |
