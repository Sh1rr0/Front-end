import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createProduct,
  deleteProduct,
  getProducts,
  login,
  logout,
  updateProduct,
} from './api'
import './App.css'

const emptyProduct = { name: '', category: '', price: '', stock: '', description: '' }

const iconPaths = {
  grid: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  box: 'm12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9',
  plus: 'M12 5v14M5 12h14',
  search: 'm20 20-4.2-4.2M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  chevron: 'm9 18 6-6-6-6',
  down: 'm7 10 5 5 5-5',
  edit: 'm12 20 8-8-4-4-8 8-1 5 5-1ZM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3',
  close: 'm18 6-12 12M6 6l12 12',
  logout: 'M10 17l5-5-5-5M15 12H3m9-8h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7',
  package: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5M12 22V12',
  arrow: 'M7 17 17 7M7 7h10v10',
  check: 'm5 12 4 4L19 6',
}

function Icon({ name, size = 18, strokeWidth = 1.7 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name]} />
    </svg>
  )
}

function initials(name = 'Inventory Admin') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function LoginScreen({ onLogin, error, notice }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await onLogin(username, password)
    } catch {
      // The API error is rendered by the parent.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-card">
          <h2>Login</h2>
          {notice && <div className="notice-box">{notice}</div>}
          {error && <div className="error-box" role="alert">{error}</div>}
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="username">User</label>
            <input id="username" type="text" autoComplete="username" placeholder="Enter user" value={username} onChange={(event) => setUsername(event.target.value)} required />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" placeholder="Enter password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button className="button button-dark login-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Login'}</button>
          </form>
        </div>
      </section>
    </main>
  )
}

function ProductDialog({ product, onClose, onSave }) {
  const [values, setValues] = useState(product || emptyProduct)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({
        ...values,
        price: Number(values.price),
        stock: Number(values.stock),
      })
      onClose()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div><span className="eyebrow">{product ? 'PRODUCT DETAILS' : 'NEW INVENTORY'}</span><h2 id="modal-title">{product ? 'Edit product' : 'Add a product'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
        </div>
        {error && <div className="error-box" role="alert">{error}</div>}
        <form className="product-form" onSubmit={handleSubmit}>
          <label className="field-full" htmlFor="product-name">Product name<input id="product-name" name="name" value={values.name || ''} onChange={setField} placeholder="e.g. Everyday ceramic mug" required /></label>
          <label htmlFor="product-category">Category<input id="product-category" name="category" value={values.category || ''} onChange={setField} placeholder="e.g. Home & living" /></label>
          <label htmlFor="product-price">Price<input id="product-price" name="price" type="number" min="0" step="0.01" value={values.price ?? ''} onChange={setField} placeholder="0.00" required /></label>
          <label htmlFor="product-stock">Stock on hand<input id="product-stock" name="stock" type="number" min="0" step="1" value={values.stock ?? ''} onChange={setField} placeholder="0" required /></label>
          <label className="field-full" htmlFor="product-description">Description <span className="optional-label">Optional</span><textarea id="product-description" name="description" value={values.description || ''} onChange={setField} placeholder="A few details about this product…" rows="3" /></label>
          <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}<Icon name="arrow" size={16} /></button></div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('stockroom_token') || '')
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('stockroom_user') || 'null')
    } catch {
      return null
    }
  })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All products')
  const [dialogProduct, setDialogProduct] = useState(null)
  const [showDialog, setShowDialog] = useState(false)

  const loadProducts = useCallback(async (authToken) => {
    setLoading(true)
    setError('')
    try {
      setProducts(await getProducts(authToken))
    } catch (loadError) {
      setError(loadError.message)
      if (loadError.status === 401) {
        localStorage.removeItem('stockroom_token')
        localStorage.removeItem('stockroom_user')
        setToken('')
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return undefined
    const timer = window.setTimeout(() => loadProducts(token), 0)
    return () => window.clearTimeout(timer)
  }, [token, loadProducts])

  async function handleLogin(email, password) {
    setError('')
    setNotice('')
    try {
      const result = await login(email, password)
      localStorage.setItem('stockroom_token', result.token)
      if (result.user) localStorage.setItem('stockroom_user', JSON.stringify(result.user))
      setUser(result.user || null)
      setToken(result.token)
    } catch (loginError) {
      setError(loginError.message)
      throw loginError
    }
  }

  async function handleLogout() {
    try {
      await logout(token)
      setNotice('')
    } catch (logoutError) {
      setNotice(`Your session was cleared, but the API logout request failed: ${logoutError.message}`)
    } finally {
      localStorage.removeItem('stockroom_token')
      localStorage.removeItem('stockroom_user')
      setToken('')
      setUser(null)
      setProducts([])
      setError('')
    }
  }

  async function saveProduct(values) {
    if (dialogProduct) {
      const updated = await updateProduct(token, dialogProduct.id, values)
      setProducts((current) => current.map((product) => product.id === dialogProduct.id ? { ...product, ...updated, ...values } : product))
      return
    }
    const created = await createProduct(token, values)
    setProducts((current) => [created, ...current])
  }

  async function removeProduct(product) {
    if (!window.confirm(`Delete “${product.name}”? This can't be undone.`)) return
    try {
      await deleteProduct(token, product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setNotice(`${product.name} was deleted.`)
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const categories = useMemo(() => ['All products', ...new Set(products.map((product) => product.category).filter(Boolean))], [products])
  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'All products' || product.category === category
    const matchesQuery = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  }), [products, category, query])
  const lowStock = products.filter((product) => Number(product.stock) <= 5).length
  const inventoryValue = products.reduce((total, product) => total + Number(product.price || 0) * Number(product.stock || 0), 0)

  if (!token) return <LoginScreen onLogin={handleLogin} error={error} notice={notice} />

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-title">Inventory</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <a className="nav-link nav-active" href="#products">Overview</a>
          <a className="nav-link" href="#products">Products <span className="nav-count">{products.length}</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">{initials(user?.name || user?.username || user?.email)}</div>
            <div className="sidebar-user-info">
              <strong>{user?.name || user?.username || 'Your account'}</strong>
              <span>{user?.email || 'Workspace admin'}</span>
            </div>
          </div>
          <button className="text-button" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>Overview</strong></div>
          <div className="topbar-actions">
            <button className="text-button" onClick={handleLogout}>Log out</button>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="date-line">Product management</div>
              <h1>Inventory overview</h1>
              <p>A simple view of products, stock, and value.</p>
            </div>
            <button className="button button-dark add-button" onClick={() => { setDialogProduct(null); setShowDialog(true) }}>Add product</button>
          </div>
          {error && <div className="error-box page-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><Icon name="close" size={16} /></button></div>}
          {notice && <div className="notice-box page-notice">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><Icon name="close" size={16} /></button></div>}
          <section className="stats-grid" aria-label="Inventory summary">
            <article className="stat-card"><div className="stat-top"><span>Products</span></div><div className="stat-value">{loading ? '-' : products.length}</div><div className="stat-foot"><span className="stat-caption">In your catalog</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Inventory value</span></div><div className="stat-value">{loading ? '-' : formatCurrency(inventoryValue)}</div><div className="stat-foot"><span className="stat-caption">Across all items</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Low stock</span></div><div className="stat-value">{loading ? '-' : lowStock}</div><div className="stat-foot"><span className="stat-caption">5 units or fewer</span></div></article>
          </section>
          <section className="products-panel" id="products">
            <div className="products-heading">
              <div>
                <div className="section-title-line"><h2>Your products</h2><span className="product-total">{filteredProducts.length}</span></div>
                <p>Current inventory list</p>
              </div>
              <button className="button button-outline" onClick={() => loadProducts(token)} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
            </div>
            <div className="table-toolbar">
              <div className="search-box"><input aria-label="Search products" placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
              <div className="filter-wrap">
                <label className="select-wrap"><span>Category</span><select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              </div>
            </div>
            <div className="product-table-wrap">
              <table className="product-table">
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>In stock</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {loading && products.length === 0 ? <tr><td className="table-message" colSpan="6"><span className="loading-spinner" />Loading products...</td></tr> : filteredProducts.length === 0 ? <tr><td className="table-message empty-message" colSpan="6"><strong>{products.length ? 'No matching products' : 'Your inventory starts here.'}</strong><span>{products.length ? 'Try another search or category.' : 'Add your first product to see it here.'}</span>{products.length === 0 && <button className="button button-outline" onClick={() => { setDialogProduct(null); setShowDialog(true) }}>Add your first product</button>}</td></tr> : filteredProducts.map((product, index) => {
                    const stock = Number(product.stock) || 0
                    const status = stock === 0 ? 'Out of stock' : stock <= 5 ? 'Low stock' : 'In stock'
                    return <tr key={product.id ?? `${product.name}-${index}`}>
                      <td><div className="product-name-cell"><span className={`product-swatch ${status === 'Out of stock' ? 'swatch-danger' : stock <= 5 ? 'swatch-warning' : 'swatch-success'}`} /><div className="product-copy"><strong>{product.name}</strong><span>{product.description || 'No description yet'}</span></div></div></td>
                      <td>{product.category || 'Uncategorized'}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{stock}</td>
                      <td><span className={`status-pill ${status === 'Out of stock' ? 'status-danger' : stock <= 5 ? 'status-warning' : 'status-success'}`}>{status}</span></td>
                      <td className="actions-cell"><button className="table-action" onClick={() => { setDialogProduct(product); setShowDialog(true) }} aria-label={`Edit ${product.name}`}>Edit</button><button className="table-action danger" onClick={() => removeProduct(product)} aria-label={`Delete ${product.name}`}>Delete</button></td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span><strong>{filteredProducts.length}</strong> matching products</span><span>Synced</span></div>
          </section>
          <div className="page-footer"><span>Inventory</span><span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
        </div>
      </section>

      {showDialog && <ProductDialog product={dialogProduct} onClose={() => setShowDialog(false)} onSave={async (payload) => { await saveProduct(payload); setShowDialog(false) }} />}
    </main>
  )
}

export default App
