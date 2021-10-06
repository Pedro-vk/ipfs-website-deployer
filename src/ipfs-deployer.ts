import glob from 'glob';
import { create, globSource } from 'ipfs-http-client';

import { generatorToArray } from './utils';

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
  cid: string;
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
    this.ipfs = create({...defaultConfig, ...config});
  }

  async deployFiles(
    files: IpfsDeployerFile[],
    onProgress?: (progress: IpfsDeployerProgress) => void,
  ): Promise<IpfsDeployerResult> {
    const progress = await this.getProgressHandler(undefined, files.length, onProgress);
    const resultsGenerator = await this.ipfs
      .addAll(
        files.map((file) => ({...file, path: `root/${file.path}`})),
        {progress},
      );
    const results = await generatorToArray(resultsGenerator);
    return this.getResultFromListOfFiles(results as any);
  }

  async deployFolder(path: string, onProgress?: (progress: IpfsDeployerProgress) => void): Promise<IpfsDeployerResult> {
    const progress = await this.getProgressHandler(path, undefined, onProgress);
    const resultsGenerator = await this.ipfs.addAll(globSource(path, '**/*'), {progress});
    const results = await generatorToArray(resultsGenerator);
    return this.getResultFromListOfFiles(results as any);
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
    onProgress({total, progress});
    return () => {
      progress++;
      onProgress({total, progress});
    };
  }

  private getFilesInFolderNumber(path: string) {
    return new Promise<number>((resolve) => {
      glob(`${path.replace(/\/$/, '')}/**/*`, {nodir: true}, (err, result) => resolve(result.length));
    });
  }

  private getResultFromListOfFiles(nodes: IpfsDeployerNode[]): IpfsDeployerResult {
    const rootFolder = (nodes[0].path.match(/^([^\/]+)/) as any)[0];
    nodes = nodes
      .map((file) => ({
        ...file,
        path: file.path.replace(new RegExp(`^${rootFolder}\/?`), './'),
      }));
    const root = nodes.find(({path}) => path === './');
    const rootHash = root?.cid?.toString() || '';
    return {rootHash, nodes};
  }
}
