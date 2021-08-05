# 开发文档

## 目录介绍

```
./
├── LICENSE
├── README.md
├── __tests__                 # 测试目录
├── commitlint.config.js
├── docs                      # 项目文档
├── examples                  # 项目示例
├── jest.config.js
├── package.json
├── prettier.config.js
├── release.config.js
├── scripts                   # 自动化脚本
├── src                       # 组件代码
├── tsconfig.json
├── typings                   # 类型声明 （主要提供自动化脚本使用）
└── version.yml               # 记录组件版本号
```

核心主要关注 `src` 目录，其中为组件运行代码，`src` 目录结构如下：

```
./src
├── config.ts             # 组件部署配置
├── formatter.ts          # 鼓励和规范化 yaml 的 inputs
├── index.ts              # 组件入口代码
├── interface             # 类型声明
├── package.json
├── serverless.ts         # 特意为 serverless component 准备的入口代码
├── typings
|   └── serverless-core.d     # @serverless/core 的类型声明（serverless 官方没有 ts 声明）
└── utils.ts              # 工具函数
```

## 初始化

项目开发之前，需要先安装所有需要的模块依赖，包括：

1. 项目开发依赖 `/`
2. 组件代码依赖 `src/`

只需要执行如下命令：

```bash
$ yarn bootstrap
```

## 组件版本号更新

组件版本维护在项目根目录的 `version.yml` 文件，我们可以通过 `yarn change:version` 命令来更新组件版本。

比如更新组件版本号，递增方式为 `patch` ：

```bash
$ yarn change:version --type=patch
```

如果不带 `--type` 参数，会通过交互方式让选择：

```bash
$ yarn update:version
yarn run v1.22.10
$ ts-node ./scripts/version.ts
ℹ No version is specified
? Please select version type ?
  patch
  minor
❯ major
```

如果想直接指定版本号：

```bash
$ yarn update:version --ver=2.0.0
```

## 组件发布

更新好组件版本号后，就可以执行 `yarn deploy` 命令来发布组件了。

修改代码后，只需要执行如下命令部署：

```bash
$ yarn deploy
```

部署的组件版本将依赖项目根目录 `version.yml` 中的 `version` 字段。

也可以通过命令行指定版本：

```bash
$ yarn deploy --version=1.0.0
```

发布 `dev` 版本：

```bash
$ yarn deploy --dev
```

组件发布命令默认部署到 `dev` 环境，如果要发布到 `prod` 环境可以通过 `-e` 或者 `--env` 参数指定：

```bash
$ yarn deploy --env=prod
```

> 注意：发布到 `prod` 环境参数，请慎用，发布前一定要确保充分验证过。

## 部署示例项目

项目根目录有 `example` 目录，下面有支持组件的示例项目，项目中都有 `serverless.yml` 配置文件，在开发中，我们经常会将配置中的 `component` 字段使用的组件版本添加 `@dev`，每次手动改会非常麻烦，所以提供了自动化脚本自动部署。

比如使用 `dev` 环境的组件 `multi-scf` 的 `dev` 版本：

```bash
$ yarn example -d
```

> 默认使用的就是 `dev` 环境

使用正式环境的 `multi-scf` 组件：

```bash
$ yarn example -e prod
```

移除部署的项目：

```bash
$ yarn example -e prod -r
```
