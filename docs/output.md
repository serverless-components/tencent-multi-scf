# 部署 `output` 参数介绍

> 组件输出可以在别的组件中通过 `${output:${stage}:${app}:<name>.<variable_name>}` 获取
> 例如，如果该组件名称是 `test_name`, ·且只部署于一个地域，则可以通过 `${output:${stage}:${app}:test_name.resouceId}` 在别的组件中获取该组件创建的工作流资源唯一性 ID 的 `resourceId`。

| 名称       |  类型   | 描述              |
| :--------- | :-----: | :---------------- |
| region     | string  | 地域信息          |
| requestId  | string  | 请求 ID           |
| resourceId | string  | 工作流资源唯一 ID |
| isNewRole  | boolean | 是否是新建角色    |
| roleName   | string  | 角色名称          |
