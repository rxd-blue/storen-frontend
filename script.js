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

// Event Listeners
if (categoryFilter && brandFilter) {
  categoryFilter.addEventListener('change', () => handleFilterChange('category'));
  brandFilter.addEventListener('change', () => handleFilterChange('brand'));
}

cartToggle.addEventListener('click', () => {
  toggleCart();
});

closeCart.addEventListener('click', closeCartMenu);
cartOverlay.addEventListener('click', closeCartMenu);
document.getElementById('completePurchase').addEventListener('click', completePurchase);

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  loadInitialProducts();
  startFilterPolling();
  startCartPolling();
  loadCart(); // Initial cart load
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
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    showNotification('❌ حدث خطأ أثناء تحميل المنتجات', 'error');
  }
}

function displayProducts(products) {
  if (!productsGrid) return;
  
  productsGrid.innerHTML = products.map(product => `
    <div class="product" data-category="${product.category || ''}" data-brand="${product.brand || ''}">
      <h3>${product.name}</h3>
      <p>${product.details || ''}</p>
      <button onclick="addToCart(this)">أضف للعربة</button>
    </div>
  `).join('');
}

// Filter Functions
async function handleFilterChange(filterType) {
  const filter = {
    category: categoryFilter.value,
    brand: brandFilter.value
  };

  try {
    // Send filter to API
    const filterResponse = await fetch(`${API_URL}/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filter)
    });

    if (!filterResponse.ok) {
      throw new Error('Failed to send filter');
    }

    // Fetch filtered products
    const productsResponse = await fetch(`${API_URL}/products?category=${filter.category}&brand=${filter.brand}`);
    if (!productsResponse.ok) {
      throw new Error('Failed to fetch filtered products');
    }

    const products = await productsResponse.json();
    displayProducts(products);
    
    showNotification(`✅ تم تطبيق الفلتر: ${filterType === 'category' ? 'الفئة' : 'الماركة'}`);
  } catch (error) {
    console.error('Error applying filter:', error);
    showNotification('❌ حدث خطأ أثناء تطبيق الفلتر', 'error');
  }
}

async function addToCart(button) {
  const product = button.closest('.product');
  const item = {
    name: product.querySelector('h3').textContent,
    details: product.querySelector('p').textContent
  };

  try {
    // Show cart menu immediately
    openCart();

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

    // Animate the button
    button.disabled = true;
    button.textContent = '✓ تمت الإضافة';
    setTimeout(() => {
      button.disabled = false;
      button.textContent = 'أضف للعربة';
    }, 2000);

    showNotification('✅ تم إضافة المنتج للعربة');
    await loadCart(); // Refresh cart display

  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification('❌ حدث خطأ أثناء الإضافة للعربة', 'error');
    closeCartMenu();
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

// Polling Functions
function startFilterPolling() {
  setInterval(async () => {
    try {
      const [filterResponse, productsResponse] = await Promise.all([
        fetch(`${API_URL}/filter`),
        fetch(`${API_URL}/products`)
      ]);

      if (!filterResponse.ok || !productsResponse.ok) {
        throw new Error('Filter or products fetch failed');
      }

      const filter = await filterResponse.json();
      const products = await productsResponse.json();

      // Update filter UI without triggering change event
      if (categoryFilter && categoryFilter.value !== filter.category) {
        categoryFilter.value = filter.category || '';
      }
      if (brandFilter && brandFilter.value !== filter.brand) {
        brandFilter.value = filter.brand || '';
      }

      // Update products display
      displayProducts(products);
    } catch (error) {
      console.error('Error polling filters:', error);
    }
  }, 2000);
}

function startCartPolling() {
  setInterval(async () => {
    try {
      const response = await fetch(`${API_URL}/cart`);
      if (!response.ok) throw new Error('Cart fetch failed');
      const items = await response.json();
      updateCartDisplay(items);
      updateCartCount(items.length);
    } catch (error) {
      console.error('Error polling cart:', error);
    }
  }, 2000);
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
    
    await fetch(`${API_URL}/cart/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedItems)
    });
    
    showNotification('✅ تم حذف المنتج من العربة');
    loadCart();
  } catch (error) {
    console.error('Error removing from cart:', error);
    showNotification('❌ حدث خطأ أثناء حذف المنتج', 'error');
  }
}

async function completePurchase() {
  try {
    await fetch(`${API_URL}/cart/reset`, {
      method: 'POST'
    });
    showNotification('✅ تم إتمام عملية الشراء بنجاح!');
    loadCart();
    closeCartMenu();
  } catch (error) {
    console.error('Error completing purchase:', error);
    showNotification('❌ حدث خطأ أثناء إتمام عملية الشراء', 'error');
  }
} 