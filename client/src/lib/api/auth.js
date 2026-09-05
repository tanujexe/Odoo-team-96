import { apiClient } from './client';

/**
 * Authenticate user with email and password
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginApi({ email, password }) {
  const response = await apiClient('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return response.data;
}

/**
 * Fetch current authenticated user session
 * @returns {Promise<{ user: object }>}
 */
export async function fetchMeApi() {
  const response = await apiClient('/auth/me');
  return response.data;
}
