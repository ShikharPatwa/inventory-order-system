from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .models import Customer, Order, OrderItem, Product
from .schemas import CustomerCreate, CustomerOut, CustomerUpdate, OrderCreate, OrderItemOut, OrderOut, ProductCreate, ProductOut, ProductUpdate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory & Order Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "name": "Inventory & Order Management API",
        "docs": "/docs",
        "health": "/health",
        "resources": ["/products", "/customers", "/orders"],
    }


@app.post("/seed")
def seed_sample_data(db: Session = Depends(get_db)):
    if db.query(Product).count() or db.query(Customer).count():
        return {"message": "Seed skipped because data already exists"}

    products = [
        Product(sku="LAP-100", name="Business Laptop", description="14 inch work laptop", price=Decimal("899.00"), stock=18),
        Product(sku="MON-240", name="24 inch Monitor", description="Full HD display", price=Decimal("179.50"), stock=32),
        Product(sku="KEY-010", name="Mechanical Keyboard", description="Compact wired keyboard", price=Decimal("74.99"), stock=45),
    ]
    customers = [
        Customer(name="Aarav Sharma", email="aarav@example.com", phone="+91 98765 43210"),
        Customer(name="Neha Kapoor", email="neha@example.com", phone="+91 91234 56789"),
    ]
    db.add_all([*products, *customers])
    db.commit()
    return {"message": "Seeded sample products and customers"}


@app.get("/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()


@app.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Product SKU must be unique") from exc
    db.refresh(product)
    return product


@app.patch("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Product SKU must be unique") from exc
    db.refresh(product)
    return product


@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Products used in orders cannot be deleted") from exc


@app.get("/customers", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.id.desc()).all()


@app.post("/customers", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(**payload.model_dump())
    db.add(customer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Customer email must be unique") from exc
    db.refresh(customer)
    return customer


@app.patch("/customers/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Customer email must be unique") from exc
    db.refresh(customer)
    return customer


@app.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.orders:
        raise HTTPException(status_code=400, detail="Customers with orders cannot be deleted")
    db.delete(customer)
    db.commit()


@app.get("/orders", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.id.desc()).all()
    return [serialize_order(order) for order in orders]


@app.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    requested: dict[int, int] = {}
    for item in payload.items:
        requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

    products = db.query(Product).filter(Product.id.in_(requested.keys())).with_for_update().all()
    product_map = {product.id: product for product in products}
    missing = set(requested) - set(product_map)
    if missing:
        raise HTTPException(status_code=404, detail=f"Product IDs not found: {sorted(missing)}")

    for product_id, quantity in requested.items():
        product = product_map[product_id]
        if product.stock < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.sku}. Available {product.stock}, requested {quantity}",
            )

    order = Order(customer_id=customer.id, status="placed")
    total = Decimal("0")
    for product_id, quantity in requested.items():
        product = product_map[product_id]
        product.stock -= quantity
        total += product.price * quantity
        order.items.append(OrderItem(product_id=product.id, quantity=quantity, unit_price=product.price))

    order.total_amount = total
    db.add(order)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


def serialize_order(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderItemOut(
                product_id=item.product_id,
                product_name=item.product.name,
                sku=item.product.sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in order.items
        ],
    )
