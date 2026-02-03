# Good Kids VIP (GAS + GitHub Pages) — VIP Dark Theme

واجهة VIP (ألوان فخمة) + سلة احترافية + صورة مصغرة داخل السلة وتكبير عند الضغط + إرسال الطلب تلقائيًا على واتساب.

---

## ✅ حل مشكلة الصورة عندك (API_BASE)
بدل ما الموقع يوقف ويقول "ضع رابط..." بشكل مزعج،
النسخة دي فيها **شاشة إعداد** داخل الموقع:
- افتح الموقع
- الصق رابط نشر Google Apps Script (Web App URL)
- اضغط **حفظ**
سيتخزن الرابط على جهازك في `localStorage`، ويشتغل الموقع فورًا.

وكمان تقدر تضيفه في رابط الموقع:
`?api=YOUR_GAS_URL`

---

## 1) إعداد Google Apps Script (Backend)

1. افتح Google Apps Script وأنشئ مشروع جديد.
2. انسخ محتوى `gas/Code.gs` وضعه في ملف `Code.gs`.
3. عدّل داخل `CONFIG` إذا لزم:
   - `FOLDER_ID` : فولدر الصور على Drive
   - `SHEET_ID`  : ملف Google Sheet لتسجيل الطلبات
   - `WHATSAPP`  : رقم الواتساب (كود الدولة + الرقم)

4. Deploy → New deployment → type: Web app
   - Execute as: Me
   - Who has access: Anyone
5. انسخ **Web app URL** (ينتهي بـ `/exec`).

---

## 2) إعداد GitHub Pages (Frontend)

### أسهل طريقة (بدون تعديل الكود)
- ارفع مجلد `web/` كما هو.
- افتح الموقع لأول مرة → الصق رابط GAS → حفظ ✅

### أو تعديل ملف config.js
في `web/config.js` ضع:
- `API_BASE` (رابط GAS)
- `LOGO_ID` (اختياري)
- روابط التواصل (اختياري)

---

## ملاحظات مهمة للصور
- الصور تُعرض من Google Drive عبر `lh3.googleusercontent.com`.
- تأكد أن الصور أو الفولدر متاح "Anyone with the link" لكي تظهر على GitHub Pages.

---

## محتويات المشروع
- `web/index.html`  (الواجهة)
- `web/config.js`   (الإعدادات)
- `gas/Code.gs`     (API + الطلبات)


---

## ✅ تم ضبط API_BASE تلقائياً
تم وضع رابط الـ GAS داخل `web/config.js` مسبقاً.
