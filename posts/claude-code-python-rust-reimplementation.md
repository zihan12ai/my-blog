---
title: "基于claude code源码重构的python代码及其rust运行版"
slug: claude-code-python-rust-reimplementation
category: "工具教程"
tags:
  - "AI Coding工具"
  - "Claude Code"
  - "AI Coding"
summary: "整理 Claude Code 相关重构项目及 Python、Rust 版本的使用笔记。"
published: 2026-06-05
updated: 2026-06-05
---
## 前言
最近 Claude Code 源码泄露，在开发者圈子里引起了巨大关注。主仓库 [ultraworkers/claw-code](https://github.com/ultraworkers/claw-code) 在短短两天内就狂揽大量 Stars，热度惊人。

原版的 Claude Code 是由官方使用 TypeScript 编写的，而这个开源仓库对其进行了 Python 以及 Rust 的重构。最重要的是，**它允许我们接入第三方的 API（比如国内的各种开源大模型）**，极大地降低了使用门槛。

:::warning
**为什么不用原版**
原版Claude Code强制要求必须手机号验证（不支持大陆手机号），且订阅需要绑定海外信用卡，门槛较高。如果你对原版感兴趣，可以参考[Claude Code 官方文档 - 中文](https://code.claude.com/docs/zh-CN/)
:::

## 第一步：获取大模型 API 密钥

由于开源版Claude Code允许接入第三方模型，我们需要先获取一个 API Key 和对应的访问地址。

**如果你已经有自己的 API 且懂得如何配置，可以跳过此节。** 

对于新手，我们以**硅基流动 (SiliconFlow)** 为例来获取免费/低成本的 API：

1. 前往[硅基流动](https://cloud.siliconflow.cn/i/ZfNGq4WR)注册并登录账号。 
2. 在左侧导航栏依次点击 **`API密钥`** -> **`新建API密钥`**。 
![1775185149411.png](https://obsidian-hexo-blog-1357454370.cos.ap-beijing.myqcloud.com/hexo/1775185149411.png)
3. **`密钥描述`** 可以随便填写（比如叫 "claw-test"），然后点击 **`新建密钥`**。
![image.png](https://obsidian-hexo-blog-1357454370.cos.ap-beijing.myqcloud.com/hexo/20260403110257538.png)
4. 复制刚刚生成的密钥（一串以 `sk-` 开头的代码），**请妥善保存**。 
![image.png](https://obsidian-hexo-blog-1357454370.cos.ap-beijing.myqcloud.com/hexo/20260403110436848.png) 

:::danger
**严正警告：** 你的 API Key 就像银行卡密码！**【绝对不要泄露给其他人】**，更不要将其提交到 GitHub 等公开平台上。
:::

## 第二步：部署与初次运行 

### 方案 A：Windows 系统

#### 1. 下载源码 
打开你的终端（推荐PowerShell），运行以下命令将代码克隆到本地：
```powershell
git clone https://github.com/ultraworkers/claw-code.git
```

#### 2. 安装 Rust 编译环境

:::warning
Windows 上的 Rust 依赖 C++ 编译工具链。如果你的电脑没装过 Visual Studio，安装时黑框中可能会提示你需要先安装 **C++ build tools**。
:::

1. 进入 [rustup.rs 官网](https://rustup.rs/)，下载 `rustup-init.exe`。
2. 双击运行，一路回车选择默认安装，等待进度条完成。
3. 安装结束后，**重新打开一个新的 PowerShell 终端**，输入：
```powershell
cargo --version
```

#### 3. 配置环境变量
```powershell
$env:ANTHROPIC_API_KEY="sk-......"
$env:ANTHROPIC_BASE_URL="https://api.siliconflow.cn"
$env:HOME = $env:USERPROFILE
```

#### 4. 编译与运行
```powershell
cd D:\你的路径\claw-code\rust
cargo build --workspace
cargo run -p rusty-claude-cli -- --model "Pro/deepseek-ai/DeepSeek-V3.1-Terminus"
```

#### 5. 成功运行
当终端中出现红色的 **CLAW** 标志时，恭喜你，配置成功了！

![image.png](https://obsidian-hexo-blog-1357454370.cos.ap-beijing.myqcloud.com/hexo/20260409225613439.png)

### 方案 B：Linux / macOS 系统

#### 1. 下载源码
```bash
git clone https://github.com/ultraworkers/claw-code.git
```

#### 2. 安装 Rust 编译环境
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### 3. 配置环境变量
```bash
export ANTHROPIC_API_KEY="sk-......"
export ANTHROPIC_BASE_URL="https://api.siliconflow.cn"
```

#### 4. 编译与运行
```bash
cd /home/user/Projects/claw-code/rust
cargo build --workspace
cargo run -p rusty-claude-cli -- --model "Pro/deepseek-ai/DeepSeek-V3.1-Terminus"
```

## 后续如何快速启动？

### Win 配置永久环境变量
1. 搜索并打开 **"编辑系统环境变量"**
2. 点击 **"环境变量"**
3. 新建三条记录：
    - `ANTHROPIC_API_KEY` = `你的真实密钥`
    - `ANTHROPIC_BASE_URL` = `https://api.siliconflow.cn`
    - `HOME` = `%USERPROFILE%`

### Linux / macOS 配置永久环境变量
```bash
echo 'export ANTHROPIC_API_KEY="你的真实密钥"' >> ~/.bashrc
echo 'export ANTHROPIC_BASE_URL="https://api.siliconflow.cn"' >> ~/.bashrc
source ~/.bashrc
```

## 如何切换其他模型？

1. 前往硅基流动网站，点击 **`模型广场`** -> **`展开筛选器`**
![1775186906664.png](https://obsidian-hexo-blog-1357454370.cos.ap-beijing.myqcloud.com/hexo/1775186906664.png)

2. 将类型筛选为 **`对话`**
![1775186809340.png](https://obsidian-hexo-blog-1357454370.cos.ap-beijing.myqcloud.com/hexo/1775186809340.png)

3. 挑选你感兴趣的模型，复制模型标识
![1775186876978.png](https://obsidian-hexo-blog-1357454370.cos.ap-beijing.myqcloud.com/hexo/1775186876978.png)

4. 替换启动命令中的 `--model` 参数：
```bash
cargo run -p rusty-claude-cli -- --model "Pro/MiniMaxAI/MiniMax-M2.5"
```

## 如何优雅地使用 ClawCode？

### 1. 强烈建议与 IDE 集成
以 **VS Code** 为例：使用快捷键 `` Ctrl + ` `` 调出终端，`cd` 到项目目录，执行启动命令。大模型就拥有了当前目录的上下文视野。

### 2. 遇事不决，直接"问本人"
在终端里直接问它：
> "你是初次进入我这个项目的助手，请教教我该怎么给你下达指令？"

### 3. 站在巨人的肩膀上：善用视频教程
[Claude Code 从 0 到 1 全攻略_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV14rzQB9EJj)
