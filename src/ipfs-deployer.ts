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

export interface IpfsDeployerNode {
  path: string;
  hash: string;
  size: number;
}

export interface IpfsDeployerResult {
  rootHash: string;
  nodes: IpfsDeployerNode[];
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
    return this.getResultFromListOfFiles(results);
  }

  async deployFolder(path: string): Promise<IpfsDeployerResult> {
    const results = await this.ipfs.addFromFs(path, {recursive: true})
    return this.getResultFromListOfFiles(results);
  }

  private getResultFromListOfFiles(nodes: IpfsDeployerNode[]): IpfsDeployerResult {
    const rootFolder = (nodes[0].path.match(/^([^\/]+)/) as any)[0]
    nodes = nodes
      .map((file) => ({
        ...file,
        path: file.path.replace(new RegExp(`^${rootFolder}\/?`), './'),
      }));
    const root = nodes.find(({path}) => path === './')
    const rootHash = (root || {} as any).hash;
    return {rootHash, nodes};
  }
}
