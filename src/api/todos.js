const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim()
const baseUrl = configuredBaseUrl || '/api'

async function request(path = '', options = {}) {
  const response = await fetch(`${baseUrl}/todos${path}`, {
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`

    try {
      const body = await response.json()
      message = body.message || body.error || message
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }

    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export const todoApi = {
  list: () => request(),
  create: (todo) => request('', { method: 'POST', body: JSON.stringify(todo) }),
  update: (id, todo) => request(`/${id}`, { method: 'PUT', body: JSON.stringify(todo) }),
  remove: (id) => request(`/${id}`, { method: 'DELETE' }),
}
