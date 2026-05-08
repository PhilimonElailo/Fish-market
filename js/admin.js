function resetAdminForm() {
  document.getElementById("admin-form").reset();
  document.getElementById("product-id").value = "";
  document.getElementById("cancel-edit").classList.add("hidden");
}

function isAdminAuthenticated() {
  return localStorage.getItem(STORAGE_KEYS.adminAuth) === "true";
}

function unlockAdminView() {
  document.getElementById("admin-gate")?.classList.add("hidden");
  document.getElementById("admin-content")?.classList.remove("hidden");
}

function initializeAdminDashboard() {
  unlockAdminView();
  renderAdminProducts();
  document.getElementById("admin-form")?.addEventListener("submit", addProduct);
  document.getElementById("cancel-edit")?.addEventListener("click", resetAdminForm);
}

function handleAdminLogin(event) {
  event.preventDefault();

  const passcodeInput = document.getElementById("admin-passcode");
  const message = document.getElementById("admin-gate-message");
  const enteredPasscode = passcodeInput.value.trim();

  if (enteredPasscode !== ADMIN_PASSCODE) {
    message.textContent = "Incorrect passcode. Try again.";
    message.classList.remove("hidden");
    return;
  }

  localStorage.setItem(STORAGE_KEYS.adminAuth, "true");
  initializeAdminDashboard();
}

function logoutAdmin() {
  localStorage.removeItem(STORAGE_KEYS.adminAuth);
  window.location.href = "index.html";
}

function renderAdminProducts() {
  const adminProducts = document.getElementById("admin-products");
  const products = loadProducts();

  if (!adminProducts) {
    return;
  }

  adminProducts.innerHTML = products.map((product) => `
    <article class="admin-card">
      <img src="${product.image}" alt="${product.name}">
      <div>
        <h3>${product.name}</h3>
        <p>${formatKES(product.price)} / kg</p>
      </div>
      <div class="admin-actions">
        <button class="edit-button" type="button" onclick="startEditProduct(${product.id})">Edit</button>
        <button class="danger-button" type="button" onclick="deleteProduct(${product.id})">Delete</button>
      </div>
    </article>
  `).join("");

  document.getElementById("dashboard-product-count").textContent = products.length;
  document.getElementById("dashboard-cart-count").textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function addProduct(event) {
  event.preventDefault();

  const idField = document.getElementById("product-id");
  const name = document.getElementById("product-name").value.trim();
  const price = Number(document.getElementById("product-price").value);
  const image = document.getElementById("product-image").value.trim() || "assets/images/fresh-bass-with-white-background.jpg";

  const products = loadProducts();
  const existingId = Number(idField.value);

  if (existingId) {
    const productIndex = products.findIndex((product) => product.id === existingId);

    if (productIndex >= 0) {
      products[productIndex] = {
        id: existingId,
        name,
        price,
        image,
        imageStyle: products[productIndex].imageStyle || "cover"
      };
    }
  } else {
    products.push({
      id: Date.now(),
      name,
      price,
      image,
      imageStyle: "cover"
    });
  }

  saveProducts(products);
  renderAdminProducts();
  resetAdminForm();
}

function startEditProduct(productId) {
  const product = getProductById(productId);

  if (!product) {
    return;
  }

  document.getElementById("product-id").value = product.id;
  document.getElementById("product-name").value = product.name;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-image").value = product.image;
  document.getElementById("cancel-edit").classList.remove("hidden");
}

function deleteProduct(productId) {
  const updatedProducts = loadProducts().filter((product) => product.id !== Number(productId));
  saveProducts(updatedProducts);

  const updatedCart = getCart().filter((item) => item.id !== Number(productId));
  saveCart(updatedCart);

  renderAdminProducts();
}

function applyAdminTheme() {
  const savedTheme = loadFromLocalStorage(STORAGE_KEYS.theme, "light");
  document.body.classList.toggle("dark-mode", savedTheme === "dark");
  updateAdminThemeToggleLabel();
}

function toggleAdminTheme() {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  saveToLocalStorage(STORAGE_KEYS.theme, isDarkMode ? "dark" : "light");
  updateAdminThemeToggleLabel();
}

function updateAdminThemeToggleLabel() {
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

document.addEventListener("DOMContentLoaded", () => {
  applyAdminTheme();
  updateNavCartCount();
  document.getElementById("theme-toggle")?.addEventListener("click", toggleAdminTheme);
  document.getElementById("admin-login-form")?.addEventListener("submit", handleAdminLogin);
  document.getElementById("admin-logout")?.addEventListener("click", logoutAdmin);

  if (!isAdminAuthenticated()) {
    return;
  }

  initializeAdminDashboard();
});
