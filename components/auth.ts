import { LoginFormData, RegisterFormData } from '@/types/auth';
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

const handleApiResponse = async (response: Response) => {
  if (response.ok) {
    return { success: true };
  }

  let backendMessage = '';
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    try {
      const errorData = await response.json();
      backendMessage = errorData.message || errorData.error || '';
    } catch (e) {
      console.error("Failed to parse error JSON", e);
    }
  }

  let errorMessage = 'An unexpected error occurred. Please try again.';

  switch (response.status) {
    case 400: // Bad Request
      errorMessage = backendMessage || 'Invalid input. Please check your email, username, and password format.';
      break;
    case 401: // Unauthorized
      errorMessage = backendMessage || 'Invalid email/username or password. If you just registered, please verify your email first.';
      break;
    case 409: // Conflict
      errorMessage = backendMessage || 'This email or username is already in use.';
      break;
    case 500: // Server Error
      errorMessage = 'Server error. Please try again later.';
      break;
    default:
      if (backendMessage) {
        errorMessage = backendMessage;
      } else {
        const errorText = await response.text();
        console.error(`Server raw error (${response.status}):`, errorText);
        errorMessage = `Technical difficulties (Error ${response.status}).`;
      }
  }

  return { success: false, error: errorMessage };
};

export const registerUser = async (data: RegisterFormData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        username: data.username,
        password: data.password
      }),
    });
    return await handleApiResponse(response);
  } catch (err) {
    console.error("Registration Network Error:", err);
    return { success: false, error: "Network error. Please check your connection and try again." };
  }
};

export const loginUser = async (data: LoginFormData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/local/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: data.email, 
        password: data.password
      }),
    });
    return await handleApiResponse(response);
  } catch (err) {
    console.error("Login Network Error:", err);
    return { success: false, error: "Network error. Please check your connection and try again." };
  }
};

export const verifyAccount = async (code: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/user/verify-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return await handleApiResponse(response);
  } catch (err) {
    console.error("Verification Network Error:", err);
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
    // Reusing our upgraded handler here for consistency!
    return await handleApiResponse(res);
  } catch (err) {
    console.error(`Social login network error (${provider}):`, err);
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