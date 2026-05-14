import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error("Google Client ID not set.");
}

GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export const handleEmailAuth = async (data: any, isRegister: boolean) => {
  const endpoint = isRegister ? '/user/register' : '/auth/local/login';

  const payload = isRegister 
    ? { 
        email: data.email,
        username: data.username,
        password: data.password
      }
    : {
        identity: data.email,
        password: data.password
      };

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), // Send the correctly keyed object
    });

    const contentType = response.headers.get("content-type");

    if (response.ok) {
      return { success: true };
    } else if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Auth failed' };
    } else {
      // Handles cases where the server returns a raw string or HTML error
      const errorText = await response.text();
      console.error("Server raw error:", errorText);
      return { success: false, error: `Error ${response.status}: Technical difficulties.` };
    }
  } catch (err) {
    console.error("Email Auth Network Error:", err);
    return { success: false, error: "Network error. Please try again." };
  }
};

const sendCodeToBackend = async (code: string, provider: 'Google' | 'GitHub') => {
  const endpoint = provider === 'Google'
    ? `${BACKEND_URL}/auth/oauth/google/login`
    : `${BACKEND_URL}/auth/oauth/github/login`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      return { success: true };
    } else {
      const errorData = await res.json();
      return { success: false, error: errorData.message || `${provider} auth failed` };
    }
  } catch (err) {
    return { success: false, error: "Network error during social login." };
  }
};

export const handleNativeSocialAuth = async (provider: 'Google' | 'GitHub') => {
  if (provider === 'Google') {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        const authCode = response.data.serverAuthCode;
        if (authCode) {
          return await sendCodeToBackend(authCode, 'Google');
        }
      }
      return { success: false, error: 'Google sign in was cancelled or failed.' };
    } catch (error) {
      console.error('Google Auth Error:', error);
      return { success: false, error: 'Failed to connect to Google.' };
    }
  } else {
    if (!GITHUB_CLIENT_ID) {
      console.error('Github Client ID not set.');
      return { success: false, error: 'Failed to connect to GitHub.' };
    }

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'nativeat', path: 'oauth-callback' });
    const options = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state: 'github_login',
    });
    const targetUrl = `https://github.com/login/oauth/authorize?${options.toString()}`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(targetUrl, redirectUri);
      if (result.type === 'success' && result.url) {
        const code = new URL(result.url).searchParams.get('code');
        if (code) {
           return await sendCodeToBackend(code, 'GitHub');
        }
      }
      return { success: false, error: 'GitHub sign in was cancelled.' };
    } catch (error) {
      console.error('GitHub Auth Error:', error);
      return { success: false, error: 'Failed to connect to GitHub.' };
    }
  }
};