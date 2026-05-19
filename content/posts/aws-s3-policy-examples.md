---
title: "Amazon S3 策略示例：从入门到进阶"
description: "10 个实用的 S3 访问控制策略，覆盖常见业务场景"
date: 2026-05-18T00:00:00+08:00
lastmod: 2026-05-19T00:00:00+08:00
slug: aws-s3-policy-examples
categories: ["云计算"]
tags: ["aws", "s3", "iam", "安全", "存储"]
draft: false
---

## 1. 允许 IAM 用户访问某个存储桶

授予用户对特定桶的完整读写权限（含控制台所需权限）：

```json
{
    "Version":"2012-10-17",
    "Statement":[
        {
            "Effect":"Allow",
            "Action": "s3:ListAllMyBuckets",
            "Resource":"*"
        },
        {
            "Effect":"Allow",
            "Action":["s3:ListBucket","s3:GetBucketLocation"],
            "Resource":"arn:aws:s3:::amzn-s3-demo-bucket1"
        },
        {
            "Effect":"Allow",
            "Action":[
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:DeleteObject"
            ],
            "Resource":"arn:aws:s3:::amzn-s3-demo-bucket1/*"
        }
    ]
}
```

> `s3:PutObjectAcl` 和 `s3:GetObjectAcl` 是控制台复制/剪切/粘贴对象所需的权限。

## 2. 允许每个用户访问自己的文件夹

### 方案一：为每个用户单独创建策略

假设有两个用户 Mary 和 Carlos，桶结构为：

```
amzn-s3-demo-bucket1/
├── Mary/
└── Carlos/
```

给 Mary 的策略：

```json
{
    "Version":"2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion"
            ],
            "Resource": "arn:aws:s3:::amzn-s3-demo-bucket1/Mary/*"
        }
    ]
}
```

### 方案二：使用策略变量（推荐）

将以下策略附加到组，组内所有用户自动只能访问自己同名的文件夹：

```json
{
    "Version":"2012-10-17",
    "Statement":[
        {
            "Effect":"Allow",
            "Action":[
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion"
            ],
            "Resource":"arn:aws:s3:::amzn-s3-demo-bucket1/${aws:username}/*"
        }
    ]
}
```

> 使用策略变量时，Version 必须指定 `2012-10-17`。

## 3. 允许组共享文件夹

授予市场团队访问共享文件夹的权限：

```json
{
    "Version":"2012-10-17",
    "Statement":[
        {
            "Effect":"Allow",
            "Action":[
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion"
            ],
            "Resource":"arn:aws:s3:::amzn-s3-demo-bucket1/share/marketing/*"
        }
    ]
}
```

## 4. 允许所有用户读取桶的只读区域

创建一个名为 `AllUsers` 的组（包含所有 IAM 用户），授予只读权限：

```json
{
    "Version":"2012-10-17",
    "Statement":[
        {
            "Effect":"Allow",
            "Action":[
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource":"arn:aws:s3:::amzn-s3-demo-bucket1/readonly/*"
        }
    ]
}
```

## 5. 允许合作伙伴上传到指定目录

限制合作伙伴只能上传到自己的目录，拒绝其他所有操作：

```json
{
    "Version":"2012-10-17",
    "Statement":[
        {
            "Effect":"Allow",
            "Action":"s3:PutObject",
            "Resource":"arn:aws:s3:::amzn-s3-demo-bucket1/uploads/anycompany/*"
        },
        {
            "Effect":"Deny",
            "Action":"s3:*",
            "NotResource":"arn:aws:s3:::amzn-s3-demo-bucket1/uploads/anycompany/*"
        }
    ]
}
```

> 使用 `Deny` + `NotResource` 确保用户无法访问上传目录之外的任何内容。

## 6. 限制对特定账户的访问

确保 IAM 主体只能访问受信任账户中的 S3 资源：

```json
{
    "Version":"2012-10-17",
    "Statement": [
        {
            "Sid": "DenyS3AccessOutsideMyBoundary",
            "Effect": "Deny",
            "Action": ["s3:*"],
            "Resource": "*",
            "Condition": {
                "StringNotEquals": {
                    "aws:ResourceAccount": ["222222222222"]
                }
            }
        }
    ]
}
```

> 此策略不授予权限，而是作为防护机制，阻止访问指定账户之外的 S3 资源。

## 7. 限制 OU 内访问

仅在 AWS Organizations 中，限制只能访问某个组织单元内的 S3 资源：

```json
{
    "Version":"2012-10-17",
    "Statement": [
        {
            "Sid": "AllowS3AccessOutsideMyBoundary",
            "Effect": "Allow",
            "Action": ["s3:*"],
            "Resource": "*",
            "Condition": {
                "ForAllValues:StringLike": {
                    "aws:ResourceOrgPaths": [
                        "o-acorg/r-acroot/ou-acroot-exampleou/"
                    ]
                }
            }
        }
    ]
}
```

## 8. 限制组织内访问

要求主体和资源必须在同一组织中：

```json
{
    "Version":"2012-10-17",
    "Statement": [
        {
            "Sid": "DenyS3AccessOutsideMyBoundary",
            "Effect": "Deny",
            "Action": ["s3:*"],
            "Resource": "arn:aws:s3:::*/*",
            "Condition": {
                "StringNotEquals": {
                    "aws:ResourceOrgID": "${aws:PrincipalOrgID}"
                }
            }
        }
    ]
}
```

## 9. 查询账户 PublicAccessBlock 配置

```json
{
    "Version":"2012-10-17",
    "Statement":[
        {
            "Sid":"statement1",
            "Effect":"Allow",
            "Action":["s3:GetAccountPublicAccessBlock"],
            "Resource":["*"]
        }
    ]
}
```

## 10. 限制只能在特定区域创建桶

仅允许在南美洲（圣保罗）区域创建存储桶：

```json
{
    "Version":"2012-10-17",
    "Statement":[
        {
            "Sid":"statement1",
            "Effect":"Allow",
            "Action": "s3:CreateBucket",
            "Resource": "arn:aws:s3:::*",
            "Condition": {
                "StringLike": {
                    "s3:LocationConstraint": "sa-east-1"
                }
            }
        },
        {
            "Sid":"statement2",
            "Effect":"Deny",
            "Action": "s3:CreateBucket",
            "Resource": "arn:aws:s3:::*",
            "Condition": {
                "StringNotLike": {
                    "s3:LocationConstraint": "sa-east-1"
                }
            }
        }
    ]
}
```

> 添加显式 Deny 语句可以防止其他策略覆盖此限制。

## 总结

| 场景 | 关键点 |
|------|--------|
| 用户级隔离 | 使用 `${aws:username}` 策略变量 |
| 组共享 | 附加策略到 IAM 组 |
| 合作伙伴限制 | `Deny` + `NotResource` 组合 |
| 组织隔离 | 使用 `aws:ResourceOrgID` 和 `aws:PrincipalOrgID` |
| 区域限制 | 使用 `s3:LocationConstraint` 条件键 |
