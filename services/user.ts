const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  roles: string[];
};

export const getUserProfile = async (): Promise<UserProfile> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  const response = await fetch(`${BACKEND_URL}/user`);
  if (!response.ok) throw new Error(`Failed to fetch user profile (${response.status})`);
  return (await response.json()) as UserProfile;
};

export const changeUserEmail = async (newEmail: string): Promise<void> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  const response = await fetch(`${BACKEND_URL}/user/change-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_email: newEmail }),
  });
  if (!response.ok) throw new Error(`Failed to initiate email change (${response.status})`);
};

export const changeUsername = async (newUsername: string): Promise<void> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  const response = await fetch(`${BACKEND_URL}/user/update-data`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_username: newUsername }),
  });
  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch { /* ignore */ }
    throw new Error(`Failed to update username (${response.status}): ${detail}`);
  }
};

export const deleteUserAccount = async (): Promise<void> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  const response = await fetch(`${BACKEND_URL}/user`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete account (${response.status})`);
};
