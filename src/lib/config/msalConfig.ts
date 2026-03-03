'use client';

import { PublicClientApplication, Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID || '',
    authority: process.env.NEXT_PUBLIC_MSAL_AUTHORITY || '',
    redirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI || '',
  },
};

let msalInstance: PublicClientApplication | null = null;

export function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

export const loginRequest = {
  scopes: ['User.Read', 'email', 'profile'],
};
