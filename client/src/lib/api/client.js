/**
 * Standard API Client with envelope handling and mock fallbacks
 * Adheres to { data, meta } on success and { error } on failure
 */

const API_BASE = '/api';

export async function apiClient(endpoint, { body, method = 'GET', headers = {}, ...customConfig } = {}) {
  const token = localStorage.getItem('peoplepay_token');

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...customConfig,
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        // Clear token on unauthorized if not on login endpoint
        if (!endpoint.includes('/login')) {
          localStorage.removeItem('peoplepay_token');
          localStorage.removeItem('peoplepay_session');
          window.dispatchEvent(new CustomEvent('peoplepay:unauthorized'));
        }
      }

      const error = data?.error || {
        message: response.statusText || 'An error occurred during network request',
        code: `HTTP_${response.status}`,
      };
      return Promise.reject(error);
    }

    return data;
  } catch (err) {
    // If backend isn't up yet during offline development, pass error forward
    console.warn(`[API Client] Error for ${endpoint}:`, err);
    throw err;
  }
}
