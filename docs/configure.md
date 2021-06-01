# 配置文档

## 全部配置

```yml
# serverless.yml

app: appDemo
stage: dev
component: multi-scf
name: multi-scf-demo

inputs:
  src:
    src: ./ # 指定当前需要上传的包含工作流配置文件的目录
    exclude:
      - .env
  region: ap-guangzhou # 云函数所在区域
  type: event # 函数类型，event - 事件类型，web - web 类型
  runtime: Nodejs12.16
  namespace: default
  memorySize: 128
  timeout: 3
  functions:
    - name: app-index
      handler: app.index
    - name: app-userList
      handler: app.userList
      memorySize: 256
      timeout: 10
  triggers:
    - type: timer
      function:
        name: app-index
      parameters:
        name: timer1
        cronExpression: '*/5 * * * * * *' # 每5秒触发一次
        enable: true
        argument: argument # 额外的参数
    - type: cos
      function:
        name: app-index
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
            function:
              name: app-index
          - path: /{uid}
            method: POST
            param:
              - name: uid
                position: PATH
                required: true
                type: string
                defaultValue: 0
                desc: user id
            function:
              name: app-userList
    - type: cmq
      function:
        name: app-index
      parameters:
        name: test-topic-queue
        enable: true
        filterType: 1
        filterKey:
          - key1
          - key2
    - type: ckafka
      function:
        name: app-index
      parameters:
        name: ckafka-xxx
        topic: test
        maxMsgNum: 999
        retry: 10000
        offset: latest
        timeout: 60
        enable: true
    - type: cls
      function:
        name: app-index
      parameters:
        topicId: 'xxx-228b-42f5-aab5-7f740cc2fb11' # 日志主题 ID
        maxWait: 60 # 最长等待时间，单位秒
        enable: true
    - type: mps
      function:
        name: app-index
      parameters:
        type: EditMediaTask # 事件类型
        enable: true
```

## inputs 配置参数

主要的参数

| 参数名称    | 必选 | 类型        |         默认值          | 描述                                         |
| ----------- | :--: | :---------- | :---------------------: | :------------------------------------------- |
| src         |  是  | [Src](#Src) |                         | 指定当前需要上传的包含工作流配置文件的目录   |
| name        |  是  | string      |                         | 工作流名称                                   |
| definition  |  是  | string      |                         | 工作流配置 json 文件路径，或者 JSON 字符串   |
| roleArn     |  是  | string      |                         | 运行角色 RoleArn                             |
| region      |  否  | string      |     `ap-guangzhou`      | 工作流所在区域                               |
| chineseName |  否  | string      |      `serverless`       | 中文名称                                     |
| description |  否  | string      | `Created By Serverless` | 备注                                         |
| type        |  否  | string      |       `STANDARD`        | 工作流类型                                   |
| enableCls   |  否  | boolean     |         `false`         | 是否启动日志投递                             |
| input       |  否  | string      |          `''`           | 默认运行参数 json 文件路径，或者 JSON 字符串 |

> 注意：如果指定 `definition` 或者 `input` 为 json 文件路径，必须制定 `src.src` 为该 json 文件目录，如果 `definition` 和 `input` 同时为 JSON 字符串，可以不配置 `src`

## 权限说明

通常 `multi-scf` 组件的运行依赖 `SLS_QcsRole` 角色授权操作云端资源，如果需要使用本组件，需要给 `SLS_QcsRole` 角色添加 `Qcloudmulti-scfFullAccess` 策略。

## Src

项目代码配置

| 参数名称 | 是否必选 |   类型   | 默认值 | 描述                                       |
| -------- | :------: | :------: | :----: | :----------------------------------------- |
| src      |    否    |  string  |        | json 配置文件路径                          |
| exclude  |    否    | string[] |        | 不包含的文件或路径, 遵守 [glob 语法][glob] |

<!-- links -->

[glob]: https://github.com/isaacs/node-glob
