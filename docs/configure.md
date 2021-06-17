# 配置文档

## 全部配置

```yml
# serverless.yml

app: multi-scf
stage: dev
name: demo
component: multi-scf

inputs:
  src:
    src: ./ # 指定当前需要上传的包含工作流配置文件的目录
    exclude:
      - .env
  region: ap-guangzhou # 云函数所在区域
  runtime: Nodejs12.16
  namespace: default
  memorySize: 128
  timeout: 3
  functions:
    index:
      handler: app.index
    userList:
      handler: app.userList
      memorySize: 256
      timeout: 10
  triggers:
    - type: timer
      function: index
      parameters:
        name: timer1
        cronExpression: '*/5 * * * * * *' # 每5秒触发一次
        enable: true
        argument: argument # 额外的参数
    - type: cos
      function: index
      parameters:
        name: cos1
        bucket: bucket-name
        filter:
          prefix: filterdir/
          suffix: .jpg
        events: 'cos:ObjectCreated:*'
        enable: true
    - type: apigw
      parameters:
        name: serverless
        id: service-xxx # 如果不配置，会自动创建
        apis:
          - path: /
            method: GET
            function: index
          - path: /{uid}
            method: POST
            function: userList
            param:
              - name: uid
                position: PATH
                required: true
                type: string
                defaultValue: 0
                desc: user id
    - type: cmq
      function: index
      parameters:
        name: test-topic-queue
        enable: true
        filterType: 1
        filterKey:
          - key1
          - key2
    - type: ckafka
      function: index
      parameters:
        name: ckafka-xxx
        topic: test
        maxMsgNum: 999
        retry: 10000
        offset: latest
        timeout: 60
        enable: true
    - type: cls
      function: index
      parameters:
        topicId: 'xxx-228b-42f5-aab5-7f740cc2fb11' # 日志主题 ID
        maxWait: 60 # 最长等待时间，单位秒
        enable: true
    - type: mps
      function: index
      parameters:
        type: EditMediaTask # 事件类型
        enable: true
```

## inputs 配置参数

主要的参数

| 参数名称       | 必选 | 类型                                        |     默认值     | 描述                                                         |
| -------------- | :--: | :------------------------------------------ | :------------: | :----------------------------------------------------------- |
| src            |  是  | [Src](#Src)                                 |                | 指定当前需要上传的包含工作流配置文件的目录                   |
| region         |  否  | string                                      | `ap-guangzhou` | 工作流所在区域                                               |
| runtime        |  否  | string                                      | `Nodejs12.16`  | 运行环境                                                     |
| memorySize     |  否  | number                                      |     `128`      | 运行内存                                                     |
| timeout        |  否  | number                                      |      `3`       | 超时时间                                                     |
| functions      |  否  | [FunctionObject](#FunctionFunctionObject)[] |      `''`      | 函数配置                                                     |
| triggers       |  否  | [Trigger](#Trigger)[]                       |      `''`      | 触发器配置                                                   |
| ignoreTriggers |  否  | boolean                                     |    `false`     | 是否忽略触发器，如果设置为 `true`，`triggers` 参数将不起作用 |

## Src

项目代码配置

| 参数名称 | 是否必选 |   类型   | 默认值 | 描述                                       |
| -------- | :------: | :------: | :----: | :----------------------------------------- |
| src      |    否    |  string  |        | 上传代码目录                               |
| exclude  |    否    | string[] |        | 不包含的文件或路径, 遵守 [glob 语法][glob] |

## FunctionObject

```yaml
functions:
  index: # 唯一 Key
    handler: app.index
    # ...
  userList: # 唯一 Key
    handler: app.userList
    # ...
```

部署后的函数名称默认会基于配置的唯一 `Key`，进行规范化拼接，规则为：``${name}-${stage}-${app}-${Key}`，比如下面配置生成的函数名称为`demo-dev-multi-scf-index`：

```yaml
app: multi-scf
stage: dev
name: demo
component: multi-scf
functions:
  index:
    handler: app.index
```

如果想要自定义函数名称，直接配置`name` 属性就好，比如：

```yaml
functions:
  index: # 唯一 Key
    name: indexFunc
    handler: app.index
```

函数配置为应用中唯一 `Key` 作为属性，然后 `Key` 属性值为 `Function` 对象，

`Function` 对象支持配置属性如下：

| 参数名称          | 必选 | 类型                        | 默认值  | 描述                                                                                                      |
| ----------------- | ---- | --------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| handler           | 是   | string                      |         | 处理方法名称                                                                                              |
| name              | 否   | string                      |         | 函数名称                                                                                                  |
| src               | 否   | string                      |         | 代码目录，相对于 [Src](#Src) 指定目录                                                                     |
| role              | 否   | string                      |         | 运行角色。                                                                                                |
| description       | 否   | string                      |         | 描述                                                                                                      |
| memorySize        | 否   | number                      | `128`   | 运行内存，单位 `MB`，范围 64、128-3072，以 128 为阶梯                                                     |
| timeout           | 否   | number                      | `3`     | 超时时间，单位为秒，可选值范围 1-900 秒                                                                   |
| environment       | 否   | [Environment](#Environment) |         | 环境变量                                                                                                  |
| vpc               | 否   | [Vpc](#Vpc)                 |         | 私有网络配置                                                                                              |
| layers            | 否   | [Layer](#Layer)[]           |         | 层                                                                                                        |
| cls               | 否   | [Cls](#Cls)                 |         | CLS 日志配置                                                                                              |
| tags              | 否   | [Tag](#Tag)[]               |         | 标签设置                                                                                                  |
| cfs               | 否   | [Cfs](#Cfs)                 |         | 文件系统挂载配置，用于云函数挂载文件系统。                                                                |
| publicAccess      | 否   | number                      | `true`  | 是否开启公网访问                                                                                          |
| eip               | 否   | boolean                     | `false` | 固定出口 IP。默认为 false，即不启用。                                                                     |
| asyncRunEnable    | 否   | boolean                     | `false` | 是否启用异步执行，默认最大支持 `12小时`，配置为 `true` 时，`cls` 配置必须。`此参数只有在函数创建时才有效` |
| traceEnable       | 否   | boolean                     | `false` | 是否启用状态追踪，如果要配置为 `true`，必须配置 `asyncRunEnable` 为 `true`                                |
| installDependency | 否   | boolean                     | `false` | 是否自动在线安装依赖                                                                                      |
| eip               | 否   | boolean                     | `false` | 是否[固定出口 IP][固定出口ip]                                                                             |

**重要字段说明**

- name - 云函数名称，字段字符需满足 `只能包含字母、数字、下划线、连字符，以字母开头，以数字或字母结尾，2~60个字符`
- runtime - 目前仅支持: `Nodejs6.10，Nodejs8.9，Nodejs10.15，Nodejs12.16，Python2.7，Python3.6，PHP5，PHP7，Go1，Java8 和 CustomRuntime`，使用 `CustomRuntime` 部署参考 [CustomRuntime][customruntime]

### Src

代码目录

| 参数名称 | 必选 |   类型   | 默认值 | 描述                                               |
| -------- | :--: | :------: | :----: | :------------------------------------------------- |
| src      |  是  |  string  |        | 代码路径。与 object 不能同时存在。                 |
| exclude  |  否  | string[] |        | 不包含的文件或路径, 遵守 [glob 语法][glob语法参考] |
| bucket   |  否  |  string  |        | 存储桶名称                                         |
| object   |  否  |  string  |        | 部署的代码在存储桶中的路径。                       |

> 注意：如果配置了 `src`，表示部署 `src` 参数指定目录的代码并压缩成 `zip` 后上传到对应的存储桶中；如果配置了 `object`，表示获取对应存储桶中 `object` 对应的代码进行部署

### Environment

环境变量

| 参数名称 | 必须 | 类型   | 描述 |
| -------- | :--: | ------ | ---- |
| key      |  是  | string | 键   |
| value    |  是  | string | 值   |

### Tag

标签

| 参数名称 | 必须 | 类型   | 描述 |
| -------- | :--: | ------ | ---- |
| key      |  是  | string | 键   |
| value    |  是  | string | 值   |

### Vpc

私有网络

| 参数名称 | 必选 | 类型   | 描述           |
| -------- | ---- | ------ | -------------- |
| vpcId    | 否   | string | 私有网络 的 Id |
| subnetId | 否   | string | 子网的 Id      |

### Layer

层配置

| 参数名称 | 必选 |  类型  | 描述     |
| -------- | :--: | :----: | :------- |
| name     |  是  | string | 层名称   |
| version  |  是  | number | 层版本号 |

### Cls

函数日志

| 参数名称 | 必选 |  类型  | 描述        |
| -------- | :--: | :----: | :---------- |
| logsetId |  否  | string | 日志集 ID   |
| topicId  |  否  | string | 日志主题 ID |

### Cfs

文件系统，使用文件系统必须配置[私有网络](#Vpc)，并保证 cfs 文件系统与云函数在同一个私有网络下。

| 参数名称       | 必选 |  类型  | 描述                   |
| -------------- | :--: | :----: | :--------------------- |
| cfsId          |  是  | string | 文件系统实例 id        |
| mountInsId     |  是  | string | 文件系统挂载点 id      |
| localMountDir  |  是  | string | 本地挂载点，云函数目录 |
| remoteMountDir |  是  | string | 远程挂载点，CFS 目录   |

## Trigger

触发器，触发器配置为数组

支持以下触发器：

```
timer - 定时触发器
apigw - API 网关触发器
cos - COS 触发器
cmq - CMQ 主题订阅触发器
ckafka - CKafka 触发器
cls - CLS 触发器
mps - MPS 触发器
```

> **注意**：对于 `API 网关触发器`，如果没有配置 网关服务 ID （serviceId），则自动创建一个 API 网关服务，对于其他触发器仅执行配置触发器，不涉及服务资源创建。

参考 [官方触发器配置描述](https://cloud.tencent.com/document/product/583/39901)

| 参数名称   | 必选 |  类型  | 默认值 | 描述                                   |
| ---------- | :--: | :----: | :----: | :------------------------------------- |
| function   |  是  | string |        | 触发器关联函数                         |
| parameters |  是  | object |        | 根据触发器类型，参考以下触发器参数表。 |

> 注意：`function` 值为 [FunctionObject](#FunctionObject) 的唯一 `Key` 值

#### 定时触发器

参考： https://cloud.tencent.com/document/product/583/9708

| 参数名称       | 必选 |  类型   |   默认值   | 描述                                             |
| -------------- | :--: | :-----: | :--------: | :----------------------------------------------- |
| qualifier      |  否  | string  | `$DEFAULT` | 触发版本，默认为 `$DEFAULT`，即 `默认流量`       |
| cronExpression |  是  | number  |            | 触发时间，为 [Cron][定时触发器-cron表达式]表达式 |
| argument       |  否  | object  |            | 入参参数。                                       |
| enable         |  否  | boolean |  `false`   | 触发器是否启用                                   |

#### COS 触发器

参考： https://cloud.tencent.com/document/product/583/9707

| 参数名称  | 必选 |           类型           |   默认值   | 描述                                               |
| --------- | :--: | :----------------------: | :--------: | :------------------------------------------------- |
| qualifier |  否  |          string          | `$DEFAULT` | 触发版本，默认为 `$DEFAULT`，即 `默认流量`         |
| bucket    |  是  |          string          |            | 配置的 COS Bucket，仅支持选择同地域下的 COS 存储桶 |
| filter    |  是  | [CosFilter][cos过滤规则] |            | COS 文件名的过滤规则                               |
| events    |  是  |          string          |            | [COS 的事件类型][cos事件类型]                      |
| enable    |  否  |         boolean          |  `false`   | 触发器是否启用                                     |

#### CMQ 触发器

| 参数名称   | 必选 | 类型     | 默认值     | 描述                                                                         |
| ---------- | ---- | -------- | ---------- | :--------------------------------------------------------------------------- |
| qualifier  | 否   | string   | `$DEFAULT` | 触发版本，默认为 `$DEFAULT`，即 `默认流量`                                   |
| name       | 是   | string   |            | CMQ Topic 主题队列名称                                                       |
| filterType | 否   | number   |            | 消息过滤类型，1 为标签类型，2 为路由匹配类型                                 |
| filterKey  | 否   | string[] |            | 当 filterType 为 1 时表示消息过滤标签，当 filterType 为 2 时表示 Binding Key |
| enable     | 否   | boolean  | `false`    | 触发器是否启用                                                               |

> 注意：添加 CMQ 触发器，需要给 `SLS_QcsRole` 添加 `QcloudCMQFullAccess` 策略。

#### Ckafka 触发器

| 参数名称  | 必选 | 类型    | 默认值     | 描述                                                       |
| --------- | ---- | ------- | ---------- | :--------------------------------------------------------- |
| qualifier | 否   | string  | `$DEFAULT` | 触发版本，默认为 `$DEFAULT`，即 `默认流量`                 |
| name      | 是   | string  |            | 配置连接的 CKafka 实例，仅支持选择同地域下的实例。         |
| topic     | 是   | string  |            | 支持在 CKafka 实例中已经创建的 Topic。                     |
| maxMsgNum | 是   | number  | `100`      | 5 秒内每汇聚 maxMsgNum 条 Ckafka 消息，则触发一次函数调用  |
| offset    | 是   | string  | `latest`   | offset 为开始消费 Ckafka 消息的位置，目前只能填写 `latest` |
| retry     | 是   | number  | `10000`    | 重试次数，函数调用失败时的最大重试次数。                   |
| timeout   | 是   | number  | `60`       | 单次触发的最长等待时间，最大 60 秒                         |
| enable    | 否   | boolean | `false`    | 触发器是否启用                                             |

> 注意：添加 CKafka 触发器，需要给 `SLS_QcsRole` 添加 `QcloudCKafkaFullAccess` 策略。

#### API 网关触发器

| 参数名称    | 必选 |   类型   | 默认值      | 描述                                                                           |
| ----------- | ---- | :------: | :---------- | :----------------------------------------------------------------------------- |
| environment | 否   |  string  | `release`   | 发布的环境，填写 `release`、`test` 或 `prepub`，不填写默认为`release`          |
| serviceId   | 否   |  string  |             | 网关 Service ID（不传入则新建一个 Service）                                    |
| protocols   | 否   | string[] | `['http']`  | 前端请求的类型，如 http，https，http 与 https                                  |
| netTypes    | 否   | string[] | `['OUTER']` | 网络类型，如 `['OUTER']`, `['INNER']` 与`['OUTER', 'INNER']`                   |
| serviceName | 否   |  string  |             | 网关 API 名称。如果不传递则默认新建一个名称与触发器名称相同的 Apigw API 名称。 |
| description | 否   |  string  |             | 网关 API 描述                                                                  |
| endpoints   | 是   | object[] |             | 参考 [endpoint](#endpoints-参数) 参数。                                        |

> 注意：如果配置多个 API 网关触发器，需要配置不同的 `serviceName`

##### endpoints 参数

参考： https://cloud.tencent.com/document/product/628/14886

| 参数名称                  | 必选 |            类型             | 默认值  | 描述                                                                                                      |
| ------------------------- | ---- | :-------------------------: | :------ | :-------------------------------------------------------------------------------------------------------- |
| path                      | 是   |           string            |         | API 的前端路径，如/path。                                                                                 |
| method                    | 否   |           string            |         | API 的前端请求方法，如 GET                                                                                |
| apiId                     | 否   |           string            |         | API ID。如果不传递则根据 path 和 method 创建一个，传递了直接忽略 path 和 method 参数。                    |
| apiName                   | 否   |           string            |         | API 名称                                                                                                  |
| description               | 否   |           string            |         | API 描述                                                                                                  |
| enableCORS                | 是   |           boolean           | `false` | 是否需要开启跨域                                                                                          |
| responseType              | 否   |           string            |         | 自定义响应配置返回类型，现在只支持 HTML、JSON、TEST、BINARY、XML（此配置仅用于生成 API 文档提示调用者）。 |
| serviceTimeout            | 是   |           number            | `15`    | API 的后端服务超时时间，单位是秒。                                                                        |
| param                     | 否   |   [Parameter](#Parameter)   |         | 前端参数                                                                                                  |
| function                  | 否   |    [Function](#Function)    |         | SCF 配置                                                                                                  |
| usagePlan                 | 否   |   [UsagePlan](#UsagePlan)   |         | 使用计划                                                                                                  |
| auth                      | 否   |        [Auth](#Auth)        |         | API 密钥配置                                                                                              |
| isBase64Encoded           | 否   |           boolean           | `false` | 是否开启 Base64 编码，只有后端为 scf 时才会生效                                                           |
| isBase64Trigger           | 否   |           boolean           | `false` | 是否开启 Base64 编码的 header 触发，只有后端为 scf 时才会生效                                             |
| base64EncodedTriggerRules | 否   | [Base64Rule](#Base64Rule)[] | []      | Header 触发 Base64 编码规则，总规则数不能超过 10，只有 `isBase64Trigger` 设置为 `true` 才有效             |

###### Parameter

前端参数

| 参数名称     | 必选 | 类型    | 默认值 | 描述                                                      |
| ------------ | ---- | ------- | ------ | --------------------------------------------------------- |
| name         | 否   | string  |        | API 的前端参数名称。                                      |
| position     | 否   | string  |        | API 的前端参数位置。当前仅支持 PATH、QUERY、HEADER        |
| required     | 否   | boolean |        | API 的前端参数是否必填，true：表示必填，false：表示可选。 |
| type         | 否   | string  |        | API 的前端参数类型，如 string、Int 等。                   |
| defaultValue | 否   | string  |        | API 的前端参数默认值。                                    |
| desc         | 否   | string  |        | API 的前端参数备注。                                      |

###### Function

SCF 配置

| 参数名称             | 必选 | 类型    | 默认值     | 描述                     |
| -------------------- | ---- | ------- | ---------- | ------------------------ |
| isIntegratedResponse | 否   | boolean | `false`    | 是否启用 SCF 集成响应。  |
| functionQualifier    | 否   | string  | `$DEFAULT` | 触发器关联的 SCF 版本 。 |

###### UsagePlan

使用计划

参考: https://cloud.tencent.com/document/product/628/14947

| 参数名称      | 必选 | 类型   | 描述                                                    |
| ------------- | :--: | ------ | :------------------------------------------------------ |
| usagePlanId   |  否  | string | 用户自定义使用计划 ID                                   |
| usagePlanName |  否  | string | 用户自定义的使用计划名称                                |
| usagePlanDesc |  否  | string | 用户自定义的使用计划描述                                |
| maxRequestNum |  否  | number | 请求配额总数，如果为空，将使用-1 作为默认值，表示不开启 |

###### Auth

API 密钥配置

参考: https://cloud.tencent.com/document/product/628/14916

| 参数名称   | 类型   | 描述     |
| ---------- | :----- | :------- |
| secretName | string | 密钥名称 |
| secretIds  | string | 密钥 ID  |

###### Base64Rule

Header 触发 Base64 编码规则，总规则数不能超过 10，只有 `isBase64Trigger` 设置为 `true` 才有效

参考: https://tcloud-dev.oa.com/document/product/628/16924?!preview&preview_docmenu=1&lang=cn&!document=1#Base64EncodedTriggerRule

| 参数名称 | 类型     | 描述                                                                                                                                          |
| -------- | :------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| name     | string   | 进行编码触发的 header，可选值 "Accept"和"Content_Type" 对应实际数据流请求 header 中的 Accept 和 Content-Type                                  |
| value    | string[] | 进行编码触发的 header 的可选值数组, 数组元素的字符串最大长度为 40，元素可以包括数字，英文字母以及特殊字符，特殊字符的可选值为： . + \* - / \_ |

例如 `value` 可以配置为：

```yaml
value:
  - application/zip
```

#### CLS 触发器

| 参数名称  | 必选 | 类型    | 默认值     | 描述                                       |
| --------- | ---- | ------- | ---------- | :----------------------------------------- |
| qualifier | 否   | string  | `$DEFAULT` | 触发版本，默认为 `$DEFAULT`，即 `默认流量` |
| topicId   | 是   | string  |            | CLS 日志主题 ID                            |
| maxWait   | 否   | number  | `60`       | 最长等待时间，单位秒                       |
| enable    | 否   | boolean | `false`    | 触发器是否启用                             |

> 注意：添加 CLS 触发器，需要给 `SLS_QcsRole` 添加 `QcloudCLSFullAccess` 策略。

#### MPS 触发器

| 参数名称  | 必选 | 类型    | 默认值     | 描述                                                                  |
| --------- | ---- | ------- | ---------- | :-------------------------------------------------------------------- |
| qualifier | 否   | string  | `$DEFAULT` | 触发版本，默认为 `$DEFAULT`，即 `默认流量`                            |
| type      | 是   | string  |            | 事件类型。`WorkflowTask - 工作流任务`，`EditMediaTask - 视频编辑任务` |
| enable    | 否   | boolean | `false`    | 触发器是否启用                                                        |

> 注意：添加 MPS 触发器，需要给 `SLS_QcsRole` 添加 `QcloudMPSFullAccess` 策略。

## 关于 API 网关 Base64 编码

> 注意：开启 API 网关 Base64 编码的后端必须是 `云函数`

如果需要开启 API 网关 Base64 编码，必须配置 `isBase64Encoded` 为 `true`，此时每次请求的请求内容都会被 Base64 编码后再传递给云函数。如果想要部分请求 Base64 编码，可以通过配置 `isBase64Trigger` 为 `true`，配置 `base64EncodedTriggerRules` Header 触发规则，此时 API 网关将根据触发规则对请求头进行校验，只有拥有特定 Content-Type 或 Accept 请求头的请求会被 Base64 编码后再传递给云函数，不满足条件的请求将不进行 Base64 编码，直接传递给云函数。
官方介绍文档：https://cloud.tencent.com/document/product/628/51799

<!-- links -->

[glob]: https://github.com/isaacs/node-glob
[函数角色与授权]: https://cloud.tencent.com/document/product/583/32389#.E8.A7.92.E8.89.B2.E8.AF.A6.E6.83.85
[函数地域列表]: https://cloud.tencent.com/document/api/583/17238#.E5.9C.B0.E5.9F.9F.E5.88.97.E8.A1.A8
[glob语法参考]: https://github.com/isaacs/node-glob
[函数环境变量]: https://cloud.tencent.com/document/api/583/17244#Variable
[定时触发器-cron表达式]: https://cloud.tencent.com/document/product/583/9708#cron-.E8.A1.A8.E8.BE.BE.E5.BC.8F
[cos过滤规则]: https://cloud.tencent.com/document/product/583/39901#CosFilter
[cos事件类型]: https://cloud.tencent.com/document/product/583/9707#cos-.E8.A7.A6.E5.8F.91.E5.99.A8.E5.B1.9E.E6.80.A7
[固定出口ip]: https://cloud.tencent.com/document/product/583/38198
[customruntime]: https://cloud.tencent.com/document/product/583/47274
[clb重定向配置]: https://cloud.tencent.com/document/product/214/8839
