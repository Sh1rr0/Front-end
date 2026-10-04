const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { token, ...options } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError('API is not configured. Set VITE_API_BASE_URL to your deployed LavaLust API URL.')
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
    throw new ApiError(`Could not reach the API. Check the API URL and CORS configuration. ${error.message}`)
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
    const message = typeof payload === 'object' && payload
      ? payload.message || payload.error || `API request failed (${response.status}).`
      : typeof payload === 'string' && payload
        ? payload
        : `API request failed (${response.status}).`
    throw new ApiError(message, response.status)
  }

  return payload
}

function unwrap(payload) {
  return payload?.data ?? payload
}

export async function login(username, password) {
  const payload = unwrap(await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, email: username, password }),
  }))
  const token = payload?.token || payload?.access_token || payload?.accessToken
  if (!token) {
    throw new ApiError('The login response did not include a token. Expected token or access_token in the JSON response.')
  }
  return { token, user: payload.user || payload.account || null }
}

export async function getProducts(token) {
  const payload = unwrap(await request('/api/products', { token }))
  const products = Array.isArray(payload) ? payload : payload?.products
  if (!Array.isArray(products)) {
    throw new ApiError('The products endpoint returned an unexpected response. Expected a JSON array or a products array.')
  }
  return products.map((product) => ({
    ...product,
    id: product.id ?? product.product_id,
    name: product.name ?? product.title ?? '',
    category: product.category ?? product.category_name ?? '',
    price: product.price ?? 0,
    stock: product.stock ?? product.quantity ?? 0,
    description: product.description ?? '',
  }))
}

export async function createProduct(token, product) {
  const result = unwrap(await request('/api/products', {
    method: 'POST',
    token,
    body: JSON.stringify(product),
  }))
  return result?.product ?? result
}

export async function updateProduct(token, id, product) {
  const result = unwrap(await request(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(product),
  }))
  return result?.product ?? result
}

export async function deleteProduct(token, id) {
  await request(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE', token })
}

export async function logout(token) {
  await request('/api/logout', { method: 'POST', token })
}
