
---
title: "Docker run 启动参数详解"
description: "从MySQL部署实例出发，全面讲解 docker run 命令的常用参数及最佳实践"
date: 2026-06-08T00:00:00+08:00
slug: docker-run-parameters
categories: ["容器Docker"]
tags: ["docker", "容器", "run", "参数", "MySQL"]
draft: false
---

## 本文实例

我们将从一个实际的MySQL部署命令开始：

```bash
docker run -d \
  --name db-server \
  --network my-network \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=testdb \
  mysql:8.0
```

这个命令虽然简单，但包含了最常用的几个参数。本文将逐个讲解 `docker run` 的核心参数。

## 基础参数

### 1. 后台运行：`-d, --detach`

```bash
docker run -d nginx
```

**作用**：在后台（守护进程）运行容器，不占用当前终端。

**对比**：
```bash
# 前台运行：Ctrl+C 就会停止容器
docker run nginx

# 后台运行：终端可继续使用
docker run -d nginx
```

**查看后台容器**：
```bash
docker ps          # 查看运行中的容器
docker logs -f <容器名/ID>  # 查看日志
```

### 2. 命名容器：`--name`

```bash
docker run -d --name my-container nginx
```

**作用**：给容器起一个可读性强的名字，便于后续管理。

**好处**：
```bash
# 不用背容器 ID
docker stop my-container    # 停止
docker start my-container   # 启动
docker logs my-container    # 看日志
```

**命名规范**：
- 使用小写字母、数字、下划线、连字符
- 避免特殊字符
- 具有语义，例如 `web-server`、`mysql-db`

## 网络参数

### 3. 网络：`--network`

```bash
docker run -d --network my-network nginx
```

**作用**：指定容器加入的网络，实现容器间通信。

**网络类型**：
```bash
# 默认网络（单节点）
docker network ls
# 输出：
# bridge   # 默认桥接网络
# host     # 共享主机网络栈
# none     # 无网络
```

**创建自定义网络**：
```bash
# 创建网络
docker network create my-network

# 两个容器加入同一网络可互相访问
docker run -d --name db --network my-network mysql:8.0
docker run -d --name web --network my-network nginx

# web 容器可以用 db 作为主机名访问数据库
# 例如：mysql -h db -u root -p
```

### 4. 端口映射：`-p, --publish`

```bash
docker run -d -p 8080:80 nginx
```

**格式**：`宿主机端口:容器端口`

**示例**：
```bash
# 宿主机 8080 → 容器 80
docker run -d -p 8080:80 nginx

# 只绑定 127.0.0.1（仅本地访问）
docker run -d -p 127.0.0.1:8080:80 nginx

# 多端口映射
docker run -d -p 8080:80 -p 8443:443 nginx
```

**验证端口映射**：
```bash
docker port <容器名>
# 输出：80/tcp -> 0.0.0.0:8080
```

### 5. 网络别名：`--network-alias`

```bash
docker run -d --network my-network --network-alias mysql-service mysql:8.0
```

**作用**：给容器在网络中起一个别名，其他容器可通过别名访问。

## 环境变量

### 6. 环境变量：`-e, --env`

```bash
docker run -d -e KEY=VALUE nginx
```

**作用**：向容器传递环境变量，配置应用。

**MySQL 示例**：
```bash
docker run -d \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=testdb \
  -e MYSQL_USER=admin \
  -e MYSQL_PASSWORD=admin123 \
  mysql:8.0
```

**常见用途**：
- 数据库密码
- API 密钥
- 运行模式（dev/prod）
- 时区设置

**查看容器环境变量**：
```bash
docker exec <容器名> env
```

**从文件加载**：
```bash
# 创建 .env 文件
# DB_PASSWORD=secret
# API_KEY=abc123

docker run -d --env-file .env myapp
```

## 数据持久化

### 7. 卷挂载：`-v, --volume`

```bash
docker run -d -v /host/path:/container/path nginx
```

**三种挂载方式**：

#### ① 命名卷（推荐）
```bash
# Docker 管理存储位置，数据持久化
docker run -d -v mysql-data:/var/lib/mysql mysql:8.0
```

#### ② 绑定挂载
```bash
# 直接挂载主机目录
docker run -d -v $(pwd)/data:/var/lib/mysql mysql:8.0
```

#### ③ 临时卷
```bash
# 容器删除后卷也删除
docker run -d --tmpfs /tmp nginx
```

**查看卷**：
```bash
docker volume ls
```

### 8. 只读卷：`:ro`

```bash
# 挂载配置文件为只读，防止容器修改
docker run -d -v $(pwd)/config:/app/config:ro nginx
```

## 资源限制

### 9. 内存限制：`--memory, -m`

```bash
docker run -d --memory=512m nginx
```

**单位**：`b`、`k`、`m`、`g`

```bash
# 最多使用 512MB 内存
docker run -d -m 512m nginx

# 预留 256MB 内存
docker run -d --memory-reservation=256m nginx
```

### 10. CPU 限制：`--cpus`

```bash
# 限制使用 1.5 个 CPU 核心
docker run -d --cpus=1.5 nginx

# 绑定到特定 CPU
docker run -d --cpuset-cpus=0-2 nginx  # 使用 0、1、2 号核心
```

## 生命周期参数

### 11. 自动重启：`--restart`

```bash
docker run -d --restart=always nginx
```

**重启策略**：
| 策略 | 说明 |
|------|------|
| `no` | 不自动重启（默认） |
| `always` | 总是重启，即使手动停止后 |
| `unless-stopped` | 除非手动停止，否则总是重启 |
| `on-failure` | 仅在退出码非 0 时重启 |

**示例**：
```bash
# 生产环境推荐
docker run -d --restart=unless-stopped nginx

# 最多重启 5 次
docker run -d --restart=on-failure:5 nginx
```

### 12. 自动清理：`--rm`

```bash
# 临时容器，退出后自动删除
docker run --rm -it alpine sh
```

### 13. 交互式运行：`-it`

```bash
docker run -it alpine sh
```

**组合说明**：
- `-i`：保持 STDIN 打开
- `-t`：分配伪终端

**进入已有容器**：
```bash
docker exec -it <容器名> sh
```

## 权限与安全

### 14. 以非 root 运行：`--user`

```bash
# 使用 UID 1000 运行
docker run -d --user 1000 nginx

# 使用用户和组
docker run -d --user 1000:1000 nginx
```

### 15. 特权模式：`--privileged`

```bash
# 不推荐，除非确实需要
docker run -d --privileged nginx
```

### 16. 能力限制：`--cap-add/--cap-drop`

```bash
# 只添加必要的能力
docker run -d --cap-drop=ALL --cap-add=NET_BIND_SERVICE nginx
```

## 其他实用参数

### 17. 健康检查

```bash
docker run -d \
  --health-cmd="curl -f http://localhost || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  nginx
```

### 18. 主机名：`--hostname`

```bash
docker run -d --hostname=web-server nginx
```

### 19. 工作目录：`-w, --workdir`

```bash
docker run -it -w /app alpine sh
```

## 完整生产示例

下面是一个生产级别的 MySQL 部署命令：

```bash
docker run -d \
  --name mysql-prod \
  --hostname mysql-prod \
  --network prod-network \
  --restart=unless-stopped \
  -p 3306:3306 \
  -v mysql-prod-data:/var/lib/mysql \
  -v /etc/localtime:/etc/localtime:ro \
  -v $(pwd)/mysql.conf:/etc/mysql/conf.d/custom.cnf:ro \
  -e MYSQL_ROOT_PASSWORD=$(cat secrets/root-pwd.txt) \
  -e MYSQL_DATABASE=appdb \
  -e MYSQL_USER=appuser \
  -e MYSQL_PASSWORD=$(cat secrets/user-pwd.txt) \
  -e TZ=Asia/Shanghai \
  --memory=2g \
  --cpus=2 \
  --health-cmd="mysqladmin ping -u root -p$(cat secrets/root-pwd.txt) || exit 1" \
  --health-interval=10s \
  --health-timeout=5s \
  --health-retries=3 \
  mysql:8.0
```

## 参数速查表

| 参数 | 作用 | 示例 |
|------|------|------|
| `-d` | 后台运行 | `-d` |
| `--name` | 命名容器 | `--name my-app` |
| `-p` | 端口映射 | `-p 8080:80` |
| `-e` | 环境变量 | `-e KEY=val` |
| `-v` | 卷挂载 | `-v data:/app/data` |
| `--network` | 指定网络 | `--network my-net` |
| `--restart` | 重启策略 | `--restart=always` |
| `--rm` | 自动删除 | `--rm` |
| `-it` | 交互终端 | `-it sh` |
| `-m` | 内存限制 | `-m 512m` |
| `--cpus` | CPU 限制 | `--cpus=1.5` |
| `-w` | 工作目录 | `-w /app` |
| `--user` | 运行用户 | `--user 1000` |

## 最佳实践

1. **使用具体版本标签**，避免 `latest`
2. **限制资源**，防止容器占用过多资源
3. **配置重启策略**，确保服务可靠性
4. **使用命名卷**，数据持久化更安全
5. **不要在命令行明文传密码**，使用环境文件或 Secret
6. **健康检查**，及时发现服务问题
7. **以非 root 用户运行**，提升安全性

## 总结

`docker run` 是 Docker 最常用的命令之一。掌握这些参数，你就能灵活地部署和管理容器化应用。从简单的单容器到复杂的生产环境，这些参数都能满足需求。
