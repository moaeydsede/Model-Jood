/****************************************************
 * Good Kids VIP — Google Apps Script Backend (API)
 * - Reads product images from a Drive folder
 * - Saves orders to Google Sheet
 * - Returns a WhatsApp "send message" URL
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 ****************************************************/

const CONFIG = {
  FOLDER_ID: "1v_jFj7cQ3ZXiJc-9VWhss7nuzWoPBiws",
  SHEET_ID:  "11p7dGM3aqQamguDftWlGmVs0Oh0HkdUCR2bcXaEPByQ",
  WHATSAPP:  "201066031078", // include country code
  CACHE_SECONDS: 6 * 60 * 60, // 6h
};

function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  const api = (p.api || "").toLowerCase();

  if (api === "products") {
    return jsonResponse({ ok: true, products: getProducts_() });
  }

  if (api === "ping") {
    return jsonResponse({ ok: true, time: new Date().toISOString() });
  }

  return jsonResponse({
    ok: true,
    message: "Good Kids VIP API is running. Use ?api=products or POST to submit orders."
  });
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : "";
    const order = body ? JSON.parse(body) : null;
    if (!order) throw new Error("Missing JSON body");

    const whatsappUrl = submitOrder_(order);
    return jsonResponse({ ok: true, whatsappUrl });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/** ===== Products ===== */
function getProducts_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("products_v3");
  if (cached) return JSON.parse(cached);

  const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  const files = folder.getFiles();

  const list = [];
  while (files.hasNext()) {
    const f = files.next();
    const mime = f.getMimeType() || "";
    if (!mime.startsWith("image/")) continue;

    const model = stripExt_(f.getName());
    const num = parseInt(model, 10);

    const section = (!isNaN(num) && num < 1000)
      ? model.substring(0, 1)
      : model.substring(0, 2);

    list.push({ id: f.getId(), model, section });
  }

  list.sort((a, b) => String(a.model).localeCompare(String(b.model), "ar"));
  cache.put("products_v3", JSON.stringify(list), CONFIG.CACHE_SECONDS);
  return list;
}

function stripExt_(name) {
  return String(name || "").replace(/\.[^/.]+$/, "");
}

/** ===== Orders ===== */
function submitOrder_(order) {
  const name = clean_(order.name);
  const phone = clean_(order.phone);
  const address = clean_(order.address);
  const shipping = clean_(order.shipping);

  const items = Array.isArray(order.items) ? order.items : [];
  if (!name || !phone || items.length === 0) throw new Error("بيانات ناقصة: الاسم/الهاتف/السلة");

  const safeItems = items
    .map(it => ({ model: clean_(it.model), qty: Number(it.qty || 0) }))
    .filter(it => it.model && it.qty > 0);

  if (!safeItems.length) throw new Error("السلة فارغة");

  const total = safeItems.reduce((s, it) => s + it.qty, 0);

  const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheets()[0];
  sh.appendRow([
    new Date(),
    name,
    phone,
    address,
    shipping,
    safeItems.map(i => `${i.model} × ${i.qty}`).join(" | "),
    total
  ]);

  let msg = `طلب جديد - Good Kids VIP\n\n`;
  safeItems.forEach(i => { msg += `موديل ${i.model} × ${i.qty}\n`; });
  msg += `\nإجمالي السيريات: ${total}`;
  msg += `\nالاسم: ${name}`;
  msg += `\nالهاتف: ${phone}`;
  if (address) msg += `\nالعنوان: ${address}`;
  if (shipping) msg += `\nشركة الشحن: ${shipping}`;

  return `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function clean_(v) {
  return String(v == null ? "" : v).trim();
}

/** ===== Utils ===== */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
