---
title: "AWS IAM 策略完全指南"
description: "从策略元素到编写规范，附实用示例与排错步骤"
date: 2026-05-18T00:00:00+08:00
slug: aws-iam-policy
categories: ["云计算"]
tags: ["aws", "iam", "security", "s3"]
draft: false
---

## IAM 策略元素

IAM 策略由以下五个核心元素组成：

| 元素 | 必需 | 说明 |
|------|------|------|
| **Effect** | 是 | `Allow` 或 `Deny`，是否允许访问 |
| **Principal** | 否 | 主体（账户/用户/角色），仅用于资源策略 |
| **Action** | 是 | 允许或拒绝的操作，如 `s3:GetObject` |
| **Resource** | 是 | 操作作用的资源 ARN |
| **Condition** | 否 | 策略生效的特定条件 |

## 实用示例

### 1. S3 只读访问

允许用户读取指定桶中的所有对象，但不允许写入或删除：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::my-bucket",
                "arn:aws:s3:::my-bucket/*"
            ]
        }
    ]
}
```

### 2. 强制 MFA 访问

用户必须使用 MFA 才能访问 S3 桶中的敏感数据：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::my-bucket/sensitive/*",
            "Condition": {
                "Bool": {
                    "aws:MultiFactorAuthPresent": "true"
                }
            }
        },
        {
            "Effect": "Deny",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::my-bucket/sensitive/*",
            "Condition": {
                "BoolIfExists": {
                    "aws:MultiFactorAuthPresent": "false"
                }
            }
        }
    ]
}
```

### 3. 限制源 IP 地址

仅允许来自公司 IP 范围的 API 调用：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Deny",
            "Action": "*",
            "Resource": "*",
            "Condition": {
                "NotIpAddress": {
                    "aws:SourceIp": [
                        "203.0.113.0/24",
                        "198.51.100.0/24"
                    ]
                }
            }
        }
    ]
}
```

### 4. S3 存储桶策略——允许跨账户访问

允许另一个 AWS 账户写入日志到本桶：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::123456789012:root"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::my-log-bucket/*"
        }
    ]
}
```

### 5. EC2 最小权限——仅管理指定实例

允许重启和停止特定 EC2 实例：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:StartInstances",
                "ec2:StopInstances",
                "ec2:RebootInstances"
            ],
            "Resource": "arn:aws:ec2:us-east-1:123456789012:instance/i-0abcd1234efgh5678"
        },
        {
            "Effect": "Allow",
            "Action": "ec2:DescribeInstances",
            "Resource": "*"
        }
    ]
}
```

### 6. 基于标签的权限控制

仅允许操作带有标签 `Environment=Production` 的资源：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "ec2:*",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:ResourceTag/Environment": "Production"
                }
            }
        }
    ]
}
```

### 7. IAM 角色信任策略

允许 EC2 服务和另一个账户代入该角色：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        },
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::987654321098:root"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

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
- 避免滥用 `"Resource": "*"`，精确定义 ARN
- 使用 Condition 增强安全性（限制 IP、MFA、时间窗口）
- 为策略命名和添加描述，便于团队理解和审计
- 定期使用 **Access Advisor** 分析实际权限使用情况

### 常见错误

- JSON 语法错误（缺少逗号、引号不匹配、多余逗号）
- Action/Resource 大小写错误（AWS 区分大小写）
- 对不支持资源级权限的服务指定具体 ARN
- 过度使用 `Deny`，应优先用 `Allow` 显式授权
- 忘记给 `s3:ListBucket` 和 `s3:GetObject` 分别指定 Resource（桶 vs 对象）

## 排错步骤

### 1. 权限被拒（AccessDenied）

**现象**：调用 AWS API 返回 `AccessDenied` 错误。

**排查步骤**：

1. 检查策略 JSON 是否有语法错误（用 JSON 验证器检查）
2. 确认 IAM 用户/角色确实附加了该策略
3. 检查是否有显式 `Deny` 覆盖了 `Allow`（Deny 优先）
4. 检查 Session Policy 或 Permission Boundary 是否限制了权限
5. 查看 **CloudTrail** 日志中的 `"errorMessage": "AccessDenied"` 条目
6. 使用 **IAM Policy Simulator** 模拟该用户的操作

### 2. 策略未生效

**现象**：刚附加的策略，调用 API 仍被拒绝。

**排查步骤**：

1. IAM 策略传播需要时间（通常几秒，最多几分钟）
2. 确认策略中 Action 的名称完全正确（AWS 区分大小写）
3. 确认 Resource ARN 格式正确（服务、区域、账户、资源 ID 都要匹配）
4. 检查是否存在更严格的 Permission Boundary

### 3. 跨账户访问失败

**现象**：账户 A 无法访问账户 B 的资源。

**排查步骤**：

1. 账户 B 的资源策略中是否指定了正确的 Principal
2. 账户 A 的 IAM 用户/角色是否有权限调用该服务
3. 确认两个账户的 ARN 都正确无误
4. 检查资源策略是否有拼写错误

### 4. Condition 不生效

**现象**：设置了 IP 限制或 MFA 限制，但用户仍可绕过。

**排查步骤**：

1. 检查 Condition Key 名称是否完全正确（如 `aws:SourceIp` 区分大小写）
2. 确认 Condition 写在正确的 Statement 中
3. 对于 Deny 效果的条件，检查是否使用了 `BoolIfExists` 而非 `Bool`
4. 测试时使用 `"aws:ViaAWSService": "true"` 等调试条件

### 5. 使用 IAM Policy Simulator 调试

```json
// 测试用例：用户能否读取 S3 对象？
// 1. 在 Simulator 中选择用户
// 2. 选择 "s3:GetObject" 动作
// 3. 输入资源 ARN: arn:aws:s3:::my-bucket/my-file.txt
// 4. 点击 "Simulate"
// 5. 查看结果是 Allow 还是 Deny
// 6. 如果 Deny，展开查看匹配了哪条 Statement
```

## 策略类型

### 基于身份的策略

附加到 IAM 身份（用户、组、角色）上，分为：

- **托管策略**：可复用，支持版本控制，适合通用权限
- **内联策略**：嵌入在特定身份中，生命周期与身份绑定，适合特例权限

### 基于资源的策略

直接附加到 AWS 资源上，如：

- S3 存储桶策略
- IAM 角色信任策略（控制谁可以代入该角色）
- KMS 密钥策略
- SQS 队列策略

## 调试工具总结

| 工具 | 用途 |
|------|------|
| **IAM Policy Simulator** | 模拟策略执行结果 |
| **CloudTrail 事件历史** | 查看实际 API 调用的权限结果 |
| **Access Advisor** | 分析服务最后访问时间，辅助精简策略 |
| **Credentials Report** | 查看账户所有用户的密码和密钥状态 |
