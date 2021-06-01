export interface TriggerOutput {
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

  triggers?: TriggerOutput[];
  Triggers?: TriggerOutput[];
}

export interface Outputs {
  region: string;
  functions: ScfOutput[];
  triggers?: { name: string; triggers: TriggerOutput[] }[];
}
