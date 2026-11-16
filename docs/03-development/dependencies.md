# 语言与第三方依赖

| 层次     | 语言或组件                                        | 用途                               |
| -------- | ------------------------------------------------- | ---------------------------------- |
| 前端     | TypeScript、React、Vite、Inter Variable           | 页面、组件和构建                   |
| 样式     | CSS、Tailwind CSS、Propel                         | 设计变量、样式和基础组件           |
| 前端状态 | MobX、mobx-react                                  | 可观察的界面状态                   |
| 路由     | React Router                                      | 全局页面和项目模块导航             |
| 后端     | Python 3.12、FastAPI、Uvicorn                     | API 与本机 HTTP 服务               |
| 输入校验 | Pydantic、pydantic-settings、tzdata               | 数据结构和环境配置                 |
| 持久化   | SQLite、SQLAlchemy、Alembic                       | 本地数据库、数据访问和迁移         |
| 文件功能 | python-multipart、openpyxl                        | 为后续上传、Excel 导入导出预备依赖 |
| 开发工具 | pnpm、uv、OxLint、oxfmt、Ruff                     | 依赖锁定、代码检查和格式化         |
| 测试     | Vitest、Testing Library、Happy DOM、pytest、HTTPX | 前后端基础验证                     |

前端依赖统一记录在 pnpm-workspace.yaml 的 catalog 中，通过 pnpm-lock.yaml 锁定。后端依赖记录在 apps/api/pyproject.toml，通过 uv.lock 锁定。Python 与 Node.js 的依赖环境彼此独立。

本机运行无需单独安装数据库服务器。附件存储最终选择待确认；当前仅预留本地目录和适配，不要求启动 RustFS。富文本编辑器、拖拽和高级图表在需求明确后再选型。

上传、Excel 和数据库工具已安装不表示对应业务功能已经完成。对外发布前按根目录 THIRD_PARTY_NOTICES.md 核对依赖许可。
