import Yargs from 'yargs/yargs';
import { Arguments } from 'yargs';
import { Bitbucket, APIClient } from 'bitbucket';
import { SyncDependencyCommand } from './commands/sync-dependency';
import { BitbucketClient } from './services/bitbucket';
import { NPMManager } from './services/npm-manager';
import * as authPrompts from './authenticate';
import { SyncDependencyArguments } from './types';

const result = Yargs(process.argv.slice(2))
  .scriptName('bitbucket-cli.js')
  .command(
    'sync-dependency',
    'Opens pull request to update provided dependency version if needed',
    {
      workspace: {
        description: 'Target Bitbucket workspace name',
        demandOption: true,
      },
      repositorySlug: {
        description: 'Target Bitbucket repository name',
        demandOption: true,
      },
      dependencyName: {
        description: 'Dependency name to update',
        demandOption: true,
      },
      dependencyVersion: {
        description: 'Dependency version to update',
        demandOption: true,
      },
      forceDowngrade: {
        description: 'Force downgrade dependency version if needed',
        type: 'boolean',
        default: false,
      },
    },
    async (args: Arguments<SyncDependencyArguments>) => {
      try {
        // TODO: Auth logic could be extracted to Yargs middleware
        const { authType } = await authPrompts.promptAuthenticationType();
        let bitbucket: APIClient;

        if (authType === 'Token') {
          const { token } = await authPrompts.promptToken();
          bitbucket = new Bitbucket({
            auth: {
              token,
            },
          });
        } else if (authType === 'Username/Password') {
          const { username, password } = await authPrompts.promptUsernamePassword();
          bitbucket = new Bitbucket({
            auth: {
              username,
              password,
            },
          });
        } else {
          throw new Error('Invalid authentication type');
        }

        const bitbucketClient = new BitbucketClient(bitbucket, args.workspace, args.repositorySlug);
        const npmManager = new NPMManager();
        const syncDependencyCommand = new SyncDependencyCommand(bitbucketClient, npmManager);

        await syncDependencyCommand.execute(
          args.dependencyName,
          args.dependencyVersion,
          args.forceDowngrade
        );
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }
  )
  .help()
  .locale('en').argv;

console.log(result);
