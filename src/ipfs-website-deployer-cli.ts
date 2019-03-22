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
  .option('--json', 'Returns full JSON data.')
  .action(async (folder) => {
    if (typeof folder !== 'string') {
      console.error('Path not defined. Use `--help`,');
      process.exit(1);
    }
    const {host, port, protocol, onlyHash, json} = program;
    await deploy(folder, host, +port, protocol, onlyHash, json);
  })
  .parse(process.argv);

async function deploy(
  folder: string,
  host?: string,
  port?: number,
  protocol?: string,
  onlyHash?: boolean,
  json?: boolean,
) {
  const config = {host, port, protocol};
  Object.keys(config)
      .forEach((key) => config[key] || delete config[key]);

  if (!onlyHash && !json) {
    console.log(`Deploying files inside "${folder}".`);
  }
  const ipfsDeployer = new IpfsDeployer(config);
  const result = await ipfsDeployer.deployFolder(folder);

  switch (true) {
    case json:
      console.log(JSON.stringify(result, null, 2));
      break;
    case onlyHash:
      console.log(result.rootHash);
      break;
    default:
      console.log(`Deployed ${result.nodes.length} nodes.`);
      console.log(`Root hash: ${result.rootHash}`);
      break;
  }
}
