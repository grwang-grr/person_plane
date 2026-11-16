# 验证和测试

## 当前自动化范围

- 前端测试：已确认的全局导航、十个项目模块、未知模块、侧栏折叠及状态实例隔离。
- 后端测试：数据库初始化、健康接口、API 与静态资源 404、SPA 路由回退、本地文件读写及路径越界。

前端测试位于 apps/web/src/test，后端位于 apps/api/tests，跨应用端到端测试预留在 tests/e2e。测试不使用真实用户数据。

## 检查入口

根目录运行 pnpm check 与 pnpm build。apps/api 中运行 uv run --locked ruff check src tests、uv run --locked pytest。Windows 全量检查入口为 scripts/windows/check.ps1。

当前测试不代表项目和任务业务已经实现。后续需增加真实业务数据流、数据库迁移、父子任务约束、日期校验、跨视图一致性、导入失败反馈及备份恢复测试。
