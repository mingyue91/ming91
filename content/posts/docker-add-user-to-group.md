---
title: "如何将当前用户添加到 Docker 组？"
description: "免 sudo 运行 Docker 命令，三步搞定用户组配置"
date: 2026-05-25T00:00:00+08:00
slug: docker-add-user-to-group
categories: ["容器Docker"]
tags: ["docker", "linux", "权限", "sudo"]
draft: false
---

使用 Docker 时，每次执行 `docker` 命令都要加 `sudo`，非常不方便。根本原因是 Docker 守护进程默认以 root 权限运行，普通用户无权访问它的 Unix socket（`/var/run/docker.sock`）。

解决办法很简单——将当前用户加入 `docker` 用户组，之后就可以免 `sudo` 运行 Docker 命令了。

## 操作步骤

### 1. 确认 Docker 已安装

```bash
docker --version
```

如果提示命令不存在，先安装 Docker。

### 2. 创建 docker 组（如不存在）

安装 Docker 后一般会自动创建 `docker` 组，但可以执行以下命令确保它存在（如果已存在会提示，忽略即可）：

```bash
sudo groupadd docker
```

### 3. 将当前用户添加到 docker 组

```bash
sudo usermod -aG docker $USER
```

`-aG` 表示追加到补充组（不移除已有组），`$USER` 会自动替换为当前用户名。

### 4. 使组变更生效

注销并重新登录，或者运行：

```bash
newgrp docker
```

### 5. 验证

```bash
docker info
```

能正常输出 Docker 信息说明配置成功。

## 为什么之前需要 sudo？

Docker 守护进程绑定的 Unix socket `/var/run/docker.sock` 默认权限为 `root:root`。只有 root 用户和 `docker` 组的成员才能读写它。把用户加入 `docker` 组就相当于授予了 socket 的访问权限。

## 安全提醒

加入 `docker` 组的用户权限等同于 root，因为可以通过挂载 `/var/run/docker.sock` 或 `--privileged` 等方式逃逸容器获得宿主机完全控制权。**仅将可信用户加入 docker 组**，生产环境中建议通过 sudo 提权或使用 `Podman` 等 rootless 容器方案。

## 总结

| 命令 | 作用 |
|------|------|
| `sudo groupadd docker` | 创建 docker 组 |
| `sudo usermod -aG docker $USER` | 将当前用户加入 docker 组 |
| `newgrp docker` | 刷新当前会话的组权限 |
| `docker info` | 验证免 sudo 是否生效 |

以后运行 `docker ps`、`docker run` 等命令就不用加 `sudo` 了。
