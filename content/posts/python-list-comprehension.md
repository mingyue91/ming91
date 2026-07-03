---
title: "Python 列表推导式详解"
description: "列表推导式（List Comprehension）的语法、用法与常见模式，包括嵌套循环、条件过滤、函数调用等"
date: 2026-07-03T00:00:00+08:00
slug: python-list-comprehension
categories: ["python"]
tags: ["python", "入门"]
draft: false
---

## 概述

**列表推导式**（List Comprehension）提供了一种简洁的方式来创建列表。常见的应用是创建新列表，其中每个元素都是对另一个序列或可迭代对象中的每个成员应用一些操作的结果，或者创建满足特定条件的元素子序列。

---

## 基础用法

假设我们想要创建一个平方数列表，使用 for 循环的方式如下：

```python
squares = []
for x in range(10):
    squares.append(x**2)

squares
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

请注意，这会创建（或覆盖）一个名为 `x` 的变量，该变量在循环完成后仍然存在。我们可以使用以下方法计算平方数列表，而没有任何副作用：

```python
squares = list(map(lambda x: x**2, range(10)))
```

或者，等效地使用列表推导式：

```python
squares = [x**2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

它更简洁，可读性更强。

---

## 语法

列表推导式由包含一个表达式的方括号组成，表达式后面跟着一个 `for` 子句，然后是零个或多个 `for` 或 `if` 子句。结果将是一个新列表，它是通过在后面的 `for` 和 `if` 子句的上下文中评估表达式而得到的。

```python
[表达式 for 变量 in 可迭代对象 if 条件]
```

---

## 嵌套循环与条件过滤

此列表推导式如果两个列表的元素不相等，则将它们组合起来：

```python
[(x, y) for x in [1,2,3] for y in [3,1,4] if x != y]
# [(1, 3), (1, 4), (2, 3), (2, 1), (2, 4), (3, 1), (3, 4)]
```

它等价于：

```python
combs = []
for x in [1,2,3]:
    for y in [3,1,4]:
        if x != y:
            combs.append((x, y))

combs
# [(1, 3), (1, 4), (2, 3), (2, 1), (2, 4), (3, 1), (3, 4)]
```

请注意，在这两个代码片段中，`for` 和 `if` 语句的顺序是相同的。

> 如果表达式是一个元组（例如上例中的 `(x, y)`），则**必须**用括号括起来。

---

## 常用模式

### 1. 数值变换

```python
vec = [-4, -2, 0, 2, 4]

# 每个元素翻倍
[x*2 for x in vec]
# [-8, -4, 0, 4, 8]

# 过滤负数
[x for x in vec if x >= 0]
# [0, 2, 4]

# 对每个元素应用函数
[abs(x) for x in vec]
# [4, 2, 0, 2, 4]
```

### 2. 字符串处理

```python
freshfruit = ['  banana', '  loganberry ', 'passion fruit  ']
[weapon.strip() for weapon in freshfruit]
# ['banana', 'loganberry', 'passion fruit']
```

### 3. 生成元组列表

```python
[(x, x**2) for x in range(6)]
# [(0, 0), (1, 1), (2, 4), (3, 9), (4, 16), (5, 25)]

# 不加括号会报错
[x, x**2 for x in range(6)]
# SyntaxError: did you forget parentheses around the comprehension target?
```

### 4. 展平嵌套列表

使用两个 `for` 实现列表展平：

```python
vec = [[1,2,3], [4,5,6], [7,8,9]]
[num for elem in vec for num in elem]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### 5. 嵌套函数调用

列表推导式可以包含复杂的表达式和嵌套函数：

```python
from math import pi
[str(round(pi, i)) for i in range(1, 6)]
# ['3.1', '3.14', '3.142', '3.1416', '3.14159']
```

---

## 总结

列表推导式是 Python 中非常实用的语法糖，相比传统的 for 循环方式更简洁、更可读。常见的应用场景包括：

- 数值变换与过滤
- 字符串批量处理
- 嵌套列表展平
- 与内置函数（如 `map()`、`filter()`）的替代

掌握列表推导式可以让你写出更 Pythonic 的代码。
