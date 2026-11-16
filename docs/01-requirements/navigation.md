# 导航与路由

## 全局导航

| 入口         | 路由或操作                    | 当前状态                                   |
| ------------ | ----------------------------- | ------------------------------------------ |
| 项目管理     | /                             | 一级导航已建立                             |
| 草稿         | /drafts                       | 列表、创建、编辑、复制、移至项目、删除     |
| 你的工作     | /your-work/overview           | 概括、已分配、创建、已订阅、活动；本地资料 |
| 便签         | /stickies                     | 独立便签页，复用编辑与标签能力             |
| 更多         | 工作区弹出菜单                | 链接现有任务、项目、数据页面               |
| 首页         | /                             | 页面骨架                                   |
| 全部任务     | /tasks                        | 页面骨架                                   |
| 项目列表     | /projects                     | 页面骨架                                   |
| 项目快捷列表 | /projects/:projectId/overview | 容器和折叠交互；接入真实项目数据           |
| 新建任务     | 创建窗口                      | 任务创建与编辑已接通                       |
| 数据与备份   | /data                         | 说明页面；尚未实现备份操作                 |

## 项目内导航

| 模块       | 路由                             |
| ---------- | -------------------------------- |
| 概览       | /projects/:projectId/overview    |
| 任务       | /projects/:projectId/tasks       |
| 计划       | /projects/:projectId/plans       |
| 周期       | /projects/:projectId/cycles      |
| 模块       | /projects/:projectId/modules     |
| 视图       | /projects/:projectId/views       |
| 文档       | /projects/:projectId/documents   |
| 里程碑     | /projects/:projectId/milestones  |
| 附件       | /projects/:projectId/attachments |
| 问题与风险 | /projects/:projectId/risks       |

任务模块已接通基础数据，其余项目模块仍为路由与空状态。项目内导航现按 Plane 的 project-navigation.tsx 放在左侧项目条目下展开，已移除先前的顶部标签方案。

刷新和浏览器前进后退应保持当前路由。项目内不存在的模块显示不存在页面；未知 API 不回退为网页。
