import { Component } from '@serverless/core';
import { Inputs, TriggerInputs, FaasInputs } from './inputs';
import { State } from './state';

export * from './inputs';
export * from './outputs';
export * from './state';

export interface Credentials {
  SecretId: string;
  SecretKey: string;
  Token?: string;
}

export type ComponentInstance = Component<State>;

export interface FormatTriggerOptions {
  triggers?: TriggerInputs[];
  instance: ComponentInstance;
  functionName?: string;
}

export interface FormatOptions {
  inputs: Inputs;
  credentials: Credentials;
  appId: string;
  instance: ComponentInstance;

  functionName?: string;
}

export interface FormatOutputs {
  region: string;
  scfInputsList: FaasInputs[];
  triggerInputsList: TriggerInputs[];
}
