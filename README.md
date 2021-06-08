## 腾讯云多函数管理流组件

腾讯云多函数管理，方便用户管理多云函数应用。

## 快速开始

1. [**安装**](#1-安装)
2. [**配置**](#2-配置)
3. [**部署**](#3-部署)
4. [**查看状态**](#4-查看状态)
5. [**移除**](#5-移除)

更多资源：

- [**账号配置**](#账号配置)

### 1. 安装

通过 `npm` 安装最新版本的 Serverless CLI

```bash
$ npm install -g serverless
```

### 2. 配置

以下是 `multi-scf` 组件的 `serverless.yml` 配置示例：

```yml
app: multi-scf
stage: dev

component: multi-scf
name: demo

inputs:
  src:
    src: ./
    exclude:
      - .env
  region: ap-guangzhou
  runtime: Nodejs12.16
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
    - type: apigw
      parameters:
        name: serverless
        protocols:
          - https
          - http
        apis:
          - path: /
            method: GET
            function: index
          - path: /
            method: POST
            function: userList
```

点此查看[全量配置及配置说明](./docs/configure.md)

### 3. 部署

在 `serverless.yml` 文件所在的项目根目录，运行以下指令进行部署：

```bash
$ serverless deploy
```

部署时需要进行身份验证，如您的账号未 [登陆](https://cloud.tencent.com/login) 或 [注册](https://cloud.tencent.com/register) 腾讯云，您可以直接通过 `微信` 扫描命令行中的二维码进行授权登陆和注册。

> 注意: 如果希望查看更多部署过程的信息，可以通过 `serverless deploy --debug` 命令查看部署过程中的实时日志信息。

- [点击此处查看输出文档](./docs/output.md)

### 4. 查看状态

在`serverless.yml`文件所在的目录下，通过如下命令查看部署状态：

```
$ serverless info
```

### 5. 移除

在`serverless.yml`文件所在的目录下，通过以下命令移除部署的 Express 服务。移除后该组件会对应删除云上部署时所创建的所有相关资源。

```
$ serverless remove
```

和部署类似，支持通过 `serverless remove --debug` 命令查看移除过程中的实时日志信息。

## 账号配置

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```console
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的 SecretId 和 SecretKey 信息并保存

如果没有腾讯云账号，可以在此[注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在[API 密钥管理](https://console.cloud.tencent.com/cam/capi)中获取 `SecretId` 和`SecretKey`.

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

## License

MIT License

Copyright (c) 2020 Tencent Cloud, Inc.
