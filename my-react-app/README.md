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
| `POST` | `/api/login` | `{ "username": "...", "password": "..." }`; response contains `access_token` and `refresh_token` |
| `GET` | `/api/products` | JSON array with `id`, `product_name`, `category`, `price`, `quantity`, and `description` |
| `POST` | `/api/products` | Product JSON; response contains the created row in `data` |
| `PUT` | `/api/products/{id}` | Updated row in `data` |
| `DELETE` | `/api/products/{id}` | Successful response |
| `POST` | `/api/logout` | `{ "refresh_token": "..." }`; revokes the refresh token |

Authenticated product requests use `Authorization: Bearer <access_token>`. Product writes accept `product_name`, `category`, `description`, `price`, and `quantity`.

## Render and Aiven

This directory contains the React frontend only; it does not contain a LavaLust API or database credentials. Deploy the separate API service to Render, configure its production environment with the Aiven MySQL host, port, database, username, password, and TLS settings supplied by Aiven, and verify the API's health and CORS settings. Do not put database credentials in this frontend.

Deploy this app to Vercel with this directory as the project root and `npm run build` as the build command; Vite outputs to `dist`. Set `VITE_API_BASE_URL` to the deployed API origin in the Vercel project's environment settings for Production and redeploy after changing it. Also set the API's `CORS_ALLOW_ORIGIN` on Render to the exact Vercel site origin (scheme and hostname, without a path). Vite variables are compiled into static assets and are public, so never put secrets in `VITE_*` variables.
