// js/order.js
const OrderApp = {
  cart: [],
  total: 0,
  captchaResult: 0,
  openingHour: 7,
  closingHour: 15,

  init() {
    // Prevent execution if order is already locked in this session
    if (sessionStorage.getItem("orderPlaced")) {
      return;
    }

    this.bindEvents();
    this.checkOpeningHours();
    this.generateCaptcha();
    this.loadCart();
  },

  bindEvents() {
    // Add-to-cart buttons
    document.querySelectorAll(".add-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);
        this.addToCart(name, price);
      });
    });
  },

  checkOpeningHours() {
    const hour = new Date().getHours();
    const statusDiv = document.getElementById("storeStatus");
    const checkoutBtn = document.getElementById("checkoutButton");

    if (hour < this.openingHour || hour >= this.closingHour) {
      if (statusDiv) {
        statusDiv.innerHTML =
          `<div class="closed">We are closed right now. Opening hours: 7:00 am – 3:00 pm.</div>`;
      }
      // Disable order actions
      document.querySelectorAll(".add-btn").forEach(btn => {
        btn.disabled = true;
        btn.classList.add("disabled");
      });
      if (checkoutBtn) {
        checkoutBtn.disabled = true;
      }
      return false;
    }

    if (statusDiv) {
      statusDiv.textContent = "";
    }
    return true;
  },

  addToCart(name, price) {
    if (!this.checkOpeningHours()) return;

    const existing = this.cart.find(item => item.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({ name, price, qty: 1 });
    }

    this.updateTotal();
    this.saveCart();
    this.renderCart();
  },

  renderCart() {
    const cartEl = document.getElementById("cart");
    if (!cartEl) return;

    cartEl.innerHTML = "";

    if (this.cart.length === 0) {
      cartEl.innerHTML = `<li class="cart-empty">Your order is empty.</li>`;
    } else {
      this.cart.forEach((item, index) => {
        cartEl.innerHTML += `
          <li class="cart-item">
            <div class="cart-item-main">
              <span class="cart-item-name">${item.name}</span>
              <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
            </div>
            <div class="cart-item-controls">
              <button type="button" class="qty-btn" aria-label="Increase quantity"
                onclick="OrderApp.changeQty(${index}, 1)">+</button>
              <span class="cart-item-qty">${item.qty}</span>
              <button type="button" class="qty-btn" aria-label="Decrease quantity"
                onclick="OrderApp.changeQty(${index}, -1)">-</button>
              <button type="button" class="remove-btn" aria-label="Remove item"
                onclick="OrderApp.removeItem(${index})">×</button>
            </div>
          </li>
        `;
      });
    }

    const totalEl = document.getElementById("total");
    if (totalEl) {
      totalEl.textContent = this.total.toFixed(2);
    }
  },

  changeQty(index, delta) {
    const item = this.cart[index];
    if (!item) return;

    item.qty += delta;

    if (item.qty <= 0) {
      this.cart.splice(index, 1);
    }

    this.updateTotal();
    this.saveCart();
    this.renderCart();
  },

  removeItem(index) {
    if (!this.cart[index]) return;
    this.cart.splice(index, 1);
    this.updateTotal();
    this.saveCart();
    this.renderCart();
  },

  updateTotal() {
    this.total = this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  saveCart() {
    localStorage.setItem("daybreak_cart", JSON.stringify(this.cart));
  },

  loadCart() {
    const saved = JSON.parse(localStorage.getItem("daybreak_cart"));
    if (Array.isArray(saved) && saved.length) {
      this.cart = saved;
      this.updateTotal();
      this.renderCart();
    } else {
      this.renderCart();
    }
  },

  generateCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    this.captchaResult = a + b;

    const el = document.getElementById("captchaQuestion");
    if (el) {
      el.textContent = `Verification: what is ${a} + ${b}?`;
    }
  },

  sanitize(str) {
    return str.replace(/[<>]/g, "");
  }
};

function checkout() {
  // Opening hours guard
  if (!OrderApp.checkOpeningHours()) {
    alert("Orders are only accepted between 7:00 am and 3:00 pm.");
    return;
  }

  const nameInput = document.getElementById("customerName");
  const phoneInput = document.getElementById("customerPhone");
  const captchaInput = document.getElementById("captchaAnswer");

  const name = OrderApp.sanitize(nameInput.value.trim());
  const phone = phoneInput.value.trim();
  const captcha = parseInt(captchaInput.value, 10);

  if (!name || !phone) {
    alert("Please fill in your name and mobile number.");
    return;
  }

  // Simple phone validation (AU-style: 8–12 digits)
  const phonePattern = /^[0-9]{8,12}$/;
  if (!phonePattern.test(phone)) {
    alert("Please enter a valid phone number (8–12 digits, numbers only).");
    return;
  }

  if (OrderApp.cart.length === 0) {
    alert("Your order is empty.");
    return;
  }

  if (captcha !== OrderApp.captchaResult) {
    alert("Captcha incorrect, please try again.");
    OrderApp.generateCaptcha();
    captchaInput.value = "";
    return;
  }

  const orderNumber = "DB" + Date.now();

  const order = {
    orderNumber,
    customer: name,
    phone,
    items: OrderApp.cart,
    total: OrderApp.total,
    time: new Date().toLocaleString(),
    status: "Pending"
  };

  // Save to localStorage order history
  const orders = JSON.parse(localStorage.getItem("daybreakOrders")) || [];
  orders.push(order);
  localStorage.setItem("daybreakOrders", JSON.stringify(orders));

  // Keep latest order
  localStorage.setItem("daybreakLatestOrder", JSON.stringify(order));

  // Clear cart
  localStorage.removeItem("daybreak_cart");
  OrderApp.cart = [];
  OrderApp.total = 0;
  OrderApp.renderCart();

  // Session lock
  sessionStorage.setItem("orderPlaced", "true");

  // Show confirmation page
  const layout = document.querySelector(".order-layout");
  const sessionMsg = document.getElementById("sessionMessage");

  if (layout && sessionMsg) {
    layout.innerHTML = `
      <section class="card confirmation-card">
        <h1>Order confirmed</h1>
        <p>Thank you, <strong>${name}</strong>.</p>
        <p>Your order number is <strong>${orderNumber}</strong>.</p>
        <p>Total: <strong>$${order.total.toFixed(2)}</strong></p>
        <p>Please quote your order number and pay at the counter when you arrive.</p>
      </section>
    `;
    sessionMsg.hidden = true;
  } else {
    alert(
      `Order placed successfully!\nOrder number: ${orderNumber}\nTotal: $${order.total.toFixed(
        2
      )}\nPlease pay at the counter.`
    );
  }
}

function adminLogin() {
  const pass = prompt("Enter admin password:");
  if (pass === "admin123") {
    window.location.href = "admin.html";
  } else if (pass !== null) {
    alert("Incorrect password.");
  }
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  OrderApp.init();
});
