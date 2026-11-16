# 你的工作：Plane 页面与字体对照

依据用户 2026-11-12 提供的“你的工作”截图，以及本地相邻 planee 的页面源码实现。保留已确认的左侧并排双栏，继续免登录，资料属于本地个人档案，不新增账号、组织或人员管理。

## 源码入口

| 内容               | Plane 源码（相对 planee）                                               |
| ------------------ | ----------------------------------------------------------------------- |
| 页面组合           | apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx |
| 顶部标题与五个标签 | 同目录 header.tsx、navbar.tsx                                           |
| 概述与工作量       | apps/web/components/profile/overview/stats.tsx、workload.tsx            |
| 两个分布图         | 同目录 priority-distribution.tsx、state-distribution.tsx                |
| 近期活动           | 同目录 activity.tsx                                                     |
| 右侧资料           | apps/web/components/profile/sidebar.tsx                                 |
| 字体加载           | apps/web/app/root.tsx，@fontsource-variable/inter 5.2.8                 |
| 字体与颜色变量     | @makeplane/propel 0.9.7 的 dist/styles/variables.css                    |
| 空状态插画         | packages/blocks/src/empty-state/assets/horizontal-stack/priority.tsx    |
| 默认封面           | apps/web/app/assets/cover-images/image_1.jpg                            |

个人版页面位于 apps/web/src/features/your-work，数据归类位于 packages/shared-state/src/personal-work.ts，样式位于 apps/web/src/styles/your-work.css。

## 实际采用的尺寸与字体

| 项目           | 数值或来源                                                                   |
| -------------- | ---------------------------------------------------------------------------- |
| 字体           | Inter Variable，由 npm 包构建成同站点 WOFF2 资源；无运行时远程字体请求       |
| 中文回退       | 与 Propel 相同的 ui-sans-serif / system-ui 字体栈，使用系统中文字体          |
| 卡片标签、正文 | 13px，字重 450，行高 1.54                                                    |
| 分区标题       | 16px，字重 500，行高 1.3                                                     |
| 统计数字       | 18px，字重 600，行高 1.2                                                     |
| 文字与边框颜色 | Propel 的 text-color-primary、placeholder、secondary、border-subtle-1 等变量 |
| 状态色         | 积压 #d9d9d9、未开始 #3f76ff、进行中 #f59e0b、完成 #16a34a、取消 #dc2626     |
| 卡片           | 圆角 12px，统计卡内边距 12px，卡片间隔 12px                                  |
| 分区与图表间隔 | 分区 28px，两列图表之间 20px                                                 |
| 顶栏和标签栏   | 各 48px                                                                      |
| 右栏           | 宽 300px；封面高 110px；头像 56px                                            |

卡片随可用宽度按上游断点折行；五个工作量卡片和三张统计卡片在足够宽时并列。额外一级窄栏来自用户此前确认的双栏结构，会占用内容宽度。浏览器缩放和系统显示缩放影响截图中的物理像素，不应靠放大字号来模拟截图。

## 本地业务语义

- 创建：本机全部未删除的正式任务，草稿不计入。
- 已分配：任务中勾选“分配给我”的正式任务。
- 已订阅：任务中勾选“订阅此任务”的正式任务，可以与分配重叠。
- 工作量、优先级及状态分布：以“已分配”的正式任务为统计集合。
- 活动：实际发生的本地项目、任务、草稿和便签操作。直接新建任务仅记录创建，不伪造草稿发布。
- 本地资料：姓名、显示名、时区、头像颜色可编辑并保存到 SQLite。加入日期为本地资料初始化时间，未复制截图中的姓名、电话或日期。
- 当前封面使用同款默认图片；未实现头像或封面上传，也不引入登录、邮件通知或多人订阅。

## 路由与入口

你的工作位于 /your-work/overview，另有 assigned、created、subscribed、activity 四个视图。卡片可跳转列表，工作量卡片带状态筛选条件。便签独立入口为 /stickies，复用首页便签保存与标签能力。更多菜单链接到已存在的列表和数据页面。导航设置可控制侧栏及项目快捷列表的展开。

## 验证

浏览器实际检查字体成功加载，标签 13px/450、分区标题 16px/500、数字 18px/600、侧栏宽 300px、封面高 110px；使用独立的 data/tmp/your-work-visual-review 数据库验证资料保存、时区、任务归类、统计与图表更新、订阅视图、窄屏资料栏开关，不写入正式演示数据。

插画、默认封面及字体的来源与许可证见根目录 THIRD_PARTY_NOTICES.md 和 licenses 目录。
