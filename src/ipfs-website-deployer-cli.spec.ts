import 'mocha';
import { assert } from 'chai';
import { promisify } from 'util';
import { exec } from 'child_process';

const run = promisify(exec);

describe('ipfs-website-deployer-cli', () => {
  it('should deploy a folder and return a hash', async () => {
    const {stdout} = await run('npx ts-node src/ipfs-website-deployer-cli.ts --only-hash src')

    assert.match(stdout, /^[a-z0-9]{46}\n$/i);
  });

  it('should deploy a folder with final slash', async () => {
    const {stderr} = await run('npx ts-node src/ipfs-website-deployer-cli.ts --only-hash src/')

    assert.isEmpty(stderr.trim());
  });
});
