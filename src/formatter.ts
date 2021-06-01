import { Cos } from 'tencent-component-toolkit';
import {
  Credentials,
  Inputs,
  SrcObject,
  FaasInputs,
  TriggerInputs,
  FormatOptions,
  FormatOutputs,
  FormatTriggerOptions,
  ComponentInstance,
  ApigwState,
} from './interface';
import { CONFIGS } from './config';
import { ApiError } from 'tencent-component-toolkit/lib/utils/error';

export const generateId = (): string =>
  Math.random()
    .toString(36)
    .substring(6);

export const getType = (obj: any): string => {
  return Object.prototype.toString.call(obj).slice(8, -1);
};

export const removeAppid = (str: string, appid: string): string => {
  const suffix = `-${appid}`;
  if (!str || str.indexOf(suffix) === -1) {
    return str;
  }
  return str.slice(0, -suffix.length);
};

function getDefaultBucketName(region: string) {
  return `sls-cloudfunction-${region}-code`;
}

function getDefultObjectName(compName: string) {
  return `/${compName}_${generateId()}-${Math.floor(Date.now() / 1000)}.zip`;
}

async function uploadCodeToCos({
  credentials,
  appId,
  inputs,
}: {
  credentials: Credentials;
  appId: string;
  inputs: Inputs;
}) {
  const region = inputs.region || CONFIGS.region;
  const { srcOriginal } = inputs;
  inputs.srcOriginal = inputs.srcOriginal || inputs.src;

  const tempSrc = (getType(srcOriginal) === 'Object'
    ? srcOriginal
    : getType(srcOriginal) === 'String'
    ? {
        src: srcOriginal,
      }
    : {}) as SrcObject;

  // 如果没配置 bucket，使用默认 bucket，默认名称复用老的逻辑
  const bucketName = tempSrc!.bucket
    ? removeAppid(tempSrc.bucket, appId)
    : getDefaultBucketName(region);

  const objectName = tempSrc.object || getDefultObjectName(CONFIGS.compName);

  const cos = new Cos(credentials, region);
  const bucket = `${bucketName}-${appId}`;

  // create new bucket, and setup lifecycle for it
  if (!tempSrc.bucket) {
    await cos.deploy({
      bucket,
      force: true,
      lifecycle: CONFIGS.cos.lifecycle,
    });
  }

  if (!tempSrc.object) {
    console.log(`Uploading code ${objectName} to bucket ${bucket}`);
    await cos.upload({
      bucket,
      file: inputs.src,
      key: objectName,
    });
  }

  return {
    code: {
      bucket: bucketName,
      object: objectName,
    },
  };
}

function getApigwState(name: string, instance: ComponentInstance): ApigwState {
  const { state } = instance;
  const triggersList = state.triggers;
  if (!triggersList) {
    return {} as ApigwState;
  }
  let apigwState = {} as ApigwState;
  LoopA: for (let i = 0; i < triggersList.length; i++) {
    const { triggers } = triggersList[i];
    for (let j = 0; j < triggers.length; j++) {
      const curT = triggers[j];
      if (curT.serviceId && curT.serviceName === name) {
        apigwState = curT as ApigwState;
        break LoopA;
      }
    }
  }

  return apigwState;
}

function formatScfName({ instance, name }: { instance: ComponentInstance; name: string }) {
  return `${name}-${instance.name}-${instance.stage}-${instance.app}`;
}

// 格式化触发器参数
export function formatTriggerInputs({
  triggers = [],
  instance,
  functionName,
}: FormatTriggerOptions): TriggerInputs[] {
  // 格式化触发器参数，输入底层依赖 SDK
  const triggersInputsList: TriggerInputs[] = [];
  triggers.forEach((item: TriggerInputs) => {
    let isNeeded = functionName ? false : true;
    if (item.type === 'apigw') {
      const serviceName = item.parameters.name;
      const apigwState = getApigwState(serviceName, instance);
      console.log('apigwState', apigwState);

      item.parameters.serviceId = item.parameters.id || apigwState.serviceId;
      item.parameters.serviceName = serviceName;

      // 定制化需求：是否在 yaml 文件中配置了 apigw 触发器的 serviceId
      item.parameters.isInputServiceId = !!item.parameters.id;

      item.parameters.endpoints = item.parameters.apis?.filter((api) => {
        const { name } = api.function;
        api.function.name = formatScfName({ instance, name });
        api.function.functionName = formatScfName({ instance, name });
        api.function.functionNamespace = api.function.namespace;
        api.function.functionQualifier = api.function.qualifier;

        if (functionName) {
          if (functionName === name) {
            isNeeded = true;
            return true;
          }

          isNeeded = false;
          return false;
        }
        isNeeded = true;
        return true;
      });

      item.parameters.oldState = apigwState;
    } else {
      const { name } = item.function!;
      if (functionName) {
        if (functionName === name) {
          isNeeded = true;
        } else {
          isNeeded = false;
        }
      } else {
        isNeeded = true;
      }
      item.function!.name = formatScfName({ instance, name: item.function!.name });
    }

    item.parameters.qualifier = item.function?.qualifier;

    if (isNeeded) {
      triggersInputsList.push(item);
    }
  });
  return triggersInputsList;
}

// 格式化云函数参数
export const formatInputs = async ({
  inputs,
  credentials,
  appId,
  instance,
  functionName,
}: FormatOptions): Promise<FormatOutputs> => {
  const region = inputs.region || CONFIGS.region;
  const { code } = await uploadCodeToCos({ credentials, appId, inputs });

  const commonInputs = {
    runtime: inputs.runtime || CONFIGS.runtime,
    description: inputs.description || CONFIGS.description,
    code,
  };

  const scfInputsList: FaasInputs[] = [];
  const { functions } = inputs;

  let isFunctionExist = false;
  functions.forEach((func: FaasInputs) => {
    const scfInputs = {
      ...commonInputs,
      ...func,
    };

    console.log('scfInputs', JSON.stringify(scfInputs));
    const formatedName = formatScfName({ instance, name: scfInputs.name });
    // 如果指定了函数名称，则过滤
    if (functionName) {
      if (scfInputs.name === functionName) {
        scfInputs.name = formatedName;
        scfInputsList.push(scfInputs);
        isFunctionExist = true;
      } else {
      }
    } else {
      scfInputs.name = formatedName;
      scfInputsList.push(scfInputs);
    }
  });

  // 如果指定了函数，但是没法找到，就报错
  if (functionName && !isFunctionExist) {
    throw new ApiError({
      type: 'MULTI-SCF_PARAMETERS_ERROR',
      message: `指定函数名称(${functionName})不存在`,
    });
  }

  const triggerInputsList = formatTriggerInputs({
    triggers: inputs.triggers,
    instance,
    functionName,
  });

  return {
    region,
    scfInputsList,
    triggerInputsList,
  };
};
