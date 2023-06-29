export type Version = {
  name: string;
  rawVersion: string;
  version: string;
  type: string;
};

export type SyncDependencyArguments = {
  workspace: string;
  repositorySlug: string;
  dependencyName: string;
  dependencyVersion: string;
  forceDowngrade: boolean;
};
