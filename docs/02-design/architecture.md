# 系统架构

前端与后端分开开发，构建后由一个 Python 服务同时提供静态页面和 API。SQLite 与附件目录均位于工程根目录 data，下游功能不能依赖前端直接访问文件系统。

## 代码边界

- apps/web/src/app：应用入口、路由与页面组合。
- apps/web/src/components：共享布局和基础业务组合组件。
- apps/web/src/features：按项目内模块组织业务实现。
- apps/web/src/services：HTTP 请求封装；lib 存放与框架无关的工具与通用 Hook。
- packages/shared-state：MobX 状态；packages/contracts 为前端共享声明。
- apps/api/src/wplane/api：API 版本和基础接口。
- apps/api/src/wplane/domains：业务边界；实现功能时再增加 router.py、schemas.py、service.py 和 repository.py。
- apps/api/src/wplane/core：设置和数据库连接。
- apps/api/src/wplane/storage：文件存储协议与适配。
- apps/api/migrations：Alembic 数据库迁移。

API 业务契约以后端 Pydantic/OpenAPI 为准。数据库持久状态、前端业务状态、弹窗等临时界面状态分别管理。计划、看板、列表共用任务事实，避免重复保存互相矛盾的状态。

当前已实现健康接口、项目基础编辑、任务与草稿、彩色便签、近期访问和操作记录；workspace 领域使用 router/schema/service/repository 分层，router 只做协议转换，业务规则集中在 service，输入输出均由 Pydantic 模型约束。启动时执行 Alembic 升级。没有 Redis、RabbitMQ、Celery 或独立对象存储运行依赖。
