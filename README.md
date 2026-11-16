# WPlane 个人项目管理

**当前改造方向已调整为复用 Plane 原版前后端。** 独立工程在 `upstream/plane`，SQLite 与本地文件适配已开始实施。双击 `start-personal.cmd` 打开原版个人版验证环境（8008）；旧 `start.cmd` 与旧数据保留（8000）。具体状态、环境和未完成项见 [原版个人版说明](docs/03-development/plane-personal.md)。以下章节描述旧版兼容工程。

原生 Windows、免登录的个人项目管理工程。参照 Plane 的导航和页面组织方式，采用 React、TypeScript、MobX、FastAPI 和 SQLite。当前已接通首页、便签、草稿及基础项目任务，其他模块按实施计划推进。

## 目录入口

| 目录            | 内容                                       |
| --------------- | ------------------------------------------ |
| apps/web        | 前端页面、布局、业务模块与前端测试         |
| apps/api        | 后端接口、数据库、存储适配、迁移与后端测试 |
| packages        | 共享类型、状态管理、TypeScript 配置        |
| data            | 本机数据库、附件、备份、日志和临时文件     |
| scripts/windows | Windows 初始化、开发、构建、启动和检查脚本 |
| docs            | 需求、设计、开发、运维、质量和实施计划     |
| tests           | 跨应用测试和测试样例                       |

## 快速开始

安装 Node.js 22.22.0 或更高兼容版本、pnpm 11.10.0、Python 3.12、uv 0.12.21、PowerShell 7。

在工程根目录执行：

```powershell
pwsh -File scripts/windows/setup.ps1
pwsh -File scripts/windows/dev.ps1
```

开发页面为 http://127.0.0.1:5173，健康接口为 http://127.0.0.1:8000/api/v1/health。

构建后，本机日常运行只需 Python 服务：

```powershell
pwsh -File scripts/windows/build.ps1
pwsh -File scripts/windows/start.ps1
```

然后访问 http://127.0.0.1:8000。也可双击根目录 start.cmd，该入口直接使用项目 Python，不依赖全局 PowerShell 7。默认仅监听本机，不包含远程访问和身份认证。

## 当前完成范围

- 工程结构、代码规范、依赖配置和 Windows 脚本。
- 你的工作五个视图、本地资料编辑、分配与订阅归类、工作量和图表；独立便签页、更多入口及导航设置。
- 与 Plane 同版本的 Inter Variable 字体及 Propel 设计变量，字体资源随应用本地提供。
- 双栏导航、草稿入口、项目快捷列表和项目内十个模块路由；无自动加载的演示数据。
- 按 Plane 源码与截图还原首页、草稿列表和任务弹窗；近期访问、我的操作与带标签的彩色便签。
- 项目创建与编辑；草稿创建、编辑、复制、发布、删除；正式任务基础编辑和项目内编号。
- FastAPI 健康接口、SQLite 初始化、前端静态资源与路由回退。
- 本地文件存储基础适配及路径校验，尚未开放附件上传接口。
- 前后端基础测试。

看板、计划、周期、模块、视图、富文本文档、里程碑、附件上传、问题与风险及备份恢复仍待开发。草稿弹窗中的周期和模块当前禁用，尚未建立关联；便签正文当前采用纯文本编辑和显式保存。详见 [实施计划](docs/06-planning/roadmap.md)。

完整文档入口：[docs/README.md](docs/README.md)。
