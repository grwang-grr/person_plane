# Plane 页面源码对照

参照本机相邻 planee 源码，而非凭模块名称重新设计通用页面。最新截图明确的草稿弹窗布局优先于本地版本差异。项目为个人版，因此移除人员、组织、权限、AI、集成及商业推广。

| 页面               | Plane 参考源码（相对 planee）                                                        | 个人版实现                                                                  |
| ------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 首页容器与问候     | apps/web/components/home/root.tsx、user-greetings.tsx                                | features/home/HomePage.tsx；居中内容最大宽 750px                            |
| 首页组件间距       | apps/web/components/home/home-dashboard-widgets.tsx                                  | 首页组件之间 48px，标题和内容之间 12px                                      |
| 近期记录           | apps/web/components/home/widgets/recents/index.tsx、issue.tsx                        | 图标、项目标识、标题、相对时间、状态与优先级，列表最大高 228px              |
| 彩色便签           | apps/web/components/stickies/widget.tsx、sticky/root.tsx、layout/stickies-list.tsx   | 便签网格、编辑、搜索；按用户要求新增标签筛选                                |
| 便签颜色           | packages/editor/src/styles/variables.css                                             | contracts 中保留同组浅色配色，包括紫色 #e3d8fd                              |
| 草稿页面标题与计数 | apps/web/app/(all)/[workspaceSlug]/(projects)/drafts/header.tsx                      | features/tasks/ItemList.tsx                                                 |
| 草稿行与菜单       | apps/web/components/issues/workspace-draft/draft-issue-block.tsx                     | 左侧标识与标题，右侧属性；编辑、复制、移至项目、删除                        |
| 创建与编辑弹窗     | apps/web/components/issues/issue-modal/form.tsx、draft-issue-layout.tsx              | features/tasks/ItemEditor.tsx；采用用户截图的左右两栏，保留底部操作         |
| 项目列表           | apps/web/components/project/root.tsx、card.tsx、card-list.tsx                        | features/projects/ProjectsPage.tsx，标题、搜索和项目卡片                    |
| 项目内导航         | apps/web/components/workspace/sidebar/project-navigation.tsx、projects-list-item.tsx | components/layout/ProjectShortcut.tsx，左侧项目下展开十个模块，移除顶部标签 |
| 默认任务状态       | apps/api/plane/db/models/state.py                                                    | 五个基础状态翻译为中文，不启用分诊或人员流程                                |

你的工作页面、字体变量及资料栏的详细对照见 [你的工作与字体](your-work-layout.md)。

## 数据行为

首页的“近期”表示最近访问的对象，每个对象只保留一条最近访问；“我的操作”表示实际变更事件，二者分开保存。便签和草稿通过 API 写入 SQLite，重启后仍保留。草稿不占正式编号，移至项目后才分配项目内编号。删除当前采用软删除，恢复界面尚未提供。

## 当前与上游的差异

- 保留用户确认的一级项目管理窄栏，二级导航按个人版清单裁剪。
- 无账号头像、受让人、权限、工作空间切换、商业试用或帮助推广入口。
- 便签正文暂为纯文本，采用显式保存，未引入上游富文本编辑器与拖拽分组。
- 周期与模块关联尚未实现，弹窗中禁用对应字段；不能将这些字段的存在视为功能已完成。
- 其他项目模块还未逐页完成源码还原，本文件不宣称整个系统已完成或与 Plane 全量一致。

后续页面须先补充对应上游文件和页面结构对照，再实施。个人新增模块若无上游对应页面，应先确认设计，不能假称 Plane 原有布局。
