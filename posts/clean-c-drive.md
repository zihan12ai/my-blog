---
title: "C盘清理"
slug: clean-c-drive
category: "工具教程"
tags:
  - "Windows"
  - "磁盘清理"
summary: "整理 Windows C 盘空间、迁移大文件并用目录联接保留原路径。"
published: 2026-06-05
updated: 2026-06-05
---
## 微信聊天记录转移
[干货：电脑C盘空间不足？微信聊天记录如何无损迁移？ - 今日头条](https://www.toutiao.com/article/7255215176260256308/)

## 用户的`.cache`文件夹中
huggingface文件夹中会有模型权重等
kagglehub文件夹中会有拉取数据集或者模型留下的缓存
若最近不会用到，可以删掉

## 重要的文件直接转移到D盘
已经删无可删了咋办？

### 先找到占用最大的部分
在当前文件夹顶部的地址栏直接输入 `powershell` 并回车，打开终端后，直接**复制粘贴**下面这行命令并回车：
```powershell
Get-ChildItem -Directory | ForEach-Object { [PSCustomObject]@{ Name = $_.Name; SizeGB = [math]::Round((Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB, 2) } } | Sort-Object SizeGB -Descending
```
层层套娃找到最占用存储的地方

### 转移到D盘
我是在用户的`.local`文件夹中，找到`opencode`文件占了50G，绷不住。这玩意我最近经常使用，总不能删掉吧，直接转移到D盘。
1. 关闭 `opencode` 相关的正在运行的程序。
2. 把整个文件夹剪切，粘贴到有空余的盘。
3. 点击 Windows 搜索栏，输入 `cmd`，右键选择"以管理员身份运行"。然后在里面输入以下命令（**注意替换成你的实际路径**）：
```cmd
mklink /J "原始文件在C盘的路径" "转移到的D盘路径"
```
例如：
```cmd
mklink /J "C:\Users\zhangsan\.local\opencode" "D:\opencode_data"
```
按下回车，如果提示"为 xxx 创建的联接"，就大功告成了！
去 C 盘原位置看，会发现多了一个带快捷方式小箭头的文件夹。
