export interface TriggerDetail {
  serviceId?: string;
  serviceName?: string;

  [key: string]: any;
}

export interface ScfOutput {
  name: string;
  runtime: string;
  handler: string;
  memorySize: number;
  timeout: number;
  namespace: string;
  type: string;
  description?: string;

  triggers?: TriggerDetail[];
  Triggers?: TriggerDetail[];
}

export interface TriggerOutput {
  name: string;
  triggers: TriggerDetail[];
}

export interface Outputs {
  region: string;
  functions: ScfOutput[];
  triggers?: TriggerOutput[];
}
