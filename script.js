// API Configuration
const API_URL = 'https://special-catnip-hawthorn.glitch.me/api';

// Cache DOM elements
const categoryFilter = document.getElementById('categoryFilter');
const brandFilter = document.getElementById('brandFilter');
const productsGrid = document.querySelector('.products-grid');
const cartItems = document.getElementById('cart-items');

// Event Listeners
if (categoryFilter && brandFilter) {
  categoryFilter.addEventListener('change', updateFilters);
  brandFilter.addEventListener('change', updateFilters);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('cart.html')) {
    loadCart();
    startCartPolling(); // Start polling cart in cart page
  } else {
    checkCartAndRedirect();
    startFilterPolling();
    startCartPolling(); // Start polling cart in main page
  }
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
  
  // Show feedback to user
  const feedbackMsg = document.createElement('div');
  feedbackMsg.className = 'filter-feedback';
  feedbackMsg.textContent = `تم تطبيق الفلتر: ${filter.category || 'كل الفئات'} - ${filter.brand || 'كل الماركات'}`;
  document.body.appendChild(feedbackMsg);
  setTimeout(() => feedbackMsg.remove(), 3000);
}

// Cart Functions
async function addToCart(button) {
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
    
    if (response.ok) {
      showNotification('✅ تم إضافة المنتج للعربة');
      // Wait for the notification to be visible
      setTimeout(() => {
        // Redirect to cart page
        window.location.href = 'cart.html';
      }, 1000);
    } else {
      throw new Error('Failed to add to cart');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification('❌ حدث خطأ أثناء الإضافة للعربة', 'error');
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
  } catch (error) {
    console.error('Error loading cart:', error);
    if (cartItems) {
      cartItems.innerHTML = '<p class="error">حدث خطأ أثناء تحميل العربة</p>';
    }
  }
}

function updateCartDisplay(items) {
  if (!cartItems) return; // Guard clause if not in cart page
  
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
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    console.error('Error completing purchase:', error);
    showNotification('❌ حدث خطأ أثناء إتمام عملية الشراء', 'error');
  }
}

// Polling Functions
async function checkCartAndRedirect() {
  try {
    const response = await fetch(`${API_URL}/cart`);
    const cart = await response.json();
    if (cart.length > 0) {
      window.location.href = 'cart.html';
    }
  } catch (error) {
    console.error('Error checking cart:', error);
  }
}

let lastFilter = {};
async function pollFilters() {
  try {
    const response = await fetch(`${API_URL}/filter`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const filter = await response.json();
    
    if (JSON.stringify(filter) !== JSON.stringify(lastFilter)) {
      console.log('New filter received:', filter);
      lastFilter = filter;
      applyFilters(filter);
    }
  } catch (error) {
    console.error('Error polling filters:', error);
  }
}

function startFilterPolling() {
  setInterval(pollFilters, 2000);
}

// Add cart polling function
function startCartPolling() {
  setInterval(async () => {
    try {
      const response = await fetch(`${API_URL}/cart`);
      if (!response.ok) throw new Error('Cart fetch failed');
      const items = await response.json();
      
      // If we're in cart page, update the display
      if (window.location.pathname.includes('cart.html')) {
        updateCartDisplay(items);
      } else {
        // If in main page, show notification for new items
        if (items.length > 0) {
          updateCartBadge(items.length);
        }
      }
    } catch (error) {
      console.error('Error polling cart:', error);
    }
  }, 2000);
}

function updateCartBadge(itemCount) {
  let badge = document.querySelector('.cart-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'cart-badge';
    const cartLink = document.querySelector('.cart-link');
    if (cartLink) {
      cartLink.appendChild(badge);
    }
  }
  badge.textContent = itemCount;
  badge.style.display = itemCount > 0 ? 'block' : 'none';
} 