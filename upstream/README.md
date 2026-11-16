# Plane 原版个人版改造

plane/ 是从相邻 Plane 源码复制的独立候选工程。来源记录在 provenance.json，许可文件保留在原位置。

该目录复用实际 Plane React 页面、Propel 组件、MobX 状态、编辑器和 Django/DRF 业务，按 SQLite、本地文件、单一身份适配。不是前一版手写页面的继续仿制。

启动入口为根目录 start-personal.cmd，端口 8008。旧版 start.cmd、端口 8000 和旧数据库仍保留。

当前是改造验证版，尚未完成所有 PostgreSQL 查询、导出、文档实时编辑和个人扩展的适配。源码复制、构建成功与部分接口测试通过不等于所有页面已验收。详见 ../docs/03-development/plane-personal.md。
