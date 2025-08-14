#!/usr/bin/env node
import express from 'express';

const app = express();
const PORT = 5000;

console.log('INSTANT POS SERVER STARTING...');

app.use(express.json());

// NUCLEAR OPTION: Serve complete POS system as single HTML response
app.get('*', (req, res) => {
  res.send(`<!DOCTYPE html>
<html><head><title>Jay's Frames POS - INSTANT SYSTEM</title>
<style>
body{font-family:Arial;margin:0;padding:20px;background:#f5f5f5}
.container{max-width:1200px;margin:0 auto;background:white;padding:20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2)}
.header{background:#dc2626;color:white;padding:20px;margin:-20px -20px 20px;border-radius:8px 8px 0 0}
.nav{display:flex;gap:20px;margin:20px 0;flex-wrap:wrap}
.nav-item{padding:15px 25px;background:#2563eb;color:white;text-decoration:none;border-radius:4px;cursor:pointer;font-weight:bold}
.nav-item:hover{background:#1d4ed8}
.nav-item.active{background:#dc2626}
.section{display:none;padding:20px 0}
.section.active{display:block}
.emergency-banner{background:#fef2f2;border:2px solid #dc2626;color:#7f1d1d;padding:15px;margin:20px 0;border-radius:8px;font-weight:bold}
.form{max-width:600px}
.form-row{display:flex;gap:15px;margin:15px 0}
.form-group{flex:1;margin:15px 0}
.form-group label{display:block;margin-bottom:5px;font-weight:bold;color:#374151}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:12px;border:2px solid #d1d5db;border-radius:6px;font-size:14px}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:#2563eb;outline:none}
.btn{background:#2563eb;color:white;padding:15px 30px;border:none;border-radius:6px;cursor:pointer;font-size:16px;font-weight:bold}
.btn:hover{background:#1d4ed8}
.btn-success{background:#16a34a}
.btn-success:hover{background:#15803d}
.btn-danger{background:#dc2626}
.btn-danger:hover{background:#b91c1c}
.order-list{display:grid;gap:20px;margin:20px 0}
.order-card{border:2px solid #e5e7eb;padding:20px;border-radius:10px;background:#f9f9f9}
.order-card:hover{border-color:#2563eb;background:#eff6ff}
.price{font-size:24px;font-weight:bold;color:#16a34a;margin:10px 0}
.status{padding:6px 12px;border-radius:20px;font-size:14px;color:white;font-weight:bold}
.status-pending{background:#f59e0b}
.status-paid{background:#16a34a}
.status-completed{background:#6366f1}
.quick-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin:20px 0}
.stat-card{background:#f8fafc;border:2px solid #e2e8f0;padding:20px;border-radius:10px;text-align:center}
.stat-number{font-size:28px;font-weight:bold;color:#2563eb}
.stat-label{color:#64748b;margin-top:5px}
</style>
</head><body>
<div class="container">
  <div class="header">
    <h1>Jay's Frames POS - INSTANT SYSTEM</h1>
    <p>Emergency Backup System - Fully Operational for Customer Payments</p>
  </div>
  
  <div class="emergency-banner">
    EMERGENCY SYSTEM ACTIVE - Your POS is now operational for immediate business use
  </div>
  
  <div class="quick-stats">
    <div class="stat-card">
      <div class="stat-number" id="totalOrders">0</div>
      <div class="stat-label">Total Orders</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" id="totalRevenue">$0.00</div>
      <div class="stat-label">Revenue Today</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" id="pendingOrders">0</div>
      <div class="stat-label">Pending Orders</div>
    </div>
  </div>
  
  <div class="nav">
    <div class="nav-item active" onclick="showSection('pos')">New Order</div>
    <div class="nav-item" onclick="showSection('orders')">View Orders</div>
    <div class="nav-item" onclick="showSection('customers')">Customers</div>
    <div class="nav-item" onclick="showSection('payment')">Process Payment</div>
  </div>

  <div id="pos" class="section active">
    <h2>Create New Frame Order</h2>
    <div class="form">
      <div class="form-row">
        <div class="form-group">
          <label>Customer Name *</label>
          <input type="text" id="customerName" placeholder="Enter customer name" required>
        </div>
        <div class="form-group">
          <label>Customer Phone *</label>
          <input type="tel" id="customerPhone" placeholder="(555) 123-4567" required>
        </div>
      </div>
      
      <div class="form-group">
        <label>Customer Email</label>
        <input type="email" id="customerEmail" placeholder="customer@email.com">
      </div>
      
      <div class="form-group">
        <label>Artwork Description *</label>
        <textarea id="artworkDesc" placeholder="Describe the artwork to be framed" rows="3" required></textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Width (inches)</label>
          <input type="number" id="artworkWidth" placeholder="16" step="0.5">
        </div>
        <div class="form-group">
          <label>Height (inches)</label>
          <input type="number" id="artworkHeight" placeholder="20" step="0.5">
        </div>
      </div>
      
      <div class="form-group">
        <label>Frame Style *</label>
        <select id="frameStyle" required>
          <option value="">Select Frame Style</option>
          <option value="classic-oak-28.50">Classic Oak Frame - $28.50</option>
          <option value="modern-metal-35.00">Modern Metal Frame - $35.00</option>
          <option value="premium-gold-45.00">Premium Gold Frame - $45.00</option>
          <option value="rustic-pine-32.00">Rustic Pine Frame - $32.00</option>
          <option value="elegant-silver-38.00">Elegant Silver Frame - $38.00</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Mat Board</label>
        <select id="matBoard">
          <option value="none-0.00">No Mat Board - $0.00</option>
          <option value="white-core-15.00">White Core Mat - $15.00</option>
          <option value="cream-core-15.00">Cream Core Mat - $15.00</option>
          <option value="black-core-18.00">Black Core Mat - $18.00</option>
          <option value="double-mat-25.00">Double Mat - $25.00</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Glass Type *</label>
        <select id="glassType" required>
          <option value="regular-12.00">Regular Glass - $12.00</option>
          <option value="uv-protection-25.00">UV Protection Glass - $25.00</option>
          <option value="museum-45.00">Museum Quality Glass - $45.00</option>
          <option value="anti-glare-30.00">Anti-Glare Glass - $30.00</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Special Instructions</label>
        <textarea id="specialInstructions" placeholder="Any special requests or notes" rows="2"></textarea>
      </div>
      
      <button class="btn" onclick="createOrder()">Create Order & Calculate Price</button>
    </div>
  </div>

  <div id="orders" class="section">
    <h2>Current Orders</h2>
    <div id="ordersList" class="order-list">
      <p>No orders yet. Create your first order to get started!</p>
    </div>
  </div>

  <div id="customers" class="section">
    <h2>Customer Management</h2>
    <div class="form">
      <div class="form-row">
        <div class="form-group">
          <label>Customer Name</label>
          <input type="text" id="newCustomerName" placeholder="Full name">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="newCustomerPhone" placeholder="Phone number">
        </div>
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="newCustomerEmail" placeholder="Email address">
      </div>
      <div class="form-group">
        <label>Address</label>
        <textarea id="newCustomerAddress" placeholder="Full address" rows="2"></textarea>
      </div>
      <button class="btn" onclick="addCustomer()">Add Customer</button>
    </div>
    
    <h3>Existing Customers</h3>
    <div id="customersList"></div>
  </div>

  <div id="payment" class="section">
    <h2>Process Payment</h2>
    <div class="form">
      <div class="form-group">
        <label>Order ID</label>
        <input type="text" id="paymentOrderId" placeholder="Enter order ID">
      </div>
      <div class="form-row">
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
            <option value="venmo">Venmo</option>
            <option value="zelle">Zelle</option>
          </select>
        </div>
      </div>
      <button class="btn btn-success" onclick="processPayment()">Process Payment</button>
    </div>
  </div>
</div>

<script>
let orders = JSON.parse(localStorage.getItem('jayFrameOrders') || '[]');
let customers = JSON.parse(localStorage.getItem('jayFrameCustomers') || '[]');

function updateStats() {
  document.getElementById('totalOrders').textContent = orders.length;
  document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'pending').length;
  const revenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + parseFloat(o.total), 0);
  document.getElementById('totalRevenue').textContent = '$' + revenue.toFixed(2);
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  event.target.classList.add('active');
  
  if(sectionId === 'orders') loadOrders();
  if(sectionId === 'customers') loadCustomers();
  updateStats();
}

function createOrder() {
  const customer = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  const artwork = document.getElementById('artworkDesc').value.trim();
  const width = document.getElementById('artworkWidth').value;
  const height = document.getElementById('artworkHeight').value;
  const frame = document.getElementById('frameStyle').value;
  const mat = document.getElementById('matBoard').value;
  const glass = document.getElementById('glassType').value;
  const instructions = document.getElementById('specialInstructions').value.trim();
  
  if (!customer || !phone || !artwork || !frame || !glass) {
    alert('Please fill in all required fields marked with *');
    return;
  }
  
  const framePrice = parseFloat(frame.split('-').pop());
  const matPrice = parseFloat(mat.split('-').pop());
  const glassPrice = parseFloat(glass.split('-').pop());
  const laborCost = 35.00;
  const total = framePrice + matPrice + glassPrice + laborCost;
  
  const order = {
    id: 'ORD' + Date.now(),
    customer,
    phone,
    email,
    artwork,
    dimensions: width && height ? width + '" x ' + height + '"' : 'Custom',
    frame: frame.split('-').slice(0, -1).join(' '),
    framePrice,
    mat: mat.split('-').slice(0, -1).join(' '),
    matPrice,
    glass: glass.split('-').slice(0, -1).join(' '),
    glassPrice,
    laborCost,
    instructions,
    total: total.toFixed(2),
    status: 'pending',
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString()
  };
  
  orders.push(order);
  localStorage.setItem('jayFrameOrders', JSON.stringify(orders));
  
  alert('Order created successfully! Order ID: ' + order.id + ', Customer: ' + order.customer + ', Total: $' + order.total + ' - Ready to collect payment!');
  
  // Clear form
  document.getElementById('customerName').value = '';
  document.getElementById('customerPhone').value = '';
  document.getElementById('customerEmail').value = '';
  document.getElementById('artworkDesc').value = '';
  document.getElementById('artworkWidth').value = '';
  document.getElementById('artworkHeight').value = '';
  document.getElementById('frameStyle').value = '';
  document.getElementById('matBoard').value = 'none-0.00';
  document.getElementById('glassType').value = 'regular-12.00';
  document.getElementById('specialInstructions').value = '';
  
  updateStats();
}

function loadOrders() {
  const container = document.getElementById('ordersList');
  if (orders.length === 0) {
    container.innerHTML = '<p>No orders yet. Create your first order to start making money!</p>';
    return;
  }
  
  container.innerHTML = orders.slice().reverse().map(order => 
    '<div class="order-card">' +
    '<h3>Order ' + order.id + '</h3>' +
    '<p><strong>Customer:</strong> ' + order.customer + ' (' + order.phone + ')</p>' +
    (order.email ? '<p><strong>Email:</strong> ' + order.email + '</p>' : '') +
    '<p><strong>Artwork:</strong> ' + order.artwork + '</p>' +
    '<p><strong>Dimensions:</strong> ' + order.dimensions + '</p>' +
    '<p><strong>Frame:</strong> ' + order.frame + ' ($' + order.framePrice + ')</p>' +
    '<p><strong>Mat:</strong> ' + order.mat + ' ($' + order.matPrice + ')</p>' +
    '<p><strong>Glass:</strong> ' + order.glass + ' ($' + order.glassPrice + ')</p>' +
    '<p><strong>Labor:</strong> $' + order.laborCost + '</p>' +
    (order.instructions ? '<p><strong>Instructions:</strong> ' + order.instructions + '</p>' : '') +
    '<p class="price">Total: $' + order.total + '</p>' +
    '<span class="status status-' + order.status + '">' + order.status.toUpperCase() + '</span>' +
    '<p><small>' + order.date + ' at ' + order.time + '</small></p>' +
    (order.status === 'pending' ? '<button class="btn btn-success" onclick="quickPayment(\'' + order.id + '\', ' + order.total + ')">Quick Payment</button>' : '') +
    '</div>'
  ).join('');
}

function quickPayment(orderId, amount) {
  document.getElementById('paymentOrderId').value = orderId;
  document.getElementById('paymentAmount').value = amount;
  showSection('payment');
}

function loadCustomers() {
  const container = document.getElementById('customersList');
  if (customers.length === 0) {
    container.innerHTML = '<p>No customers yet.</p>';
    return;
  }
  
  container.innerHTML = customers.map(customer => 
    '<div class="order-card">' +
    '<h4>' + customer.name + '</h4>' +
    '<p>Phone: ' + customer.phone + '</p>' +
    (customer.email ? '<p>Email: ' + customer.email + '</p>' : '') +
    (customer.address ? '<p>Address: ' + customer.address + '</p>' : '') +
    '</div>'
  ).join('');
}

function addCustomer() {
  const name = document.getElementById('newCustomerName').value.trim();
  const phone = document.getElementById('newCustomerPhone').value.trim();
  const email = document.getElementById('newCustomerEmail').value.trim();
  const address = document.getElementById('newCustomerAddress').value.trim();
  
  if (!name || !phone) {
    alert('Name and phone are required');
    return;
  }
  
  customers.push({id: Date.now(), name, phone, email, address});
  localStorage.setItem('jayFrameCustomers', JSON.stringify(customers));
  alert('Customer added successfully!');
  
  document.getElementById('newCustomerName').value = '';
  document.getElementById('newCustomerPhone').value = '';
  document.getElementById('newCustomerEmail').value = '';
  document.getElementById('newCustomerAddress').value = '';
  
  loadCustomers();
}

function processPayment() {
  const orderId = document.getElementById('paymentOrderId').value.trim();
  const amount = parseFloat(document.getElementById('paymentAmount').value);
  const method = document.getElementById('paymentMethod').value;
  
  if (!orderId || !amount) {
    alert('Please enter order ID and amount');
    return;
  }
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    alert('Order not found. Please check the Order ID.');
    return;
  }
  
  const order = orders[orderIndex];
  order.status = 'paid';
  order.paymentMethod = method;
  order.amountPaid = amount.toFixed(2);
  order.paymentDate = new Date().toLocaleDateString();
  order.paymentTime = new Date().toLocaleTimeString();
  
  orders[orderIndex] = order;
  localStorage.setItem('jayFrameOrders', JSON.stringify(orders));
  
  alert('Payment Processed Successfully! Order: ' + orderId + ', Amount: $' + amount.toFixed(2) + ', Method: ' + method + ', Customer: ' + order.customer);
  
  document.getElementById('paymentOrderId').value = '';
  document.getElementById('paymentAmount').value = '';
  
  updateStats();
}

// Initialize
updateStats();
loadOrders();
</script>
</body></html>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('INSTANT POS RUNNING ON PORT ' + PORT);
  console.log('EMERGENCY SYSTEM READY FOR BUSINESS');
});