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
  name: 'serverless-test',
  definition: './workflow.json',
  chineseName: 'chineseName',
  description: 'Created By Serverless',
  role: 'serverless-test-aws',
  input: '{"key":"value"}',
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
    expect(instance.instanceName).toEqual(instanceYaml.name);
    expect(instance.outputs.region).toEqual('ap-guangzhou');
    expect(instance.outputs.roleName).toEqual('serverless-test-aws');
  });

  it('update source code', async () => {
    inputs.chineseName = 'updateChineseName';
    const instance = await sdk.deploy(instanceYaml, credentials);

    expect(instance).toBeDefined();
    expect(instance.instanceName).toEqual(instanceYaml.name);
    expect(instance.outputs.region).toEqual('ap-guangzhou');
    expect(instance.outputs.roleName).toEqual('serverless-test-aws');
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
