function getCart() {
  return loadFromLocalStorage(STORAGE_KEYS.cart, []);
}

function saveCart(cart) {
  saveToLocalStorage(STORAGE_KEYS.cart, cart);
  updateNavCartCount();
}

function addToCart(productId) {
  const product = getProductById(productId);

  if (!product) {
    return;
  }

  const cart = getCart();
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      imageStyle: product.imageStyle,
      quantity: 1
    });
  }

  saveCart(cart);
}

function removeFromCart(productId) {
  const updatedCart = getCart().filter((item) => item.id !== Number(productId));
  saveCart(updatedCart);
  return updatedCart;
}

function updateQuantity(productId, qty) {
  const quantity = Number(qty);
  const cart = getCart();
  const item = cart.find((entry) => entry.id === Number(productId));

  if (!item) {
    return cart;
  }

  if (quantity <= 0 || Number.isNaN(quantity)) {
    return removeFromCart(productId);
  }

  item.quantity = quantity;
  saveCart(cart);
  return cart;
}

function calculateTotal() {
  return getCart().reduce((total, item) => total + (item.price * item.quantity), 0);
}

function clearCart() {
  saveCart([]);
}

function updateNavCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#nav-cart-count").forEach((element) => {
    element.textContent = count;
  });
}
