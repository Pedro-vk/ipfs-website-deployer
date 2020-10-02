#!/usr/bin/env node

import 'colors';
import program from 'commander';
import Progress from 'ts-progress';
import { IpfsDeployer, IpfsDeployerProgress } from './ipfs-deployer';

// tslint:disable-next-line
const packageJson = require('../package.json');

program
  .version(packageJson.version)
  .description(packageJson.description)
  .usage('[options] <path>')
  .option('-h, --host <name>', 'IPFS host name', 'ipfs.infura.io')
  .option('-p, --port <port>', 'IPFS port', 5001)
  .option('--protocol <http|https|...>', 'IPFS protocol', 'https')
  .option('--only-hash', 'Returns only root hash.')
  .option('--json', 'Returns full JSON data.')
  .option('--progress', 'Shows a progress bar.')
  .action(async (folder) => {
    if (typeof folder !== 'string') {
      console.error('Path not defined. Use `--help`,');
      process.exit(1);
    }
    const {host, port, protocol, onlyHash, json, progress} = program;
    await deploy(folder, host, +port, protocol, onlyHash, json, progress);
  })
  .parse(process.argv);

async function deploy(
  folder: string,
  host?: string,
  port?: number,
  protocol?: string,
  onlyHash?: boolean,
  json?: boolean,
  showProgress?: boolean,
) {
  const config = {host, port, protocol};
  Object.keys(config)
      .forEach((key) => config[key] || delete config[key]);

  if (!onlyHash && !json) {
    console.log(`Deploying files inside "${folder}".`);
  }

  let progressInstance;
  let progressHandler;
  if (showProgress) {
    progressHandler = ({progress, total}: IpfsDeployerProgress) => {
      if (!progressInstance) {
        progressInstance = new Progress(
          total,
          'Progress: {bar.white.cyan.40} | Elapsed: {elapsed.blue} | {percent.green}',
        );
      } else {
        progressInstance.update();
      }
    };
  }

  const ipfsDeployer = new IpfsDeployer(config);
  const result = await ipfsDeployer.deployFolder(folder, progressHandler);

  switch (true) {
    case json:
      console.log(JSON.stringify(result, null, 2));
      break;
    case onlyHash:
      console.log(result.rootHash);
      break;
    default:
      console.log(`Deployed ${String(result.nodes.length).red.bold} nodes.`);
      console.log(`Root hash: ${result.rootHash.green.bold}`);
      console.log('You can see the website here:\n  ', `https://ipfs.io/ipfs/${result.rootHash}/`.bold);
      break;
  }
}
