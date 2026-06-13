import {
  EventType,
  PublicClientApplication,
  type AccountInfo,
  type Configuration,
} from "@azure/msal-browser";

const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined;
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined;
const redirectUri =
  (import.meta.env.VITE_AZURE_REDIRECT_URI as string | undefined) ??
  (typeof window !== "undefined" ? window.location.origin : "");

/** True when the env vars are present and MSAL should be initialized. */
export const ssoEnabled = Boolean(tenantId && clientId);

const config: Configuration = {
  auth: {
    clientId: clientId ?? "00000000-0000-0000-0000-000000000000",
    authority: `https://login.microsoftonline.com/${tenantId ?? "common"}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(config);

/** Scopes requested for sign-in. ID token contains email/name. */
export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

/** Wire up the active-account handler the first time the module loads. */
export async function initializeMsal(): Promise<void> {
  // MSAL v3 requires initialize() before any auth call, even if we don't
  // actively use SSO (so the MsalProvider can mount safely).
  await msalInstance.initialize();
  if (!ssoEnabled) return;
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(accounts[0]);
  }
  msalInstance.addEventCallback((event) => {
    if (
      event.eventType === EventType.LOGIN_SUCCESS &&
      event.payload &&
      "account" in event.payload
    ) {
      msalInstance.setActiveAccount(event.payload.account as AccountInfo);
    }
  });
  // Complete any redirect-flow login that's still in the URL hash.
  await msalInstance.handleRedirectPromise();
}

/** Acquire an ID token silently (or via popup if interaction is required). */
export async function acquireIdToken(): Promise<string | null> {
  if (!ssoEnabled) return null;
  const account = msalInstance.getActiveAccount();
  if (!account) return null;
  try {
    const result = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return result.idToken ?? null;
  } catch {
    return null;
  }
}
