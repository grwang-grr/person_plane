# 启动排错与日志

## 双击入口

start.cmd 直接调用 apps/api/.venv/Scripts/python.exe，不再依赖全局 pwsh.exe、Python 或 Node.js。前提是已经初始化依赖并构建前端。启动成功后访问 http://127.0.0.1:8000，保持服务窗口开启；按 Ctrl+C 停止。启动失败时窗口停留并显示错误，需要按键退出。

初始化和开发脚本仍要求 PowerShell 7。未初始化 Python 环境时，启动入口会显示缺少环境的提示；此时 Python 服务尚未运行，不能产生服务日志。

## 日志位置

| 文件                          | 内容                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| data/logs/server.log          | 双击入口或 start.ps1 的启动信息、请求记录、服务错误和异常堆栈 |
| data/logs/server.log.1 至 .3  | 自动轮转的历史日志，每个文件上限约 5 MiB                      |
| data/logs/api-dev.stdout.log  | dev.ps1 启动的后端标准输出                                    |
| data/logs/api-dev.stderr.log  | dev.ps1 启动的后端标准错误、Uvicorn 请求和运行信息            |
| data/tmp/build-validation.log | 工程搭建时保留的构建验证输出，不属于服务运行日志              |

如在 .env 中设置 WPLANE_DATA_ROOT，server.log 位于对应目录的 logs 子目录；配置解析失败时使用工程默认 data/logs。日志采用 UTF-8。直接手动运行 uvicorn 不会自动启用启动器的文件日志。

## 常见问题

- 原入口终端闪退：旧 start.cmd 调用了系统未安装的 pwsh.exe，并且失败后直接关闭。新入口已移除此依赖并保留失败提示。
- 缺少前端构建文件：先按开发文档执行构建，再启动。
- WinError 10048：8000 端口被占用，检查是否重复启动。不要直接结束不明进程。
- 网页点击后报错：记录页面地址、按钮名称及报错原文。浏览器脚本错误目前需从浏览器开发者工具控制台查看，尚未自动保存到服务日志。

可在终端执行 start.cmd --port 8001 临时使用其他端口。默认仍只监听本机。
