---
title: "AWS 2026 年度更新汇总（截至 5 月）"
description: "新服务、新功能、重要变更——一张表看清 AWS 2026 上半年所有大新闻"
date: 2026-05-19T00:00:00+08:00
slug: aws-2026-updates
categories: ["云计算"]
tags: ["aws", "2026", "汇总", "更新"]
draft: false
---

2026 年 AWS 的主题是 **Agent + AI**，同时存储、计算、数据库均有重磅更新。以下是按类别整理的所有重要发布（截至 5 月 19 日）。

## AI / ML

| 时间 | 内容 |
|------|------|
| 1月 | Amazon Nova 2 系列发布：Sonic（语音转语音）、Lite（推理）、Omni（预览）、Act（UI 自动化）|
| 2月 | SageMaker Inference 支持自定义 Nova 模型部署 |
| 3月 | Bedrock AgentCore 运行时支持有状态 MCP 服务器 |
| 4月 | Amazon Agent Registry（预览）— 企业级 Agent 统一注册中心 |
| 4月 | Bedrock AgentCore 新增托管工具、CLI、AgentCore 技能 |
| 4月 | SageMaker AI 推出 Agent 化模型微调体验 |
| 4月 | What's Next 大会：Quick AI 桌面版、Connect 拆分为 4 个 Agent 产品 |
| 4月 | AWS + OpenAI 合作：GPT-5.5/5.4 上 Bedrock、Codex 上 Bedrock、托管 Agent |
| 5月 | Agent Toolkit for AWS（GA）— 40+ Agent Skills、托管 MCP Server |
| 5月 | AWS MCP Server（GA）— 托管 MCP，IAM 防护，沙箱执行 |
| 5月 | Claude Platform on AWS（GA）— 原生 Claude 体验通过 AWS 账号使用 |
| 5月 | WAF AI 流量分析面板（追踪 650+ Bot/Agent）|
| 5月 | Entity Resolution 增量 ML 匹配（处理速度提升 95%）|

## 存储

| 时间 | 内容 |
|------|------|
| 1月 | EFS Archive 存储类 — 比 EFS IA 省 72%，适合冷数据 |
| 3月 | S3 账号区域命名空间 — 无需全局唯一桶名 |
| 4月 | **S3 Files（GA）** — S3 桶挂载为 NFS 文件系统，1ms 延迟 |
| 4月 | Lambda 支持 S3 Files 挂载 |
| 4月 | S3 新增 5 种校验算法（MD5、XXHash3/64/128、SHA-512）|
| 4月 | S3 Express One Zone 支持 S3 Inventory |
| 4月 | **EBS Volume Clones** — 即时卷克隆，秒级可用 |

## 计算

| 时间 | 内容 |
|------|------|
| 2月 | EC2 M8azn — AMD EPYC 5代，5GHz 最高频率 |
| 2月 | EC2 Hpc8a — HPC 优化，192 核，300Gbps EFA |
| 3月 | Lambda Managed Instances 最大 32GB / 16 vCPU，可配内存比 |
| 3-5月 | 第 6 代 Intel 实例全面上市：C8in/C8ib、M8in/M8ib、R8in/R8idn/R8idb |
| 4月 | EC2 High Memory U7i 新增区域（8TB-24TB 内存）|
| 5月 | Lambda Managed Instances 支持 EventBridge 计划伸缩 |
| 5月 | EventBridge Scheduler 新增 619 个 SDK 动作 |

## 数据库

| 时间 | 内容 |
|------|------|
| 2月 | Aurora 新集群默认启用服务端加密 |
| 2月 | Aurora DSQL 支持自增列和序列 |
| 2月 | RDS/Aurora 快照恢复支持修改备份配置 |
| 3月 | Aurora PostgreSQL Express 配置 |
| 4月 | **Aurora Serverless 性能提升 30%** + 更智能伸缩 |
| 5月 | Aurora DSQL 新增 5 个区域 |

## 网络

| 时间 | 内容 |
|------|------|
| 1月 | Network Firewall 支持 GenAI 流量分类 |
| 3月 | Route 53 Global Resolver（GA）|
| 3月 | VPC Encryption Controls 开始计费 |
| 4月 | **AWS Interconnect（GA）** — 多云连接（GCP + Azure）+ 最后一英里 |
| 5月 | EKS EFA 支持 Kubernetes DRA |

## 开发工具

| 时间 | 内容 |
|------|------|
| 3月 | AWS Builder ID 支持 GitHub/Amazon 登录 |
| 4月 | AWS Transform 支持容器化迁移 |
| 5月 | ECR Pull Through Cache 支持 OCI 引用同步 |

## ⚠️ 服务变更

3 月 31 日发布一批服务状态变更：

**进入维护（4/30 起停新客户）：**
App Runner、Audit Manager、CloudTrail Lake、Glue Ray Jobs、IoT FleetWise、ARC Readiness、Comprehend（部分功能）、Rekognition（部分）、SNS MDP

**进入终止（Sunset）：**
RDS Custom for Oracle、WorkMail、WorkSpaces Thin Client、Service Management Connector

**停止支持：**
Chime SDK Proxy Sessions（3/31）

## 总览

AI/Agent 是绝对主线——Agent Toolkit、MCP Server、OpenAI/Claude 深度集成，AWS 正在全面押注 Agent 生态。存储方面 S3 Files 和 EBS Volume Clones 是两大亮点。计算方面第 6 代 Intel 实例全面铺开。数据库方面 Aurora Serverless 大幅增强。此外一批老服务开始清理，值得关注迁移计划。
