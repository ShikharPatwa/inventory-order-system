# Submission Handoff

## Local Status

- Project folder: `/Users/shikharpatwa/Desktop/inventory-order-system`
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- PostgreSQL: running through Docker Compose on `localhost:5432`
- Backend Docker image built locally: `inventory-order-system-backend:latest`

## Verified Locally

- `docker compose ps` shows PostgreSQL healthy, backend running, and frontend running.
- `GET /health` returns `{"status":"ok"}`.
- `GET /products` returns seeded product data from the PostgreSQL-backed API.
- PostgreSQL tables exist: `products`, `customers`, `orders`, `order_items`.

## Google Form Fields

These require public account publishing and cannot be generated locally without login/credentials:

- GitHub Repository Link: requires pushing this local git repo to your GitHub account.
- Backend Docker Hub Image Link: requires Docker Hub login and push under your Docker Hub username.
- Frontend Hosted URL: requires deploying the frontend to Vercel/Netlify or similar.
- Backend API Hosted URL: requires deploying the backend plus PostgreSQL to Render/Railway/Fly or similar.

## Shortest Next Commands

```bash
cd /Users/shikharpatwa/Desktop/inventory-order-system

# GitHub
git remote add origin https://github.com/<github-username>/inventory-order-system.git
git push -u origin main

# Docker Hub backend image
docker login
docker tag inventory-order-system-backend:latest <dockerhub-username>/inventory-order-backend:latest
docker push <dockerhub-username>/inventory-order-backend:latest
```

For hosting, deploy:

- `frontend/` to Vercel or Netlify with `VITE_API_URL=<hosted-backend-url>`.
- `backend/` to Render/Railway/Fly with `DATABASE_URL=<hosted-postgres-url>` and `CORS_ORIGINS=<hosted-frontend-url>`.
