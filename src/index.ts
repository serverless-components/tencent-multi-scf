import { InvokeFunctionInputs, GetFunctionLogInputs } from './interface/inputs';
import { Component } from '@serverless/core';
import { Scf, TriggerManager } from 'tencent-component-toolkit';
import { ScfDeployInputs } from 'tencent-component-toolkit/lib/modules/scf/interface';
import { ApiError } from 'tencent-component-toolkit/lib/utils/error';
import { formatInputs } from './formatter';
import {
  State,
  Inputs,
  Outputs,
  ScfOutput,
  TriggerOutput,
  Credentials,
  InvokeParameters,
  FaasInputs,
} from './interface';
import { deepClone, mergeArray } from './utils';
import { CONFIGS } from './config';
import { SimpleApigwDetail } from 'tencent-component-toolkit/lib/modules/triggers/interface/index';

export class ServerlessComponent extends Component<State> {
  getCredentials(): Credentials {
    const { tmpSecrets } = this.credentials.tencent;

    if (!tmpSecrets || !tmpSecrets.TmpSecretId) {
      throw new ApiError({
        type: 'CREDENTIAL',
        message:
          '无法获取授权密钥信息，账号可能为子账户，并且没有角色 SLS_QcsRole 的权限，请确认角色 SLS_QcsRole 是否存在，参考 https://cloud.tencent.com/document/product/1154/43006',
      });
    }

    return {
      SecretId: tmpSecrets.TmpSecretId,
      SecretKey: tmpSecrets.TmpSecretKey,
      Token: tmpSecrets.Token,
    };
  }

  getAppId(): string {
    return this.credentials.tencent.tmpSecrets.appId;
  }

  getFunctionTriggers(functionsList: ScfOutput[], triggersList: any[]): ScfOutput[] {
    return functionsList.map(
      (item): ScfOutput => {
        for (const cur of triggersList) {
          if (cur.name === item.name) {
            item.triggers = cur.triggers;
            break;
          }
        }
        return item;
      },
    );
  }

  async bulkDeployFaas(region: string, scfInputsList: FaasInputs[]): Promise<ScfOutput[]> {
    const credentials = this.getCredentials();
    const scf = new Scf(credentials, region);

    const outputs: ScfOutput[] = [];
    for (const item of scfInputsList) {
      const res = await scf.deploy(item as ScfDeployInputs);
      outputs.push({
        region,
        type: res.Type,
        name: res.FunctionName,
        timeout: res.Timeout,
        namespace: res.Namespace,
        runtime: res.Runtime,
        handler: res.Handler,
        memorySize: res.MemorySize,
      });
    }
    return outputs;
  }

  async deploy(inputs: Inputs): Promise<Outputs> {
    console.log(`正在部署多函数应用`);
    const credentials = this.getCredentials();
    const appId = this.getAppId();

    const { function: commandFunctionKey } = inputs;

    // 格式化 yaml 配置
    const { region, scfInputsList, triggerInputsList } = await formatInputs({
      inputs,
      appId,
      credentials,
      instance: this,
      commandFunctionKey,
    });

    const triggerManager = new TriggerManager(credentials, region);

    const outputs: Outputs = {
      region,
      functions: [],
      triggers: [],
    };

    // 部署函数
    const functions = await this.bulkDeployFaas(region, scfInputsList);
    outputs.functions = deepClone(functions);

    // 部署触发器
    const { triggerList, apigwList } = await triggerManager.bulkCreateTriggers(triggerInputsList);
    outputs.triggers = triggerList;

    this.state = {
      region,
      functions: this.state.functions || [],
      triggers: this.state.triggers || [],
      // 存储API网关类型触发器信息，方便查询已经创建的 serviceId
      apigws: apigwList,
    };

    if (commandFunctionKey) {
      // 如果传入指定函数名称，则需要查找已经存在的函数和触发器状态
      // 如果是存在的函数，则修改状态，如果不存在，则添加到 state.functions 数组中
      const stateFunctions = mergeArray<ScfOutput>({
        arr1: functions,
        arr2: this.state.functions || [],
        compareKey: 'name',
      });
      // 如果是存在的触发器，则修改状态，如果不存在，则添加到 state.triggers 数组中
      const stateTriggers = mergeArray<TriggerOutput>({
        arr1: triggerList,
        arr2: this.state.triggers || [],
        compareKey: 'name',
      });

      this.state.functions = this.getFunctionTriggers(stateFunctions, stateTriggers);
      this.state.triggers = stateTriggers;
    } else {
      this.state.functions = this.getFunctionTriggers(functions, triggerList);
      this.state.triggers = triggerList;
    }

    return outputs;
  }

  async remove(inputs: Inputs): Promise<any> {
    console.log(`正在移除多函数应用`);

    const credentials = this.getCredentials();
    const { function: commandFunctionName } = inputs;

    const { region } = this.state;
    const { functions = [], apigws: stateApigws } = this.state;
    const scf = new Scf(credentials, region);

    // 删除函数
    let isFunctionExist = false;
    let apigwNeedRemove: SimpleApigwDetail[] = [];
    const removeTasks: Promise<boolean>[] = [];
    const newFunctions = functions.filter((item) => {
      const pms = async (): Promise<boolean> => {
        const apigwList = (stateApigws || []).filter((aItem) => {
          return aItem.functionName === item.name;
        });
        apigwNeedRemove = apigwNeedRemove.concat(apigwList);

        return scf.remove({
          ...item,
          functionName: item.name,
          isAutoRelease: false,
        });
      };
      if (commandFunctionName) {
        if (commandFunctionName === item.name) {
          removeTasks.push(pms());
          isFunctionExist = true;
          return false;
        }
        return true;
      }
      removeTasks.push(pms());
      return false;
    });

    // 如果指定了函数，但是没法找到，就报错
    if (commandFunctionName && !isFunctionExist) {
      throw new ApiError({
        type: 'MULTI-SCF_PARAMETERS_ERROR',
        message: `指定函数名称(${commandFunctionName})不存在`,
      });
    }

    await Promise.all(removeTasks);

    const triggerManager = new TriggerManager(credentials, region);

    // 不删除网关，只删除api
    await triggerManager.bulkReleaseApigw(apigwNeedRemove);

    if (newFunctions.length > 0) {
      this.state = {
        functions: newFunctions,
      } as State;
      return {
        region,
        functions: newFunctions,
        triggers: [],
      };
    }

    // 清空 state
    this.state = {};

    return {};
  }

  /**
   * 执行函数
   * @param options 执行单个函数参数
   * @returns 执行结果
   */
  async invokeFunction({
    region,
    namespace = 'default',
    function: commandFunctionName,
    asyncRun,
    event,
    clientContext,
  }: InvokeFunctionInputs): Promise<any> {
    const invokeTypeMap = {
      // 同步
      request: 'RequestResponse',
      // 异步
      event: 'Event',
    };
    const logTypeMap = {
      tail: 'Tail',
      none: 'None',
    };

    const credentials = this.getCredentials();
    region = region || CONFIGS.region;

    const invokeParams: InvokeParameters = {
      functionName: commandFunctionName,
      namespace,
      invocationType: invokeTypeMap.event,
      logType: logTypeMap.none,
      clientContext: event || clientContext || {},
    };
    if (asyncRun) {
      invokeParams.invocationType = invokeTypeMap.request;
      invokeParams.logType = logTypeMap.tail;
    }

    const scf = new Scf(credentials, region);

    console.log(`正在执行函数 ${invokeParams.functionName}`);
    return scf.invoke(invokeParams);
  }

  /**
   * 获取函数日志
   * @param options 获取函数日志参数
   * @returns 函数日志列表
   */
  async getFunctionLog({
    region,
    namespace = 'default',
    qualifier = '$LATEST',
    function: commandFunctionName,
  }: GetFunctionLogInputs): Promise<any> {
    const credentials = this.getCredentials();
    region = region || CONFIGS.region;

    console.log(`正在获取函数 ${commandFunctionName} 日志`);
    const scf = new Scf(credentials, region);

    return scf.logs({
      functionName: commandFunctionName,
      namespace: namespace,
      qualifier: qualifier,
    });
  }

  // TODO
  // async invoke(inputs: Inputs) {}

  // TODO
  // async log(inputs: Inputs) {}

  // 获得存储状态
  get_state(): State {
    return this.state;
  }
}
