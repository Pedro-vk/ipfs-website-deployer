import ipfsHttpClient from 'ipfs-http-client'

export interface IpfsDeployerConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https' | string;
}

export interface IpfsDeployerFile {
  path: string;
  content?: Buffer;
}

export interface IpfsDeployerResult {
  path: string;
  hash: string;
  size: number;
}

const defaultConfig: IpfsDeployerConfig = {
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
}

export class IpfsDeployer {
  private ipfs: any;

  constructor(config: Partial<IpfsDeployerConfig> = {}) {
    this.ipfs = new ipfsHttpClient(Object.assign({}, defaultConfig, config));
  }

  async deployFiles(files: IpfsDeployerFile[]): Promise<{rootHash: string, files: IpfsDeployerResult[]}> {
    const root = "root";
    const results = await this.ipfs
      .add(
        files.map(file => ({...file, path: `/${root}/${file.path}`})),
      );
    const rootHash = results.find(({path}) => path === root).hash;
    return {rootHash, files: results};
  }
}
