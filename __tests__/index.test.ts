import { join } from 'path';
import { generateId, getServerlessSdk } from './lib/utils';
import { Inputs } from '../src/interface';

interface YamlConfig {
  org: string;
  app: string;
  component: string;
  name: string;
  stage: string;
  inputs: Inputs;
}

const inputs = {
  src: join(__dirname, '..', 'example'),
  region: 'ap-guangzhou',
  runtime: 'Nodejs12.16',
  memorySize: 128,
  timeout: 3,
  functions: {
    index: {
      handler: 'app.index',
    },
    userList: {
      handler: 'app.userList',
      memorySize: 256,
      timeout: 10,
    },
  },
  triggers: [
    {
      type: 'timer',
      function: 'index',
      parameters: {
        name: 'timer1',
        cronExpression: '*/5 * * * * * *',
        enable: true,
        argument: 'argument',
      },
    },
    {
      type: 'apigw',
      parameters: {
        name: 'serverless',
        protocols: ['https', 'http'],
        apis: [
          {
            path: '/',
            method: 'GET',
            function: 'index',
          },
          {
            path: '/',
            method: 'POST',
            function: 'userList',
          },
        ],
      },
    },
  ],
};

const instanceYaml: YamlConfig = {
  org: process.env.TENCENT_APP_ID as string,
  app: 'appDemo',
  component: 'multi-scf@dev',
  name: `multi-scf-integration-tests-${generateId()}`,
  stage: 'dev',
  inputs,
};

const credentials = {
  tencent: {
    SecretId: process.env.TENCENT_SECRET_ID,
    SecretKey: process.env.TENCENT_SECRET_KEY,
  },
};

describe('multi-scf', () => {
  const sdk = getServerlessSdk(instanceYaml.org, process.env.TENCENT_APP_ID as string);

  it('deploy', async () => {
    const instance = await sdk.deploy(instanceYaml, credentials);

    expect(instance).toBeDefined();
  });

  it('update source code', async () => {
    const instance = await sdk.deploy(instanceYaml, credentials);

    expect(instance).toBeDefined();
  });

  it('remove', async () => {
    await sdk.remove(instanceYaml, credentials);
    const result = await sdk.getInstance(
      instanceYaml.org,
      instanceYaml.stage,
      instanceYaml.app,
      instanceYaml.name,
    );

    expect(result.instance.instanceStatus).toEqual('inactive');
  });
});
