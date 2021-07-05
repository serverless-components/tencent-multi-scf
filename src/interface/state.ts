import { SimpleApigwDetail } from 'tencent-component-toolkit/lib/modules/triggers/interface/index';
import { FaasOutput, TriggerOutput } from './outputs';

export interface ApigwState {
  serviceId: string;
  serviceName: string;

  [key: string]: any;
}

export type State = {
  region?: string;
  functions?: FaasOutput[];

  triggers?: TriggerOutput[];

  apigws?: SimpleApigwDetail[];
};
