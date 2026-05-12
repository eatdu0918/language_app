const BASE_URL = '/api/v1'

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    return null
  }

  const data = (await res.json()) as { accessToken: string; refreshToken: string }
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return data.accessToken
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (isRefreshing) {
      const newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve)
      })
      if (!newToken) throw new ApiError(401, 'Unauthorized')
      return request<T>(path, init)
    }

    isRefreshing = true
    const newToken = await tryRefresh()
    isRefreshing = false
    refreshQueue.forEach((resolve) => resolve(newToken))
    refreshQueue = []

    if (!newToken) throw new ApiError(401, 'Unauthorized')
    return request<T>(path, init)
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: res.statusText }))) as { message: string }
    throw new ApiError(res.status, err.message)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : null }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : null }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export { ApiError }
