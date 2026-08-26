import { Configuration, LogLevel, PublicClientApplication } from '@azure/msal-browser'

/**
 * 🔐 Cấu hình Microsoft Authentication Library (MSAL)
 * Dùng cho phương pháp Embed & Extract Power BI bằng Master User / Azure AD Account
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/thong-so` : 'http://localhost:3000/thong-so',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL Error]:', message)
            return
          case LogLevel.Warning:
            console.warn('[MSAL Warning]:', message)
            return
          case LogLevel.Info:
            return
          case LogLevel.Verbose:
            return
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
}

/**
 * 🔑 Scopes bắt buộc để gọi Power BI REST API và Power BI Embedded SDK
 */
export const powerBiScopes = {
  scopes: [
    'https://analysis.windows.net/powerbi/api/Report.Read.All',
    'https://analysis.windows.net/powerbi/api/Dataset.Read.All',
  ],
}

// Instance Singleton cho PublicClientApplication (Client-side)
let msalInstance: PublicClientApplication | null = null

export async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig)
    await msalInstance.initialize()
  }
  return msalInstance
}
