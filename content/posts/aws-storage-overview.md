---
title: "AWS 存储服务全景"
description: "S3、EBS、EFS、FSx、Storage Gateway……一张图看懂 AWS 所有存储服务"
date: 2026-05-22T00:00:00+08:00
slug: aws-storage-overview
categories: ["云计算"]
tags: ["aws", "存储", "s3", "ebs", "efs", "入门"]
pinned: true
draft: false
---

AWS 提供十几种存储服务，覆盖块存储、文件存储、对象存储、混合存储、备份与数据迁移等场景。本文帮你理清各服务的定位与选型思路。

## 存储服务分类

### 对象存储

| 服务 | 用途 | 关键特点 |
|------|------|----------|
| **S3** | 通用对象存储 | 无限扩展，11 个 9 持久性，多种存储类 |
| **S3 Glacier** | 归档存储 | 低成本长期存档，分钟到小时级取回 |
| **S3 Express One Zone** | 高性能单 AZ | 个位数毫秒延迟，适合高性能计算 |

### 块存储

块存储类似云上的硬盘，挂载到 EC2 实例使用。

| 服务 | 用途 | 关键特点 |
|------|------|----------|
| **EBS** | EC2 块存储 | 持久化，支持快照，容量最大 64TB |
| **Instance Store** | 临时块存储 | 高 IOPS，数据随实例终止丢失 |

### 文件存储

| 服务 | 用途 | 关键特点 |
|------|------|----------|
| **EFS** | 共享文件系统（NFS）| 自动扩展，多 AZ 冗余，兼容 Linux |
| **FSx for Windows** | Windows 共享（SMB）| 原生 Windows 文件服务器体验 |
| **FSx for Lustre** | 高性能并行文件系统 | 适合 HPC、机器学习训练 |
| **FSx for NetApp ONTAP** | NetApp 兼容 | 高级数据管理功能 |
| **FSx for OpenZFS** | ZFS 文件系统 | 高性能快照与克隆 |

### 混合存储

连接本地数据中心与 AWS 的存储服务。

| 服务 | 用途 | 关键特点 |
|------|------|----------|
| **Storage Gateway** | 本地与云桥接 | 支持 NFS/SMB/VTL/iSCSI 协议 |
| **Snow Family** | 物理设备传输 | 离线迁移海量数据 |

### 备份与容灾

| 服务 | 用途 | 关键特点 |
|------|------|----------|
| **AWS Backup** | 统一备份管理 | 集中策略、自动备份 |
| **Elastic Disaster Recovery** | 容灾恢复 | 秒级 RPO 的持续复制 |

## 选型决策树

```
数据怎么访问？
├── 通过网络 API 访问 → 对象存储
│   ├── 频繁访问 → S3 Standard / Intelligent-Tiering
│   ├── 归档备份 → S3 Glacier / Glacier Deep Archive
│   └── 超低延迟 → S3 Express One Zone
├── 挂载到 EC2 作为磁盘 → 块存储
│   ├── 持久化存储 → EBS
│   └── 临时缓存 → Instance Store
└── 共享文件系统 → 文件存储
    ├── NFS 协议 → EFS
    ├── SMB / Windows → FSx for Windows
    ├── HPC / ML → FSx for Lustre
    └── NetApp 或 ZFS → FSx for ONTAP / OpenZFS
```

## 各服务详解

### S3 家族

**S3（Simple Storage Service）** 是 AWS 最早（2006 年）也是最核心的存储服务。详情见 [Amazon S3 入门](/ming91/posts/aws-s3-intro/)。

| 子服务 | 延迟 | 单对象最小计费 | 适用场景 |
|--------|------|---------------|----------|
| S3 Standard | 毫秒 | 无 | 热数据，CDN 源站，数据湖 |
| S3 Express One Zone | 个位数毫秒 | 无 | 高性能计算，实时分析 |
| S3 Glacier Instant | 毫秒 | 90 天 | 长期数据但需即时访问 |
| S3 Glacier Flexible | 1-5 分 / 3-5 时 | 90 天 | 备份归档 |
| S3 Glacier Deep Archive | 12 小时 | 180 天 | 合规归档，最便宜 |

### EBS（Elastic Block Store）

EBS 是 EC2 实例的持久化块存储，类似云上的硬盘。

- **持久性**：同 AZ 内 99.999%，可做快照备份到 S3
- **容量**：1 GB ~ 64 TB
- **性能类型**：

| 类型 | 最大 IOPS | 最大吞吐 | 适用场景 |
|------|-----------|----------|----------|
| gp3 | 16,000 | 1,000 MB/s | 通用（默认）|
| io2 | 256,000 | 4,000 MB/s | 关键业务数据库 |
| st1 | 500 | 500 MB/s | 大数据、日志处理 |
| sc1 | 250 | 250 MB/s | 冷数据、每日备份 |

> EBS 只能挂载到同一可用区的 EC2 实例。

### EFS（Elastic File System）

EFS 是托管的 NFS 文件系统，可同时挂载到多个 EC2 实例。

- **自动扩展**：无需预置容量，按实际使用付费
- **多 AZ 冗余**：Standard 模式数据跨 AZ 存储
- **兼容性**：仅支持 Linux 实例
- **性能模式**：General Purpose（默认，适合通用）、Max I/O（适合高并行）

### FSx 家族

| 服务 | 协议 | 亮点 |
|------|------|------|
| FSx for Windows | SMB | 集成 AD，支持 Windows ACL |
| FSx for Lustre | POSIX | 与 S3 原生集成，可做 ML 训练数据源 |
| FSx for NetApp ONTAP | NFS/SMB/iSCSI | 完整 ONTAP 功能，支持 SnapMirror |
| FSx for OpenZFS | NFS | ZFS 快照、克隆、压缩 |

### Storage Gateway

将本地存储无缝扩展到 AWS 的混合云服务：

| 模式 | 协议 | 说明 |
|------|------|------|
| **File Gateway** | NFS / SMB | 本地访问 S3，支持本地缓存 |
| **Volume Gateway** | iSCSI | 本地卷自动备份到 S3（EBS 快照）|
| **Tape Gateway** | VTL | 虚拟磁带库，替代物理磁带 |

### Snow Family

离线传输海量数据到 AWS：

| 设备 | 可用容量 | 适用场景 |
|------|----------|----------|
| Snowcone | 8 TB | 便携，恶劣环境 |
| Snowball Edge | 80 TB | 大数据传输 + 边缘计算 |
| Snowmobile | 100 PB | 超大规模迁移（集装箱卡车） |

## 跨服务对比

| 维度 | S3 | EBS | EFS | FSx |
|------|-----|-----|-----|-----|
| 存储类型 | 对象 | 块 | 文件 | 文件 |
| 访问方式 | REST API | 挂载为磁盘 | 挂载为目录 | 挂载为目录 |
| 最大容量 | 无限 | 64 TB / 卷 | 无限 | 随预置容量 |
| 跨 AZ | 是 | 否（需快照） | 是 | 取决于部署 |
| 多实例共享 | 是 | 否 | 是 | 是 |
| 常见延迟 | 毫秒 | 毫秒 | 毫秒 | 毫秒 |
| Linux | ✓ | ✓ | ✓ | ✓ |
| Windows | ✓ | ✓ | 需客户端 | ✓ |

## 典型架构组合

```plaintext
用户 → CloudFront CDN
                ↓
           S3（静态资源 + 数据湖）
                ↓
EC2（应用服务器 + EBS 系统盘）
          ↓
     EFS（共享代码/配置文件）
          ↓
     FSx for Windows（共享文档）
```

## 存储费用要点

各存储服务费用构成差异较大，主要注意以下几点：

1. **S3**：存储量 + 请求次数 + 数据传输 + 取回费用
2. **EBS**：预置容量（无论是否使用）+ 快照存储
3. **EFS**：实际使用量 + 吞吐模式选择
4. **FSx**：预置容量（类似 EBS）
5. **Storage Gateway**：网关软件费用 + S3 存储费用 + 缓存磁盘费用

> 使用 [AWS 计费计算器](https://calculator.aws) 可提前估算成本。

## 总结

| 场景 | 推荐服务 |
|------|----------|
| 静态网站、备份、数据湖 | S3 Standard → Glacier |
| EC2 系统盘、数据库 | EBS gp3 / io2 |
| 多实例共享、代码目录 | EFS |
| Windows 文件服务器 | FSx for Windows |
| HPC、ML 训练 | FSx for Lustre |
| 本地备份上云 | Storage Gateway |
| 离线数据迁移 | Snowball Edge |
| 统一备份策略 | AWS Backup |
