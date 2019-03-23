import fs from 'fs';
import glob from 'glob';
import ipfsHttpClient from 'ipfs-http-client';

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
  rootHash: string;
  nodes: {
    path: string;
    hash: string;
    size: number;
  }[];
}

const defaultConfig: IpfsDeployerConfig = {
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
};

export class IpfsDeployer {
  private ipfs: any;

  constructor(config: Partial<IpfsDeployerConfig> = {}) {
    this.ipfs = new ipfsHttpClient({...defaultConfig, ...config});
  }

  async deployFiles(files: IpfsDeployerFile[]): Promise<IpfsDeployerResult> {
    let results = await this.ipfs
      .add(
        files.map((file) => ({...file, path: `root/${file.path}`})),
      );
    results = results
      .map((file) => ({
        ...file,
        path: file.path.replace(/^root\/?/, './'),
      }));
    const rootHash = results.find(({path}) => path === './').hash;
    return {rootHash, nodes: results};
  }

  async deployFolder(path: string): Promise<IpfsDeployerResult> {
    path = path.replace(/\/$/, '');
    const paths: string[] = await new Promise((resolve, reject) => {
      glob(`${path}/**`, (error, matches) => error ? reject(error) : resolve(matches));
    });

    const files = paths
      .filter((_) => _ !== path)
      .map((_) => ({
        path: _.replace(`${path}/`, ''),
        content: fs.readFileSync(_),
      }));

    return this.deployFiles(files);
  }
}
