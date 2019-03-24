import ipfsHttpClient from 'ipfs-http-client';
import glob from 'glob';

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

export interface IpfsDeployerProgress {
  progress: number;
  total: number;
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

  async deployFiles(files: IpfsDeployerFile[], onProgress?: (progress: IpfsDeployerProgress) => void): Promise<IpfsDeployerResult> {
    const progress = await this.getProgressHandler(undefined, files.length, onProgress)
    let results = await this.ipfs
      .add(
        files.map((file) => ({...file, path: `root/${file.path}`})),
        {progress}
      );
    return this.getResultFromListOfFiles(results);
  }

  async deployFolder(path: string, onProgress?: (progress: IpfsDeployerProgress) => void): Promise<IpfsDeployerResult> {
    const progress = await this.getProgressHandler(path, undefined, onProgress)
    const results = await this.ipfs.addFromFs(path, {recursive: true, progress})
    return this.getResultFromListOfFiles(results);
  }

  private async getProgressHandler(
    path?: string,
    filesNumber?: number,
    onProgress?: (progress: IpfsDeployerProgress) => void,
  ): Promise<undefined | (() => any)> {

    if (!onProgress) {
      return;
    }
    const total = filesNumber || await this.getFilesInFolderNumber(path || '');
    let progress = 0;
    return () => {
      progress++;
      onProgress({total, progress});
    }
  }

  private getFilesInFolderNumber(path: string) {
    return new Promise<number>(resolve => {
      glob(`${path.replace(/\/$/, '')}/**/*`, {nodir: true}, (err, result) => resolve(result.length));
    })
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
