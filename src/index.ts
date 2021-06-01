import { Component } from '@serverless/core';
import { Scf, TriggerManager } from 'tencent-component-toolkit';
import { ScfDeployOutputs } from 'tencent-component-toolkit/lib/modules/scf/interface';
import { ApiError } from 'tencent-component-toolkit/lib/utils/error';
import { formatInputs } from './formatter';
import { State, Inputs, Outputs, ScfOutput, Credentials } from './interface';
import { deepClone } from './utils';

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

  async deploy(inputs: Inputs): Promise<Outputs> {
    console.log(`正在部署多函数应用`);

    const credentials = this.getCredentials();
    const appId = this.getAppId();

    const { commandOptions = {} } = inputs;

    // 格式化 yaml 配置
    const { region, scfInputsList, triggerInputsList } = await formatInputs({
      inputs,
      appId,
      credentials,
      instance: this,
      functionName: commandOptions.function,
    });

    const scf = new Scf(credentials, region);
    const triggerManager = new TriggerManager(credentials, region);

    const outputs: Outputs = {
      region,
      functions: [],
      triggers: [],
    };

    // 部署函数
    const deployTasks: Promise<ScfDeployOutputs>[] = [];
    scfInputsList.forEach((item) => {
      deployTasks.push(scf.deploy(item));
    });
    const res = await Promise.all(deployTasks);

    // 格式化函数输出
    const functions = res.map((item) => {
      return {
        type: item.Type,
        name: item.FunctionName,
        timeout: item.Timeout,
        region: region,
        namespace: item.Namespace,
        runtime: item.Runtime,
        handler: item.Handler,
        memorySize: item.MemorySize,
      } as ScfOutput;
    });
    outputs.functions = deepClone(functions);

    // 部署触发器
    const triggers = await triggerManager.bulkCreateTriggers(triggerInputsList);
    outputs.triggers = triggers;

    this.state = {
      region,
      functions: [],
      triggers,
    };
    this.state.functions = functions.map(
      (item): ScfOutput => {
        for (let i = 0; i < triggers.length; i++) {
          const cur = triggers[i];

          if (cur.name === item.name) {
            item.triggers = cur.triggers;

            break;
          }
        }
        return item;
      },
    );

    return outputs;
  }

  async remove(inputs: Inputs): Promise<boolean> {
    console.log(`正在移除多函数应用`);

    const credentials = this.getCredentials();
    const { commandOptions = {} } = inputs;

    const { region } = this.state;
    const { functions } = this.state;
    const scf = new Scf(credentials, region);

    let isFunctionExist = false;
    const removeTasks: Promise<boolean>[] = [];
    const newFunctions = functions.filter((item) => {
      const pms = async (): Promise<boolean> => {
        // TODO: remove 函数内部有日志，此处不需要打印
        // console.log(`正在删除函数 ${item.name}`);
        const res = await scf.remove({
          ...item,
          functionName: item.name,
        });
        return res;
      };
      if (commandOptions.function) {
        if (commandOptions.function === item.name) {
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
    if (commandOptions.function && !isFunctionExist) {
      throw new ApiError({
        type: 'MULTI-SCF_PARAMETERS_ERROR',
        message: `指定函数名称(${commandOptions.function})不存在`,
      });
    }

    await Promise.all(removeTasks);

    this.state = {
      functions: newFunctions,
    } as State;

    return true;
  }
}
