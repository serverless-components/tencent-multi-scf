import { Component } from '@serverless/core';
import { Inputs, TriggerInputs, FaasInputs, TriggerSdkInputs } from './inputs';
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

export interface FaasKeyMap {
  [key: string]: {
    name: string;
    type?: string;
  };
}
export interface FormatTriggerOptions {
  triggers?: TriggerInputs[];
  instance: ComponentInstance;
  faasKeyMap: FaasKeyMap;
  commandFunctionKey?: string;

  function: {
    namespace?: string;
    qualifier?: string;
  };
}

export interface FormatOptions {
  inputs: Inputs;
  credentials: Credentials;
  appId: string;
  instance: ComponentInstance;

  commandFunctionKey?: string;
}

export interface FormatOutputs {
  region: string;
  scfInputsList: FaasInputs[];
  triggerInputsList: TriggerSdkInputs[];
}
