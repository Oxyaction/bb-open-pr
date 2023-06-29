import semver from 'semver';
import { BitbucketClient } from '../services/bitbucket';

import { EventEmitter } from 'node:events';
import { NPMManager } from '../services/npm-manager';
import { validateVersion } from '../utils';

export class SyncDependencyCommand {
  public readonly eventEmitter: EventEmitter;

  constructor(
    private readonly bitbucketClient: BitbucketClient,
    private readonly npmManager: NPMManager
  ) {
    this.eventEmitter = new EventEmitter();
  }

  async execute(
    dependencyName: string,
    dependencyVersion: string,
    forceDowngrade: boolean
  ): Promise<string | void> {
    if (!validateVersion(dependencyVersion)) {
      throw new Error(`Invalid version provided: '${dependencyVersion}'`);
    }

    this.eventEmitter.emit('progress', 'retrieveing package.json');
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
      this.eventEmitter.emit('progress', `Dependency ${dependencyName} is already up to date`);
      return;
    }

    const newPackageJSON = this.npmManager.updateDependencyVersion(
      currentDependencyVersion,
      dependencyVersion
    );
    const newBranch = `update-${dependencyName}-to-${dependencyVersion}`;
    const title = `Update ${dependencyName} to ${dependencyVersion}`;
    const description = `This is automatically-generated PR to update ${dependencyName} to ${dependencyVersion}`;

    this.eventEmitter.emit('progress', `creating branch ${newBranch}`);
    await this.bitbucketClient.createBranch(newBranch, devBranch);
    this.eventEmitter.emit('progress', `creating commit ${title}`);
    await this.bitbucketClient.createCommit(newBranch, title, 'package.json', newPackageJSON);

    this.eventEmitter.emit('progress', `creating pr '${title}'`);
    const prURL = await this.bitbucketClient.createPullRequest(
      newBranch,
      devBranch,
      title,
      description
    );
    return prURL;
  }
}
