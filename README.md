# 🛍️ Smart Shop

متجر ذكي مع واجهة عرض منتجات وعربة شراء متكاملة

## 🌟 المميزات

- ✅ واجهة مستخدم عربية حديثة وجذابة
- ✅ تصفية المنتجات حسب الفئة والماركة
- ✅ عربة شراء ذكية مع إمكانية الإضافة والحذف
- ✅ API كامل لإدارة المنتجات والعربة
- ✅ تحديث مباشر للفلاتر والعربة
- ✅ تصميم متجاوب مع جميع الشاشات

## 🚀 البدء السريع

### متطلبات النظام

- Node.js v14 أو أحدث
- npm v6 أو أحدث

### تشغيل السيرفر المحلي

1. تثبيت الاعتمادات:
   ```bash
   npm install
   ```

2. تشغيل السيرفر:
   ```bash
   npm start
   ```

3. افتح المتصفح على `http://localhost:3000`

## 📡 النشر على الإنترنت

### نشر الواجهة الأمامية

1. ارفع الملفات التالية على GitHub:
   - `index.html`
   - `cart.html`
   - `style.css`
   - `script.js`

2. فعّل GitHub Pages من إعدادات المستودع

### نشر السيرفر

1. انشئ حساب على [Render](https://render.com)
2. اربط المستودع مع Render
3. اختر "Web Service"
4. اضبط الإعدادات:
   - Build Command: `npm install`
   - Start Command: `npm start`

## 🔌 API Endpoints

### الفلاتر

- `POST /api/filter` - تحديث الفلتر الحالي
- `GET /api/filter` - جلب الفلتر الحالي

### عربة الشراء

- `POST /api/cart/add` - إضافة منتج للعربة
- `POST /api/cart/batch` - تحديث العربة بالكامل
- `GET /api/cart` - جلب محتويات العربة
- `POST /api/cart/reset` - تفريغ العربة

## 🛠️ التخصيص

### تغيير الألوان

عدّل المتغيرات في ملف `style.css`:

```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #1d4ed8;
  --background-color: #f8fafc;
  --text-color: #1e293b;
  --border-color: #e2e8f0;
}
```

### إضافة منتجات

أضف منتجات في `index.html`:

```html
<div class="product" data-category="الفئة" data-brand="الماركة">
  <h3>اسم المنتج</h3>
  <p>وصف المنتج</p>
  <button onclick="addToCart(this)">أضف للعربة</button>
</div>
```

## 📝 ملاحظات

- تأكد من تحديث `API_URL` في `script.js` بعد النشر
- استخدم HTTPS للاتصال الآمن
- اضبط CORS حسب احتياجات موقعك 