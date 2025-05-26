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
  categoryFilter.addEventListener('change', updateFilters);
  brandFilter.addEventListener('change', updateFilters);
}

cartToggle.addEventListener('click', () => {
  cartMenu.classList.add('active');
  cartOverlay.classList.add('active');
  loadCart(); // Refresh cart when opened
});

closeCart.addEventListener('click', () => {
  cartMenu.classList.remove('active');
  cartOverlay.classList.remove('active');
});

cartOverlay.addEventListener('click', () => {
  cartMenu.classList.remove('active');
  cartOverlay.classList.remove('active');
});

document.getElementById('completePurchase').addEventListener('click', completePurchase);

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  startFilterPolling();
  startCartPolling();
  loadCart(); // Initial cart load
});

// Filter Functions
function updateFilters() {
  const filter = {
    category: categoryFilter.value,
    brand: brandFilter.value
  };
  
  sendFiltersToAPI(filter);
  applyFilters(filter);
}

async function sendFiltersToAPI(filter) {
  try {
    await fetch(`${API_URL}/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filter)
    });
  } catch (error) {
    console.error('Error sending filters:', error);
  }
}

function applyFilters(filter) {
  const products = document.querySelectorAll('.product');
  products.forEach(product => {
    const matchesCategory = !filter.category || product.dataset.category === filter.category;
    const matchesBrand = !filter.brand || product.dataset.brand === filter.brand;
    
    if (matchesCategory && matchesBrand) {
      product.style.display = 'block';
      product.style.opacity = '1';
      product.style.transform = 'translateY(0)';
    } else {
      product.style.opacity = '0';
      product.style.transform = 'translateY(20px)';
      setTimeout(() => {
        product.style.display = 'none';
      }, 300);
    }
  });
  
  // Update filter UI
  if (categoryFilter) categoryFilter.value = filter.category || '';
  if (brandFilter) brandFilter.value = filter.brand || '';
  
  showNotification(`تم تطبيق الفلتر: ${filter.category || 'كل الفئات'} - ${filter.brand || 'كل الماركات'}`);
}

// Cart Functions
async function addToCart(button) {
  const product = button.closest('.product');
  const item = {
    name: product.querySelector('h3').textContent,
    details: product.querySelector('p').textContent
  };

  try {
    // Show cart menu immediately
    cartMenu.classList.add('active');
    cartOverlay.classList.add('active');

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

    showNotification('✅ تم إضافة المنتج للعربة');
    loadCart(); // Refresh cart display

  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification('❌ حدث خطأ أثناء الإضافة للعربة', 'error');
    
    // Hide cart menu if there was an error
    cartMenu.classList.remove('active');
    cartOverlay.classList.remove('active');
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

async function loadCart() {
  try {
    const response = await fetch(`${API_URL}/cart`);
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
  cartCount.textContent = count;
  cartToggle.style.display = count > 0 ? 'flex' : 'none';
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
    
    // Close cart menu after purchase
    cartMenu.classList.remove('active');
    cartOverlay.classList.remove('active');
  } catch (error) {
    console.error('Error completing purchase:', error);
    showNotification('❌ حدث خطأ أثناء إتمام عملية الشراء', 'error');
  }
}

// Polling Functions
function startFilterPolling() {
  setInterval(async () => {
    try {
      const response = await fetch(`${API_URL}/filter`);
      if (!response.ok) throw new Error('Filter fetch failed');
      const filter = await response.json();
      applyFilters(filter);
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