import semver from 'semver';

export function validateVersion(version: string): boolean {
  return semver.valid(version) !== null;
}
