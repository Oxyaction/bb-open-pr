import { SyncDependencyCommand } from './sync-dependency';
import { NPMManager } from '../services/npm-manager';
import { BitbucketClient } from '../services/bitbucket';

jest.mock('../services/bitbucket', () => {
  return {
    BitbucketClient: jest.fn().mockImplementation(() => {
      return {
        getLatestFileContent: jest.fn().mockResolvedValue('{"dependencies": {"react": "2.0.0"}}'),
        getDevelopmentBranch: jest.fn().mockResolvedValue('main'),
        createBranch: jest.fn(),
        createCommit: jest.fn(),
        createPullRequest: jest.fn(),
      };
    }),
  };
});

describe('SyncDependencyCommand', () => {
  let bitbucketClient: BitbucketClient;
  let command: SyncDependencyCommand;
  let npmManager: NPMManager;

  beforeEach(() => {
    bitbucketClient = new BitbucketClient({} as any, 'test-workspace', 'test-slug');
    npmManager = new NPMManager();
    command = new SyncDependencyCommand(bitbucketClient, npmManager);
  });

  it('should throw error on incorrect version provided', async () => {
    await expect(command.execute('react', 'junk-version', false)).rejects.toThrow(
      "Invalid version provided: 'junk-version'"
    );
  });

  it('should get package.json content from development branch', async () => {
    await command.execute('react', '3.0.0', false);
    expect(bitbucketClient.getLatestFileContent).toHaveBeenCalledWith('main', 'package.json');
  });

  it('should set correct package.json value to NPMManager', async () => {
    jest.spyOn(npmManager, 'setRawJSON');
    await command.execute('react', '3.0.0', false);
    expect(npmManager.setRawJSON).toHaveBeenCalledWith('{"dependencies": {"react": "2.0.0"}}');
  });

  it('should get current dependency version from NPMManager', async () => {
    jest.spyOn(npmManager, 'getDependencyVersion');
    await command.execute('react', '3.0.0', false);
    expect(npmManager.getDependencyVersion).toHaveBeenCalledWith('react');
  });

  it('should throw error if current dependency version is greater than new version', async () => {
    await expect(command.execute('react', '1.0.0', false)).rejects.toThrow(
      'Cannot downgrade dependency react from 2.0.0 to 1.0.0'
    );
  });

  it('should return if current dependency version is equal to new version', async () => {
    await expect(command.execute('react', '2.0.0', false)).resolves.not.toThrow();
    expect(bitbucketClient.createBranch).not.toHaveBeenCalled();
  });

  it("should proceed if  new version is less than current dependency version and 'forceDowngrade' option provided", async () => {
    await expect(command.execute('react', '1.0.0', true)).resolves.not.toThrow();
    expect(bitbucketClient.createBranch).toHaveBeenCalled();
  });

  it('should create new branch', async () => {
    await command.execute('react', '3.0.0', false);
    expect(bitbucketClient.createBranch).toHaveBeenCalledWith('update-react-to-3.0.0', 'main');
  });

  it('should create new commit in created branch', async () => {
    await command.execute('react', '3.0.0', false);
    expect(bitbucketClient.createCommit).toHaveBeenCalledWith(
      'update-react-to-3.0.0',
      'Update react to 3.0.0',
      'package.json',
      JSON.stringify(JSON.parse('{"dependencies":{"react":"3.0.0"}}'), null, 2)
    );
  });

  it('should create new pull request', async () => {
    await command.execute('react', '3.0.0', false);
    expect(bitbucketClient.createPullRequest).toHaveBeenCalledWith(
      'update-react-to-3.0.0',
      'main',
      'Update react to 3.0.0',
      'This is automatically-generated PR to update react to 3.0.0'
    );
  });
});
