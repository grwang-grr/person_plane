# 第三方组件说明

- 页面字体使用与 Plane 同版本的 @fontsource-variable/inter 5.2.8（Inter Variable）；字体许可保存在 [licenses/Inter-OFL.txt](licenses/Inter-OFL.txt)。
- 个人资料默认封面来自相邻 planee 的 apps/web/app/assets/cover-images/image_1.jpg；空状态插画及颜色辅助文件来自 packages/blocks/src/empty-state/assets。复制的组件保留原版权与 SPDX 声明，上游许可保存在 [licenses/Plane-LICENSE.txt](licenses/Plane-LICENSE.txt)。
- tzdata 为 Windows 上的 IANA 时区校验提供数据，版本随后端 uv.lock 锁定。

本工程为本地个人使用工程，尚未确定自身对外发布许可。private 包标记不改变第三方依赖的许可义务。

Propel 0.9.7 的包元数据标注 AGPL-3.0-only，来源为 makeplane/propel。本工程通过依赖引用其组件和图标，须保留依赖附带的许可证。未来分发或提供网络服务前需核对适用许可义务。

React、MobX、Vite、FastAPI 等其他依赖的许可证随锁定版本一并核对。Tiptap、拖拽、Excel 前端等功能所需的额外依赖，在对应功能实际开发时再添加，避免把技术建议当成已实现能力。
