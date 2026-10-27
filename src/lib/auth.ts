import { API_BASE_URL } from './api';

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const notifyAuthChange = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event('auth:updated'));
};

const safeJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: `Server error (${res.status})` };
  }
};

export const getAuthToken = () => {
  if (!isBrowser()) return null;
  return localStorage.getItem('authToken');
};

export const fetchMe = async () => {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await safeJson(res);
  if (json.success) {
    localStorage.setItem('user', JSON.stringify(json.user));
    notifyAuthChange();
    return json.user;
  } else {
    logout();
  }
  return null;
};

export const loginWithEmail = async (email: string, password?: string) => {
  if (!password) throw new Error('Password is required');
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await safeJson(res);
  if (!json.success) {
    throw new Error(json.error || 'Login failed.');
  }
  
  if (isBrowser()) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('authToken', json.token);
    localStorage.setItem('user', JSON.stringify(json.user));
    notifyAuthChange();
  }
  return json.user;
};

export const signupWithEmail = async (name: string, email: string, password?: string, confirmPassword?: string) => {
  if (!password || password !== confirmPassword) throw new Error('Passwords do not match');
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirmPassword, name }),
  });
  const json = await safeJson(res);
  if (!json.success) throw new Error(json.error || 'Signup failed');
  return true;
};

export const logout = async () => {
  if (!isBrowser()) return;
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  notifyAuthChange();
  try {
    sessionStorage.clear();
  } catch (e) {}
};

export const getCurrentUser = (): any => {
  if (!isBrowser()) return null;
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }
  return null;
};

export const getStoredUser = getCurrentUser;

export const checkIsAuthenticated = (): boolean => {
  if (!isBrowser()) return false;
  return localStorage.getItem('isLoggedIn') === 'true' && !!getAuthToken();
};

export const refreshCredits = async () => {
  return await fetchMe();
};

export const getPlanType = (): string => {
  const user = getCurrentUser();
  return user?.plan || 'Free';
};

export const isPremiumUser = (): boolean => {
  const plan = getPlanType();
  return plan === 'Pro' || plan === 'Enterprise';
};

export const clearBuildHistory = () => {
  if (!isBrowser()) return;
  localStorage.removeItem('buildHistory');
};

export const upgradeToPremium = async (plan: string = 'Pro'): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`${API_BASE_URL}/api/auth/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan }),
  });
  const json = await safeJson(res);
  if (!json.success) throw new Error(json.error || 'Upgrade failed');
  await fetchMe();
  return json;
};

export const changePassword = async () => ({ success: false, error: 'Not implemented' });
export const requestPasswordReset = async () => ({ success: false, error: 'Not implemented' });
export const verifyPasswordResetOTP = async () => ({ success: false, error: 'Not implemented' });
export const verifySignupOTP = async () => ({ success: false, error: 'Not implemented' });
export const verifyOTP = async () => ({ success: false, error: 'Not implemented' });
export const loginWithGoogle = async () => null;
