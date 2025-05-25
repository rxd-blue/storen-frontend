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
  } else {
    checkCartAndRedirect();
    startFilterPolling();
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
    await fetch(`${API_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    
    alert('✅ تم إضافة المنتج للعربة');
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('❌ حدث خطأ أثناء الإضافة للعربة');
  }
}

async function loadCart() {
  try {
    const response = await fetch(`${API_URL}/cart`);
    const items = await response.json();
    
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
  } catch (error) {
    console.error('Error loading cart:', error);
    cartItems.innerHTML = '<p class="error">حدث خطأ أثناء تحميل العربة</p>';
  }
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
    
    loadCart();
  } catch (error) {
    console.error('Error removing from cart:', error);
    alert('❌ حدث خطأ أثناء حذف المنتج');
  }
}

async function completePurchase() {
  try {
    await fetch(`${API_URL}/cart/reset`, {
      method: 'POST'
    });
    alert('✅ تم إتمام عملية الشراء بنجاح!');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error completing purchase:', error);
    alert('❌ حدث خطأ أثناء إتمام عملية الشراء');
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
      
      // Show success indicator
      const indicator = document.createElement('div');
      indicator.className = 'sync-indicator success';
      indicator.textContent = '✓ تم التحديث';
      document.body.appendChild(indicator);
      setTimeout(() => indicator.remove(), 2000);
    }
  } catch (error) {
    console.error('Error polling filters:', error);
    
    // Show error indicator
    const indicator = document.createElement('div');
    indicator.className = 'sync-indicator error';
    indicator.textContent = '× خطأ في الاتصال';
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 2000);
  }
}

function startFilterPolling() {
  setInterval(pollFilters, 2000);
} 