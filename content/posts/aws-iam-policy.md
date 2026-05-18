---
title: "AWS IAM 策略完全指南"
description: "从策略元素到编写规范，一篇搞懂 IAM Policy"
date: 2026-05-18T00:00:00+08:00
slug: aws-iam-policy
categories: ["云计算"]
tags: ["aws", "iam", "security"]
draft: false
---

## IAM 策略元素

IAM 策略由以下五个核心元素组成：

| 元素 | 必需 | 说明 |
|------|------|------|
| **Effect** | 是 | `Allow` 或 `Deny`，表示允许还是拒绝访问 |
| **Principal** | 否 | 指定主体（账户、用户、角色），仅用于资源策略 |
| **Action** | 是 | 允许或拒绝的操作列表，如 `s3:GetObject` |
| **Resource** | 是 | 操作作用的资源 ARN |
| **Condition** | 否 | 策略生效的特定条件 |

## IAM 策略编写规范

### 基本结构

策略必须是有效的 JSON 格式：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::example-bucket/*"
        }
    ]
}
```

### 最佳实践

- **最小权限原则**：只授予完成任务所需的最小权限
- 避免滥用 `"Resource": "*"`
- 使用 Condition 增强安全性（如限制 IP、MFA 要求）
- 为策略命名和添加描述，便于审计

### 常见错误

- JSON 语法错误（逗号、引号）
- Action/Resource 大小写错误（AWS 区分大小写）
- 对不支持资源级权限的服务指定具体 ARN
- 过度使用 `Deny`，优先用 `Allow` 显式授权

## 策略类型

### 基于身份的策略

附加到 IAM 身份（用户、组、角色）上，分为：

- **托管策略**：可复用，支持版本控制
- **内联策略**：嵌入在特定身份中，生命周期与身份绑定

### 基于资源的策略

直接附加到 AWS 资源上，如：

- S3 存储桶策略
- IAM 角色信任策略（控制谁可以代入该角色）

## 调试建议

- 使用 **IAM Policy Simulator** 测试策略
- 查看 **CloudTrail 日志** 验证权限
- 使用 **Access Advisor** 分析实际使用权限，精简策略
