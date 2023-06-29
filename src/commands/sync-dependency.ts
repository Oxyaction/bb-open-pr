import semver from 'semver';
import { BitbucketClient }  from '../services/bitbucket';
import { NPMManager } from '../services/npm-manager';
import { Version } from '../types';

export class SyncDependencyCommand {
  constructor(
    private readonly bitbucketClient: BitbucketClient,
    private readonly npmManager: NPMManager
  ) {}

  async execute(dependencyName: string, dependencyVersion: string, forceDowngrade: boolean) {
    console.log(`syncing dependency ${dependencyName} to version ${dependencyVersion}`);
    
    if (!validateVersion(dependencyVersion)) {
      throw new Error(`Invalid version provided: ${dependencyVersion}`);
    }

    const currentDependencyVersion = await this.getDependencyVersion(dependencyName);

    if (semver.gt(currentDependencyVersion.version, dependencyVersion) && !forceDowngrade) {
      throw new Error(`Cannot downgrade dependency ${dependencyName} from ${currentDependencyVersion.version} to ${dependencyVersion}`);
    }

    if (currentDependencyVersion.version === dependencyVersion) {
      console.log(`Dependency ${dependencyName} is already up to date`);
      return;
    }

    // const newPackageJSON = this.npmManager.updateDependencyVersion(currentDependencyVersion, dependencyVersion);
  }

  protected async getDependencyVersion(dependencyName: string): Promise<Version> {
    const packageJSON = await this.bitbucketClient.getPackageJSON();
    this.npmManager.setRawJSON(packageJSON);
    const currentDependencyVersion = this.npmManager.getDependencyVersion(dependencyName);
    return currentDependencyVersion;
  }
}

function validateVersion(version: string): boolean {
  return semver.valid(version) !== null;
}