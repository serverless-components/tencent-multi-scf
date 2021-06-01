import { ScfOutput, TriggerOutput } from './outputs';

export interface ApigwState {
  serviceId: string;
  serviceName: string;

  [key: string]: any;
}

export type State = {
  region: string;
  functions: ScfOutput[];

  triggers?: { name: string; triggers: TriggerOutput[] }[];
};
