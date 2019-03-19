import 'mocha';
import { assert } from 'chai';

import { IpfsDeployer, IpfsDeployerFile } from './ipfs-deployer';

describe('IpfsDeployer', () => {
  it('should be initialized', async () => {
    assert.isDefined(new IpfsDeployer());
  });

  it('should deploy the files', async () => {
    const ipfsDeployer = new IpfsDeployer();

    const files: IpfsDeployerFile[] = [
      {path: 'index.html', content: Buffer.from("Test index", 'utf8')},
      {path: 'about.html', content: Buffer.from("Test about", 'utf8')},
    ];

    const result = await ipfsDeployer.deployFiles(files);

    assert.match(result.rootHash, /^[a-z0-9]{46}$/i);
    assert.equal(result.files.length, files.length + 1);
  });

  it('should deploy the files of a directory', async () => {
    const ipfsDeployer = new IpfsDeployer();

    const result = await ipfsDeployer.deployFolder('src');

    assert.match(result.rootHash, /^[a-z0-9]{46}$/i);
    assert.isAtLeast(result.files.length, 3);
  });
});
