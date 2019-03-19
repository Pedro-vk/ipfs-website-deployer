#!/usr/bin/env node

import program from 'commander';
import { IpfsDeployer } from './ipfs-deployer';

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
  .action(async (folder) => {
    if (typeof folder !== 'string') {
      console.error('Path not defined. Use `--help`,');
      process.exit(1);
    }
    const {host, port, protocol, onlyHash} = program;
    await deploy(folder, host, +port, protocol, onlyHash);
  })
  .parse(process.argv);

async function deploy(
  folder: string,
  host?: string,
  port?: number,
  protocol?: string,
  onlyHash?: boolean,
) {
  const config = {host, port, protocol};
  Object.keys(config)
      .forEach((key) => config[key] || delete config[key]);

  if (!onlyHash) {
    console.log(`Deploying files inside "${folder}"`);
  }
  const ipfsDeployer = new IpfsDeployer(config);
  const result = await ipfsDeployer.deployFolder(folder);

  if (onlyHash) {
    console.log(result.rootHash);
  } else {
    console.log(`Deployed ${result.files.length} nodes.`);
    console.log(`Root hash: ${result.rootHash}`);
  }
}
