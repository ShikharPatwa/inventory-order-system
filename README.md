# Inventory & Order Management System

Full-stack assessment project for managing products, customers, orders, and inventory tracking.

## Tech Stack

- Backend: Python, FastAPI, SQLAlchemy
- Frontend: React, Vite, lucide-react
- Database: PostgreSQL
- Containerization: Docker and Docker Compose

## Features

- Product CRUD with unique SKU validation.
- Customer CRUD with unique email validation.
- Order creation with one or more order lines.
- Inventory validation before every order is accepted.
- Automatic stock reduction after successful order placement.
- Product/customer deletion protection when records are referenced by orders.
- Responsive dashboard with metrics, searchable inventory, low-stock badges, and order history.
- Environment-variable driven configuration.
- API documentation available through FastAPI Swagger UI.
- Backend tests for uniqueness, stock reduction, and insufficient-stock rejection.

## API Endpoints

- `GET /health` checks backend status.
- `POST /seed` creates sample products and customers for demos.
- `GET /products`, `POST /products`, `PATCH /products/{id}`, `DELETE /products/{id}` manage products.
- `GET /customers`, `POST /customers`, `PATCH /customers/{id}`, `DELETE /customers/{id}` manage customers.
- `GET /orders`, `POST /orders` list and place orders.

## Run With Docker

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Run In Development

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Test Backend

```bash
cd backend
pytest
```

## Environment Variables

Root `.env` for Docker Compose:

```env
POSTGRES_USER=inventory
POSTGRES_PASSWORD=inventory
POSTGRES_DB=inventory_db
DATABASE_URL=postgresql+psycopg://inventory:inventory@db:5432/inventory_db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost
VITE_API_URL=http://localhost:8000
```

Backend-only `.env` for local development:

```env
DATABASE_URL=postgresql+psycopg://inventory:inventory@localhost:5432/inventory_db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Docker Image Build

```bash
docker build -t <dockerhub-username>/inventory-order-backend:latest ./backend
docker push <dockerhub-username>/inventory-order-backend:latest
```

## Deployment Notes

- Frontend can be deployed to Vercel or Netlify. Set `VITE_API_URL` to the hosted backend URL.
- Backend can be deployed to Render, Railway, Fly.io, or another container host. Set `DATABASE_URL` to the hosted PostgreSQL URL and `CORS_ORIGINS` to the hosted frontend URL.
- PostgreSQL can be hosted through Render, Railway, Neon, Supabase, or any compatible provider.

## Submission Fields

- GitHub Repository Link: `https://github.com/<username>/inventory-order-system`
- Backend Docker Hub Image Link: `https://hub.docker.com/r/<username>/inventory-order-backend`
- Frontend Hosted URL: `<your deployed frontend URL>`
- Backend API Hosted URL: `<your deployed backend URL>`
