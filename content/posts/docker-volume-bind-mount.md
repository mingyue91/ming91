---
title: "Docker 数据持久化：Volume 与 Bind Mount 实战"
description: "通过一个实验搞懂两种挂载方式的区别"
date: 2026-05-26T00:00:00+08:00
slug: docker-volume-bind-mount
categories: ["容器Docker"]
tags: ["docker", "volume", "bind-mount", "数据持久化", "入门"]
draft: false
---

## 实验目标

用一个 Nginx 容器，验证 Volume 和 Bind Mount 两种数据持久化方式的区别。

## 前置准备

```bash
docker --version
docker info
```

确保 Docker 已安装并运行。

---

## 第一部分：命名卷（Named Volume）

### 1. 创建命名卷

```bash
docker volume create web-data
```

这条命令的作用：

| 部分 | 说明 |
|------|------|
| `docker volume create` | 创建数据卷的命令 |
| `web-data` | 数据卷的名字，后续挂载时用这个名字引用 |

验证卷已创建：

```bash
docker volume ls
```

输出中应该能看到 `web-data`。查看详情：

```bash
docker volume inspect web-data
```

会返回 JSON，包含 `Mountpoint`（卷在宿主机上的实际存储路径），但正常情况下不需要关心这个路径——Docker 会自动管理。

### 2. 启动容器并挂载卷

```bash
docker run -d --name nginx-vol -v web-data:/usr/share/nginx/html nginx:alpine
```

参数拆解：

| 参数 | 含义 |
|------|------|
| `docker run -d` | 后台运行容器 |
| `--name nginx-vol` | 给容器取名 nginx-vol |
| `-v web-data:/usr/share/nginx/html` | **挂载卷**：将 `web-data` 卷挂载到容器的 `/usr/share/nginx/html`（Nginx 存放网页文件的目录） |
| `nginx:alpine` | 使用基于 Alpine Linux 的 Nginx 镜像，体积更小 |

关于 `-v` 参数：

```
-v 卷名:容器内路径
```

- 冒号左边是卷名（`web-data`）
- 冒号右边是容器内的目录路径
- 效果：容器内对该目录的读写，实际存储在卷中

### 3. 创建 index.html

进入容器：

```bash
docker exec -it nginx-vol sh
```

参数说明：

| 参数 | 含义 |
|------|------|
| `docker exec` | 在运行中的容器里执行命令 |
| `-it` | 交互模式（-i 保持输入流，-t 分配伪终端） |
| `nginx-vol` | 容器名 |
| `sh` | 在容器内启动 shell（Alpine 没有 bash，用 sh） |

进入容器后，创建 index.html：

```bash
cd /usr/share/nginx/html
echo "<h1>Hello from Volume - 张三</h1>" > index.html
exit
```

验证网页是否正常：

```bash
# 获取容器 IP
docker inspect nginx-vol --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

# 或用 curl 访问本机映射端口（如果有 -p 映射的话）
# 这里没映射端口，所以用容器 IP 访问
curl http://容器IP
```

没映射端口的话，也可以用这个命令直接查看：

```bash
docker exec nginx-vol cat /usr/share/nginx/html/index.html
```

### 4. 删除容器，用同一卷重建

**删除旧容器：**

```bash
docker rm -f nginx-vol
```

| 参数 | 含义 |
|------|------|
| `docker rm` | 删除容器 |
| `-f` | 强制删除（即使容器正在运行） |

注意：**删除容器不会删除数据卷**。卷是独立于容器的资源。

**用同一卷启动新容器：**

```bash
docker run -d --name nginx-vol-new -v web-data:/usr/share/nginx/html nginx:alpine
```

**验证数据是否保留：**

```bash
docker exec nginx-vol-new cat /usr/share/nginx/html/index.html
```

如果输出 `<h1>Hello from Volume - 张三</h1>`，说明数据保留成功。

**结论：Volume 的生命周期独立于容器，容器删除后数据仍在。**

### 5. 清理

```bash
docker rm -f nginx-vol-new
docker volume rm web-data
```

`docker volume rm` 删除数据卷。确认已删除：

```bash
docker volume ls
```

---

## 第二部分：Bind Mount（绑定挂载）

### 1. 准备宿主机目录

在本地创建目录和文件：

```bash
# Linux/macOS
mkdir -p ./html
echo "<h1>Hello from Bind Mount - 张三</h1>" > ./html/index.html

# Windows PowerShell
mkdir html
"<h1>Hello from Bind Mount - 张三</h1>" | Out-File -Encoding utf8 ./html/index.html
```

查看文件：

```bash
cat ./html/index.html
```

### 2. 启动容器绑定挂载

```bash
docker run -d --name nginx-bind -v $(pwd)/html:/usr/share/nginx/html -p 8080:80 nginx:alpine
```

这次多了几个新东西：

| 参数 | 含义 |
|------|------|
| `-v $(pwd)/html:/usr/share/nginx/html` | **绑定挂载**：将宿主机当前目录下的 `html/` 文件夹挂载到容器内 |
| `-p 8080:80` | 端口映射：宿主机 8080 端口 → 容器 80 端口 |

与 Volume 的 `-v` 区别：

```
Volume 方式：     -v 卷名:容器内路径
Bind Mount 方式： -v 宿主机绝对路径:容器内路径
```

- Volume：左边是卷名（Docker 管理）
- Bind Mount：左边是宿主机文件系统路径（你管理）

`$(pwd)` 获取当前目录的绝对路径，相当于写死了路径。Windows PowerShell 中用 `$(Get-Location)` 或直接写全路径。

### 3. 验证挂载

```bash
# 通过浏览器访问
curl http://localhost:8080

# 或在容器内查看
docker exec nginx-bind cat /usr/share/nginx/html/index.html
```

### 4. 修改宿主机文件，验证实时同步

Bind Mount 最大的特点：**宿主机改文件，容器立即生效**，不需要重启。

```bash
# 修改宿主机上的 index.html
echo "<h1>Bind Mount Updated - 张三</h1>" > ./html/index.html

# 再次访问，内容已更新
curl http://localhost:8080
```

不需要重启容器，内容已经变了。这在开发时非常有用——改代码即时生效。

### 5. 容器内修改，宿主机也同步

反过来也一样：

```bash
docker exec nginx-bind sh -c 'echo "<h1>Changed inside container - 张三</h1>" > /usr/share/nginx/html/index.html'

# 查看宿主机文件
cat ./html/index.html
```

宿主机上的文件也变了。

**结论：Bind Mount 是双向同步的，宿主机和容器共享同一份文件。**

### 6. 清理

```bash
docker rm -f nginx-bind
```

Bind Mount 的目录在宿主机上，不会被 Docker 删除，需要手动清理。

---

## 两种方式对比

| 对比项 | Named Volume | Bind Mount |
|--------|-------------|------------|
| 命令格式 | `-v 卷名:容器路径` | `-v 宿主机路径:容器路径` |
| 由谁管理 | Docker 自动管理 | 你管理 |
| 宿主机路径 | Docker 自动创建，位置不透明 | 你指定，位置透明 |
| 数据生命周期 | 独立于容器，`docker volume rm` 才删除 | 就是宿主机目录，手动删除 |
| 跨平台可移植 | 好（不依赖具体路径） | 差（路径因系统而异） |
| 适用场景 | 数据库数据、生产环境持久化 | 开发调试、热更新代码、配置文件 |
| 容器删除后数据 | 保留 | 保留（因为是宿主机目录） |
| 备份/迁移 | 需通过 `docker run --volumes-from` 或手动拷贝 | 直接操作宿主机目录即可 |

### 什么时候用哪个？

- **数据库（MySQL、PostgreSQL）** → Volume。数据由 Docker 管理，迁移方便
- **开发环境** → Bind Mount。改代码即时生效，不用重建镜像
- **配置文件** → Bind Mount。把配置文件放宿主机，不用修改镜像
- **生产环境** → Volume。更安全、可移植、日志管理方便

---

## 常用命令速查

```bash
# Volume 相关
docker volume create my-vol       # 创建卷
docker volume ls                   # 列出卷
docker volume inspect my-vol       # 查看卷详情
docker volume prune                # 删除未使用的卷
docker volume rm my-vol            # 删除指定卷

# 挂载方式
docker run -v my-vol:/data ...     # Volume 挂载
docker run -v /主机/路径:/data ... # Bind Mount 挂载
docker run -v /主机/路径:/data:ro  # 只读挂载

# 查看容器挂载信息
docker inspect 容器名 --format '{{json .Mounts}}' | ConvertFrom-Json  # PowerShell
docker inspect 容器名 --format '{{json .Mounts}}' | python -m json.tool  # Linux
```

## 总结

实验验证了两件事：

1. **Volume 数据持久化**：删容器重建，数据还在。卷是独立资源。
2. **Bind Mount 实时同步**：改宿主机文件，容器立即可见。适合开发。

核心区别一句话：**Volume 交给 Docker 管，Bind Mount 你自己管**。
