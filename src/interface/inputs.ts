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
  runtime?: string;
  memorySize?: number;
  timeout?: number;
  description?: string;
  evironment?: KeyValue[];
}

export interface FaasInputs extends FaasBaseConfig {
  name: string;
  handler: string;
}

export interface TriggerFunctionConfig {
  name: string;
  namespace?: string;
  qualifier?: string;
}

export interface ApiInputs {
  path: string;
  method: string;
  function: {
    name: string;
    namespace?: string;
    qualifier?: string;
    // 兼容旧的配置
    functionName?: string;
    functionQualifier?: string;
    functionNamespace?: string;
  };

  [key: string]: any;
}

export interface TriggerInputs {
  type: string;

  function?: {
    name: string;
    namespace?: string;
    qualifier?: string;
  };

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
  src?: string;
  type?: string;

  functions: FaasInputs[];
  triggers?: TriggerInputs[];

  code?: {
    bucket: string;
    object: string;
  };

  // serverless component 注入的
  srcOriginal?: string | SrcObject;

  // 通过自定义命令传入参数
  commandOptions?: CommandOptions;
}
