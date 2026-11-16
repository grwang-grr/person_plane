# 目录职责

项目按应用源码、共享代码、文档、运行数据、工具脚本和测试区分。英文目录用于稳定的代码路径，中文说明用于查阅。

```text
wplane/
├─ apps/                          应用工程
│  ├─ web/                        React 前端
│  │  └─ src/
│  │     ├─ app/                  入口与路由组合
│  │     ├─ components/           布局与共享组件
│  │     ├─ features/             按业务模块组织页面与交互
│  │     ├─ lib/                  与框架无关的工具与通用 Hook
│  │     ├─ services/             HTTP 请求
│  │     ├─ styles/               全局样式与设计变量
│  │     └─ test/                 前端测试
│  └─ api/                        Python 后端
│     ├─ src/wplane/
│     │  ├─ api/v1/              API 路由与版本入口
│     │  ├─ core/                配置、路径与数据库连接
│     │  ├─ domains/             各业务领域
│     │  └─ storage/             文件存储协议与适配
│     ├─ migrations/             数据库迁移
│     └─ tests/                  后端测试
├─ packages/                      共享代码与配置
│  ├─ contracts/                  导航声明与共享类型
│  ├─ shared-state/               MobX 状态
│  └─ typescript-config/          TypeScript 严格配置
├─ docs/                          需求与技术文档
│  ├─ 01-requirements/            已确认需求和待确认项
│  ├─ 02-design/                  架构、业务边界和页面设计
│  ├─ 03-development/             环境、目录与开发规范
│  ├─ 04-operations/              数据和运维
│  ├─ 05-quality/                 测试与验证记录
│  └─ 06-planning/                分阶段实施计划
├─ data/                          本机运行数据，不提交版本库
│  ├─ database/                   SQLite 文件
│  ├─ attachments/                附件预留目录
│  ├─ backups/                    备份预留目录
│  ├─ logs/                       运行日志
│  └─ tmp/                        临时文件
├─ scripts/windows/               初始化、开发、构建、启动和检查
├─ tests/                         跨应用端到端测试和测试样例
├─ AGENTS.md                      后续开发必须遵守的项目规范
├─ README.md                      工程使用入口
├─ THIRD_PARTY_NOTICES.md          第三方组件说明
├─ .env.example                   环境配置模板
├─ pnpm-lock.yaml                 前端依赖锁定
└─ start.cmd                      本机运行入口，需先构建
```

空目录使用 .gitkeep 保留，不代表功能已经实现。后端依赖清单及锁文件位于 apps/api/pyproject.toml 和 apps/api/uv.lock。node_modules、.venv 和 dist 为安装或构建产物，不属于业务源码。

新功能优先放入所属业务模块，避免把所有页面写进 app、把所有规则写进 API 路由。进入功能阶段时再按实际职责增加文件，不预先建立大量空类和空接口。
