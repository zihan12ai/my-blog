---
title: 从 conda 转 uv 快速上手
slug: conda-to-uv
category: Python教程
tags:
  - uv
  - 环境管理
summary: 抛弃臃肿的 conda，用 Rust 写的 uv 快速管理 Python 环境与依赖。
published: 2026-07-28
updated: 2026-07-29
---

抛弃臃肿的 conda，用 Rust 写的 uv 快速管理 Python 环境与依赖。这篇举个栗子，讲讲怎么平滑迁移。

## 为什么换 uv

uv 用 Rust 写成，创建环境、装依赖的速度比 conda 快一个数量级，而且兼容 `requirements.txt` 和 `pyproject.toml`。

> 每个知识点，都值得举个栗子 —— 这正是算栗工坊的初衷。

## 安装

一行命令搞定：

:::example 先看一个最小例子

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

安装后在一个空文件夹里执行 `uv init my-project`，就能创建第一个 uv 项目。

:::

## 常用命令

- `uv venv` 建虚拟环境
- `uv pip install` 装包
- `uv sync` 按 lock 文件同步依赖

:::key 复习时只记这三件事

- `uv init`：创建项目
- `uv add`：添加依赖
- `uv run`：在项目环境中运行命令

:::

:::pitfall 从 conda 迁移时别忽略环境

`uv` 以项目目录中的 `.venv` 为中心。若终端仍自动激活 conda，先执行 `conda deactivate`，避免误把依赖装进旧环境。

:::

## 小结

从 conda 迁到 uv 主要是一次性把依赖清单转过去，之后日常用起来会快很多。
