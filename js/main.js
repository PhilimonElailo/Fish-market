function renderProducts(productsToRender = loadProducts()) {
  const productGrid = document.getElementById("product-grid");
  const emptyState = document.getElementById("product-empty");

  if (!productGrid) {
    return;
  }

  if (!productsToRender.length) {
    productGrid.innerHTML = "";
    emptyState?.classList.remove("hidden");
    return;
  }

  emptyState?.classList.add("hidden");
  productGrid.innerHTML = productsToRender.map((product) => `
    <article class="product-card">
      <div class="product-art product-art--${product.imageStyle || "cover"}">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-content">
        <p class="section-label">Fresh Catch</p>
        <h3>${product.name}</h3>
        <div class="price-row">
          <span class="price-tag">${formatKES(product.price)} / kg</span>
        </div>
        <div class="product-actions">
          <button class="primary-button" type="button" onclick="handleAddToCart(${product.id})">Add to Cart</button>
        </div>
      </div>
    </article>
  `).join("");
}

function refreshProductCatalog() {
  if (document.body.dataset.page === "home" || document.body.dataset.page === "products") {
    renderProducts();
    updateNavCartCount();
  }
}

function handleAddToCart(productId) {
  addToCart(productId);
  updateNavCartCount();
}

function renderCartPage() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartEmpty = document.getElementById("cart-empty");

  if (!cartItemsContainer) {
    return;
  }

  const cart = getCart();

  if (!cart.length) {
    cartItemsContainer.innerHTML = "";
    cartEmpty?.classList.remove("hidden");
  } else {
    cartEmpty?.classList.add("hidden");
    cartItemsContainer.innerHTML = cart.map((item) => `
      <article class="cart-card">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <div class="cart-meta">
            <div>
              <h3>${item.name}</h3>
              <p>${formatKES(item.price)} / kg</p>
            </div>
            <strong>${formatKES(item.price * item.quantity)}</strong>
          </div>
          <div class="cart-actions">
            <label>
              Qty
              <input type="number" min="1" value="${item.quantity}" onchange="handleQuantityChange(${item.id}, this.value)">
            </label>
            <button class="secondary-button" type="button" onclick="handleRemoveFromCart(${item.id})">Remove</button>
          </div>
        </div>
      </article>
    `).join("");
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("summary-items").textContent = totalItems;
  document.getElementById("summary-total").textContent = formatKES(calculateTotal());
  updateNavCartCount();
}

function handleRemoveFromCart(productId) {
  removeFromCart(productId);
  renderCartPage();
}

function handleQuantityChange(productId, quantity) {
  updateQuantity(productId, quantity);
  renderCartPage();
}

function renderCheckoutPage() {
  const checkoutItems = document.getElementById("checkout-items");

  if (!checkoutItems) {
    return;
  }

  const cart = getCart();

  checkoutItems.innerHTML = cart.map((item) => `
    <div class="checkout-line">
      <span>${item.name} x ${item.quantity}</span>
      <strong>${formatKES(item.price * item.quantity)}</strong>
    </div>
  `).join("");

  document.getElementById("checkout-total").textContent = formatKES(calculateTotal());
  updateNavCartCount();
}

function handleCheckoutSubmit(event) {
  event.preventDefault();

  const cart = getCart();
  const message = document.getElementById("checkout-message");

  if (!cart.length) {
    message.textContent = "Your cart is empty. Add fish before placing an order.";
    message.classList.remove("hidden");
    return;
  }

  const customerName = document.getElementById("customer-name").value.trim();
  const customerPhone = document.getElementById("customer-phone").value.trim();

  const orders = loadFromLocalStorage(STORAGE_KEYS.orders, []);
  orders.push({
    id: Date.now(),
    customerName,
    customerPhone,
    items: cart,
    total: calculateTotal(),
    createdAt: new Date().toISOString()
  });

  saveToLocalStorage(STORAGE_KEYS.orders, orders);
  clearCart();
  event.target.reset();
  renderCheckoutPage();

  message.textContent = `Order placed successfully for ${customerName}. We will reach you via ${customerPhone}.`;
  message.classList.remove("hidden");
}

function handleMemberRegistration(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("member-register-message");
  const payload = {
    id: Date.now(),
    name: document.getElementById("member-name").value.trim(),
    contact: document.getElementById("member-contact").value.trim(),
    idNumber: document.getElementById("member-id").value.trim(),
    role: document.getElementById("member-role").value.trim(),
    status: "pending",
    submittedAt: new Date().toISOString()
  };

  const requests = loadMemberRequests();
  requests.push(payload);
  saveMemberRequests(requests);

  form.reset();
  message.textContent = "Thank you. Your BMU membership request has been received and is awaiting review.";
  message.classList.remove("hidden");
}

function applyTheme() {
  const savedTheme = loadFromLocalStorage(STORAGE_KEYS.theme, "light");
  document.body.classList.toggle("dark-mode", savedTheme === "dark");
  updateThemeToggleLabel();
}

function toggleTheme() {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  saveToLocalStorage(STORAGE_KEYS.theme, isDarkMode ? "dark" : "light");
  updateThemeToggleLabel();
}

function updateThemeToggleLabel() {
  const themeToggle = document.getElementById("theme-toggle");

  if (!themeToggle) {
    return;
  }

  const isDarkMode = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDarkMode ? "Back to Normal Colors" : "Night Mode";
  themeToggle.setAttribute(
    "aria-label",
    isDarkMode ? "Switch back to normal colors" : "Switch to night mode"
  );
}

function filterAndRenderProducts() {
  const searchInput = document.getElementById("search-input");
  const priceFilter = document.getElementById("price-filter");

  if (!searchInput || !priceFilter) {
    return;
  }

  const searchValue = searchInput.value.trim().toLowerCase();
  const maxPrice = priceFilter.value;

  const filteredProducts = loadProducts().filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchValue);
    const matchesPrice = maxPrice === "all" ? true : product.price <= Number(maxPrice);
    return matchesSearch && matchesPrice;
  });

  renderProducts(filteredProducts);
}

function isAdminAuthenticated() {
  return localStorage.getItem(STORAGE_KEYS.adminAuth) === "true";
}

function updateAdminLinkVisibility() {
  const showAdminLink = isAdminAuthenticated();
  document.querySelectorAll("[data-admin-link]").forEach((link) => {
    link.classList.toggle("hidden", !showAdminLink);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  updateNavCartCount();
  updateAdminLinkVisibility();

  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
  document.getElementById("member-register-form")?.addEventListener("submit", handleMemberRegistration);

  const page = document.body.dataset.page;

  if (page === "home" || page === "products") {
    renderProducts();
    document.getElementById("search-input")?.addEventListener("input", filterAndRenderProducts);
    document.getElementById("price-filter")?.addEventListener("change", filterAndRenderProducts);
  }

  if (page === "cart") {
    renderCartPage();
  }

  if (page === "checkout") {
    renderCheckoutPage();
    document.getElementById("checkout-form")?.addEventListener("submit", handleCheckoutSubmit);
  }

  window.addEventListener("productsUpdated", refreshProductCatalog);
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEYS.products) {
      refreshProductCatalog();
    }
  });
});
