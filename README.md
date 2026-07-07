# hammadshow — PWA احترافي
### من برمجة وتطوير المهندس محمد حماد

تطبيق بث مباشر احترافي — HTML + CSS + JS فقط — بدون أي Framework

## المميزات
- ✅ PWA كامل (يعمل بدون إنترنت + قابل للتثبيت)
- ✅ دعم كامل للعربية والإنجليزية مع RTL/LTR
- ✅ Firebase Realtime Database (تحكم كامل بالمحتوى)
- ✅ تصميم OLED داكن احترافي مع تأثيرات بصرية
- ✅ شاشة بداية (Splash Screen) متحركة
- ✅ شريط تنقل سفلي مع مؤشر متحرك
- ✅ مشغل فيديو مدمج
- ✅ نظام مفضلات
- ✅ بحث في القنوات والتصنيفات
- ✅ بانرات قابلة للتخصيص
- ✅ Service Worker للتخزين المؤقت
- ✅ متجاوب مع جميع الشاشات

## التشغيل
فقط افتح `index.html` في المتصفح، أو استضفه على أي سيرفر (GitHub Pages, Netlify, etc.)

## التحكم بالمحتوى من Firebase
أضف بيانات في Firebase Console في المسارات التالية:

### settings/
```json
{
  "appName": "hammadshow",
  "welcomeMessageAr": "مرحباً بك في hammadshow",
  "welcomeMessageEn": "Welcome to hammadshow"
}
```

### categories/
```json
{
  "-Nx01": { "nameAr": "رياضة", "nameEn": "Sports", "icon": "⚽", "order": 1, "visible": true }
}
```

### channels/{categoryId}/
```json
{
  "-Nx01": {
    "-NxCh1": {
      "name": "Sports HD", "nameAr": "رياضة عالي الجودة",
      "url": "https://example.com/live/stream.m3u8",
      "logo": "https://example.com/logo.png",
      "type": "live"
    }
  }
}
```

### banners/
```json
{
  "-NxB1": { "titleAr": "مميز", "titleEn": "Featured", "imageUrl": "https://...", "order": 1, "active": true }
}
```

## هيكل الملفات
```
hammadshow-pwa/
├── index.html      ← الصفحة الرئيسية
├── style.css       ← الأنماط (600+ سطر)
├── app.js          ← كل المنطق + Firebase (500+ سطر)
├── sw.js           ← Service Worker
├── manifest.json   ← PWA Manifest
├── icons/          ← أيقونات التطبيق
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   └── icon-maskable-512.png
└── README.md
```

## رابط المطور
https://www.facebook.com/en.mohamed.nasr

© 2024 hammadshow — من برمجة وتطوير المهندس محمد حماد