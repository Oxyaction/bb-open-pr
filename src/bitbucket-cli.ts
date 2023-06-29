import Yargs from 'yargs/yargs';
import { Arguments } from 'yargs';
import { Bitbucket, APIClient } from 'bitbucket';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import { SyncDependencyCommand } from './commands/sync-dependency';
import { BitbucketClient } from './services/bitbucket';
import { NPMManager } from './services/npm-manager';
import * as authPrompts from './authenticate';
import { SyncDependencyArguments } from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
Yargs(process.argv.slice(2))
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

      console.log('\n');
      const spinner = createSpinner(`Verifying '${args.dependencyName}' version`).start();
      try {
        const bitbucketClient = new BitbucketClient(bitbucket, args.workspace, args.repositorySlug);
        const npmManager = new NPMManager();
        const syncDependencyCommand = new SyncDependencyCommand(bitbucketClient, npmManager);
        syncDependencyCommand.eventEmitter.on('progress', (stage: string) => {
          spinner.update({
            text: stage,
          });
        });

        const prURL = await syncDependencyCommand.execute(
          args.dependencyName,
          args.dependencyVersion,
          args.forceDowngrade
        );

        if (prURL) {
          spinner.success({
            text: `Created pull request to update '${args.dependencyName}' to version '${args.dependencyVersion}'`,
          });

          console.log('\n');
          console.log(chalk.blue(prURL));
          console.log('\n');
        } else {
          spinner.success({
            text: `Dependency '${args.dependencyName}' is already up to date`,
          });
        }
      } catch (error) {
        spinner.error({
          text: error.message,
        });
      }
    }
  )
  .help()
  .locale('en').argv;
