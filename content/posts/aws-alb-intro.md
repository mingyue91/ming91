---
title: "AWS ALB 入门：应用负载均衡器核心架构指南"
description: "ALB 是 AWS 第 7 层负载均衡器，支持基于内容的路由、HTTP/2、WebSocket，是微服务和容器化架构的流量中枢"
date: 2026-07-27T00:00:00+08:00
slug: aws-alb-intro
categories: ["云计算"]
tags: ["aws", "alb", "负载均衡", "网络", "入门"]
draft: false
---

## 什么是 ALB？

AWS Application Load Balancer（ALB）是 AWS 提供的**第 7 层（应用层）**负载均衡器，专门处理 HTTP/HTTPS 流量。与传统的第 4 层负载均衡器不同，ALB 能够解析 HTTP 请求头（Header、Path、Method、Query 等），基于内容进行智能路由，是**微服务架构**和**容器化应用**的理想入口。

## 核心定位与工作原理

ALB 作为客户端流量的智能入口，通过分析 HTTP 请求内容将请求精准分发到后端目标组。

```plaintext
客户端 → ALB（第 7 层） → 基于内容路由 → Target Group A（/api/*）
                                       → Target Group B（/images/*）
                                       → Target Group C（api.example.com）
```

## 四大关键技术能力

| 能力维度 | 核心机制 | 业务价值 |
|---------|---------|---------|
| **智能路由** | 支持基于路径（`/api`、`/images`）、基于主机（`api.example.com`）、基于 HTTP 头或查询参数的路由规则 | 单一入口下的多服务分发，支持 A/B 测试、多租户架构和 API 版本平滑过渡 |
| **高可用性** | 持续执行可定制的健康检查；支持注销延迟（Deregistration Delay） | 自动隔离故障节点，允许正在处理的请求优雅完成 |
| **现代架构集成** | 原生支持 HTTP/2（头部压缩、多路复用）和 WebSocket；无缝集成 ECS（动态端口映射）和 Lambda | 提升实时通信性能，支持无服务器架构 |
| **企业级安全** | 与 ACM 集成实现 SSL/TLS 卸载；与 WAF 集成防御 Web 攻击；与 Cognito 集成实现边缘身份验证 | 减轻后端加密负担，在流量到达应用前拦截恶意请求 |

## 核心组件

### Listener（监听器）

ALB 的入口，监听指定协议（HTTP/HTTPS）和端口（如 80/443）的连接请求。HTTPS 监听器必须绑定 ACM 证书。

```plaintext
Listener: HTTP :80  → Rules → Target Group A
Listener: HTTPS :443 → Rules → Target Group B（需绑定 SSL 证书）
```

### Target Group（目标组）

后端目标的逻辑集合。每个目标组有独立的健康检查配置。

| 目标类型 | 适用场景 |
|---------|---------|
| EC2 实例 | 传统部署模式，按实例 ID 注册 |
| IP 地址 | 本地数据中心或对等连接 |
| Lambda 函数 | 无服务器架构，直接调用函数 |
| ECS 容器 | 动态端口映射，端口由 ECS 自动管理 |

### Rules（规则）

绑定在 Listener 上，由"条件（Conditions）"和"操作（Actions）"组成，按优先级顺序评估。

```plaintext
Rule 1（优先级 10）: IF path = /api/* → Forward to api-target-group
Rule 2（优先级 20）: IF host = images.example.com → Forward to image-target-group
Rule 3（优先级 默认）: → Forward to default-target-group
```

### Sticky Sessions（粘性会话）

通过 ALB 生成的专用 Cookie（`AWSALB`），确保同一用户的连续请求被路由到同一个后端目标，适用于有状态应用。

### Security Groups（安全组）

ALB 的虚拟防火墙，需双向放行：

1. **ALB 安全组**：允许客户端访问 ALB 的监听端口（80/443）
2. **后端安全组**：仅允许来自 ALB 安全组的流量访问业务端口和健康检查端口

## 典型业务场景

### 电子商务平台

利用**路径路由**将商品浏览、购物车、支付网关分发到独立微服务，各服务独立扩缩容，应对大促流量突发。

```plaintext
example.com/products/* → product-service
example.com/cart/*     → cart-service
example.com/checkout/* → checkout-service
```

### 媒体流媒体服务

利用 **WebSocket** 保持长连接，结合健康检查自动剔除异常节点，确保百万级并发用户的流畅播放体验。

### SaaS 多租户应用

利用**基于主机的路由**，让多租户共享同一套基础设施，结合 Cognito 实现租户级隔离与认证。

```plaintext
tenantA.saas.com → tenant-a-target-group
tenantB.saas.com → tenant-b-target-group
```

### 移动端后端

利用**基于 HTTP 头的路由**（如 `User-Agent` 或自定义 Header），将不同版本的 App API 请求路由到对应后端版本，实现灰度发布。

## ALB vs NLB 对比

| 维度 | ALB | NLB |
|------|-----|-----|
| OSI 层级 | 第 7 层（应用层） | 第 4 层（传输层） |
| 协议 | HTTP、HTTPS、HTTP/2、WebSocket | TCP、UDP、TLS |
| 路由方式 | 基于内容（URL、Host、Header） | 基于 IP 和端口 |
| 延迟 | 几毫秒 | 微秒级 |
| 静态 IP | 不支持（可通过 Global Accelerator 解决） | 支持每可用区一个弹性 IP |
| WAF 集成 | 原生支持 | 不支持 |
| 适用场景 | Web 应用、微服务、API 网关 | 金融交易、游戏服务器、低延迟应用 |

## 最佳实践

### 1. 优雅下线配置

根据应用平均请求处理时间合理设置 Deregistration Delay（默认 300 秒）。如果请求处理只需 2 秒，设为 10-30 秒即可，避免 Auto Scaling 缩容时长时间占用资源。

### 2. ECS 动态端口映射

在 ECS 中，ALB 支持将容器映射到宿主机上的随机高端口，由 ALB 自动发现。这打破了传统"一个端口一个服务"的限制，极大提升了容器密度。

### 3. 安全组最小权限

```plaintext
ALB 安全组入站规则：
  来源: 0.0.0.0/0 → 端口: 80, 443

后端安全组入站规则：
  来源: ALB 安全组 ID → 端口: 应用端口（如 3000, 8080）
  来源: ALB 安全组 ID → 端口: 健康检查端口
```

### 4. 成本优化

ALB 按 **LCU（Load Balancer Capacity Units）** 计费，综合考虑新建连接数、活跃连接数、处理字节数和规则评估数。对于纯静态内容，建议前置 CloudFront 缓存，大幅降低 ALB 的 LCU 消耗和后端压力。

### 5. 监控与告警

建议为 ALB 配置以下 CloudWatch 指标告警：

| 指标 | 建议阈值 |
|------|---------|
| `TargetResponseTime` | > 5 秒（p99） |
| `HTTPCode_Target_5XX_Count` | > 0 |
| `RejectedConnectionCount` | > 0 |
| `UnhealthyHostCount` | > 0 |

## 总结

ALB 不仅仅是一个流量分发器，它是现代云原生架构中的**智能流量编排中枢**。熟练掌握其基于内容的路由规则、与容器/无服务器服务的深度集成，以及结合 WAF/Cognito 的边缘安全能力，是构建高可用、高安全微服务架构的关键。
