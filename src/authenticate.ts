import inquirer, { QuestionCollection } from 'inquirer';

interface TokenAnswers {
  token: string;
}

interface UsernamePasswordAnswers {
  username: string;
  password: string;
}

interface AuthenticationTypeAnswers {
  authType: 'Token' | 'Username/Password';
}

export async function promptAuthenticationType(): Promise<AuthenticationTypeAnswers> {
  const questions: QuestionCollection<AuthenticationTypeAnswers> = [
    {
      type: 'list',
      name: 'authType',
      message: 'Choose authentication type:',
      choices: ['Token', 'Username/Password'],
    },
  ];

  return inquirer.prompt<AuthenticationTypeAnswers>(questions);
}

export async function promptToken(): Promise<TokenAnswers> {
  const questions: QuestionCollection<TokenAnswers> = [
    {
      type: 'input',
      name: 'token',
      message: 'Enter your token:',
    },
  ];

  return inquirer.prompt<TokenAnswers>(questions);
}

export async function promptUsernamePassword(): Promise<UsernamePasswordAnswers> {
  const questions: QuestionCollection<UsernamePasswordAnswers> = [
    {
      type: 'input',
      name: 'username',
      message: 'Enter your username:',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your password:',
    },
  ];

  return inquirer.prompt<UsernamePasswordAnswers>(questions);
}
