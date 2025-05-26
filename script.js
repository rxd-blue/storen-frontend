// API Configuration
const API_URL = 'https://special-catnip-hawthorn.glitch.me/api';

// Cache DOM elements
const categoryFilter = document.getElementById('categoryFilter');
const brandFilter = document.getElementById('brandFilter');
const productsGrid = document.querySelector('.products-grid');
const cartMenu = document.getElementById('cartMenu');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartToggle = document.getElementById('cartToggle');
const closeCart = document.getElementById('closeCart');

let currentFilter = {
  category: '',
  brand: ''
};

// Event Listeners
if (categoryFilter && brandFilter) {
  categoryFilter.addEventListener('change', () => handleFilterChange());
  brandFilter.addEventListener('change', () => handleFilterChange());
}

cartToggle.addEventListener('click', toggleCart);
closeCart.addEventListener('click', closeCartMenu);
cartOverlay.addEventListener('click', closeCartMenu);
document.getElementById('completePurchase').addEventListener('click', completePurchase);

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialProducts();
  startCartPolling();
});

// Cart Functions
function toggleCart() {
  if (cartMenu.classList.contains('active')) {
    closeCartMenu();
  } else {
    openCart();
  }
}

function openCart() {
  cartMenu.classList.add('active');
  cartOverlay.classList.add('active');
  loadCart(); // Refresh cart when opened
}

function closeCartMenu() {
  cartMenu.classList.remove('active');
  cartOverlay.classList.remove('active');
}

async function loadInitialProducts() {
  try {
    await handleFilterChange(); // This will load products with current filters
  } catch (error) {
    console.error('Error loading initial products:', error);
    showNotification('❌ حدث خطأ أثناء تحميل المنتجات', 'error');
  }
}

function displayProducts(products) {
  if (!productsGrid) return;
  
  if (!Array.isArray(products) || products.length === 0) {
    productsGrid.innerHTML = '<p class="no-products">لا توجد منتجات متاحة</p>';
    return;
  }

  productsGrid.innerHTML = products.map(product => `
    <div class="product" data-category="${product.category || ''}" data-brand="${product.brand || ''}">
      <h3>${product.name}</h3>
      <p>${product.details || ''}</p>
      <button onclick="addToCart(this)" class="add-to-cart-btn">أضف للعربة</button>
    </div>
  `).join('');
}

// Filter Functions
async function handleFilterChange() {
  try {
    const newFilter = {
      category: categoryFilter.value,
      brand: brandFilter.value
    };

    // Only proceed if filters have actually changed
    if (JSON.stringify(newFilter) === JSON.stringify(currentFilter)) {
      return;
    }

    currentFilter = newFilter;

    // Send filter to API
    const filterResponse = await fetch(`${API_URL}/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newFilter)
    });

    if (!filterResponse.ok) {
      throw new Error('Failed to send filter');
    }

    // Fetch filtered products
    const productsResponse = await fetch(`${API_URL}/products`);
    if (!productsResponse.ok) {
      throw new Error('Failed to fetch filtered products');
    }

    const products = await productsResponse.json();
    
    // Filter products on client side as well
    const filteredProducts = products.filter(product => {
      const matchesCategory = !newFilter.category || product.category === newFilter.category;
      const matchesBrand = !newFilter.brand || product.brand === newFilter.brand;
      return matchesCategory && matchesBrand;
    });

    displayProducts(filteredProducts);
    showNotification('✅ تم تطبيق الفلتر بنجاح');
  } catch (error) {
    console.error('Error applying filter:', error);
    showNotification('❌ حدث خطأ أثناء تطبيق الفلتر', 'error');
  }
}

async function addToCart(button) {
  // Disable the button immediately to prevent double clicks
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = 'جاري الإضافة...';

  const product = button.closest('.product');
  const item = {
    name: product.querySelector('h3').textContent,
    details: product.querySelector('p').textContent
  };

  try {
    const response = await fetch(`${API_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });

    if (!response.ok) {
      throw new Error('Failed to add to cart');
    }

    // Show success state
    button.textContent = '✓ تمت الإضافة';
    showNotification('✅ تم إضافة المنتج للعربة');

    // Open cart with animation
    requestAnimationFrame(() => {
      openCart();
      // Force a reflow to ensure the animation plays
      cartMenu.offsetHeight;
    });

    // Update cart contents
    await loadCart();

    // Reset button after delay
    setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
    }, 2000);

  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification('❌ حدث خطأ أثناء الإضافة للعربة', 'error');
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function loadCart() {
  try {
    const response = await fetch(`${API_URL}/cart`);
    if (!response.ok) throw new Error('Failed to load cart');
    const items = await response.json();
    updateCartDisplay(items);
    updateCartCount(items.length);
  } catch (error) {
    console.error('Error loading cart:', error);
    if (cartItems) {
      cartItems.innerHTML = '<p class="error">حدث خطأ أثناء تحميل العربة</p>';
    }
  }
}

function updateCartDisplay(items) {
  if (!cartItems) return;
  
  if (!items.length) {
    cartItems.innerHTML = '<p class="empty-cart">العربة فارغة</p>';
    return;
  }

  cartItems.innerHTML = items.map(item => `
    <div class="cart-item">
      <div>
        <h3>${item.name}</h3>
        <p>${item.details || ''}</p>
      </div>
      <button onclick="removeFromCart('${item.name}')" class="remove-btn">حذف</button>
    </div>
  `).join('');
}

function updateCartCount(count) {
  if (cartCount) cartCount.textContent = count;
  if (cartToggle) cartToggle.style.display = count > 0 ? 'flex' : 'none';
}

// Cart Polling
function startCartPolling() {
  setInterval(loadCart, 2000);
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

async function removeFromCart(productName) {
  try {
    const response = await fetch(`${API_URL}/cart`);
    const items = await response.json();
    const updatedItems = items.filter(item => item.name !== productName);
    
    const updateResponse = await fetch(`${API_URL}/cart/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedItems)
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to remove item from cart');
    }
    
    showNotification('✅ تم حذف المنتج من العربة');
    await loadCart();
  } catch (error) {
    console.error('Error removing from cart:', error);
    showNotification('❌ حدث خطأ أثناء حذف المنتج', 'error');
  }
}

async function completePurchase() {
  try {
    const response = await fetch(`${API_URL}/cart/reset`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to complete purchase');
    }

    showNotification('✅ تم إتمام عملية الشراء بنجاح!');
    await loadCart();
    closeCartMenu();
  } catch (error) {
    console.error('Error completing purchase:', error);
    showNotification('❌ حدث خطأ أثناء إتمام عملية الشراء', 'error');
  }
} 