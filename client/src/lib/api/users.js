import { apiClient } from './client';

export async function fetchUsersApi() {
  const response = await apiClient('/users');
  return response.data;
}

export async function createUserApi(data) {
  const response = await apiClient('/users', {
    method: 'POST',
    body: data,
  });
  return response.data;
}

export async function updateUserApi(userId, data) {
  const response = await apiClient(`/users/${userId}`, {
    method: 'PATCH',
    body: data,
  });
  return response.data;
}

export async function updateUserRoleApi(userId, role) {
  return updateUserApi(userId, { role });
}

export async function deleteUserApi(userId) {
  const response = await apiClient(`/users/${userId}`, {
    method: 'DELETE',
  });
  return response.data;
}
