# Customer Evaluation – CRM Score (Firebase + GitHub Pages)

## ✅ ما هذه النسخة؟
واجهة CRM احترافية (RTL عربية) تعمل على:
- GitHub Pages (Static)
- Firebase Authentication (Email/Password)
- Firestore Database

## 1) إعداد Firebase
من Firebase Console:
1. Project Settings → Your apps → Web app config
2. افتح الملف: `js/config.js`
3. ضع القيم: `apiKey` و `authDomain` و `projectId`

## 2) Authorized Domains
Firebase → Authentication → Settings → Authorized domains
أضف:
- moaeydsede.github.io

## 3) تفعيل تسجيل الدخول
Firebase → Authentication → Sign-in method
فعّل:
- Email/Password

## 4) قاعدة البيانات (Firestore)
قم بإنشاء:
- tenants/Main/customers  (Collection)
- tenants/Main/users      (Collection)

### تفعيل المستخدم (صلاحيات)
بعد تسجيل الدخول، ضع وثيقة للمستخدم:
`tenants/Main/users/<uid>`
مثال:
{
  "displayName": "Admin",
  "role": "admin",
  "active": true
}

## 5) تشغيل
- `index.html` صفحة الدخول
- `app.html` لوحة التحكم

## CSV Import/Export
- تصدير: زر "تصدير CSV"
- استيراد: زر "استيراد CSV"
الأعمدة المطلوبة:
name,code,sales,returns,payments,discounts,stars
