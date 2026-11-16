# Windows 开发环境

## 工具

| 工具       | 版本                   |
| ---------- | ---------------------- |
| Node.js    | 22.22.0 或更高兼容版本 |
| pnpm       | 11.10.0                |
| Python     | 3.12                   |
| uv         | 0.12.21                |
| PowerShell | 7 或更高               |

依赖首次安装需要访问 npm 和 Python 包索引。项目使用 pnpm-lock.yaml 和 apps/api/uv.lock 固定依赖。setup.ps1 不覆盖已有 .env。

## 常用命令

```powershell
pwsh -File scripts/windows/setup.ps1
pwsh -File scripts/windows/dev.ps1
pwsh -File scripts/windows/check.ps1
pwsh -File scripts/windows/build.ps1
pwsh -File scripts/windows/start.ps1
```

dev.ps1 启动本机 API 和 Vite；退出时停止该脚本启动的 API 进程。start.ps1 在前台启动一个本机服务，同时提供构建后的页面。前端开发端口 5173，API 端口 8000，默认绑定 127.0.0.1。

单独启动 API：在根目录执行 uv run --project apps/api python -m uvicorn wplane.main:app --app-dir apps/api/src --host 127.0.0.1 --port 8000。

数据库迁移在 apps/api 中执行 uv run alembic upgrade head；已有首批工作台表迁移，启动器会自动升级到 head。后续添加业务模型时生成并审查迁移文件。

本工程没有配置 Windows 开机服务、安装包或 EXE 打包；这些是后续交付项。

双击 start.cmd 的日常运行入口无需全局 PowerShell 7；初始化与开发脚本仍需要。启动与日志详见 [启动排错与日志](../04-operations/logging.md)。
