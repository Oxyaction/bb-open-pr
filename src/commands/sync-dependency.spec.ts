import { SyncDependencyCommand } from './sync-dependency';
import { NPMManager } from '../services/npm-manager';
import { BitbucketClient } from '../services/bitbucket';

const getPacakgeJSONMock = jest
  .spyOn(BitbucketClient.prototype, 'getLatestFileContent')
  .mockResolvedValue(Promise.resolve('{"dependencies": {"react": "1.0.0"}}'));

describe('SyncDependencyCommand', () => {
  const bitbucketClient = new BitbucketClient({} as any, 'workspace', 'slug');
  const command = new SyncDependencyCommand(bitbucketClient, new NPMManager());

  it('should throw error if dependency not found', async () => {
    await expect(command.execute('lodash', '1.0.0', false)).rejects.toThrow(
      'Dependency lodash not found'
    );
  });
});
