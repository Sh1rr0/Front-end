// Get the LavaLust API URL from Vercel environment variables.
// Example:
// VITE_API_BASE_URL=https://your-lavalust-api.onrender.com
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')


// ================================
// API ERROR
// ================================

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}


// ================================
// MAIN REQUEST FUNCTION
// ================================

async function request(path, { token, ...options } = {}) {

  // Make sure the API URL exists
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

        // Only add Content-Type when sending a body
        ...(options.body
          ? {
              'Content-Type': 'application/json',
            }
          : {}),

        // Add JWT token when available
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        // Allow custom headers
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


  // Read response
  const text = await response.text()

  let payload = null

  if (text) {

    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }


  // Handle HTTP errors
  if (!response.ok) {

    const message =
      typeof payload === 'object' && payload
        ? payload.message ||
          payload.error ||
          `API request failed (${response.status}).`

        : typeof payload === 'string' && payload
        ? payload

        : `API request failed (${response.status}).`

    throw new ApiError(message, response.status)
  }


  return payload
}


// ================================
// RESPONSE HELPER
// ================================

function unwrap(payload) {
  return payload?.data ?? payload
}


// ================================
// LOGIN
// ================================

export async function login(username, password) {

  const payload = unwrap(
    await request('/api/login', {
      method: 'POST',

      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })
  )


  // Support different token names
  const token =
    payload?.token ||
    payload?.access_token ||
    payload?.accessToken


  if (!token) {

    console.error('Login response:', payload)

    throw new ApiError(
      'Login was successful but the API did not return a token. Expected token, access_token, or accessToken.'
    )
  }


  return {
    token: token,

    user:
      payload?.user ||
      payload?.account ||
      null,
  }
}


// ================================
// GET PRODUCTS
// ================================

export async function getProducts(token) {

  const payload = unwrap(
    await request('/api/products', {
      method: 'GET',
      token: token,
    })
  )


  const products = Array.isArray(payload)
    ? payload
    : payload?.products


  if (!Array.isArray(products)) {

    console.error('Products response:', payload)

    throw new ApiError(
      'The products endpoint returned an unexpected response. Expected a JSON array or a products array.'
    )
  }


  return products.map((product) => ({

    ...product,

    // ID
    id:
      product.id ??
      product.product_id ??
      product.Product_ID ??
      product.ProductID,

    // Name
    name:
      product.name ??
      product.product_name ??
      product.title ??
      '',

    // Category
    category:
      product.category ??
      product.category_name ??
      '',

    // Price
    price:
      product.price ??
      0,

    // Stock
    stock:
      product.stock ??
      product.quantity ??
      0,

    // Description
    description:
      product.description ??
      '',
  }))
}


// ================================
// CREATE PRODUCT
// ================================

export async function createProduct(token, product) {

  const result = unwrap(
    await request('/products', {

      method: 'POST',

      token: token,

      body: JSON.stringify({
        ...product,
      }),
    })
  )


  return result?.product ?? result
}


// ================================
// UPDATE PRODUCT
// ================================

export async function updateProduct(token, id, product) {

  const result = unwrap(
    await request(
      `/products/${encodeURIComponent(id)}`,
      {

        method: 'PUT',

        token: token,

        body: JSON.stringify({
          ...product,
        }),
      }
    )
  )


  return result?.product ?? result
}


// ================================
// DELETE PRODUCT
// ================================

export async function deleteProduct(token, id) {

  await request(
    `/products/${encodeURIComponent(id)}`,
    {

      method: 'DELETE',

      token: token,
    }
  )

}


// ================================
// LOGOUT
// ================================

export async function logout(token) {

  await request('/logout', {

    method: 'POST',

    token: token,
  })

}


// ================================
// TEST API CONNECTION
// ================================

export async function testApi() {

  try {

    const response = await fetch(
      `${API_BASE_URL}/products`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    )


    return {
      success: response.ok,
      status: response.status,
    }

  } catch (error) {

    return {
      success: false,
      status: null,
      error: error.message,
    }
  }
}