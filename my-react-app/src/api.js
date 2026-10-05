// LavaLust API client.
// Set VITE_API_BASE_URL (Vercel / .env) to your deployed API, e.g.
// VITE_API_BASE_URL=https://famadulan-adrian-lavalust.onrender.com
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

// The refresh token is kept only so logout can revoke it on the server.
const REFRESH_KEY = 'lavalust_refresh_token'

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { token, ...options } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError(
      'API is not configured. Set VITE_API_BASE_URL to your deployed LavaLust API URL.'
    )
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    console.error('API connection error:', error)
    throw new ApiError(
      `Could not reach the API. Check your API URL and CORS configuration. ${
        error.message || 'Failed to fetch'
      }`
    )
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    let message = `API request failed (${response.status}).`
    if (payload && typeof payload === 'object') {
      // Field-level validation errors are more useful than "Validation failed".
      const fieldErrors = payload.errors && typeof payload.errors === 'object'
        ? Object.values(payload.errors).flat().join(' ')
        : ''
      message = fieldErrors || payload.error || payload.message || message
    } else if (typeof payload === 'string' && payload) {
      message = payload
    }
    throw new ApiError(message, response.status)
  }

  return payload
}

// ---------- Login ----------

export async function login(username, password) {
  const payload = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  // LavaLust returns access_token and refresh_token directly.
  const tokens = payload?.tokens ?? payload?.data ?? payload
  const token = tokens?.access_token || tokens?.token || tokens?.accessToken

  if (!token) {
    console.error('Login response:', payload)
    throw new ApiError('Login worked but the API did not return an access token.')
  }

  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  }

  return { token, user: payload?.user ?? null }
}

// ---------- Products ----------

// Convert the API's columns into the names the screens use.
function fromApi(p) {
  return {
    ...p,
    id: p.id,
    name: p.product_name ?? '',
    category: p.category ?? '',
    description: p.description ?? '',
    price: p.price ?? 0,
    stock: p.quantity ?? 0,
  }
}

// Convert the form's values into the columns the API expects.
function toApi(p) {
  return {
    product_name: p.product_name ?? p.name ?? '',
    category: p.category ?? '',
    description: p.description ?? '',
    price: Number(p.price) || 0,
    quantity: Number(p.quantity ?? p.stock) || 0,
  }
}

export async function getProducts(token) {
  const payload = await request('/api/products', { method: 'GET', token })
  const list = Array.isArray(payload) ? payload : payload?.data ?? payload?.products

  if (!Array.isArray(list)) {
    console.error('Products response:', payload)
    throw new ApiError('The products endpoint returned an unexpected response.')
  }
  return list.map(fromApi)
}

export async function createProduct(token, product) {
  const result = await request('/api/products', {
    method: 'POST',
    token,
    body: JSON.stringify(toApi(product)),
  })
  return fromApi(result?.data ?? result)
}

export async function updateProduct(token, id, product) {
  const result = await request(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(toApi(product)),
  })
  return fromApi(result?.data ?? result)
}

export async function deleteProduct(token, id) {
  await request(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}

// ---------- Logout ----------

export async function logout() {
  const refresh = localStorage.getItem(REFRESH_KEY)
  localStorage.removeItem(REFRESH_KEY)
  try {
    if (refresh) {
      await request('/api/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refresh }),
      })
    }
  } catch (error) {
    // Signing out locally is enough if the server call fails.
    console.warn('Logout request failed:', error)
  }
}

// ---------- Connection test ----------

export async function testApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    // 401 is expected without a token and still means the API is reachable.
    return { success: response.ok || response.status === 401, status: response.status }
  } catch (error) {
    return { success: false, status: null, error: error.message }
  }
}