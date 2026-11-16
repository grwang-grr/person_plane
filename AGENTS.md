# WPlane 开发规范

本工程是独立的个人项目管理系统，参考 Plane 的页面和业务结构。源码、运行数据、文档分别存放，禁止修改旁边的 planee 工程来实现本工程功能。

## 已确认范围

最新用户要求：Plane 工作导航覆盖的全部业务功能、子页、表单、弹窗、菜单及相关操作均需保留；详见 docs/01-requirements/plane-workspace-full-scope.md。不能把当前自定义骨架或占位页面当作原版全量功能完成。原版前后端的个人版改造位于 upstream/plane，已经开始迁移，但尚未替换旧 start.cmd。不得覆盖旧库；新库为 data/database/plane-personal.sqlite3，旧库保留在 data/database/wplane.sqlite3。

免登录、个人使用、原生 Windows。一级窄栏仅显示“项目管理”；二级导航为新建任务、首页、草稿、你的工作、便签、全部任务、项目列表、更多、可折叠项目快捷列表，底部数据与备份。你的工作采用本地个人资料、分配给我与订阅归类，继续免登录。首页增加近期访问、我的操作、彩色便签及标签分类。项目内保留概览、任务、计划、周期、模块、视图、文档、里程碑、附件、问题与风险。

不新增人员、项目经理、组织、周报、AI、商业推广或第三方集成入口。用户已确认 SQLite、本地文件目录、数据库与附件共同备份、旧数据迁入。具体业务规则中的未确认项必须先询问用户。

## 目录与代码

- 前端在 apps/web，后端在 apps/api；禁止将业务数据放入源码目录。
- 上述 apps 是旧版兼容工程。新原版改造工程拥有独立 pnpm 工作区 upstream/plane；前端在其中 apps/web，后端 apps/api。使用原版 Django/DRF 模型、权限、序列化和服务；数据库变更通过 Django migrations。原版个人模块在 plane/personal，SQLite 模型基线迁移在其中 sqlite_migrations，个人扩展迁移在 migrations，不能混用。命令见 docs/03-development/plane-personal.md。
- TypeScript 必须开启 strict，不使用无约束 any。组件 PascalCase，变量和函数 camelCase。
- 基础组件使用 Propel。原版复用方案应优先使用 Plane 页面、共享组件及必要业务依赖，保留来源与许可；个人扩展放在本工程 components 或 features。先验证完整业务链路，再扩大迁移范围。
- MobX 状态放在 packages/shared-state；路由驱动当前项目和页面，不能额外维护一套冲突的选中状态。
- 导航与共享类型放在 packages/contracts。未来 API 业务契约以 Pydantic/OpenAPI 为准，建立生成流程后再生成前端类型。
- 前端组件不得直接读写磁盘或数据库。API 路由负责协议，service 负责规则，repository 负责持久化，schema 负责输入输出。
- Python 使用类型标注；数据库修改通过 Alembic 迁移。
- 内部包使用 workspace:\*，外部前端依赖使用 catalog:；后端改依赖时同时更新 pyproject.toml 和 uv.lock，uv 固定 0.12.21。
- 不复制或改写真实用户数据进行测试。附件路径不能越界，备份使用 SQLite 一致性备份，禁止直接复制运行中的数据库文件。

## 验证

前端：pnpm check、pnpm build。后端：在 apps/api 执行 uv run --locked ruff check src tests 与 uv run --locked pytest。统一检查脚本为 scripts/windows/check.ps1。

新增功能应有有意义的单元或集成测试。禁止将占位页面、空路由或仅声明的数据模型描述为已完成业务功能。
