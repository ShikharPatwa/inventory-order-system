import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Boxes, DatabaseZap, PackagePlus, Pencil, Plus, Search, ShoppingCart, Trash2, Users } from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Request failed');
  }
  if (response.status === 204) return null;
  return response.json();
}

const emptyProduct = { sku: '', name: '', description: '', price: '', stock: '' };
const emptyCustomer = { name: '', email: '', phone: '' };

function App() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState({ type: 'info', text: '' });

  const load = async () => {
    const [productData, customerData, orderData] = await Promise.all([api('/products'), api('/customers'), api('/orders')]);
    setProducts(productData);
    setCustomers(customerData);
    setOrders(orderData);
  };

  useEffect(() => {
    load().catch((error) => setMessage({ type: 'error', text: error.message }));
  }, []);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) => `${product.sku} ${product.name} ${product.description}`.toLowerCase().includes(needle));
  }, [products, query]);

  const stats = useMemo(() => {
    const stock = products.reduce((sum, product) => sum + Number(product.stock), 0);
    const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const lowStock = products.filter((product) => Number(product.stock) <= 5).length;
    return { stock, revenue: revenue.toFixed(2), lowStock };
  }, [products, orders]);

  const run = async (callback, successText) => {
    try {
      setMessage({ type: 'info', text: '' });
      await callback();
      await load();
      setMessage({ type: 'success', text: successText });
      return true;
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      return false;
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const method = editingProductId ? 'PATCH' : 'POST';
    const path = editingProductId ? `/products/${editingProductId}` : '/products';
    const saved = await run(
      () => api(path, { method, body: JSON.stringify({ ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) }) }),
      editingProductId ? 'Product updated.' : 'Product created.'
    );
    if (saved) {
      setProductForm(emptyProduct);
      setEditingProductId(null);
    }
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    const method = editingCustomerId ? 'PATCH' : 'POST';
    const path = editingCustomerId ? `/customers/${editingCustomerId}` : '/customers';
    const saved = await run(() => api(path, { method, body: JSON.stringify(customerForm) }), editingCustomerId ? 'Customer updated.' : 'Customer created.');
    if (saved) {
      setCustomerForm(emptyCustomer);
      setEditingCustomerId(null);
    }
  };

  return (
    <main>
      <header className="topbar">
        <div>
          <h1>Inventory & Order Management</h1>
          <p>Track products, customers, orders, and stock movement with enforced business rules.</p>
        </div>
        <button className="ghost" onClick={() => run(() => api('/seed', { method: 'POST' }), 'Sample data is ready.')}>
          <DatabaseZap size={18} /> Seed
        </button>
      </header>

      <section className="metrics">
        <Metric icon={<Boxes />} label="Products" value={products.length} />
        <Metric icon={<Users />} label="Customers" value={customers.length} />
        <Metric icon={<ShoppingCart />} label="Orders" value={orders.length} />
        <Metric icon={<PackagePlus />} label="Units In Stock" value={stats.stock} />
      </section>

      {message.text && <div className={`notice ${message.type}`}>{message.text}</div>}

      <section className="workspace">
        <div className="forms">
          <Panel title={editingProductId ? 'Edit Product' : 'Add Product'}>
            <ProductForm form={productForm} setForm={setProductForm} onSubmit={saveProduct} onCancel={() => { setProductForm(emptyProduct); setEditingProductId(null); }} editing={Boolean(editingProductId)} />
          </Panel>
          <Panel title={editingCustomerId ? 'Edit Customer' : 'Add Customer'}>
            <CustomerForm form={customerForm} setForm={setCustomerForm} onSubmit={saveCustomer} onCancel={() => { setCustomerForm(emptyCustomer); setEditingCustomerId(null); }} editing={Boolean(editingCustomerId)} />
          </Panel>
          <Panel title="Create Order">
            <OrderForm products={products} customers={customers} onSubmit={(payload) => run(() => api('/orders', { method: 'POST', body: JSON.stringify(payload) }), 'Order placed and stock reduced.')} />
          </Panel>
        </div>

        <div className="content">
          <div className="toolbar">
            <div>
              <h2>Products</h2>
              <p>{stats.lowStock} low-stock items</p>
            </div>
            <label className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SKU or product" /></label>
          </div>
          <ProductTable
            products={filteredProducts}
            onEdit={(product) => {
              setEditingProductId(product.id);
              setProductForm({ sku: product.sku, name: product.name, description: product.description || '', price: product.price, stock: product.stock });
            }}
            onDelete={(product) => run(() => api(`/products/${product.id}`, { method: 'DELETE' }), 'Product deleted.')}
          />
          <CustomerTable
            customers={customers}
            onEdit={(customer) => {
              setEditingCustomerId(customer.id);
              setCustomerForm({ name: customer.name, email: customer.email, phone: customer.phone || '' });
            }}
            onDelete={(customer) => run(() => api(`/customers/${customer.id}`, { method: 'DELETE' }), 'Customer deleted.')}
          />
          <OrderTable orders={orders} />
        </div>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }) {
  return <div className="metric">{icon}<span>{label}</span><strong>{value}</strong></div>;
}

function Panel({ title, children }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function ProductForm({ form, setForm, onSubmit, onCancel, editing }) {
  return (
    <form onSubmit={onSubmit}>
      <Field label="SKU" value={form.sku} onChange={(sku) => setForm({ ...form, sku })} />
      <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <Field label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} required={false} />
      <Field label="Price" type="number" min="0.01" step="0.01" value={form.price} onChange={(price) => setForm({ ...form, price })} />
      <Field label="Stock" type="number" min="0" value={form.stock} onChange={(stock) => setForm({ ...form, stock })} />
      <Actions editing={editing} onCancel={onCancel} />
    </form>
  );
}

function CustomerForm({ form, setForm, onSubmit, onCancel, editing }) {
  return (
    <form onSubmit={onSubmit}>
      <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
      <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required={false} />
      <Actions editing={editing} onCancel={onCancel} />
    </form>
  );
}

function Field({ label, value, onChange, type = 'text', required = true, ...props }) {
  return <label>{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}

function Actions({ editing, onCancel }) {
  return (
    <div className="actions">
      <button type="submit">{editing ? <Pencil size={17} /> : <Plus size={17} />}{editing ? 'Update' : 'Save'}</button>
      {editing && <button className="ghost" type="button" onClick={onCancel}>Cancel</button>}
    </div>
  );
}

function OrderForm({ products, customers, onSubmit }) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

  const submit = (event) => {
    event.preventDefault();
    onSubmit({ customer_id: Number(customerId), items: items.map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) })) });
    setItems([{ product_id: '', quantity: 1 }]);
  };

  return (
    <form onSubmit={submit}>
      <label>Customer<select required value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
      {items.map((item, index) => (
        <div className="line" key={index}>
          <label>Product<select required value={item.product_id} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, product_id: event.target.value } : row))}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name} ({product.stock})</option>)}</select></label>
          <label>Qty<input type="number" min="1" required value={item.quantity} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: event.target.value } : row))} /></label>
          {items.length > 1 && <button className="icon danger" type="button" onClick={() => setItems(items.filter((_, rowIndex) => rowIndex !== index))}><Trash2 size={17} /></button>}
        </div>
      ))}
      <button className="ghost" type="button" onClick={() => setItems([...items, { product_id: '', quantity: 1 }])}><Plus size={17} /> Add Line</button>
      <button type="submit"><ShoppingCart size={17} /> Place Order</button>
    </form>
  );
}

function ProductTable({ products, onEdit, onDelete }) {
  return <DataTable title="Product Inventory" headers={['SKU', 'Name', 'Price', 'Stock', 'Actions']} rows={products.map((product) => [
    product.sku,
    product.name,
    formatCurrency(product.price),
    <span className={Number(product.stock) <= 5 ? 'stock low' : 'stock'}>{product.stock}</span>,
    <RowActions onEdit={() => onEdit(product)} onDelete={() => onDelete(product)} />,
  ])} />;
}

function CustomerTable({ customers, onEdit, onDelete }) {
  return <DataTable title="Customers" headers={['Name', 'Email', 'Phone', 'Actions']} rows={customers.map((customer) => [
    customer.name,
    customer.email,
    customer.phone || '-',
    <RowActions onEdit={() => onEdit(customer)} onDelete={() => onDelete(customer)} />,
  ])} />;
}

function OrderTable({ orders }) {
  return <DataTable title="Orders" headers={['Customer', 'Items', 'Total', 'Status']} rows={orders.map((order) => [
    order.customer_name,
    order.items.map((item) => `${item.quantity}x ${item.sku}`).join(', '),
    formatCurrency(order.total_amount),
    <span className="status">{order.status}</span>,
  ])} />;
}

function RowActions({ onEdit, onDelete }) {
  return <div className="row-actions"><button className="icon" onClick={onEdit}><Pencil size={16} /></button><button className="icon danger" onClick={onDelete}><Trash2 size={16} /></button></div>;
}

function DataTable({ title, headers, rows }) {
  return (
    <section className="table-wrap">
      <h2>{title}</h2>
      <table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length}>No records yet</td></tr>}</tbody></table>
    </section>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

createRoot(document.getElementById('root')).render(<App />);
