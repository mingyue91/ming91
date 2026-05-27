---
title: "Docker 存储与网络命令详解"
description: "volume、network、system 三大子系统——管理数据持久化、容器网络和 Docker 系统资源"
date: 2026-05-27T00:00:00+08:00
slug: docker-storage-network
categories: ["容器Docker"]
tags: ["docker", "volume", "网络", "进阶"]
draft: false
---

## 概述

除容器和镜像外，Docker 还有三大核心子系统：**存储（Volume）**、**网络（Network）**、**系统管理（System）**。掌握这些命令才能在生产环境中游刃有余。

---

# 一、存储管理（docker volume）

## docker volume create —— 创建卷

```bash
docker volume create mydata
docker volume create --driver local --label env=prod mydata
docker volume create --opt type=nfs --opt o=addr=192.168.1.1,rw --opt device=:/path nfs-volume
```

---

## docker volume ls —— 列出卷

```bash
docker volume ls
docker volume ls -q                    # 仅名称
docker volume ls --filter "dangling=true"   # 未被容器使用的卷
docker volume ls --filter "label=env=prod"
```

---

## docker volume inspect —— 查看卷详情

```bash
docker volume inspect mydata

[
    {
        "CreatedAt": "2026-05-27T10:00:00Z",
        "Driver": "local",
        "Mountpoint": "/var/lib/docker/volumes/mydata/_data",
        "Name": "mydata",
        "Options": {},
        "Scope": "local"
    }
]
```

---

## docker volume rm —— 删除卷

```bash
docker volume rm mydata
docker volume rm $(docker volume ls -q)            # 删除全部
```

---

## docker volume prune —— 清理未使用的卷

```bash
docker volume prune                     # 交互确认
docker volume prune -f                  # 强制删除
```

> **注意**：`prune` 只删除不被任何容器使用的卷。运行中的容器即使没在用也不会被删除。

---

## 挂载 volume 到容器

```bash
docker run -v mydata:/data myapp                          # 命名卷（推荐）
docker run -v /host/path:/container/path myapp            # 绑定挂载
docker run --mount source=mydata,target=/data myapp       # --mount 语法（更详细）
```

### 挂载类型对比

| 类型 | 命令格式 | 适用场景 |
|------|---------|---------|
| 命名卷 | `-v mydata:/data` | 生产数据持久化 |
| 绑定挂载 | `-v $(pwd):/app` | 开发热重载 |
| tmpfs | `--tmpfs /tmp` | 临时敏感数据 |

### --mount 详解

```bash
docker run \
  --mount type=volume,source=mydata,target=/data,readonly \
  --mount type=bind,source=$(pwd)/config,target=/app/config \
  --mount type=tmpfs,target=/tmp,tmpfs-size=100m \
  myapp
```

---

## 数据卷备份与恢复

```bash
# 备份
docker run --rm -v mydata:/data -v $(pwd):/backup alpine \
    tar czf /backup/mydata-backup.tar.gz -C /data .

# 恢复
docker run --rm -v mydata:/data -v $(pwd):/backup alpine \
    tar xzf /backup/mydata-backup.tar.gz -C /data
```

---

# 二、网络管理（docker network）

---

## docker network create —— 创建网络

```bash
docker network create mynet
docker network create --driver bridge mynet       # 桥接（默认）
docker network create --driver overlay mynet      # 覆盖网络（Swarm）
docker network create --driver macvlan \
    --subnet=192.168.1.0/24 --gateway=192.168.1.1 \
    -o parent=eth0 my-macvlan-net
```

### 网络驱动

| 驱动 | 说明 | 适用场景 |
|------|------|---------|
| `bridge` | 默认，单机通信 | 单机容器互联 |
| `host` | 共享宿主机网络栈 | 性能敏感场景 |
| `none` | 无网络 | 安全隔离 |
| `overlay` | 跨主机通信 | Swarm 集群 |
| `macvlan` | 分配 MAC 地址 | 直接接入物理网络 |

---

## docker network ls —— 列出网络

```bash
docker network ls
docker network ls -q
docker network ls --filter "driver=bridge"
```

---

## docker network inspect —— 查看网络详情

```bash
docker network inspect mynet

# 查看哪些容器在该网络上
docker network inspect --format='{{range .Containers}}{{.Name}} {{end}}' mynet
```

---

## docker network connect —— 将容器接入网络

```bash
docker network connect mynet mycontainer
docker network connect --alias api mynet mycontainer   # 网络别名
docker network connect --ip 172.20.0.10 mynet mycontainer  # 指定 IP
```

---

## docker network disconnect —— 将容器断开网络

```bash
docker network disconnect mynet mycontainer
docker network disconnect -f mynet mycontainer   # 强制断开
```

---

## docker network rm —— 删除网络

```bash
docker network rm mynet
```

---

## docker network prune —— 清理未使用的网络

```bash
docker network prune
docker network prune -f
```

---

## 网络通信实战

```bash
# 创建自定义网络（容器名作为 DNS 名称）
docker network create app-net

# 启动服务
docker run -d --name redis --network app-net redis:alpine
docker run -d --name web --network app-net -p 8080:80 nginx:alpine

# web 容器内可以直接 ping redis
docker exec web ping redis
```

---

# 三、系统管理（docker system）

---

## docker system df —— 查看磁盘使用

```bash
docker system df                # 镜像、容器、卷、构建缓存的使用量
docker system df -v             # 详细信息

TYPE            TOTAL     ACTIVE    SIZE        RECLAIMABLE
Images          5         2         1.2GB       800MB (66%)
Containers      8         3         50MB        20MB (40%)
Local Volumes   4         2         200MB       100MB (50%)
Build Cache     12        0         300MB       300MB (100%)
```

---

## docker system prune —— 批量清理

```bash
docker system prune                  # 清理停止的容器、悬空镜像、未用网络、构建缓存
docker system prune -a               # 清理所有未使用的镜像（含已标记的）
docker system prune -a --volumes     # 连未使用的 volume 一起清理
docker system prune -f               # 不提示直接清理
```

| 参数 | 清理内容 |
|------|---------|
| 无参数 | 停止的容器、悬空镜像、未用网络、构建缓存 |
| `-a` | 所有未使用的镜像 |
| `--volumes` | 所有未使用的 volume |
| `-f` | 不提示确认 |

### 专项 prune

```bash
docker container prune     # 停止的容器
docker image prune         # 悬空镜像
docker image prune -a      # 所有未使用镜像
docker volume prune        # 未使用卷
docker network prune       # 未使用网络
docker builder prune       # 构建缓存
```

---

## docker system events —— 实时事件流

实时查看 Docker 守护进程事件。

```bash
docker system events                # 实时显示所有事件
docker system events --since 5m     # 最近 5 分钟
docker system events --filter 'type=container' --filter 'event=start'
```

### 事件过滤

```bash
docker system events --filter 'type=image' --filter 'event=push'
docker system events --filter 'container=myapp'
```

输出示例：

```
2026-05-27 10:00:00.123 container start 456abc... (name=myapp)
2026-05-27 10:00:05.456 image pull 789def... (name=nginx:alpine)
```

---

## docker system info —— 系统信息

```bash
docker info
docker system info                # 等效

# 常用信息提取
docker info --format '{{.OSType}}'       # 操作系统类型
docker info --format '{{.ServerVersion}}' # Docker 版本
docker info --format '{{.DockerRootDir}}' # Docker 数据目录
```

---

## docker version —— 版本信息

```bash
docker version                   # 客户端+服务端
docker version --format '{{.Server.Version}}'
```

---

## docker system dial-stdio —— （调试用）

将标准 I/O 转发到 Docker 服务端的标准 I/O。通常用于调试。

---

## 命令速查表

### volume

| 命令 | 作用 |
|------|------|
| `volume create` | 创建卷 |
| `volume ls` | 列出卷 |
| `volume inspect` | 查看详情 |
| `volume rm` | 删除卷 |
| `volume prune` | 清理未用卷 |

### network

| 命令 | 作用 |
|------|------|
| `network create` | 创建网络 |
| `network ls` | 列出网络 |
| `network inspect` | 查看详情 |
| `network connect` | 接入容器 |
| `network disconnect` | 断开容器 |
| `network rm` | 删除网络 |
| `network prune` | 清理未用网络 |

### system

| 命令 | 作用 |
|------|------|
| `system df` | 磁盘使用 |
| `system prune` | 批量清理 |
| `system events` | 实时事件 |
| `system info` | 系统信息 |
| `version` | 版本信息 |
