# 🎯 راهنمای استفاده از فونت‌های سفارشی

## 📋 **فونت‌های موجود:**

### **🎯 Mahal - برای تیترها و سرفصل‌ها**
- وزن‌ها: Thin (100) تا Black (900)
- کاربرد: عناوین، سرفصل‌ها، دکمه‌های مهم

### **📝 Lahzeh - برای متن اصلی**  
- وزن‌ها: Thin (100) تا Black (900)
- کاربرد: متن‌های اصلی، توضیحات، محتوا

## 🛠️ **روش‌های استفاده:**

### **1️⃣ کلاس‌های CSS آماده (پیشنهادی ⭐):**

```jsx
// کلاس‌های فونت اصلی
<h1 className="font-mahal font-bold text-3xl">عنوان با فونت Mahal</h1>
<p className="font-lahzeh font-normal text-base">متن با فونت Lahzeh</p>

// Aliases راحت‌تر
<h2 className="font-headers font-semibold text-2xl">تیتر</h2>
<span className="font-body font-medium text-sm">متن</span>

// کلاس‌های ترکیبی آماده
<h1 className="title-primary">تیتر اصلی</h1>      // Mahal + Bold + 1.5rem
<h2 className="title-secondary">تیتر فرعی</h2>    // Mahal + SemiBold + 1.25rem
<p className="text-primary">متن اصلی</p>        // Lahzeh + Normal + 1rem
<span className="text-medium">متن پررنگ</span>   // Lahzeh + Medium + 1rem
```

### **2️⃣ CSS Variables (برای کاستوم‌سازی):**

```css
.my-custom-class {
  font-family: var(--font-headers);  /* Mahal */
  font-weight: var(--font-bold);     /* 700 */
}

.my-text-class {
  font-family: var(--font-body);     /* Lahzeh */
  font-weight: var(--font-medium);   /* 500 */
}
```

### **3️⃣ Inline Styles (فقط در موارد خاص):**

```jsx
<h1 style={{ fontFamily: 'Mahal, Vazirmatn, Arial, sans-serif', fontWeight: 700 }}>
  تیتر خاص
</h1>
```

## 🎨 **نمونه‌های عملی:**

### **کارت محصول:**
```jsx
const ProductCard = () => (
  <div className="card">
    <h3 className="font-mahal font-bold text-xl mb-2">نام محصول</h3>
    <p className="font-lahzeh font-normal text-sm text-gray-600 mb-4">
      توضیحات محصول با فونت Lahzeh خوانا و زیبا
    </p>
    <button className="font-mahal font-semibold btn-primary">
      خرید محصول
    </button>
  </div>
);
```

### **صفحه داشبورد:**
```jsx
const Dashboard = () => (
  <div>
    <h1 className="font-headers font-bold text-4xl text-gray-900 mb-2">
      داشبورد مدیریت
    </h1>
    <p className="font-body font-normal text-lg text-gray-600 mb-8">
      به پنل مدیریت سیستم خوش آمدید
    </p>
    
    <div className="grid grid-cols-3 gap-6">
      <div className="card">
        <h3 className="title-secondary mb-3">آمار فروش</h3>
        <p className="text-primary">اطلاعات و آمار فروش ماهانه</p>
      </div>
    </div>
  </div>
);
```

## 📊 **جدول مرجع کلاس‌های آماده:**

| **کلاس CSS** | **فونت** | **وزن** | **سایز** | **کاربرد** |
|---------------|----------|----------|----------|------------|
| `font-mahal` | Mahal | - | - | فونت تیترها |
| `font-lahzeh` | Lahzeh | - | - | فونت متن |
| `font-headers` | Mahal | - | - | alias تیترها |
| `font-body` | Lahzeh | - | - | alias متن |
| `title-primary` | Mahal | 700 | 1.5rem | تیتر اصلی |
| `title-secondary` | Mahal | 600 | 1.25rem | تیتر فرعی |
| `text-primary` | Lahzeh | 400 | 1rem | متن اصلی |
| `text-medium` | Lahzeh | 500 | 1rem | متن پررنگ |

## ⚡ **نکات مهم برای Tailwind v4:**

### **🚨 تغییرات مهم:**
- ✅ **کلاس‌های CSS:** از کلاس‌های تعریف شده در `index.css` استفاده کنید
- ❌ **Tailwind Classes:** `font-mahal` و `font-lahzeh` به صورت Tailwind کار نمی‌کند
- ✅ **ترکیب:** کلاس‌های فونت + وزن و سایز Tailwind

### **✅ روش‌های درست:**
```jsx
// ✅ درست - ترکیب کلاس CSS + Tailwind
<h1 className="font-mahal font-bold text-3xl">تیتر</h1>
<p className="font-lahzeh font-normal text-base">متن</p>

// ✅ درست - کلاس‌های آماده
<h1 className="title-primary">تیتر اصلی</h1>
<p className="text-primary">متن اصلی</p>

// ✅ درست - استفاده از aliases
<h2 className="font-headers font-semibold text-2xl">تیتر</h2>
<span className="font-body font-medium text-sm">متن</span>
```

### **❌ روش‌های غلط:**
```jsx
// ❌ غلط - این کلاس‌ها وجود ندارند
<h1 className="font-title font-bold">تیتر</h1>
<p className="font-text font-normal">متن</p>
```

## 🔧 **Troubleshooting:**

### **فونت لود نمی‌شود؟**
1. مسیر فونت‌ها را چک کنید: `src/assets/fonts/`
2. فایل `fonts.css` import شده باشد در `index.css`
3. Cache مرورگر را پاک کنید (Ctrl+F5)
4. Developer Tools → Network → فونت‌ها بارگذاری شده باشند

### **کلاس‌ها کار نمی‌کنند؟**
1. `npm run dev` را restart کنید
2. مطمئن شوید کلاس‌ها در `index.css` تعریف شده‌اند
3. Inspector کنید و ببینید CSS اعمال شده یا نه

### **فونت در Production کار نمی‌کند؟**
1. فونت‌ها در build نهایی کپی شوند
2. مسیرهای relative درست باشند
3. فایل‌های فونت accessible باشند

## 🚀 **آماده به کار!**
حالا می‌تونید از فونت‌های زیبای Mahal و Lahzeh استفاده کنید! 🎉

### **🔥 تست سریع:**
```jsx
// این کد رو امتحان کنید:
<div className="p-8">
  <h1 className="font-mahal font-bold text-4xl mb-4">سلام دنیا!</h1>
  <p className="font-lahzeh font-normal text-lg">
    این متن با فونت Lahzeh نوشته شده است.
  </p>
</div>
``` 