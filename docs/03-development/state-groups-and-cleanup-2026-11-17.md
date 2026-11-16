# 状态分组创建修复与代码清理

## 创建流程

中文分组名经 ASCII `slugify` 处理后可能为空，原接口因此拒绝合法名称；前端分组映射未声明为 MobX observable，导致请求成功后分组列表仍不更新，内置分组名称也回退为英文标识。

- 未手填标识时由序列化器生成合法、长度受限的内部标识，支持中文名称。
- 分组映射与加载状态纳入响应式管理；重新拉取时清除当前项目已不存在的定义。
- 内置分组采用中文显示名称；分拣状态继续由原分拣流程管理。
- 修改自定义分组标识时，事务内同步更新状态归属，前端也同步更新本地状态。
- 创建、编辑支持保存中禁用输入、明确提示和失败保留内容；状态表单支持回车提交。
- 状态接口对同名状态返回字段校验错误，不依赖数据库异常提示。

本次不更改数据库结构，无新增迁移，也不改写用户填写的项目名、状态名或分组名称。

## 代码清理

- 移除甘特图未使用的日期计算、看板未使用的函数解构及模块统计未使用的类型导入。
- 日记类型名称统一维护；日记服务的 21 处重复错误处理合并，并保留无响应的网络错误。
- 状态接口使用明确的输入输出类型，当前 Web API 基类的删除请求数据使用 `unknown`。
- 日记关联名称按目标类型批量读取；测试中 19 条关联仅需 4 次目标查询。
- 删除重复的分组草稿规范化和不必要的分组更新失败回写，使用一次遍历构造分组映射。
- Web lint 历史警告从 426 条减至 419 条，检查上限同步收紧至 419；仍需后续逐项处理历史警告。

## 验证

```powershell
# upstream/plane/apps/api
.venv/Scripts/python.exe -m pytest -c pytest-personal.ini
.venv/Scripts/python.exe manage.py check --settings=plane.settings.personal
.venv/Scripts/python.exe manage.py makemigrations --check --dry-run --settings=plane.settings.personal

# upstream/plane；类型生成和构建必须顺序执行
pnpm --filter web test:unit
pnpm --filter web check:lint
pnpm --filter web check:types
pnpm turbo run build --filter=web
```

后端新增状态分组与批量查询回归测试，合计 67 项；前端增加 3 项接口错误提示测试，使用 Node 自带测试框架，不增加依赖。

页面验证使用独立 SQLite 数据库、合成项目和状态，避免向日常运行库写入测试数据。生产构建更新后需重启个人版服务，使 WhiteNoise 重新索引静态资源。
