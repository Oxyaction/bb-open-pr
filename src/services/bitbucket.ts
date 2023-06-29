import { APIClient } from "bitbucket";

export class BitbucketClient {
  constructor(
    protected readonly client: APIClient,
    protected readonly workspace: string,
    protected readonly repoSlug: string
  ) {}

  async getPackageJSON(): Promise<string> {
    const devBranch = await this.getDevelopmentBranch();
    const lastCommit = await this.getLastBranchCommit(devBranch);
    const rawPackageJSON = await this.getFileContent(lastCommit, "package.json");
    return rawPackageJSON;
  }

  protected async getDevelopmentBranch(): Promise<string> {
    const { data } = await this.client.branching_model.get({
      repo_slug: this.repoSlug,
      workspace: this.workspace,
    });

    const devBranch = data.development?.name;
    if (!devBranch) {
      throw new Error("No development branch found");
    }

    return devBranch;
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
      throw new Error(`No file found at path ${path}`);
    }

    return fileContent as string;
  }

  public async createBranch(branchName: string, fromBranch: string): Promise<void> {
    const { data, headers } = await this.client.refs.createBranch({
      repo_slug: this.repoSlug,
      workspace: this.workspace,
      _body: {
        name: branchName,
        target: {
          hash: fromBranch,
        },
      },
    });

    console.log(data, headers);
  }
}
