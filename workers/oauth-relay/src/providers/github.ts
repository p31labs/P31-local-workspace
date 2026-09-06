import type { Env, ProviderConfig } from '../types';

export const githubProvider: ProviderConfig = {
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userinfoUrl: 'https://api.github.com/user',
  scopes: ['read:user', 'user:email'],
  getClientId: (env: Env) => env.GITHUB_CLIENT_ID,
  getClientSecret: (env: Env) => env.GITHUB_CLIENT_SECRET,
};
