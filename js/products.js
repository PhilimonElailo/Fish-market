const STORAGE_KEYS = {
  products: "fishMarketProducts",
  cart: "fishMarketCart",
  orders: "fishMarketOrders",
  theme: "fishMarketTheme",
  adminAuth: "fishMarketAdminAuth"
};

const BRAND = {
  name: "SilverFin Market",
  short: "SF"
};

const ADMIN_PASSCODE = "silverfin-2026";

const defaultProducts = [
  {
    id: 1,
    name: "Nile Perch",
    price: 500,
    image: "assets/images/nile-perch.jpg",
    imageStyle: "contain"
  },
  {
    id: 2,
    name: "Tilapia",
    price: 450,
    image: "assets/images/black-tilapia-tilapia.jpg",
    imageStyle: "contain"
  },
  {
    id: 3,
    name: "Salmon",
    price: 1200,
    image: "assets/images/salmon.png",
    imageStyle: "contain"
  },
  {
    id: 4,
    name: "Cat Fish",
    price: 680,
    image: "assets/images/cat-fish.jfif",
    imageStyle: "contain"
  },
  {
    id: 5,
    name: "Fresh Sardines",
    price: 350,
    image: "assets/images/overhead-shot-sardines-placed-dark-green-plate.jpg",
    imageStyle: "cover"
  },
  {
    id: 6,
    name: "Tuna",
    price: 850,
    image: "assets/images/tuna.jpg",
    imageStyle: "contain"
  },
  {
    id: 7,
    name: "Thorny Red Tilapia",
    price: 620,
    image: "assets/images/red.jfif",
    imageStyle: "contain"
  },
  {
    id: 8,
    name: "Gold Fish",
    price: 540,
    image: "assets/images/gold.jfif",
    imageStyle: "contain"
  },
  {
    id: 9,
    name: "Snapper",
    price: 980,
    image: "assets/images/snapper.png",
    imageStyle: "contain"
  },
  {
    id: 10,
    name: "Anchovy",
    price: 300,
    image: "assets/images/anchovy.jfif",
    imageStyle: "contain"
  },
  {
    id: 11,
    name: "Pollock",
    price: 760,
    image: "assets/images/pollock.jfif",
    imageStyle: "contain"
  },
  {
    id: 12,
    name: "Trout",
    price: 900,
    image: "assets/images/trout.jfif",
    imageStyle: "contain"
  }
];

function saveToLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadFromLocalStorage(key, fallback = []) {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return fallback;
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    return fallback;
  }
}

function loadProducts() {
  const rawProducts = localStorage.getItem(STORAGE_KEYS.products);

  if (!rawProducts) {
    saveToLocalStorage(STORAGE_KEYS.products, defaultProducts);
    return [...defaultProducts];
  }

  const storedProducts = loadFromLocalStorage(STORAGE_KEYS.products, []);

  if (!Array.isArray(storedProducts)) {
    return [...defaultProducts];
  }

  const customProducts = storedProducts.filter((product) => !defaultProducts.some((defaultProduct) => defaultProduct.id === product.id));
  const normalizedProducts = [...defaultProducts, ...customProducts];
  const needsCatalogSync = JSON.stringify(normalizedProducts) !== JSON.stringify(storedProducts);

  if (needsCatalogSync) {
    saveToLocalStorage(STORAGE_KEYS.products, normalizedProducts);
    return normalizedProducts;
  }

  return storedProducts;
}

function getProductById(productId) {
  return loadProducts().find((product) => product.id === Number(productId));
}

function saveProducts(products) {
  saveToLocalStorage(STORAGE_KEYS.products, products);
}

function formatKES(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(amount);
}
