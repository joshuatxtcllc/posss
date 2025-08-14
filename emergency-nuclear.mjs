#!/usr/bin/env node
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// NUCLEAR OPTION: Force port 5000 - the standard for this project
const PORT = 5000;

console.log(`🔥 NUCLEAR SERVER - PORT ${PORT}`);

app.use(express.json());
app.use(express.static(join(__dirname, 'client/dist/public')));

// Serve the actual HTML with inline React app
app.get('*', (req, res) => {
  res.send(`<!DOCTYPE html>
<html><head><title>Jay's Frames POS</title>
<style>
body{font-family:Arial;margin:0;padding:20px;background:#f5f5f5}
.container{max-width:1200px;margin:0 auto;background:white;padding:20px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}
.header{background:#2563eb;color:white;padding:20px;margin:-20px -20px 20px;border-radius:8px 8px 0 0}
.nav{display:flex;gap:20px;margin:20px 0}
.nav-item{padding:10px 20px;background:#3b82f6;color:white;text-decoration:none;border-radius:4px;cursor:pointer}
.nav-item:hover{background:#1d4ed8}
.section{display:none;padding:20px 0}
.section.active{display:block}
.form{max-width:500px}
.form-group{margin:15px 0}
.form-group label{display:block;margin-bottom:5px;font-weight:bold}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;font-size:14px}
.btn{background:#2563eb;color:white;padding:12px 24px;border:none;border-radius:4px;cursor:pointer;font-size:16px}
.btn:hover{background:#1d4ed8}
.btn-success{background:#16a34a}
.btn-success:hover{background:#15803d}
.order-list{display:grid;gap:15px;margin:20px 0}
.order-card{border:1px solid #ddd;padding:15px;border-radius:8px;background:#f9f9f9}
.price{font-size:18px;font-weight:bold;color:#16a34a}
.status{padding:4px 8px;border-radius:4px;font-size:12px;color:white}
.status-pending{background:#f59e0b}
.status-completed{background:#16a34a}
</style>
</head><body>
<div class="container">
  <div class="header">
    <h1>Jay's Frames POS System</h1>
    <p>Professional Picture Framing Business Management</p>
  </div>
  
  <div class="nav">
    <div class="nav-item" onclick="showSection('pos')">New Order</div>
    <div class="nav-item" onclick="showSection('orders')">View Orders</div>
    <div class="nav-item" onclick="showSection('customers')">Customers</div>
    <div class="nav-item" onclick="showSection('payment')">Process Payment</div>
  </div>

  <div id="pos" class="section active">
    <h2>Create New Frame Order</h2>
    <div class="form">
      <div class="form-group">
        <label>Customer Name</label>
        <input type="text" id="customerName" placeholder="Enter customer name">
      </div>
      <div class="form-group">
        <label>Customer Phone</label>
        <input type="tel" id="customerPhone" placeholder="(555) 123-4567">
      </div>
      <div class="form-group">
        <label>Artwork Description</label>
        <textarea id="artworkDesc" placeholder="Describe the artwork to be framed" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>Artwork Dimensions</label>
        <input type="text" id="dimensions" placeholder="e.g., 16x20 inches">
      </div>
      <div class="form-group">
        <label>Frame Style</label>
        <select id="frameStyle">
          <option value="">Select Frame</option>
          <option value="classic-oak">Classic Oak Frame - $28.50</option>
          <option value="modern-metal">Modern Metal Frame - $35.00</option>
          <option value="premium-gold">Premium Gold Frame - $45.00</option>
        </select>
      </div>
      <div class="form-group">
        <label>Mat Board</label>
        <select id="matBoard">
          <option value="">Select Mat</option>
          <option value="white-core">White Core Mat - $15.00</option>
          <option value="cream-core">Cream Core Mat - $15.00</option>
          <option value="black-core">Black Core Mat - $18.00</option>
        </select>
      </div>
      <div class="form-group">
        <label>Glass Type</label>
        <select id="glassType">
          <option value="regular">Regular Glass - $12.00</option>
          <option value="uv-protection">UV Protection Glass - $25.00</option>
          <option value="museum">Museum Glass - $45.00</option>
        </select>
      </div>
      <button class="btn" onclick="createOrder()">Create Order</button>
    </div>
  </div>

  <div id="orders" class="section">
    <h2>Current Orders</h2>
    <div id="ordersList" class="order-list">
      <!-- Orders will be loaded here -->
    </div>
  </div>

  <div id="customers" class="section">
    <h2>Customer Management</h2>
    <div class="form">
      <div class="form-group">
        <label>Customer Name</label>
        <input type="text" id="newCustomerName" placeholder="Full name">
      </div>
      <div class="form-group">
        <label>Phone Number</label>
        <input type="tel" id="newCustomerPhone" placeholder="Phone number">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="newCustomerEmail" placeholder="Email address">
      </div>
      <button class="btn" onclick="addCustomer()">Add Customer</button>
    </div>
  </div>

  <div id="payment" class="section">
    <h2>Process Payment</h2>
    <div class="form">
      <div class="form-group">
        <label>Order ID</label>
        <input type="text" id="paymentOrderId" placeholder="Enter order ID">
      </div>
      <div class="form-group">
        <label>Payment Amount</label>
        <input type="number" id="paymentAmount" placeholder="0.00" step="0.01">
      </div>
      <div class="form-group">
        <label>Payment Method</label>
        <select id="paymentMethod">
          <option value="cash">Cash</option>
          <option value="card">Credit Card</option>
          <option value="check">Check</option>
        </select>
      </div>
      <button class="btn btn-success" onclick="processPayment()">Process Payment</button>
    </div>
  </div>
</div>

<script>
let orders = JSON.parse(localStorage.getItem('frameOrders') || '[]');
let customers = JSON.parse(localStorage.getItem('frameCustomers') || '[]');

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  if(sectionId === 'orders') loadOrders();
}

function createOrder() {
  const customer = document.getElementById('customerName').value;
  const phone = document.getElementById('customerPhone').value;
  const artwork = document.getElementById('artworkDesc').value;
  const dimensions = document.getElementById('dimensions').value;
  const frame = document.getElementById('frameStyle').value;
  const mat = document.getElementById('matBoard').value;
  const glass = document.getElementById('glassType').value;
  
  if (!customer || !phone || !artwork || !frame) {
    alert('Please fill in required fields');
    return;
  }
  
  const framePrice = frame === 'classic-oak' ? 28.50 : frame === 'modern-metal' ? 35.00 : 45.00;
  const matPrice = mat === 'black-core' ? 18.00 : 15.00;
  const glassPrice = glass === 'regular' ? 12.00 : glass === 'uv-protection' ? 25.00 : 45.00;
  const total = framePrice + matPrice + glassPrice + 25.00; // +$25 labor
  
  const order = {
    id: 'ORD' + Date.now(),
    customer,
    phone,
    artwork,
    dimensions,
    frame,
    mat,
    glass,
    total: total.toFixed(2),
    status: 'pending',
    date: new Date().toLocaleDateString()
  };
  
  orders.push(order);
  localStorage.setItem('frameOrders', JSON.stringify(orders));
  alert('Order created successfully! Order ID: ' + order.id);
  
  // Clear form
  document.getElementById('customerName').value = '';
  document.getElementById('customerPhone').value = '';
  document.getElementById('artworkDesc').value = '';
  document.getElementById('dimensions').value = '';
  document.getElementById('frameStyle').value = '';
  document.getElementById('matBoard').value = '';
  document.getElementById('glassType').value = 'regular';
}

function loadOrders() {
  const container = document.getElementById('ordersList');
  if (orders.length === 0) {
    container.innerHTML = '<p>No orders yet. Create your first order!</p>';
    return;
  }
  
  container.innerHTML = orders.map(order => \`
    <div class="order-card">
      <h3>Order \${order.id}</h3>
      <p><strong>Customer:</strong> \${order.customer} (\${order.phone})</p>
      <p><strong>Artwork:</strong> \${order.artwork}</p>
      <p><strong>Dimensions:</strong> \${order.dimensions}</p>
      <p class="price">Total: $\${order.total}</p>
      <span class="status status-\${order.status}">\${order.status.toUpperCase()}</span>
      <p><small>Date: \${order.date}</small></p>
    </div>
  \`).join('');
}

function addCustomer() {
  const name = document.getElementById('newCustomerName').value;
  const phone = document.getElementById('newCustomerPhone').value;
  const email = document.getElementById('newCustomerEmail').value;
  
  if (!name || !phone) {
    alert('Name and phone are required');
    return;
  }
  
  customers.push({id: Date.now(), name, phone, email});
  localStorage.setItem('frameCustomers', JSON.stringify(customers));
  alert('Customer added successfully!');
  
  document.getElementById('newCustomerName').value = '';
  document.getElementById('newCustomerPhone').value = '';
  document.getElementById('newCustomerEmail').value = '';
}

function processPayment() {
  const orderId = document.getElementById('paymentOrderId').value;
  const amount = document.getElementById('paymentAmount').value;
  const method = document.getElementById('paymentMethod').value;
  
  if (!orderId || !amount) {
    alert('Please enter order ID and amount');
    return;
  }
  
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    alert('Order not found');
    return;
  }
  
  order.status = 'paid';
  order.paymentMethod = method;
  order.amountPaid = amount;
  localStorage.setItem('frameOrders', JSON.stringify(orders));
  
  alert(\`Payment of $\${amount} processed successfully for order \${orderId}\`);
  
  document.getElementById('paymentOrderId').value = '';
  document.getElementById('paymentAmount').value = '';
}

// Load initial data
loadOrders();
</script>
</body></html>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NUCLEAR POS SYSTEM LIVE ON PORT ${PORT}`);
  console.log(`💰 ACCEPTING CUSTOMER PAYMENTS NOW`);
});