import semver from 'semver';
import { BitbucketClient } from '../services/bitbucket';
import { NPMManager } from '../services/npm-manager';
import { validateVersion } from '../utils';

export class SyncDependencyCommand {
  constructor(
    private readonly bitbucketClient: BitbucketClient,
    private readonly npmManager: NPMManager
  ) {}

  async execute(dependencyName: string, dependencyVersion: string, forceDowngrade: boolean) {
    console.log(`syncing dependency ${dependencyName} to version ${dependencyVersion}`);

    if (!validateVersion(dependencyVersion)) {
      throw new Error(`Invalid version provided: '${dependencyVersion}'`);
    }

    const devBranch = await this.bitbucketClient.getDevelopmentBranch();
    const packageJSON = await this.bitbucketClient.getLatestFileContent(devBranch, 'package.json');
    this.npmManager.setRawJSON(packageJSON);
    const currentDependencyVersion = this.npmManager.getDependencyVersion(dependencyName);

    if (semver.gt(currentDependencyVersion.version, dependencyVersion) && !forceDowngrade) {
      throw new Error(
        `Cannot downgrade dependency ${dependencyName} from ${currentDependencyVersion.version} to ${dependencyVersion}`
      );
    }

    if (currentDependencyVersion.version === dependencyVersion) {
      console.log(`Dependency ${dependencyName} is already up to date`);
      return;
    }

    const newPackageJSON = this.npmManager.updateDependencyVersion(
      currentDependencyVersion,
      dependencyVersion
    );
    const newBranch = `update-${dependencyName}-to-${dependencyVersion}`;
    const title = `Update ${dependencyName} to ${dependencyVersion}`;
    const description = `This is automatically-generated PR to update ${dependencyName} to ${dependencyVersion}`;

    console.log('creating branch', newBranch);
    await this.bitbucketClient.createBranch(newBranch, devBranch);
    console.log('creating commit', newBranch);
    await this.bitbucketClient.createCommit(newBranch, title, 'package.json', newPackageJSON);

    console.log('creating pr');
    await this.bitbucketClient.createPullRequest(newBranch, devBranch, title, description);
  }
}
