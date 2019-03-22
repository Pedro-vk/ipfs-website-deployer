import 'mocha';
import { assert } from 'chai';
import { promisify } from 'util';
import { exec } from 'child_process';

const run = promisify(exec);

describe('ipfs-website-deployer-cli', () => {
  it('should deploy a folder and return a hash', async () => {
    const {stdout} = await run('npx ts-node src/ipfs-website-deployer-cli.ts --only-hash src');

    assert.match(stdout.trim(), /^[a-z0-9]{46}$/i);
  });

  it('should deploy a folder with final slash', async () => {
    const {stderr} = await run('npx ts-node src/ipfs-website-deployer-cli.ts --only-hash src/');

    assert.isEmpty(stderr.trim());
  });

  it('should print a json', async () => {
    const {stdout} = await run('npx ts-node src/ipfs-website-deployer-cli.ts --json src/');
    const result = JSON.parse(stdout);

    assert.isDefined(result);
    assert.match(result.rootHash, /^[a-z0-9]{46}$/i);
    assert.instanceOf(result.files, Array);
  });
});
