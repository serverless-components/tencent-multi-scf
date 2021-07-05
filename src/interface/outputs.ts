export interface TriggerDetail {
  serviceId?: string;
  serviceName?: string;

  [key: string]: any;
}

export interface FaasOutput {
  key?: string;
  name: string;
  region: string;
  memorySize: number;
  timeout: number;
  namespace: string;
  type: string;
  runtime?: string;
  handler?: string;
  description?: string;
  latestVersion?: string;

  triggers?: TriggerDetail[];
  Triggers?: TriggerDetail[];
}

export interface TriggerOutput {
  name: string;
  triggers: TriggerDetail[];
}

export interface Outputs {
  region: string;
  functions: FaasOutput[];
  triggers?: TriggerOutput[];
}
