import { watchAuth, logout, fetchMyProfile } from "./auth.js";
import { db } from "./firebase.js";
import { TENANT_ID } from "./config.js";
import {
  collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp,
  doc, setDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (sel) => document.querySelector(sel);

function toast(title, msg){
  const t = $("#toast");
  $("#toastTitle").textContent = title;
  $("#toastMsg").textContent = msg || "";
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 4200);
}

function stars(score){
  const s = Math.max(0, Math.min(5, Number(score||0)));
  const full = "★".repeat(Math.round(s));
  const empty = "☆".repeat(5 - Math.round(s));
  return full + empty;
}

function money(n){
  const v = Number(n||0);
  return v.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadKPIs(){
  // KPI demo aggregation from last N customers docs (fast, works free tier)
  const qy = query(collection(db, "tenants", TENANT_ID, "customers"), orderBy("updatedAt", "desc"), limit(250));
  const snap = await getDocs(qy);

  let totalSales = 0, totalReturns = 0, totalPayments = 0, totalDiscounts = 0, count = 0, sumStars = 0;

  snap.forEach(d=>{
    const x = d.data();
    totalSales += Number(x.sales||0);
    totalReturns += Number(x.returns||0);
    totalPayments += Number(x.payments||0);
    totalDiscounts += Number(x.discounts||0);
    sumStars += Number(x.stars||0);
    count += 1;
  });

  $("#kpiSales").textContent = money(totalSales);
  $("#kpiReturns").textContent = money(totalReturns);
  $("#kpiPayments").textContent = money(totalPayments);
  $("#kpiDiscounts").textContent = money(totalDiscounts);
  $("#kpiCustomers").textContent = count.toLocaleString("ar-EG");
  $("#kpiStars").textContent = count ? (sumStars / count).toFixed(1) : "0.0";
}

let allCustomers = [];

function renderCustomers(list){
  const tbody = $("#customersTbody");
  tbody.innerHTML = "";
  list.forEach(c=>{
    const tr = document.createElement("tr");
    tr.innerHTML = [
      `<td><strong>${escapeHtml(c.name||"—")}</strong><div class="small">${escapeHtml(c.code||"")}</div></td>`,
      `<td>${money(c.sales)}</td>`,
      `<td>${money(c.returns)}</td>`,
      `<td>${money(c.payments)}</td>`,
      `<td>${money(c.discounts)}</td>`,
      `<td><span class="pill">${stars(c.stars||0)}</span></td>`,
      `<td><button class="btn secondary" data-id="${c.id}">فتح</button></td>`
    ].join("");
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-id]").forEach(btn=>{
    btn.addEventListener("click", ()=> openCustomer(btn.getAttribute("data-id")));
  });
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

async function loadCustomers(){
  const qy = query(collection(db, "tenants", TENANT_ID, "customers"), orderBy("updatedAt","desc"), limit(500));
  const snap = await getDocs(qy);
  allCustomers = snap.docs.map(d=>({ id:d.id, ...d.data() }));
  renderCustomers(allCustomers);
  $("#customersCount").textContent = allCustomers.length.toLocaleString("ar-EG");
}

function applySearch(){
  const q = ($("#search").value || "").trim().toLowerCase();
  if(!q){ renderCustomers(allCustomers); return; }
  const filtered = allCustomers.filter(c=>{
    const name = String(c.name||"").toLowerCase();
    const code = String(c.code||"").toLowerCase();
    return name.includes(q) || code.includes(q);
  });
  renderCustomers(filtered);
}

async function openCustomer(id){
  const c = allCustomers.find(x=>x.id===id);
  if(!c) return;
  $("#modalName").textContent = c.name || "عميل";
  $("#mSales").value = Number(c.sales||0);
  $("#mReturns").value = Number(c.returns||0);
  $("#mPayments").value = Number(c.payments||0);
  $("#mDiscounts").value = Number(c.discounts||0);
  $("#mStars").value = Number(c.stars||0);
  $("#modal").dataset.id = id;
  $("#modal").showModal();
}

async function saveCustomer(){
  const id = $("#modal").dataset.id;
  const ref = doc(db, "tenants", TENANT_ID, "customers", id);
  const payload = {
    sales: Number($("#mSales").value||0),
    returns: Number($("#mReturns").value||0),
    payments: Number($("#mPayments").value||0),
    discounts: Number($("#mDiscounts").value||0),
    stars: Number($("#mStars").value||0),
    updatedAt: serverTimestamp()
  };
  await updateDoc(ref, payload);
  $("#modal").close();
  toast("تم الحفظ", "تم تحديث بيانات العميل بنجاح");
  await loadCustomers();
  await loadKPIs();
}

async function addCustomer(){
  const name = prompt("اسم العميل:");
  if(!name) return;
  const code = prompt("كود العميل (اختياري):") || "";
  const ref = collection(db, "tenants", TENANT_ID, "customers");
  await addDoc(ref, {
    name, code,
    sales: 0, returns: 0, payments: 0, discounts: 0, stars: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  toast("تمت الإضافة", "تم إنشاء عميل جديد");
  await loadCustomers();
  await loadKPIs();
}

function downloadCSV(){
  const headers = ["id","name","code","sales","returns","payments","discounts","stars"];
  const rows = [headers.join(",")];
  allCustomers.forEach(c=>{
    const vals = headers.map(h => String((c[h] ?? "")).replaceAll('"','""'));
    rows.push(vals.map(v=>`"${v}"`).join(","));
  });
  const blob = new Blob([rows.join("\n")], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "customers.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importCSV(file){
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if(lines.length < 2){ toast("خطأ", "ملف CSV فارغ"); return; }
  const headers = parseCSVLine(lines[0]).map(h=>h.trim());
  const idx = (name) => headers.indexOf(name);

  const need = ["name","code","sales","returns","payments","discounts","stars"];
  for(const n of need){
    if(idx(n) === -1){
      toast("خطأ", `العمود مفقود: ${n}`);
      return;
    }
  }

  const colRef = collection(db, "tenants", TENANT_ID, "customers");
  let ok = 0;
  for(let i=1;i<lines.length;i++){
    const cols = parseCSVLine(lines[i]);
    if(!cols.length) continue;
    const name = cols[idx("name")] || "";
    if(!name) continue;
    await addDoc(colRef, {
      name,
      code: cols[idx("code")] || "",
      sales: Number(cols[idx("sales")]||0),
      returns: Number(cols[idx("returns")]||0),
      payments: Number(cols[idx("payments")]||0),
      discounts: Number(cols[idx("discounts")]||0),
      stars: Number(cols[idx("stars")]||0),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    ok++;
  }
  toast("تم الاستيراد", `تم إضافة ${ok} عميل`);
  await loadCustomers();
  await loadKPIs();
}

function parseCSVLine(line){
  // Simple CSV parser for quoted values
  const out = [];
  let cur = "", inQ = false;
  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(ch === '"' ){
      if(inQ && line[i+1] === '"'){ cur += '"'; i++; }
      else inQ = !inQ;
    } else if(ch === "," && !inQ){
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function printCurrent(){
  window.print();
}

function showView(view){
  document.querySelectorAll("[data-view]").forEach(el=>{
    el.style.display = (el.getAttribute("data-view") === view) ? "block" : "none";
  });
  document.querySelectorAll("[data-nav]").forEach(btn=>{
    btn.setAttribute("aria-current", btn.getAttribute("data-nav") === view ? "true" : "false");
  });
}

async function initApp(){
  $("#btnLogout").addEventListener("click", async ()=>{
    await logout();
    location.href = "./index.html";
  });

  // Nav
  document.querySelectorAll("[data-nav]").forEach(b=>{
    b.addEventListener("click", ()=> showView(b.getAttribute("data-nav")));
  });

  $("#search").addEventListener("input", applySearch);
  $("#btnAddCustomer").addEventListener("click", addCustomer);
  $("#btnExport").addEventListener("click", downloadCSV);
  $("#btnPrint").addEventListener("click", printCurrent);
  $("#csvFile").addEventListener("change", (e)=>{
    const f = e.target.files && e.target.files[0];
    if(f) importCSV(f);
    e.target.value = "";
  });

  $("#btnSaveCustomer").addEventListener("click", saveCustomer);
  $("#btnCloseModal").addEventListener("click", ()=>$("#modal").close());

  await loadKPIs();
  await loadCustomers();
}

watchAuth(async (user)=>{
  if(!user){ location.replace("./index.html"); return; }

  const profile = await fetchMyProfile(user.uid);
  if(!profile){
    toast("ملاحظة", "تم الدخول لكن الحساب غير مُفعل داخل Firestore (users/uid).");
  }

  $("#meName").textContent = (profile && profile.displayName) ? profile.displayName : (user.email || "مستخدم");
  $("#meRole").textContent = (profile && profile.role) ? profile.role : "user";
  $("#meUid").textContent = user.uid;

  // If role is not admin, hide Users section
  const role = (profile && profile.role) ? String(profile.role) : "user";
  if(role !== "admin"){
    const usersBtn = document.querySelector('[data-nav="users"]');
    if(usersBtn) usersBtn.style.display = "none";
  }

  await initApp();
});
