import Yargs from "yargs/yargs";
import { Arguments } from 'yargs';
import { syncDependency } from './commands/sync-dependency';

type SyncDependencyArguments = {
  repository: string;
  dependencyName: string;
  dependencyVersion: string;
}

Yargs(process.argv.slice(2))
  .scriptName("bitbucket-cli.js")
  .command(
    "sync-dependency",
    "Opens pull request to update provided dependency version if needed",
    {
      repository: {
        description: "Target Bitbucket repository name",
        demandOption: true,
      },
      dependencyName: {
        description: "Dependency name to update",
        demandOption: true,
      },
      dependencyVersion: {
        description: "Dependency version to update",
        demandOption: true,
      },
    },
    async (args: Arguments<SyncDependencyArguments>) => {
      await syncDependency(args.repository, args.dependencyName, args.dependencyVersion);
    }
  )
  .help()
  .locale("en").argv;
