import { JSONSchemaForNPMPackageJsonFiles } from "@schemastore/package";
import semver from "semver";
import { Version } from '../types';

export class NPMManager {
  private npmConfig: JSONSchemaForNPMPackageJsonFiles;

  setRawJSON(rawJSON: string) {
    this.npmConfig = JSON.parse(rawJSON);
  }

  getDependencyVersion(dependency: string): Version {
    const availableDependencies = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ];

    for (const dep of availableDependencies) {
      const rawVersion = this.npmConfig[dep]?.[dependency];
      if (rawVersion) {
        return {
          dependency,
          rawVersion: rawVersion as string,
          version: semver.coerce(rawVersion).version,
          type: dep,
        };
      }
    }

    throw new Error(`Dependency ${dependency} not found`);
  }

  updateDependencyVersion(version: Version, newVersion: string): string {
    const newPackageJSON = this.npmConfig;
    newPackageJSON[version.type][version.dependency] = newVersion;
    return JSON.stringify(newPackageJSON);
  }
}
