import { APIClient } from 'bitbucket';
import FormData from 'form-data';

export class BitbucketClient {
  constructor(
    protected readonly client: APIClient,
    protected readonly workspace: string,
    protected readonly repoSlug: string
  ) {}

  /**
   * Returns latest file content from provided branch
   * @param branch
   * @param fileName
   * @returns
   */
  async getLatestFileContent(branch: string, fileName: string): Promise<string> {
    const lastCommit = await this.getLastBranchCommit(branch);
    const rawPackageJSON = await this.getFileContent(lastCommit, fileName);
    return rawPackageJSON;
  }

  /**
   * Get development branch name
   * @returns
   */
  async getDevelopmentBranch(): Promise<string> {
    const { data } = await this.client.branching_model.get({
      repo_slug: this.repoSlug,
      workspace: this.workspace,
    });

    const devBranch = data.development?.name;
    if (!devBranch) {
      throw new Error('No development branch found');
    }

    return devBranch;
  }

  /**
   * Create new branch from provided branch
   * @param branch
   * @param fromBranch
   */
  async createBranch(branch: string, fromBranch: string): Promise<void> {
    await this.client.refs.createBranch({
      repo_slug: this.repoSlug,
      workspace: this.workspace,
      _body: {
        name: branch,
        target: {
          hash: fromBranch,
        },
      },
    });
  }

  /**
   * Creates new commit for a single file in provided branch
   * @param branch
   * @param message
   * @param fileName
   * @param content
   */
  async createCommit(branch: string, message: string, fileName: string, content: string) {
    const contentBuffer = Buffer.from(content, 'utf8');

    const form = new FormData();
    form.append(fileName, contentBuffer);

    await this.client.source.createFileCommit({
      repo_slug: this.repoSlug,
      workspace: this.workspace,
      branch,
      message,
      _body: form,
    });
  }

  async createPullRequest(
    fromBranch: string,
    targetBranch: string,
    title: string,
    description: string
  ): Promise<string> {
    const { data } = await this.client.pullrequests.create({
      repo_slug: this.repoSlug,
      workspace: this.workspace,
      _body: {
        type: 'pullrequest',
        title: title,
        description,
        close_source_branch: true,
        source: {
          branch: {
            name: fromBranch,
          },
        },
        destination: {
          branch: {
            name: targetBranch,
          },
        },
      },
    });

    return data.links!.html!.href!;
  }

  protected async getLastBranchCommit(branch: string): Promise<string> {
    const { data } = await this.client.commits.list({
      repo_slug: this.repoSlug,
      workspace: this.workspace,
      include: branch,
    });

    const lastCommit = data.values?.[0];
    if (!lastCommit) {
      throw new Error(`No commits found for branch ${branch}`);
    }

    return lastCommit.hash!;
  }

  protected async getFileContent(commit: string, path: string): Promise<string> {
    const { data: fileContent } = await this.client.source.read({
      repo_slug: this.repoSlug,
      workspace: this.workspace,
      path,
      commit,
    });

    if (!fileContent) {
      throw new Error(`No file found at path '${path}'`);
    }

    return fileContent as string;
  }
}
