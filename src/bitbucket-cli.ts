import Yargs from "yargs/yargs";
import { Arguments } from 'yargs';
import { Bitbucket } from "bitbucket";
import { SyncDependencyCommand } from './commands/sync-dependency';
import { BitbucketClient } from './services/bitbucket';
import { NPMManager } from './services/npm-manager';

type SyncDependencyArguments = {
  workspace: string;
  repositorySlug: string;
  dependencyName: string;
  dependencyVersion: string;
  forceDowngrade: boolean;
}

Yargs(process.argv.slice(2))
  .scriptName("bitbucket-cli.js")
  .command(
    "sync-dependency",
    "Opens pull request to update provided dependency version if needed",
    {
      workspace: {
        description: "Target Bitbucket workspace name",
        demandOption: true,
      },
      repositorySlug: {
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
      forceDowngrade: {
        description: "Force downgrade dependency version if needed",
        type: "boolean",
        default: false,
      }
    },
    async (args: Arguments<SyncDependencyArguments>) => {
      const bitbucket = new Bitbucket();
      const bitbucketClient = new BitbucketClient(bitbucket, args.workspace, args.repositorySlug);
      const npmManager = new NPMManager();
      const syncDependencyCommand = new SyncDependencyCommand(bitbucketClient, npmManager);

      await syncDependencyCommand.execute(args.dependencyName, args.dependencyVersion, args.forceDowngrade);
    }
  )
  .help()
  .locale("en").argv;
