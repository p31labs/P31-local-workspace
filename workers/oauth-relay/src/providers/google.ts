import type { Env, ProviderConfig } from '../types';

export const googleProvider: ProviderConfig = {
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userinfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
  scopes: ['openid', 'email', 'profile'],
  getClientId: (env: Env) => env.GOOGLE_CLIENT_ID,
  getClientSecret: (env: Env) => env.GOOGLE_CLIENT_SECRET,
};
