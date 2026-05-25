---
title: "Docker 部署 MySQL 完整指南"
description: "从拉取镜像到数据持久化，每个参数都讲清楚"
date: 2026-05-25T00:00:00+08:00
slug: docker-mysql-deploy
categories: ["容器Docker"]
tags: ["docker", "mysql", "数据库", "部署"]
draft: false
---

## 为什么用 Docker 跑 MySQL？

传统安装 MySQL 的痛点：
- 下载安装包，下一步下一步，不同系统还不一样
- 卸载不干净，残留文件和服务
- 想换版本要重新折腾

Docker 方案：**一行命令启动，一行命令删除，版本随意切换**。

## 拉取 MySQL 镜像

```bash
docker pull mysql:8.0
```

- `mysql` 是镜像名
- `8.0` 是标签（版本号），也可以写 `5.7`、`8.4` 或 `latest`（当前最新）

查看已拉取的镜像：

```bash
docker images
```

## 启动 MySQL 容器

### 最简单的启动方式

```bash
docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=123456 -d mysql:8.0
```

这条命令拆开看：

| 参数 | 含义 |
|------|------|
| `docker run` | 创建并启动容器 |
| `--name mysql-dev` | 给容器起个名字，后续操作都用这名字 |
| `-e MYSQL_ROOT_PASSWORD=123456` | 设置环境变量，指定 root 密码 |
| `-d` | 后台运行（detach），不霸占终端 |
| `mysql:8.0` | 用哪个镜像 |

启动后查看容器状态：

```bash
docker ps
```

看到 `STATUS` 列为 `Up` 就说明跑起来了。

### 连接试试

```bash
docker exec -it mysql-dev mysql -uroot -p
```

| 参数 | 含义 |
|------|------|
| `docker exec` | 在运行中的容器里执行命令 |
| `-it` | 交互式终端（-i 交互，-t 分配伪终端） |
| `mysql-dev` | 容器名 |
| `mysql -uroot -p` | 在容器内执行的命令：用 root 登录 MySQL |

输入密码 `123456` 就能进 MySQL 命令行，`exit` 退出。

## 端口映射

上面启动的 MySQL 只能在容器内部访问，外部程序连不上。需要把容器的 3306 端口映射到宿主机：

```bash
docker run --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -p 3306:3306 \
  -d mysql:8.0
```

`-p 3306:3306` 含义：`宿主机端口:容器端口`

- 左边 `3306`：你电脑上访问的端口
- 右边 `3306`：MySQL 在容器里的端口

换一个宿主机端口也行：

```bash
-p 3307:3306   # 访问 localhost:3307 就能连上容器里的 MySQL 3306
```

改完后用 Navicat、DataGrip 或任何 MySQL 客户端，连接 `127.0.0.1:3306` 就能用。

## 数据持久化（非常重要！）

不加数据卷的后果：**容器删了，数据全丢**。

```bash
# 演示丢数据
docker rm -f mysql-dev        # 强制删除容器
docker run --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -p 3306:3306 \
  -d mysql:8.0                # 重新启动，数据已丢失
```

解决办法：挂载数据卷（Volume），把 MySQL 的数据文件存到宿主机。

```bash
docker run --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  -d mysql:8.0
```

`-v mysql-data:/var/lib/mysql` 含义：

| 部分 | 说明 |
|------|------|
| `mysql-data` | 数据卷名字（Docker 自动创建） |
| `:` | 分隔符 |
| `/var/lib/mysql` | MySQL 在容器里存数据的目录 |

现在就算删掉容器重建：

```bash
docker rm -f mysql-dev
docker run --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  -d mysql:8.0
```

数据还在，因为数据卷 `mysql-data` 没有随容器删除。

也可以用宿主机目录（更直观）：

```bash
-v D:/docker/mysql-data:/var/lib/mysql
```

但推荐用命名卷（`mysql-data`），Docker 自动管理，不需要关心路径。

## 配置文件挂载

MySQL 的配置文件在容器内的 `/etc/mysql/conf.d/` 或 `/etc/mysql/my.cnf`。可以把宿主机上的配置文件挂载进去。

先在宿主机创建配置文件：

```bash
mkdir -p D:/docker/mysql-config
```

创建 `D:/docker/mysql-config/my.cnf` 文件：

```ini
[mysqld]
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
default-time-zone=+8:00
max_connections=200

[client]
default-character-set=utf8mb4
```

挂载配置启动：

```bash
docker run --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  -v D:/docker/mysql-config/my.cnf:/etc/mysql/conf.d/my.cnf \
  -d mysql:8.0
```

配置文件参数说明：

| 参数 | 含义 |
|------|------|
| `character-set-server=utf8mb4` | 数据库默认字符集，utf8mb4 支持 emoji |
| `collation-server=utf8mb4_unicode_ci` | 排序规则，unicode 通用 |
| `default-time-zone=+8:00` | 时区设为东八区（中国） |
| `max_connections=200` | 最大连接数 |

## 完整的启动命令

把上面所有功能组合起来：

```bash
docker run --name mysql-dev \
  --restart always \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=myapp \
  -e MYSQL_USER=appuser \
  -e MYSQL_PASSWORD=apppass \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  -v D:/docker/mysql-config/my.cnf:/etc/mysql/conf.d/my.cnf \
  -d mysql:8.0
```

新增的环境变量：

| 变量 | 作用 |
|------|------|
| `MYSQL_DATABASE=myapp` | 启动时自动创建一个数据库 |
| `MYSQL_USER=appuser` | 创建一个普通用户 |
| `MYSQL_PASSWORD=apppass` | 给普通用户设密码 |

`--restart always`：容器退出后自动重启。服务器重启了也不用管，Docker 会自动拉起 MySQL。

## 常用管理命令

```bash
# 查看日志
docker logs mysql-dev

# 实时查看日志
docker logs -f mysql-dev

# 重启容器
docker restart mysql-dev

# 停止容器
docker stop mysql-dev

# 启动已停止的容器
docker start mysql-dev

# 进入容器内部
docker exec -it mysql-dev bash

# 查看容器详细信息（IP、端口映射、挂载卷等）
docker inspect mysql-dev

# 备份数据库（在宿主机执行）
docker exec mysql-dev mysqldump -uroot -p123456 myapp > backup.sql

# 恢复数据库
docker exec -i mysql-dev mysql -uroot -p123456 myapp < backup.sql
```

## 使用 Docker Compose（推荐）

写个 `docker-compose.yml`，所有配置一目了然：

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql-dev
    restart: always
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: myapp
      MYSQL_USER: appuser
      MYSQL_PASSWORD: apppass
    volumes:
      - mysql-data:/var/lib/mysql
      - ./mysql-config/my.cnf:/etc/mysql/conf.d/my.cnf
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

volumes:
  mysql-data:
```

启动：

```bash
docker compose up -d
```

停止并删除容器（数据卷保留）：

```bash
docker compose down
```

停止并删除一切（包括数据卷，数据会丢）：

```bash
docker compose down -v
```

## 生产环境注意事项

| 注意点 | 建议 |
|--------|------|
| 密码 | 不要用 `123456`，用强密码 |
| 端口 | 不要暴露 3306 到公网，仅内网访问 |
| 数据备份 | 定期用 `mysqldump` 备份到外部存储 |
| 资源限制 | 加上 `--memory=1g --cpus=1` 限制内存和 CPU |
| 日志 | 配置日志轮转，防止日志撑爆磁盘 |
| 时区 | 务必设置 `TZ=Asia/Shanghai` 或 `default-time-zone=+8:00` |
| 网络 | 用 Docker 自定义网络，让应用容器通过容器名连接 MySQL |

带资源限制的启动命令：

```bash
docker run --name mysql-dev \
  --restart always \
  --memory=1g \
  --cpus=1 \
  -e MYSQL_ROOT_PASSWORD=你的强密码 \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  -d mysql:8.0
```

## 常见问题

**Q：启动后 STATUS 不是 Up，而是 Exit 或 Restarting？**

看日志排查：

```bash
docker logs mysql-dev
```

常见原因：端口被占用、数据目录权限不对、配置文件语法错误。

**Q：连不上 MySQL，报 `Access denied`？**

确保密码正确，或者检查是否用了正确的用户名。root 用户默认只能从容器内部连接，如果要远程连接需要修改权限：

```bash
docker exec -it mysql-dev mysql -uroot -p
# 在 MySQL 里执行：
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '密码';
FLUSH PRIVILEGES;
```

**Q：中文变成 `???`？**

确保启动时配置了 `character-set-server=utf8mb4`，连接时也指定字符集：

```bash
docker exec -it mysql-dev mysql -uroot -p --default-character-set=utf8mb4
```

## 删除清理

```bash
# 停止并删除容器
docker rm -f mysql-dev

# 删除数据卷（数据永久丢失）
docker volume rm mysql-data

# 删除镜像
docker rmi mysql:8.0
```

## 总结

| 步骤 | 命令 |
|------|------|
| 拉取镜像 | `docker pull mysql:8.0` |
| 启动容器 | `docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=密码 -p 3306:3306 -v mysql-data:/var/lib/mysql -d mysql:8.0` |
| 连接测试 | `docker exec -it mysql-dev mysql -uroot -p` |
| 查看日志 | `docker logs mysql-dev` |
| 停止 | `docker stop mysql-dev` |
| 删除 | `docker rm -f mysql-dev` |

Docker 部署 MySQL 的核心就三件事：**挂载数据卷防丢、映射端口供连接、配好字符集不乱码**。记住这三点，怎么折腾都行。
