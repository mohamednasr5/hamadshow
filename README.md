# Nasr Live - IPTV Web Player

<p align="center">
  <img src="img/banner_w.png" alt="Nasr Live" width="200" />
</p>

<h3 align="center">مشغل IPTV احترافي عبر المتصفح</h3>
<p align="center">
  شاهد القنوات التلفزيونية المباشرة والأفلام والمسلسلات مباشرة في متصفحك بدون أي برامج إضافية!
</p>

---

## ✨ المميزات

| الميزة | الوصف |
|--------|-------|
| 🎬 **دعم Xtream API** | متوافق تماماً مع واجهة Xtream Codes API |
| 📺 **البث المباشر** | شاهد جميع القنوات التلفزيونية مباشرة مع دعم HLS |
| 🎥 **الأفلام والمسلسلات** | مكتبة كاملة للأفلام والمسلسلات مع المواسم والحلقات |
| 📋 **دليل البرامج (EPG)** | عرض جدول البرامج التلفزيونية مع شريط التقدم المباشر |
| ❤️ **المفضلة** | أضف قنواتك وأفلامك المفضلة واحفظها |
| ▶️ **تابع المشاهدة** | استكمل مشاهدة الأفلام والمسلسلات من حيث توقفت |
| 🔍 **بحث شامل** | ابحث في القنوات والأفلام والمسلسلات |
| 📺 **صورة في صورة (PiP)** | تابع المشاهدة أثناء تصفح المحتوى |
| ⏩ **الحلقة التالية تلقائياً** | تشغيل الحلقة التالية تلقائياً عند انتهاء الحلقة الحالية |
| 🎨 **تصميم داكن احترافي** | ثيم داكن أنيق مع ألوان ذهبية |
| 📱 **تصميم متجاوب** | يعمل على جميع الأجهزة والشاشات |
| 🌐 **دعم RTL** | واجهة عربية كاملة من اليمين لليسار |
| ⌨️ **اختصارات لوحة المفاتيح** | تحكم كامل بلوحة المفاتيح |
| 🔐 **حماية XSS** | تنظيف المدخلات لحماية من هجمات XSS |
| 📊 **تحسين أسماء الأفلام** | إزالة معلومات الجودة والترميز من الأسماء تلقائياً |
| 🌍 **تكامل TMDB** | [اختياري] عرض معلومات الأفلام من TMDB |

## 🚀 التثبيت

### الطريقة الأولى: استضافة مباشرة (بدون PHP)

1. انسخ جميع الملفات إلى مجلد الخادم الخاص بك
2. افتح ملف `config.js` واضبط الإعدادات التالية:
   ```javascript
   window.playername = "اسم المشغل";  // اختياري
   window.dns = "https://example.com:8080";  // رابط خادم IPTV
   window.cors = false;  // true إذا كنت تحتاج proxy
   ```
3. افتح الموقع في المتصفح

### الطريقة الثانية: مع PHP (لـ EPG و CORS Proxy)

1. انسخ جميع الملفات إلى خادم يدعم PHP
2. اضبط `config.js` كما في الطريقة الأولى
3. افتح `config.php` واضبط إعدادات قاعدة البيانات:
   ```php
   $db_url = "localhost";
   $db_name = "your_database";
   $db_username = "your_username";
   $db_password = "your_password";
   $epg_url = "http://example.com/xmltv.php?username=X&password=Y";
   ```
4. استورد `sql_table.sql` في قاعدة بيانات MySQL
5. إذا كنت تحتاج proxy بسبب CORS، اضبط:
   - `config.js`: `window.cors = true;`
   - `config.php`: `$cors = true;` و `$dns = "http://your-iptv-provider.com";`

## ⚙️ الإعدادات

### config.js

| المتغير | الوصف | الافتراضي |
|---------|-------|-----------|
| `window.playername` | اسم المشغل | "Nasr Live" |
| `window.dns` | رابط خادم IPTV | "" (يدخل المستخدم) |
| `window.cors` | تفعيل CORS proxy | false |
| `window.https` | استخدام SSL | false |
| `window.tmdb` | مفتاح TMDB API | "" |
| `window.autoNextEpisode` | تشغيل الحلقة التالية تلقائياً | true |
| `window.defaultView` | العرض الافتراضي (grid/list) | "grid" |
| `window.defaultLang` | اللغة الافتراضية (ar/en) | "ar" |

### config.css - تخصيص الألوان

```css
:root {
    --second-color: #F5A623;      /* اللون الذهبي */
    --first-color: #1A1A2E;       /* اللون الداكن الأساسي */
    --bg-primary: #0F0F1A;        /* لون الخلفية */
    --bg-secondary: #1A1A2E;      /* لون الخلفية الثانوي */
    --text-primary: #EAEAEA;      /* لون النص الرئيسي */
    --text-secondary: #A0A0B8;    /* لون النص الثانوي */
}
```

## ⌨️ اختصارات لوحة المفاتيح

| المفتاح | الوظيفة |
|---------|---------|
| `Space` / `K` | تشغيل / إيقاف |
| `F` | ملء الشاشة |
| `M` | كتم الصوت |
| `←` | الرجوع 10 ثوانٍ |
| `→` | التقديم 10 ثوانٍ |
| `↑` | رفع الصوت |
| `↓` | خفض الصوت |
| `Escape` | إغلاق / خروج |

## 📁 هيكل المشروع

```
Nasr-Live-IPTV-Web-Player/
├── index.html          # الصفحة الرئيسية
├── config.js           # ملف الإعدادات (عدّل هذا!)
├── config.css          # ألوان الثيم (عدّل هذا!)
├── manifest.json       # PWA manifest
├── .gitignore          # Git ignore
├── README.md           # هذا الملف
│
├── css/
│   └── style.css       # أنماط CSS الرئيسية
│
├── js/
│   ├── app.js          # المتحكم الرئيسي
│   ├── api.js          # وحدة الاتصال بـ Xtream API
│   ├── auth.js         # وحدة تسجيل الدخول
│   ├── router.js       # نظام التوجيه
│   ├── player.js       # مشغل الفيديو (HLS.js)
│   ├── favorites.js    # المفضلة ومتابعة المشاهدة
│   ├── epg.js          # دليل البرامج
│   └── utils.js        # دوال مساعدة
│
├── img/
│   ├── banner_w.png    # الشعار (أبيض)
│   ├── banner_b.png    # الشعار (أسود)
│   └── no_cover.jpg    # صورة بديلة
│
├── proxy.php           # CORS proxy
├── config.php          # إعدادات PHP
├── epg.php             # واجهة EPG
├── epg-api.php         # وظائف EPG
└── sql_table.sql       # جدول EPG في MySQL
```

## 🛠️ التقنيات المستخدمة

- **HTML5** - هيكل الصفحات
- **CSS3** - التصميم مع Custom Properties و Flexbox و Grid
- **Vanilla JavaScript** - بدون إطارات عمل، أداء عالي
- **HLS.js** - تشغيل بث HLS المباشر
- **Xtream Codes API** - بروتوكول IPTV
- **PHP** [اختياري] - CORS proxy و EPG

## 📄 الترخيص

هذا المشروع متاح للاستخدام الشخصي والتجاري.

---

<p align="center">
  <strong>Nasr Live</strong> — مشغل IPTV احترافي 🎬
</p>