---
title: "MySQL 子查询详解"
description: "从基础到进阶，全面掌握 MySQL 子查询的写法、类型与优化技巧"
date: 2026-06-08T00:00:00+08:00
slug: mysql-subquery
categories: ["数据库"]
tags: ["MySQL", "SQL", "子查询", "数据库"]
draft: false
---

## 什么是子查询

子查询（Subquery）就是嵌套在另一个 SQL 语句中的 SELECT 查询，也叫内层查询或嵌套查询。外层的主查询使用子查询的结果来进一步筛选或计算数据。

```sql
-- 子查询在括号内，先执行
SELECT name, age
FROM users
WHERE age > (SELECT AVG(age) FROM users);
```

**执行顺序**：先执行子查询（内层），再执行主查询（外层）。

## 子查询可以在哪里出现

| 位置 | 用法 | 示例 |
|------|------|------|
| WHERE 中 | 作为过滤条件 | `WHERE age > (SELECT AVG(age) ...)` |
| FROM 中 | 作为临时表（派生表） | `FROM (SELECT * FROM ...) AS t` |
| SELECT 中 | 作为计算列（标量子查询） | `SELECT name, (SELECT ...) AS cnt` |

## 三种子查询类型

### 1. 标量子查询

返回**单个值**（一行一列），常配合比较运算符使用。

```sql
-- 查询工资高于平均工资的员工
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 查询最新入职的员工
SELECT name, hire_date
FROM employees
WHERE hire_date = (SELECT MAX(hire_date) FROM employees);
```

### 2. 列子查询

返回**一列多行**，常配合 IN、ANY、ALL 使用。

```sql
-- 查询有订单的用户（IN 用法）
SELECT name, email
FROM users
WHERE id IN (SELECT DISTINCT user_id FROM orders);

-- 查询有未支付订单的用户
SELECT name
FROM users
WHERE id IN (
    SELECT user_id
    FROM orders
    WHERE status = 'unpaid'
);
```

### 3. 行子查询

返回**一行多列**，须用括号匹配对应列的数量和类型。

```sql
-- 查询每个部门工资最高的员工
SELECT name, department, salary
FROM employees
WHERE (department, salary) IN (
    SELECT department, MAX(salary)
    FROM employees
    GROUP BY department
);
```

## 子查询常用运算符

### IN / NOT IN

```sql
-- 查询购买了商品 "A" 或 "B" 的用户
SELECT name
FROM users
WHERE id IN (
    SELECT user_id
    FROM orders
    WHERE product IN ('A', 'B')
);

-- 查询从未下过单的用户
SELECT name
FROM users
WHERE id NOT IN (
    SELECT DISTINCT user_id FROM orders
);
```

### EXISTS / NOT EXISTS

`EXISTS` 只关心子查询结果是否为空，效率通常高于 IN（尤其在子查询结果集很大时）。

```sql
-- 查询已下单的用户（EXISTS 版本）
SELECT name, email
FROM users u
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.user_id = u.id
);
```

> `SELECT 1` 是 EXISTS 的惯用写法，因为它只需要知道有结果即可，不关心具体字段。

**IN vs EXISTS 对比**：

| 特性 | IN | EXISTS |
|------|-----|--------|
| 执行逻辑 | 先执行子查询，得到结果集 | 逐行检查，找到即停止 |
| 适用场景 | 子查询结果集小时 | 子查询结果集大时 |
| NULL 处理 | 可能有问题 | 不受影响 |

### ANY / ALL

```sql
-- 查询成绩比班级 A 任何一个学生都高的
SELECT name, score
FROM scores
WHERE score > ANY (
    SELECT score FROM scores WHERE class = 'A'
);

-- 查询成绩比班级 A 所有学生都高的
SELECT name, score
FROM scores
WHERE score > ALL (
    SELECT score FROM scores WHERE class = 'A'
);
```

**区别示例**：
```sql
-- 班级A最高分 95，最低分 60
-- > ANY → 只要大于 60 即满足（大于任何一个）
-- > ALL  → 必须大于 95 才满足（大于全部）

-- 查询价格超过所有笔记本的产品
SELECT name, price
FROM products
WHERE price > ALL (
    SELECT price FROM products WHERE category = '笔记本'
);
```

## 关联子查询

子查询内部引用了外层查询的列，需要**逐行执行**。

```sql
-- 查询每个用户及其最新订单日期
SELECT u.name, u.email,
    (SELECT MAX(o.created_at)
     FROM orders o
     WHERE o.user_id = u.id) AS last_order_date
FROM users u;

-- 查询工资高于本部门平均水平的员工
SELECT name, department, salary
FROM employees e1
WHERE salary > (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e1.department = e2.department
);
```

**注意**：关联子查询性能较差，大数据量场景建议用 JOIN 代替。

## 派生表（FROM 中的子查询）

子查询用在 FROM 子句中作为一个临时表，**必须指定别名**。

```sql
-- 每个用户的订单总数
SELECT u.name, t.order_count
FROM users u
JOIN (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
) AS t ON u.id = t.user_id
ORDER BY t.order_count DESC;

-- 每月新增用户数
SELECT month, COUNT(*) AS new_users
FROM (
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month
    FROM users
) AS t
GROUP BY month
ORDER BY month;
```

## 实战示例

### 示例 1：库存预警

```sql
-- 查询库存低于该商品平均销量的商品
SELECT p.name, p.stock,
    (SELECT AVG(quantity) FROM order_items WHERE product_id = p.id) AS avg_sold
FROM products p
WHERE p.stock < (
    SELECT AVG(quantity)
    FROM order_items
    WHERE product_id = p.id
);
```

### 示例 2：重复数据查询

```sql
-- 查询有重复邮箱的用户
SELECT name, email
FROM users
WHERE email IN (
    SELECT email
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
);
```

### 示例 3：Top N 问题

```sql
-- 每个分类销量最高的产品
SELECT p.category, p.name, p.sales
FROM products p
WHERE (p.category, p.sales) IN (
    SELECT category, MAX(sales)
    FROM products
    GROUP BY category
);
```

### 示例 4：多层嵌套

```sql
-- 查询购买了"最畅销商品"的用户
SELECT name, email
FROM users
WHERE id IN (
    SELECT user_id
    FROM order_items
    WHERE product_id = (
        SELECT product_id
        FROM order_items
        GROUP BY product_id
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
);
```

## 子查询 vs JOIN

很多子查询需求可以用 JOIN 代替，且 JOIN 通常更高效：

```sql
-- 子查询方式
SELECT name
FROM users
WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);

-- JOIN 方式（推荐）
SELECT DISTINCT u.name
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.amount > 100;
```

**选择建议**：
- **简单 IN/NOT IN → JOIN 代替**
- **聚合计算 → 优先尝试 GROUP BY + JOIN**
- **EXISTS/NOT EXISTS → 性能通常不错，可保留**
- **逻辑复杂、多层嵌套 → 考虑 CTE（WITH 子句）**

## CTE：更好的子查询替代

MySQL 8.0+ 支持公共表表达式（CTE），比嵌套子查询更清晰：

```sql
-- 子查询写法（嵌套深，难读）
SELECT AVG(order_count)
FROM (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
    HAVING COUNT(*) >= 3
) AS active_users;

-- CTE 写法（语义清晰）
WITH active_users AS (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
    HAVING COUNT(*) >= 3
)
SELECT AVG(order_count) FROM active_users;
```

## 常见错误

```sql
-- ❌ 子查询返回超过 1 行
SELECT * FROM products
WHERE price = (SELECT price FROM products WHERE category = '电子');
-- 错误：Subquery returns more than 1 row

-- ✅ 改用 IN
SELECT * FROM products
WHERE price IN (SELECT price FROM products WHERE category = '电子');
```

```sql
-- ❌ 派生表缺少别名
SELECT * FROM (
    SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id
);
-- 错误：Every derived table must have its own alias

-- ✅ 添加别名
SELECT * FROM (
    SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id
) AS t;
```

## 性能优化建议

| 技巧 | 说明 |
|------|------|
| 尽量用 JOIN 代替 IN 子查询 | JOIN 可利用索引，IN 子查询可能全表扫描 |
| EXISTS 替代 IN（大数据集） | EXISTS 找到匹配即停止，不生成结果集 |
| 给关联列加索引 | 关联子查询中引用的外层列必须有索引 |
| 避免多层嵌套 | 超过 2 层考虑 CTE 或临时表 |
| 用 EXPLAIN 分析 | 查看执行计划，检查是否有 `DEPENDENT SUBQUERY` |

```sql
-- 使用 EXPLAIN 分析子查询
EXPLAIN SELECT name
FROM users
WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);
```

## 总结

子查询是 SQL 中强大的工具，能用一条语句完成复杂的数据分析。掌握以下要点即可应对大部分场景：

| 要点 | 一句话 |
|------|--------|
| 标量子查询 | 单个值，配合 =、>、< 使用 |
| IN 子查询 | 一列多值，判断是否在集合中 |
| EXISTS 子查询 | 判断是否存在，大型结果集友好 |
| 派生表 | FROM 中的子查询，必须起别名 |
| 关联子查询 | 引用外层列，逐行执行，较慢 |
| CTE | MySQL 8.0+，比嵌套子查询更清晰 |