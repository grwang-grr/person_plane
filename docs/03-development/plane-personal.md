# Plane 原版个人版改造与验证

## 已确认设计

原生 Windows，免登录，单人使用。复用原版前后端；数据库使用 SQLite，附件、头像和文档图片使用本地目录，一同备份。不要求 WSL、Docker、PostgreSQL、Redis、RabbitMQ、RustFS 或外部对象存储。

保留一个内部本地用户和默认工作空间，用于维持原版外键、项目隔离和数据审计。这不代表恢复组织架构和登录界面。成员管理、邀请、外部集成和 API 密钥不作为个人版业务入口。

## 目录与入口

| 路径                                   | 用途                                           |
| -------------------------------------- | ---------------------------------------------- |
| upstream/plane/apps/web                | 原版 React Router/Vite 页面与组件              |
| upstream/plane/packages                | 原版组件、编辑器、类型、服务及 MobX 等共享依赖 |
| upstream/plane/apps/api                | 原版 Django/DRF 后端                           |
| upstream/plane/apps/api/plane/personal | 本地身份、存储、备份与旧数据迁移适配           |
| data/database/plane-personal.sqlite3   | 原版个人版的新数据库                           |
| data/database/wplane.sqlite3           | 旧版数据库，保留                               |
| data/attachments                       | 本地附件、头像、文档图片；文件名由服务端分配   |
| data/backups                           | 一致性数据库备份、附件及 SHA-256 清单          |
| data/logs/plane-personal.log           | 原版个人版日志，5 MiB 轮转，保留 3 份          |
| start-personal.cmd                     | 个人版独立验证入口，127.0.0.1:8008             |
| start.cmd                              | 旧版入口，仍为 127.0.0.1:8000                  |

源码与依赖已在本机准备。双击 start-personal.cmd 即可启动已构建的候选版，不依赖全局 PowerShell 7。失败时保留终端输出。该入口会检查迁移状态；旧库导入后若发生变化，会拒绝覆盖新库，需要核对增量。

开发环境版本来自原项目要求：Python 3.12、uv 0.12.21、Node >=22.22.0、pnpm 11.10.0。本机 Node 22.19.0 下构建可以通过，但会报告版本警告，尚未更改全局 Node。

## 独立安装和检查

在 upstream/plane 执行：

```powershell
pnpm install --frozen-lockfile
pnpm turbo run build --filter=web
pnpm --filter web check:types
pnpm --filter @plane/i18n exec tsx --test src/core/instance.test.ts
```

在 upstream/plane/apps/api 执行：

```powershell
uv sync --locked
$env:DJANGO_SETTINGS_MODULE = 'plane.settings.personal'
uv run python manage.py check
uv run python manage.py migrate
uv run python manage.py bootstrap_personal
uv run python -m pytest -c pytest-personal.ini
uv run ruff check plane/personal personal_tests plane/settings/personal.py
uv run python manage.py backup_personal
```

前端开发服务器代理 /api 和 /local-assets 到 8008；正式验证由同一个 Django 服务提供已构建页面和接口。

## 数据与存储

已于 2026-11-12 创建 before-plane-\* 备份：使用 SQLite backup API，包含 WAL 中已提交的数据，没有直接复制运行中的数据库主文件。备份时旧库有 1 个项目、1 条操作记录、1 条近期访问，任务和便签为 0；真实内容不写入文档或测试。

导入在事务中执行，保留项目/任务/草稿/便签 UUID、项目标识、任务编号、日期、标签和父子关系。保留已删除任务与编号空档，避免后续编号重复；将本地分配、订阅映射到单一本地身份。所有源表原始字段同时存入 personal.LegacyRecord，不能用“有存档”替代页面功能验收。

备份 ZIP 包含 database/plane-personal.sqlite3、attachments/、本地密钥和 manifest.json。运行中的请求与备份使用本地文件锁协调；备份库单独关闭连接后再打包，以兼容 Windows 文件锁。SQLite 完整性和文件摘要检查有自动测试。尚未提供恢复覆盖功能。

上传保留原版接口流程：申请上传 → 带短期签名策略上传到本地 → 确认资产。下载先经过原版业务权限，再生成本地签名链接；保留文件大小、路径边界和安全下载类型约束。

## 验证范围与剩余工作

已经建立 SQLite 当前模型的独立初始迁移，修正数组字段/聚合、计数返回类型、任务编号锁；本地执行必要后台任务。原版项目、任务新建与状态更新、周期、模块、文档基础接口、草稿发布及便签读写有集成测试。中文命名空间改为打包资源，避免构建后动态路径失效；使用原版字体和设计变量。

以下不能标记为完成：

- 复杂统计、所有富筛选、JSON/数组专用查询与字段去重的 SQLite 全覆盖。
- 原版导出任务仍有直接 S3 调用，需要本地化；导入模板和恢复流程也未验收。
- 文档实时协作依赖尚未改为完整单人编辑链路；文档创建接口通过不代表编辑器验收。
- 旧版“我的操作”、便签标签及本地资料扩展的所有页面回显；原始数据已保留。
- 全部组织相关深层设置、项目表单中的人员字段与商业内容的最终清理；本轮已处理固定界面英文。
- 计划、里程碑、问题与风险等个人扩展与全量点击验收。

当前保持两个独立入口，尚未切换默认 start.cmd。后续切换前需重新核对旧库变化并完成相关模块的实际操作验收。

## 界面中文化（2026-11-12）

已确认范围：翻译个人版的固定界面文字和系统默认名称，保留用户填写的英文项目名、标题、正文、便签及标识。内部接口字段、状态编码、路由和图标标识继续使用原值，避免破坏已有数据与关联关系。

修改覆盖项目页面、工作项、周期、模块、视图、编辑器、设置、弹窗、排序筛选、空状态、通知和接口固定错误提示；补齐中文日期、相对时间、浏览器标题及缺失翻译键。图标选择器使用独立中文标签，保留原始图标标识并兼容此前标签值。新建项目的默认状态为待规划、未开始、进行中、已完成、已取消、待分拣。

检查当前个人库后，六个系统状态已是中文，没有英文默认工作项类型；截图中唯一页面的名称为空，英文来自前端兜底文字。改为显示“未命名”，不将名称写回数据库。因此本次不需要数据迁移，也未批量翻译用户内容或覆盖旧库。

中文化审计脚本位于 scripts/audit-chinese.cjs、scripts/audit-api-chinese.py、scripts/audit-translation-keys.cjs；scripts/chinese-ui.tsv 保存补充译文。默认只报告，前两者传入 --write 才修改源码。审计中的英文开发错误、图标标识、路径、格式代号和代码表达式不能作为用户内容批量替换。

回归测试覆盖空白页面和视图的中文名称、手填英文名称保留、中文月份、157 个图标的标识稳定性及新建项目默认状态。具体运行结果见 data/logs/chinese-*.log。

本轮结果：后端 10 项、前端 4 项测试通过；Web 及依赖构建、全部依赖类型检查通过；前端代码检查通过但保留既有警告，个人后端 Ruff 检查通过。实际浏览器验证了页面列表、操作和排序菜单、中文浏览器标题，以及工作项表格的链接、附件、子工作项计数。截图为 data/logs/verification/chinese-pages.jpg。当前数据库完整性检查正常，外键错误为零，个人版服务返回正常响应。

## 本轮验证记录（2026-11-12）

- 个人版 Django 测试 9 项通过，覆盖导入回滚与重入、编号空档、父子关联、JSON 数组聚合、免登录访问边界、CSRF、本地上传下载、原版头像接口与一致性备份。
- 前端单元测试 3 项通过，覆盖全部中文命名空间和并发 CSRF 初始化/失败重试；Web 类型检查通过。
- Web 及所需的 9 个共享包构建成功；新增前端文件的 OxLint 检查为 0 错误、0 警告，个人后端 Ruff 检查通过。
- 从实际页面点击创建备份并下载成功，下载文件与服务端备份 SHA-256 一致；ZIP、清单内所有文件摘要、SQLite 完整性和外键检查均通过。
- 页面验证截图保存在 data/logs/verification/plane-personal-backup.png，详细构建与测试输出在 data/logs/personal-\*.log。

本轮验证的是原版个人版的基础迁移与本地存储链路，不能替代上文剩余业务的全量验收。
