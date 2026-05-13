import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1'

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await AsyncStorage.getItem('accessToken')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: res.statusText }))) as { message: string }
    throw new ApiError(res.status, err.message)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
}

export { ApiError }
