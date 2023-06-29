# Bitbucket-cli utils

Provides a cli to operate bitbucket.

### See all commands

```
pnpm ts-node src/bitbucket-cli.ts --help
```

## Commands:
### sync-dependency
Command used to open a Bitbucket pull request to update a dependency (if needed). Run `--help` to see all command options.

```
pnpm ts-node src/bitbucket-cli.ts sync-dependency --help
```
General usage:
```
pnpm ts-node src/bitbucket-cli.ts sync-dependency --workspace=akompaniets --repositorySlug=pr-opener-test --dependencyName=lodash --dependencyVersion=1.2.3
```