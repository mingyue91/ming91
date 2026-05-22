---
title: "Amazon S3 入门：对象存储基础"
description: "从零开始理解 S3——什么是对象存储、核心概念、存储类与常见应用场景"
date: 2026-05-22T00:00:00+08:00
slug: aws-s3-intro
categories: ["云计算"]
tags: ["aws", "s3", "存储", "入门"]
draft: false
---

## 什么是 Amazon S3？

Amazon Simple Storage Service（S3）是 AWS 提供的**对象存储服务**。它被设计为可无限扩展、高持久性（99.999999999%，即 11 个 9），适合存储任意类型和任意规模的数据。

与传统的文件系统（如 NAS/SAN）不同，S3 不是挂载到服务器的磁盘，而是通过 HTTP REST API 访问的云存储。

## 核心概念

### 存储桶（Bucket）

桶是 S3 中存储对象的容器。每个桶有一个全局唯一的名称，并归属特定 AWS 区域。

```plaintext
my-bucket（桶名，全局唯一）
└── s3.ap-northeast-1.amazonaws.com（区域端点）
```

桶的命名规则：
- 全局唯一，不区分大小写
- 长度 3-63 个字符
- 只能包含小写字母、数字、句点（.）和连字符（-）
- 不能以句点或连字符开头或结尾

### 对象（Object）

对象是 S3 中存储的基本实体。每个对象由以下组成：

| 组件 | 说明 |
|------|------|
| **数据（Data）** | 任意二进制数据，最大 5TB |
| **键（Key）** | 对象在桶中的唯一标识符 |
| **元数据（Metadata）** | 键值对形式的对象描述信息 |
| **标签（Tags）** | 用于分类和成本分配 |
| **版本 ID** | 版本控制开启时，标识对象版本 |

### 键（Key）与文件夹模拟

S3 没有真正的文件夹层级，但通过键名的 `/` 分隔符在控制台中模拟出文件夹结构。

```plaintext
桶名：my-bucket
键名：images/2026/photo.jpg

在控制台中看起来像：
my-bucket/
└── images/
    └── 2026/
        └── photo.jpg
```

但实际上 S3 只存储了一个键名为 `images/2026/photo.jpg` 的对象，没有真实的文件夹实体。

## 数据一致性模型

S3 为 PUT 和 DELETE 操作提供**强一致性**：

| 操作 | 一致性 |
|------|--------|
| 新对象写入（PUT） | 立即可见 |
| 对象覆盖（PUT） | 强一致性 |
| 对象删除（DELETE） | 强一致性 |
| 桶创建/删除 | 最终一致性（目前也已几乎强一致）|

这意味着对象写入成功后，后续读取一定能读到最新版本。

## 存储类

S3 提供多种存储类，在成本和访问频率之间做权衡：

| 存储类 | 持久性 | 可用性 | 最短存储期 | 适用场景 |
|--------|--------|--------|------------|----------|
| **S3 Standard** | 11 个 9 | 99.99% | 无 | 热数据，频繁访问 |
| **S3 Intelligent-Tiering** | 11 个 9 | 99.9% | 无 | 访问模式不确定 |
| **S3 Standard-IA** | 11 个 9 | 99.9% | 30 天 | 低频但需快速访问 |
| **S3 One Zone-IA** | 11 个 9 | 99.5% | 30 天 | 可重建的非关键数据 |
| **S3 Glacier Instant Retrieval** | 11 个 9 | 99.9% | 90 天 | 归档但需毫秒级检索 |
| **S3 Glacier Flexible Retrieval** | 11 个 9 | 99.99% | 90 天 | 存档备份，分钟级取回 |
| **S3 Glacier Deep Archive** | 11 个 9 | 99.99% | 180 天 | 长期存档，最长 12 小时取回 |

> 所有存储类的持久性都非常高，区别主要在于可用性、取回时间和价格。

## 主要功能

### 版本控制

在桶级别开启后，S3 会保留对象的所有版本，包括删除标记。

```plaintext
PUT  photo.jpg (version 1)
PUT  photo.jpg (version 2)
DELETE photo.jpg (version 3 - 删除标记)

可以随时恢复到 version 1 或 version 2
```

### 存储桶策略

基于资源的策略，JSON 格式，控制对桶及其对象的访问权限：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::public-bucket/*"
        }
    ]
}
```

### 生命周期管理

自动在存储类之间转换数据，或过期删除：

```plaintext
写入 S3 Standard（第 0 天）
    → 30 天后转为 S3 Standard-IA
    → 90 天后转为 S3 Glacier
    → 365 天后删除
```

### 加密

| 加密方式 | 说明 |
|----------|------|
| **SSE-S3** | AWS 管理密钥，AES-256 |
| **SSE-KMS** | AWS KMS 管理密钥，支持审计 |
| **SSE-C** | 客户提供密钥，AWS 不存储 |
| **客户端加密** | 上传前自行加密 |

### 静态网站托管

S3 可以托管静态网站（HTML、CSS、JS），直接通过 HTTP 访问。

```
http://my-bucket.s3-website-ap-northeast-1.amazonaws.com
```

### 跨区域复制（CRR）

自动将对象从一个区域的桶复制到另一区域的桶，用于合规、容灾或低延迟访问。

### 事件通知

对象创建、删除等操作可以触发通知到 SQS、SNS 或 Lambda：

```
PUT photo.jpg → S3 Event → Lambda 生成缩略图
```

## 访问方式

| 方式 | 说明 |
|------|------|
| **AWS 管理控制台** | Web 界面操作 |
| **AWS CLI** | 命令行：`aws s3 cp file.txt s3://my-bucket/` |
| **AWS SDK** | 各语言 SDK（Python、Java、JS 等）|
| **REST API** | 直接 HTTP 请求 |
| **S3 Transfer Acceleration** | 通过 AWS 边缘节点加速上传 |
| **S3 Object Lambda** | 在读取时用 Lambda 转换数据 |

## 常见应用场景

| 场景 | 说明 |
|------|------|
| 备份与归档 | 用生命周期将备份自动转入 Glacier |
| 数据湖 | 以原生格式（Parquet、CSV、JSON）存储海量数据 |
| 静态网站托管 | 结合 CloudFront 搭建 CDN 加速站点 |
| 日志存储 | 存储 CloudTrail、ELB、应用日志 |
| 大数据分析 | Athena 直接在 S3 上跑 SQL 查询 |
| 媒体存储 | 图片、视频等多媒体文件 |

## 安全控制

S3 的安全性由多层机制共同保障：

| 机制 | 作用 |
|------|------|
| **IAM 策略** | 控制谁可以访问桶 |
| **桶策略** | 控制对桶的访问规则 |
| **ACL** | 传统访问控制，目前不推荐 |
| **Block Public Access** | 一键阻止所有公开访问 |
| **S3 Object Lock** | 写一次读多次（WORM），防止篡改 |
| **VPC 端点** | S3 不经过公网，通过内网访问 |

## 计费维度

S3 按以下维度计费（各区域价格不同）：

1. **存储用量**：每月每 GB 计费，存储类不同价格不同
2. **请求次数**：PUT/GET 等 API 调用次数
3. **数据传输**：流出到互联网的数据量
4. **S3 Select / Glacier 取回**：额外功能费用

> AWS 提供 [计费计算器](https://calculator.aws) 帮助预估费用。

## 总结

| 要点 | 说明 |
|------|------|
| 对象存储 | 通过 REST API 访问，非文件系统挂载 |
| 桶 + 键 | 桶全局唯一，键标识对象 |
| 11 个 9 | 设计持久性高达 99.999999999% |
| 多种存储类 | 从热数据到长期归档全覆盖 |
| 版本控制 | 保留对象所有版本，可恢复 |
| 生命周期 | 自动转换存储类或过期删除 |
| 安全分层 | IAM + 桶策略 + Block Public Access + 加密 |
