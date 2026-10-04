# Stockroom

A React inventory dashboard for a LavaLust API. It supports sign-in, product listing, search and category filtering, create/update/delete, stock alerts, and sign-out.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the base URL of your LavaLust API (for example, `https://your-api.onrender.com`).
3. Run `npm install` and `npm run dev`.

Vite embeds `VITE_*` variables in the client bundle at build time. Set the production value in the frontend host's build environment and rebuild after changing it. The deployed API must allow the frontend origin through CORS.

## API contract

The frontend sends JSON requests to:

| Method | Endpoint | Request / response |
| --- | --- | --- |
| `POST` | `/api/login` | `{ "email": "...", "password": "..." }`; response contains `token` or `access_token` and optionally `user` |
| `GET` | `/api/products` | JSON array or `{ "products": [...] }`; product fields include `id`, `name`, `category`, `price`, `stock`, and optional `description` |
| `POST` | `/api/products` | Product JSON; response contains the created product |
| `PUT` | `/api/products/{id}` | Updated product JSON |
| `DELETE` | `/api/products/{id}` | Successful response |
| `POST` | `/api/logout` | Successful response |

Authenticated requests use `Authorization: Bearer <token>`. Product IDs may be `id` or `product_id`; names may be `name` or `title`; stock may be `stock` or `quantity`. If your LavaLust routes or authentication response use a different contract, update the endpoint paths and payload normalization in `src/api.js` to match the backend.

## Render and Aiven

This directory contains the React frontend only; it does not contain a LavaLust API or database credentials. Deploy the separate API service to Render, configure its production environment with the Aiven MySQL host, port, database, username, password, and TLS settings supplied by Aiven, and verify the API's health and CORS settings. Do not put database credentials in this frontend.

Deploy this app as a Render Static Site with root directory `my-react-app`, build command `npm install && npm run build`, and publish directory `dist`. Set `VITE_API_BASE_URL` to the deployed API origin in the static site's build environment. Since Vite variables are compiled into static assets, trigger a new build after changing this value.
