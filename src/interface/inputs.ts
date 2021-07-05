export interface KeyValue {
  key: string;
  value: string;
}

// export enum TriggerType {
//   timer = 'timer',
//   cos = 'cos',
//   apigw = 'apigw',
//   cmq = 'cmq',
//   ckafka = 'ckafka',
//   cls = 'cls',
//   mps = 'mps',
// }

export interface FaasBaseConfig {
  // 函数类型
  type?: string;
  // 运行环境
  runtime?: string;
  // 运行内存
  memorySize?: number;
  // 超时时间
  timeout?: number;
  // 描述
  description?: string;
  environments?: KeyValue[];

  // 环境变量，兼容老的结构 { variables: { [key: string]: string } }
  environment?: { variables: { [key: string]: string } };

  // 命令空间
  namespace?: string;
  // vpc 配置
  vpc?: {
    vpcId: string;
    subnetId: string;
  };
  // vpc 配置，兼容旧的配置
  vpcConfig?: {
    vpcId: string;
    subnetId: string;
  };

  // CFS 配置
  cfs?: {
    // cfs ID
    cfsId: string;
    // 挂载 ID
    mountInsId: string;
    // 本地挂在目录（云函数目录）
    localMountDir: string;
    // 远程挂载目录（CFS 目录）
    remoteMountDir: string;
  }[];
  // CLS 配置
  cls?: {
    logsetId: string;
    topicId: string;
  };
  // 标签配置，兼容老的结构 { [key: string]: string }
  tags?: KeyValue[] | Record<string, string>;

  // 关联层
  layers?: { name: string; version: string }[];

  /**
   * 扩展配置
   */
  // 固定 IP
  eip?: boolean;
  // 是否开启公网访问
  publicAccess?: boolean;
  // 在线安装依赖
  installDependency?: boolean;
  // 是否忽略触发器部署
  ignoreTriggers?: boolean;
  // 启用异步执行（长时间运行）
  asyncRunEnable?: boolean;
  // 是否启用状态追踪，如果要配置为 `true`，必须配置 `asyncRunEnable` 同时为 `true`
  traceEnable?: boolean;
}

export interface FaasInputs extends FaasBaseConfig {
  key?: string;
  name?: string;
  src?: string;
  code?: {
    bucket?: string;
    object?: string;

    imageType?: string;
    imageUri?: string;
    registryId?: string;
    command?: string;
    args?: string;
  };
  handler: string;

  // 镜像配置
  image?: {
    // 镜像版本 URL，这里用 imageUrl，而不用 imageUri，为了方便用户配置和理解，i 字母也容易写错。（底层云api用的是 ImageUri）
    imageUrl: string;
    // 容器镜像服务实例 ID，企业版必须
    registryId?: string;
    // 镜像类型
    imageType?: string;
    // 容器启动命名
    command?: string;
    // # 容器启动参数
    args?: string;
  };

  imageConfig?: {
    registryId?: string;
    imageType: string;
    imageUri: string;
    command?: string;
    args?: string;
  };
}

export interface TriggerFunctionConfig {
  name: string;
  namespace?: string;
  qualifier?: string;
}

export interface TriggerFunctionConfig {
  name: string;
  type?: string;
  namespace?: string;
  qualifier?: string;
  // 兼容旧的配置
  functionName?: string;
  functionQualifier?: string;
  functionNamespace?: string;
}

export interface ApiInputs {
  path: string;
  method: string;
  function: TriggerFunctionConfig | string;

  [key: string]: any;
}

export interface TriggerInputs {
  type: string;

  function?: TriggerFunctionConfig | string;

  namespace?: string;

  parameters: {
    apis?: ApiInputs[];
    [key: string]: any;
  };
}
export interface TriggerSdkInputs {
  type: string;

  function?: TriggerFunctionConfig;

  parameters: {
    apis?: ApiInputs[];
    [key: string]: any;
  };
}

export interface SrcObject {
  bucket?: string;
  object?: string;
}

export interface CommandOptions {
  // 指定函数名称
  function?: string;
}

export interface Inputs extends FaasBaseConfig {
  region?: string;
  src?: string | SrcObject;
  type?: string;

  functions: Record<string, FaasInputs>;
  triggers?: TriggerInputs[];

  code?: {
    bucket: string;
    object: string;
  };

  // serverless component 注入的
  srcOriginal?: string | SrcObject;

  // 通过自定义命令传入参数
  commandOptions?: CommandOptions;

  // 命令行传入指定函数名称
  function?: string;

  // 是否自动发版
  isAutoPublish?: boolean;
  // 发布版本的描述信息
  publishDescription?: string;
}

export interface InvokeParameters {
  functionName: string;
  namespace?: string;
  invocationType?: string;
  logType?: string;
  clientContext: Record<string, any>;
}

export interface InvokeFunctionInputs {
  // 地区
  region?: string;
  // 函数名称
  function: string;
  // 命名空间
  namespace?: string;
  // 是否是异步执行函数
  asyncRun?: boolean;
  // 函数执行输入参数 event
  event?: Record<string, any>;
  // 函数执行输入参数 event，兼容老的版本
  clientContext?: Record<string, any>;
}

export interface GetFunctionLogInputs {
  function: string;
  region?: string;
  namespace?: string;
  qualifier?: string;
}
