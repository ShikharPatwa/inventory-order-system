import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_unique_sku_and_customer_email_are_enforced():
    product = {"sku": "SKU-1", "name": "Laptop", "price": "500.00", "stock": 5}
    assert client.post("/products", json=product).status_code == 201
    duplicate_product = client.post("/products", json=product)
    assert duplicate_product.status_code == 409

    customer = {"name": "Riya Shah", "email": "riya@example.com", "phone": "9999999999"}
    assert client.post("/customers", json=customer).status_code == 201
    duplicate_customer = client.post("/customers", json=customer)
    assert duplicate_customer.status_code == 409


def test_order_reduces_stock_and_returns_total():
    product = client.post("/products", json={"sku": "MOUSE-1", "name": "Mouse", "price": "25.00", "stock": 10}).json()
    customer = client.post("/customers", json={"name": "Dev User", "email": "dev@example.com"}).json()

    order_response = client.post(
        "/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 3}]},
    )

    assert order_response.status_code == 201
    assert order_response.json()["total_amount"] == "75.00"
    products = client.get("/products").json()
    assert products[0]["stock"] == 7


def test_order_is_rejected_when_stock_is_insufficient():
    product = client.post("/products", json={"sku": "CHAIR-1", "name": "Chair", "price": "80.00", "stock": 1}).json()
    customer = client.post("/customers", json={"name": "Ops User", "email": "ops@example.com"}).json()

    response = client.post(
        "/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 2}]},
    )

    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]
