function resetAdminForm() {
  const adminForm = document.getElementById("admin-form");
  const productIdField = document.getElementById("product-id");
  const cancelButton = document.getElementById("cancel-edit");

  if (adminForm) {
    adminForm.reset();
  }

  if (productIdField) {
    productIdField.value = "";
  }

  if (cancelButton) {
    cancelButton.classList.add("hidden");
  }
}

function isAdminAuthenticated() {
  return localStorage.getItem(STORAGE_KEYS.adminAuth) === "true";
}

function unlockAdminView() {
  const gate = document.getElementById("admin-gate");
  const content = document.getElementById("admin-content");

  if (gate) {
    gate.classList.add("hidden");
  }

  if (content) {
    content.classList.remove("hidden");
  }
}

function bindAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".admin-tab-panel");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const targetId = tab.dataset.tab + "-tab";

      tabs.forEach(function (button) {
        button.classList.toggle("active", button === tab);
      });

      panels.forEach(function (panel) {
        panel.classList.toggle("hidden", panel.id !== targetId);
      });
    });
  });
}

function renderMetrics() {
  const orders = loadFromLocalStorage(STORAGE_KEYS.orders, []);
  const sales = orders.reduce(function (sum, order) {
    return sum + Number(order.total || 0);
  }, 0);

  const memberRequests = loadMemberRequests();
  const activities = loadActivities();
  const approvedMembers = memberRequests.filter(function (member) {
    return member.status === "approved";
  }).length;

  const totalMembersElm = document.getElementById("metric-total-members");
  const approvedMembersElm = document.getElementById("metric-approved-members");
  const totalSalesElm = document.getElementById("metric-total-sales");
  const cleanupElm = document.getElementById("metric-cleanups");

  if (totalMembersElm) {
    totalMembersElm.textContent = String(memberRequests.length);
  }

  if (approvedMembersElm) {
    approvedMembersElm.textContent = String(approvedMembers);
  }

  if (totalSalesElm) {
    totalSalesElm.textContent = formatKES(sales);
  }

  if (cleanupElm) {
    cleanupElm.textContent = String(activities.length);
  }

  const dashboardProductCount = document.getElementById("dashboard-product-count");
  const dashboardCartCount = document.getElementById("dashboard-cart-count");

  if (dashboardProductCount) {
    dashboardProductCount.textContent = String(loadProducts().length);
  }

  if (dashboardCartCount) {
    dashboardCartCount.textContent = String(getCart().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0));
  }
}

function renderMemberRequests() {
  const tbody = document.getElementById("member-requests-body");

  if (!tbody) {
    return;
  }

  const requests = loadMemberRequests();

  if (!requests.length) {
    tbody.innerHTML = '<tr><td colspan="6">No member registrations yet.</td></tr>';
    return;
  }

  tbody.innerHTML = requests.map(function (request) {
    const status = request.status || "pending";
    const statusClass = "status-" + status;
    const row = [
      '<tr>',
      '<td>' + (request.name || "") + '</td>',
      '<td>' + (request.contact || "") + '</td>',
      '<td>' + (request.idNumber || "") + '</td>',
      '<td>' + (request.role || "") + '</td>',
      '<td><span class="status-badge ' + statusClass + '">' + status + '</span></td>',
      '<td><div class="table-actions">',
      '<button type="button" class="small-button success-button" data-member-action="approve" data-member-id="' + request.id + '">Approve</button>',
      '<button type="button" class="small-button danger-button" data-member-action="reject" data-member-id="' + request.id + '">Reject</button>',
      '</div></td>',
      '</tr>'
    ];
    return row.join("");
  }).join("");

  tbody.querySelectorAll("[data-member-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      const action = button.dataset.memberAction;
      const memberId = Number(button.dataset.memberId);
      handleMemberAction(memberId, action);
    });
  });
}

function handleMemberAction(memberId, action) {
  const requests = loadMemberRequests();
  const updatedRequests = requests.map(function (member) {
    if (member.id !== memberId) {
      return member;
    }

    return Object.assign({}, member, {
      status: action === "approve" ? "approved" : "rejected"
    });
  });

  saveMemberRequests(updatedRequests);
  renderMemberRequests();
  renderMetrics();
}

function renderActivityList() {
  const container = document.getElementById("activity-list");

  if (!container) {
    return;
  }

  const activities = loadActivities();
  container.innerHTML = activities.map(function (item) {
    return [
      '<article class="activity-item">',
      '<div>',
      '<p class="section-label">' + (item.date || "") + '</p>',
      '<h3>' + (item.title || "") + '</h3>',
      '</div>',
      '<p>' + (item.details || "") + '</p>',
      '</article>'
    ].join("");
  }).join("");
}

function handleActivitySubmit(event) {
  event.preventDefault();

  const titleInput = document.getElementById("activity-title");
  const detailsInput = document.getElementById("activity-details");
  const dateInput = document.getElementById("activity-date");

  const title = titleInput ? titleInput.value.trim() : "";
  const details = detailsInput ? detailsInput.value.trim() : "";
  const date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().slice(0, 10);

  if (!title || !details) {
    return;
  }

  const activities = loadActivities();
  activities.unshift({
    id: Date.now(),
    title: title,
    details: details,
    date: date
  });

  saveActivities(activities);
  renderActivityList();
  renderMetrics();

  if (event.target) {
    event.target.reset();
  }
}

function initializeAdminDashboard() {
  unlockAdminView();
  renderAdminProducts();
  renderMemberRequests();
  renderActivityList();
  renderMetrics();
  bindAdminTabs();

  const adminForm = document.getElementById("admin-form");
  const cancelEdit = document.getElementById("cancel-edit");
  const activityForm = document.getElementById("activity-form");

  if (adminForm) {
    adminForm.addEventListener("submit", addProduct);
  }

  if (cancelEdit) {
    cancelEdit.addEventListener("click", resetAdminForm);
  }

  if (activityForm) {
    activityForm.addEventListener("submit", handleActivitySubmit);
  }
}

function handleAdminLogin(event) {
  event.preventDefault();

  const passcodeInput = document.getElementById("admin-passcode");
  const message = document.getElementById("admin-gate-message");
  const enteredPasscode = passcodeInput ? passcodeInput.value.trim() : "";

  if (enteredPasscode !== ADMIN_PASSCODE) {
    if (message) {
      message.textContent = "Incorrect passcode. Try again.";
      message.classList.remove("hidden");
    }
    return;
  }

  localStorage.setItem(STORAGE_KEYS.adminAuth, "true");
  initializeAdminDashboard();
}

function logoutAdmin() {
  localStorage.removeItem(STORAGE_KEYS.adminAuth);
  window.location.href = "index.html";
}

function moveProductOrder(productId, direction) {
  const products = loadProducts();
  const index = products.findIndex(function (product) {
    return product.id === Number(productId);
  });

  if (index === -1) {
    return;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= products.length) {
    return;
  }

  const reorderedProducts = [...products];
  const movedProduct = reorderedProducts[index];
  reorderedProducts[index] = reorderedProducts[targetIndex];
  reorderedProducts[targetIndex] = movedProduct;

  saveProducts(reorderedProducts);
  renderAdminProducts();
  renderMetrics();
}

function reorderProductById(draggedProductId, targetProductId) {
  const products = loadProducts();
  const fromIndex = products.findIndex(function (product) {
    return product.id === Number(draggedProductId);
  });
  const toIndex = products.findIndex(function (product) {
    return product.id === Number(targetProductId);
  });

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return;
  }

  const reorderedProducts = [...products];
  const [movedProduct] = reorderedProducts.splice(fromIndex, 1);
  reorderedProducts.splice(toIndex, 0, movedProduct);

  saveProducts(reorderedProducts);
  renderAdminProducts();
  renderMetrics();
}

function renderAdminProducts() {
  const adminProducts = document.getElementById("admin-products");
  const products = loadProducts();

  if (!adminProducts) {
    return;
  }

  adminProducts.innerHTML = products.map(function (product) {
    return [
      '<article class="admin-card" draggable="true" data-product-id="' + product.id + '">',
      '<img src="' + product.image + '" alt="' + product.name + '">',
      '<div>',
      '<h3>' + product.name + '</h3>',
      '<p>' + formatKES(product.price) + ' / kg</p>',
      '</div>',
      '<div class="admin-actions">',
      '<div class="admin-order-controls">',
      '<button class="order-button" type="button" data-reorder="up" data-product-id="' + product.id + '" aria-label="Move ' + product.name + ' up">↑</button>',
      '<button class="order-button" type="button" data-reorder="down" data-product-id="' + product.id + '" aria-label="Move ' + product.name + ' down">↓</button>',
      '</div>',
      '<button class="edit-button" type="button" onclick="startEditProduct(' + product.id + ')">Edit</button>',
      '<button class="danger-button" type="button" onclick="deleteProduct(' + product.id + ')">Delete</button>',
      '</div>',
      '</article>'
    ].join("");
  }).join("");

  let draggedProductId = null;

  adminProducts.querySelectorAll(".admin-card").forEach(function (card) {
    card.addEventListener("dragstart", function (event) {
      draggedProductId = Number(card.dataset.productId);
      card.classList.add("dragging");
      event.dataTransfer?.setData("text/plain", String(draggedProductId));
    });

    card.addEventListener("dragover", function (event) {
      event.preventDefault();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", function () {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", function (event) {
      event.preventDefault();
      const targetProductId = Number(card.dataset.productId);
      card.classList.remove("drag-over");

      if (Number.isNaN(targetProductId) || draggedProductId === null || draggedProductId === targetProductId) {
        return;
      }

      reorderProductById(draggedProductId, targetProductId);
    });

    card.addEventListener("dragend", function () {
      draggedProductId = null;
      card.classList.remove("dragging");
      adminProducts.querySelectorAll(".admin-card").forEach(function (item) {
        item.classList.remove("drag-over");
      });
    });
  });

  adminProducts.querySelectorAll("[data-reorder]").forEach(function (button) {
    button.addEventListener("click", function () {
      moveProductOrder(button.dataset.productId, button.dataset.reorder);
    });
  });

  const dashboardProductCount = document.getElementById("dashboard-product-count");
  const dashboardCartCount = document.getElementById("dashboard-cart-count");

  if (dashboardProductCount) {
    dashboardProductCount.textContent = String(products.length);
  }

  if (dashboardCartCount) {
    dashboardCartCount.textContent = String(getCart().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0));
  }
}

function addProduct(event) {
  event.preventDefault();

  const idField = document.getElementById("product-id");
  const nameInput = document.getElementById("product-name");
  const priceInput = document.getElementById("product-price");
  const imageInput = document.getElementById("product-image");

  const name = nameInput ? nameInput.value.trim() : "";
  const price = priceInput ? Number(priceInput.value) : 0;
  const image = imageInput && imageInput.value.trim() ? imageInput.value.trim() : "assets/images/fresh-bass-with-white-background.jpg";

  const products = loadProducts();
  const existingId = idField ? Number(idField.value) : 0;

  if (existingId) {
    const productIndex = products.findIndex(function (product) {
      return product.id === existingId;
    });

    if (productIndex >= 0) {
      products[productIndex] = {
        id: existingId,
        name: name,
        price: price,
        image: image,
        imageStyle: products[productIndex].imageStyle || "cover"
      };
    }
  } else {
    products.push({
      id: Date.now(),
      name: name,
      price: price,
      image: image,
      imageStyle: "cover"
    });
  }

  saveProducts(products);
  renderAdminProducts();
  renderMetrics();
  resetAdminForm();
}

function startEditProduct(productId) {
  const product = getProductById(productId);

  if (!product) {
    return;
  }

  const productIdField = document.getElementById("product-id");
  const nameInput = document.getElementById("product-name");
  const priceInput = document.getElementById("product-price");
  const imageInput = document.getElementById("product-image");
  const cancelButton = document.getElementById("cancel-edit");

  if (productIdField) {
    productIdField.value = String(product.id);
  }

  if (nameInput) {
    nameInput.value = product.name;
  }

  if (priceInput) {
    priceInput.value = String(product.price);
  }

  if (imageInput) {
    imageInput.value = product.image;
  }

  if (cancelButton) {
    cancelButton.classList.remove("hidden");
  }
}

function deleteProduct(productId) {
  const updatedProducts = loadProducts().filter(function (product) {
    return product.id !== Number(productId);
  });
  saveProducts(updatedProducts);

  const updatedCart = getCart().filter(function (item) {
    return item.id !== Number(productId);
  });
  saveCart(updatedCart);

  renderAdminProducts();
  renderMetrics();
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
  themeToggle.setAttribute("aria-label", isDarkMode ? "Switch back to normal colors" : "Switch to night mode");
}

document.addEventListener("DOMContentLoaded", function () {
  applyAdminTheme();
  updateNavCartCount();

  const themeToggle = document.getElementById("theme-toggle");
  const adminLoginForm = document.getElementById("admin-login-form");
  const adminLogoutButton = document.getElementById("admin-logout");

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleAdminTheme);
  }

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", handleAdminLogin);
  }

  if (adminLogoutButton) {
    adminLogoutButton.addEventListener("click", logoutAdmin);
  }

  if (!isAdminAuthenticated()) {
    return;
  }

  initializeAdminDashboard();
});
