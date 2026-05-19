---
title: "AWS 数据库服务详解：RDS 与 DynamoDB"
description: "深入对比 AWS 两大核心数据库服务——关系型的 RDS 与非关系型的 DynamoDB，帮你选对数据库"
date: 2026-05-19T00:00:00+08:00
slug: aws-database-rds-dynamodb
categories: ["云计算"]
tags: ["aws", "数据库", "rds", "dynamodb", "入门"]
draft: false
---

AWS 提供两大类托管数据库服务：关系型的 **Amazon RDS**（含 Aurora）和 NoSQL 的 **Amazon DynamoDB**。本文围绕这两大服务展开，涵盖架构、选型、计费和 2026 年最新特性。

## Amazon RDS：托管关系型数据库

RDS 让你在云上运行熟悉的数据库引擎，而无需管理操作系统、补丁、备份等运维工作。

### 支持的引擎

| 引擎 | 类型 | 许可模式 |
|------|------|----------|
| Aurora MySQL | 兼容 MySQL | License Included |
| Aurora PostgreSQL | 兼容 PostgreSQL | License Included |
| MySQL | 开源 | License Included |
| PostgreSQL | 开源 | License Included |
| MariaDB | 开源 | License Included |
| SQL Server | 商业 | LI / BYOL |
| Oracle | 商业 | LI / BYOL |
| IBM Db2 | 商业 | BYOL / Marketplace |

> 2026 年 RDS for Db2 已陆续扩展到 GovCloud 和新西兰区域，支持跨区域 Standby Replica、跨区域加密备份、原生数据库级别备份和单实例多数据库（最多 50 个数据库）。

### 存储

| 类型 | 上限 | IOPS | 适用场景 |
|------|------|------|----------|
| gp3 | 64 TiB | 64,000（含基线）| 新项目默认选择 |
| io2 | 64 TiB | 256,000 | 关键业务，99.999% 持久性 |
| io1 | 64 TiB | 64,000 | 高 IOPS 生产库 |
| gp2 | 64 TiB | 3,000（基线）| 存量，新项目建议用 gp3 |

> Aurora 的存储是自动扩展的分布式共享存储层（6 副本跨 3 AZ），上限 256 TiB，无需管理存储容量。

### 实例类型

最新几代 RDS 实例（2026 年）：

| 系列 | 处理器 | 特点 |
|------|--------|------|
| db.m8i / r8i | Intel Xeon 6 | 最新英特尔，较 m7i 提升 15% 性价比 |
| db.m8a / r8a | AMD EPYC 5代 | 高性价比，多线程场景 |
| db.r8g / m8g | AWS Graviton4 | ARM 架构，性价比最高 |
| db.m7i / r7i | Intel Xeon 4代 | 成熟稳定，广泛可用 |

### 部署选项

| 模式 | 说明 | 可用性 SLA |
|------|------|------------|
| Single-AZ | 单一可用区，成本最低 | 99.5% |
| Multi-AZ | 同步复制到另一 AZ 的 Standby | 99.95% |
| Multi-AZ DB Cluster | 1 主 + 2 可读 Standby | 99.95% |
| Read Replicas（跨区域） | 异步复制，最多 15 个 | N/A |

> Aurora 的分布式存储层本身就跨 3 个 AZ，故障切换通常在 30 秒内完成（RDS 标准 Multi-AZ 需要 60-120 秒）。

### 2026 年 RDS 主要更新

- Aurora 新集群**默认启用服务端加密**
- RDS/Aurora 快照恢复时**可修改备份保留期和备份窗口**
- Aurora Serverless 性能提升 **30%**，支持更智能伸缩
- Aurora PostgreSQL Express 配置：**数秒创建数据库**，附互联网网关，无需 VPC
- Aurora DSQL 新增 5 个区域（香港、孟买、新加坡、斯德哥尔摩、圣保罗），支持自增列和序列
- RDS for Db2 扩展到 GovCloud 和新西兰区域
- **Database Savings Plans**：跨 RDS/Aurora 引擎的灵活折扣，1 年期最高省 35%

### RDS 计费

RDS 费用由四部分构成：

```
总费用 = 实例小时数（按实例类型）
       + 存储（GB/月）
       + IOPS（gp3 基线外计费，io2/io1 全量计费）
       + 备份存储（超过免费额度部分）
```

几个参考价格（us-east-1，On-Demand，Single-AZ）：

| 引擎 | 实例 | vCPU | 小时价格 |
|------|------|------|----------|
| MySQL/PostgreSQL | db.t4g.micro | 2 | $0.016 |
| MySQL/PostgreSQL | db.m5.large | 2 | ~$0.17 |
| Aurora | db.r5.large | 2 | ~$0.29 |
| SQL Server LI | db.m5.large | 2 | ~$0.98 |
| Oracle LI | db.r5.large | 2 | ~$0.48 |

> 可选项：**Reserved Instances**（1/3 年，节省 30-60%）和 **Database Savings Plans**（跨引擎灵活折扣）。

---

## Amazon DynamoDB：托管 NoSQL 数据库

DynamoDB 是一个全托管的 Key-Value 和文档数据库，设计目标是单毫秒级延迟、自动伸缩、无服务器。

### 核心概念

| 概念 | 说明 |
|------|------|
| **表（Table）** | 数据容器，无固定 schema |
| **项（Item）** | 一行数据，最大 400 KB |
| **分区键（Partition Key）** | 必须指定，决定数据分布 |
| **排序键（Sort Key）** | 可选，同一分区内的排序 |
| **局部二级索引（LSI）** | 同一分区内另一排序方式，创建后不可修改 |
| **全局二级索引（GSI）** | 跨分区的新索引，可随时创建 |

### 读取一致性

| 模式 | 说明 | 价格 |
|------|------|------|
| 最终一致性读取 | 返回的数据可能滞后，延迟最低 | 1 RCU = 2 次读取（4KB/次）|
| 强一致性读取 | 返回最新数据 | 1 RCU = 1 次读取（4KB/次）|
| 事务性读取 | 跨表/跨项的事务保证 | 1 RCU = 0.5 次读取 |

> 单区域表默认是强一致性读取。Global Tables 默认是最终一致性（MREC），多区域强一致性（MRSC）于 2025 年 6 月 GA。

### 容量模式

**按需（On-Demand）：**
- 完全无服务器，自动伸缩
- 按实际请求数计费，读 $1.25/MRRU、写 $5.00/MWRU（us-east-1）
- 新表起始：4,000 写请求/秒、12,000 读请求/秒
- 自动翻倍：可瞬间达到前一次峰值的 2 倍
- 适合：流量不可预测、新项目、开发测试

**预置（Provisioned）：**
- 手动指定 RCU/WCU，可选 Auto Scaling
- 建议目标利用率设为 **70%**
- 可购买 **预留容量（Reserved Capacity）**：1 年节省 54%、3 年节省 77%
- 适合：流量可预测的稳定生产负载

| 对比 | 按需 | 预置 |
|------|------|------|
| 容量管理 | 无需规划 | 需设定上限/下限 + Auto Scaling |
| 账单 | 按请求数 | 按预置容量（即使不用）|
| 成本优势 | 负载利用率 < 35% 时更省 | 稳定负载下更划算 |
| 预留折扣 | 无 | 最高省 77% |

### Global Tables

DynamoDB Global Tables 是多区域、多主架构，自动跨区域复制数据。

| 特性 | MREC（多区域最终一致性） | MRSC（多区域强一致性） |
|------|------------------------|------------------------|
| 复制延迟 | 通常 1-2 秒 | 同步复制 |
| RPO | 秒级 | **0** |
| 可用性 SLA | 99.999% | 99.999% |
| Region 数量 | 不限 | 必须 3 个（含 witness）|
| 跨账号 | ✅（2026 年 2 月新增） | ❌ |

> 2026 年 2 月：Global Tables 支持**跨 AWS 账号复制**，实现更强的安全隔离和灾备能力。

### DynamoDB Streams

DynamoDB 表的每次变更都会生成 Stream 记录（最多保留 24 小时），可用于：
- 触发 Lambda 函数
- 同步到其他数据源
- 实时数据管道

### 2026 年 DynamoDB 主要更新

- **跨账号 Global Tables（GA）** — 数据复制到不同账号，加强安全隔离
- 按需模式可设**最大读写吞吐上限**，防止成本失控
- **Warm Throughput** — 预冷吞吐量，应对突发流量
- **CloudWatch Contributor Insights** 支持 GSI 级别
- 标准表免费层：**25 GB 存储 + 25 RCU/WCU**（永不过期，每月重置）

### 计费参考

| 维度 | 价格（us-east-1）|
|------|------------------|
| 按需读 | $1.25 / 百万请求单元 |
| 按需写 | $5.00 / 百万请求单元 |
| 预置读（RCU/小时）| ~$0.00013 |
| 预置写（WCU/小时）| ~$0.00065 |
| 标准存储 | $0.25 / GB / 月 |
| Standard-IA 存储 | $0.10 / GB / 月 |
| 连续备份（PITR）| $0.20 / GB / 月 |

> 免费层可支撑约 **2 亿请求/月**（取决于 Item 大小）。

---

## RDS vs DynamoDB：如何选型

### 选 RDS 的场景

- 数据间有明确的关系（JOIN、外键）
- 需要 ACID 事务（复杂的跨表操作）
- 固定 Schema，需求已知
- 现有应用依赖 SQL 语法
- 报告、BI 类查询
- 需要商业引擎的特定功能（Oracle 存储过程、SQL Server 的 CLR、Db2 的纯 XML）

### 选 DynamoDB 的场景

- 超高并发（百万级 QPS）
- 灵活 Schema，访问模式不确定
- Key-Value 或简单的文档查询
- 需要自动伸缩，不想管理容量
- 多区域低延迟写入
- 物联网、游戏、会话管理、购物车、元数据存储

### 典型架构

```plaintext
┌─────────────────────────────────────┐
│                用户                  │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      │  Application    │
      │  (微服务)       │
      └────────┬────────┘
               │
      ┌────────┴────────┐
      │    API 层       │
      └────────┬────────┘
               │
       ┌───────┴───────┐
       │               │
  ┌────┴────┐    ┌────┴────┐
  │ Aurora  │    │DynamoDB │
  │(订单/   │    │(会话/   │
  │ 用户/   │    │ 购物车/ │
  │ 账务)   │    │ 日志)   │
  └─────────┘    └─────────┘
```

> 实践中两者经常配合使用：RDS 存核心业务数据（订单、用户、账务），DynamoDB 存高并发辅助数据（会话、购物车、点赞）。

### 选型简化决策树

```
数据有复杂关系 / 需要 JOIN？
├── 是 → RDS（PostgreSQL / MySQL / Aurora）
└── 否 → 需要 ACID 多行事务？
         ├── 是 → Aurora（分布式存储 + 强一致性）
         └── 否 → 请求量 > 10K QPS / 需要自动伸缩？
                  ├── 是 → DynamoDB
                  └── 否 → 两者皆可，按团队技能偏好
```

## 总结

| 维度 | RDS | DynamoDB |
|------|-----|----------|
| 模型 | 关系型（表/SQL） | Key-Value + 文档 |
| Schema | 固定 | 无 schema |
| 伸缩 | 垂直（换更大实例）| 水平（自动）|
| 最大存储 | 64 TiB（Aurora 256 TiB）| 无限 |
| 延迟 | 毫秒级 | 单毫秒级 |
| 索引 | 标准 SQL 索引 | LSI / GSI |
| 事务 | 完整 ACID | 单一分区 ACID |
| 跨区域 | 异步读副本 | Global Tables（多主）|
| 查询能力 | SQL 完整 | 按主键/索引查询 |
| 最适场景 | 业务系统、ERP、CMS | 实时应用、IoT、游戏 |
