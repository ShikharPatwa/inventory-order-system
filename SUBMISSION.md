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

Use these final URLs:

- GitHub Repository Link: `https://github.com/ShikharPatwa/inventory-order-system`
- Backend Docker Hub Image Link: `https://hub.docker.com/r/shikharpatwa/inventory-order-backend`
- Frontend Hosted URL: `https://twenty-sloths-smash.loca.lt`
- Backend API Hosted URL: `https://real-seals-write.loca.lt`

## Public Hosting Notes

- The GitHub repository is public and the local `main` branch is pushed to `origin`.
- The backend Docker image is pushed to Docker Hub as `shikharpatwa/inventory-order-backend:latest`.
- The frontend and backend public URLs are localtunnel URLs backed by the currently running local services.
- Keep the two live localtunnel sessions, Docker Compose frontend, backend, and PostgreSQL processes running while the evaluator uses the hosted URLs.
