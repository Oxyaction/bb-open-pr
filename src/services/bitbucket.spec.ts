import { APIClient } from 'bitbucket';
import FormData from 'form-data';
import { BitbucketClient } from './bitbucket';

describe('BitbucketClient', () => {
  let client: APIClient;
  let bitbucketClient: BitbucketClient;

  beforeEach(() => {
    client = {
      commits: {
        list: jest.fn().mockResolvedValue({
          data: {
            values: [
              {
                hash: 'some-hash',
              },
            ],
          },
        }),
      },
      source: {
        read: jest.fn().mockResolvedValue({ data: 'some-file-content' }),
        createFileCommit: jest.fn(),
      },
      branching_model: {
        get: jest.fn().mockResolvedValue({
          data: {
            development: {
              name: 'main',
            },
          },
        }),
      },
      refs: {
        createBranch: jest.fn().mockResolvedValue(null),
      },
      pullrequests: {
        create: jest.fn().mockResolvedValue({
          data: {
            links: {
              html: {
                href: 'test-pull-request-url',
              },
            },
          },
        }),
      },
    } as unknown as APIClient;
    bitbucketClient = new BitbucketClient(client, 'test-workspace', 'test-repoSlug');
  });

  describe('getLatestFileContent', () => {
    it('should return latest file content', async () => {
      await expect(bitbucketClient.getLatestFileContent('test-branch', 'test-file')).resolves.toBe(
        'some-file-content'
      );
    });

    it('should correctly get last commit', async () => {
      await bitbucketClient.getLatestFileContent('test-branch', 'test-file');
      expect(client.commits.list).toBeCalledWith({
        repo_slug: 'test-repoSlug',
        workspace: 'test-workspace',
        include: 'test-branch',
      });
    });

    it('should correctly get file content', async () => {
      await bitbucketClient.getLatestFileContent('test-branch', 'test-file');
      expect(client.source.read).toBeCalledWith({
        repo_slug: 'test-repoSlug',
        workspace: 'test-workspace',
        commit: 'some-hash',
        path: 'test-file',
      });
    });

    it('should throw error if no commits found', async () => {
      (client.commits.list as jest.Mock).mockResolvedValueOnce({
        data: {
          values: [],
        },
      });
      await expect(
        bitbucketClient.getLatestFileContent('test-branch', 'test-file')
      ).rejects.toThrowError('No commits found');
    });

    it('should throw error if no file content found', async () => {
      (client.source.read as jest.Mock).mockResolvedValueOnce({
        data: '',
      });
      await expect(
        bitbucketClient.getLatestFileContent('test-branch', 'test-file')
      ).rejects.toThrowError("No file found at path 'test-file'");
    });
  });

  describe('getDevelopmentBranch', () => {
    it('should return development branch', async () => {
      await expect(bitbucketClient.getDevelopmentBranch()).resolves.toBe('main');
    });

    it('should throw error if no development branch found', async () => {
      (client.branching_model.get as jest.Mock).mockResolvedValueOnce({
        data: {},
      });
      await expect(bitbucketClient.getDevelopmentBranch()).rejects.toThrowError(
        'No development branch found'
      );
    });

    it('should correctly get development branch', async () => {
      await bitbucketClient.getDevelopmentBranch();
      expect(client.branching_model.get).toBeCalledWith({
        repo_slug: 'test-repoSlug',
        workspace: 'test-workspace',
      });
    });
  });

  describe('createBranch', () => {
    it('should create new branch', async () => {
      await bitbucketClient.createBranch('test-branch', 'test-fromBranch');
      expect(client.refs.createBranch).toBeCalledWith({
        repo_slug: 'test-repoSlug',
        workspace: 'test-workspace',
        _body: {
          name: 'test-branch',
          target: {
            hash: 'test-fromBranch',
          },
        },
      });
    });
  });

  describe('createCommit', () => {
    it('should create new commit', async () => {
      const fileContent = 'test-content';
      const fileName = 'test-file';

      await bitbucketClient.createCommit('test-branch', 'test-commit', fileName, fileContent);

      const calledWith = (client.source.createFileCommit as jest.Mock).mock.calls[0][0];

      expect(calledWith.repo_slug).toBe('test-repoSlug');
      expect(calledWith.workspace).toBe('test-workspace');
      expect(calledWith.branch).toBe('test-branch');
      expect(calledWith.message).toBe('test-commit');
      expect(calledWith._body).toBeInstanceOf(FormData);
    });
  });

  describe('createPullRequest', () => {
    it('should create new pull request', async () => {
      const link = await bitbucketClient.createPullRequest(
        'test-fromBranch',
        'test-targetBranch',
        'test-title',
        'test-description'
      );

      const calledWith = (client.pullrequests.create as jest.Mock).mock.calls[0][0];

      expect(link).toBe('test-pull-request-url');
      expect(calledWith.repo_slug).toBe('test-repoSlug');
      expect(calledWith.workspace).toBe('test-workspace');
      expect(calledWith._body).toStrictEqual({
        type: 'pullrequest',
        close_source_branch: true,
        title: 'test-title',
        source: {
          branch: {
            name: 'test-fromBranch',
          },
        },
        destination: {
          branch: {
            name: 'test-targetBranch',
          },
        },
        description: 'test-description',
      });
    });
  });
});
