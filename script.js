/** script.js — نسخة محسّنة وآمنة (انسخ كامل المحتوى واحفظ كـ script.js)
 *
 * تحسينات رئيسية:
 * - إصلاح محددات DOM المكسورة (لم يعد هناك استثناء يمنع تنفيذ JS)
 * - استخدام textContent بدل innerHTML لحماية ضد XSS
 * - تجميع مراجع DOM (cache) لتقليل عمليات DOM المتكررة
 * - إدارة حالة تحميل (spinner/message) وتحسين رسائل الخطأ
 * - debounce لعمليات البحث لتقليل عدد الrequests
 * - وضع نقطة تكوين لجعل استخدام خادم وسيط سهلاً
 *
 * تذكير أمني: لا تضف مفتاح Airtable في الواجهة العامة. استخدم endpoint على الخادم ليحتفظ بالمفتاح.
 */

/* =========================
   إعدادات — غيّر القيم هنا
   ========================= */
const CONFIG = {
  // ضع URL الخادم الوسيط هنا (مفضل). مثال: '/api/airtable' أو '/.netlify/functions/airtable'
  API_BASE: '/api/airtable', // <-- عدّل حسب إعدادك
  // خيار تشغيل مباشر (غير موصى به للإنتاج): لو true ستستخدم AIRTABLE_API_KEY من المتصفح
  USE_DIRECT: false,
  AIRTABLE_API_KEY: '', // إذا فعلت USE_DIRECT ضع المفتاح هنا (غير مستحسن)
  AIRTABLE_BASE_ID: 'appXXXXXXXXXXXX', // ضع Base ID إن كنت تستخدم DIRECT
  AIRTABLE_TABLE_NAME: 'Reservations',   // اسم الجدول في Airtable
  // تكوين العرض
  PAGE_SIZE: 50
};

/* =========================
   ثوابت الحقول (عدّل حسب تكوين قاعدة Airtable)
   استخدم أسماء الحقول كما في Airtable UI أو معرفات الحقول
   ========================= */
const FIELD_IDS = {
  GUEST_NAME: 'Guest Name',
  SUMMARY_COLUMN: 'Summary',
  ARRIVAL: 'Arrival',
  DEPARTURE: 'Departure',
  SUITE_PREFIX: 'Suite' // مثال لاستخدام لو لديك حقول Suite1SuiteCount ... إلخ
};

/* =========================
   أدوات مساعدة عامة
   ========================= */
function qs(sel, parent = document) { return parent.querySelector(sel); }
function qsa(sel, parent = document) { return Array.from(parent.querySelectorAll(sel)); }

function createEl(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') el.className = attrs[k];
    else el.setAttribute(k, attrs[k]);
  }
  if (text) el.textContent = text;
  return el;
}

function formatDateISOToLocal(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString();
  } catch (e) { return dateStr; }
}

function showMessage(msg, type = 'info') {
  // type: info | error | success
  const container = DOM.refs.statusMessage;
  container.textContent = msg;
  container.className = `status-message ${type}`;
  container.style.display = 'block';
  // اخفاء آلي بعد 6 ثواني للحالات non-error
  if (type !== 'error') {
    setTimeout(() => { container.style.display = 'none'; }, 6000);
  }
}

/* Debounce utility */
function debounce(fn, wait = 350) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* =========================
   DOM Caching
   ========================= */
const DOM = {
  refs: {}
};

function cacheDOM() {
  DOM.refs = {
    reservationsTableContainer: qs('#reservationsTableContainer'),
    btnRefresh: qs('#btnRefresh'),
    searchInput: qs('#reservationSearch'),
    newForm: qs('#newReservationForm'),
    saveNewBtn: qs('#saveNewReservationBtn'),
    spinner: qs('#globalSpinner'),
    statusMessage: qs('#statusMessage') || (() => {
      // اذا لم يوجد عنصر حالة، انشئ واحداً بسيطاً
      const s = createEl('div', { id: 'statusMessage', class: 'status-message info' });
      document.body.prepend(s);
      return s;
    })()
  };
}

/* =========================
   API layer (abstracted)
   ========================= */
async function apiFetch(path, opts = {}) {
  // path relative to API_BASE if not full URL
  const url = path.startsWith('http') ? path : `${CONFIG.API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };

  // If USE_DIRECT true -> call Airtable directly with Authorization header
  if (CONFIG.USE_DIRECT) {
    // build direct URL for Airtable if path looks like '/records' etc.
    // NOTE: Direct mode expects that API_BASE holds baseId/tableName info or path is full URL.
    opts.headers = Object.assign({}, opts.headers || {}, defaultHeaders, {
      'Authorization': `Bearer ${CONFIG.AIRTABLE_API_KEY}`
    });
  } else {
    // in proxy mode, we only set content-type; server is responsible for auth
    opts.headers = Object.assign({}, opts.headers || {}, defaultHeaders);
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`API Error ${res.status}: ${res.statusText} ${text ? '- ' + text : ''}`);
    err.status = res.status;
    throw err;
  }
  // try parse as json
  return res.json().catch(() => ({}));
}

/* Convenience functions: fetchReservations, createReservation, updateReservation */
async function fetchReservations({ pageSize = CONFIG.PAGE_SIZE, searchQuery = '' } = {}) {
  // If the proxy expects query params: ?search=...
  const q = searchQuery ? `?search=${encodeURIComponent(searchQuery)}&pageSize=${pageSize}` : `?pageSize=${pageSize}`;
  return apiFetch(`/reservations${q}`, { method: 'GET' });
}

async function createReservation(payload) {
  return apiFetch('/reservations', { method: 'POST', body: JSON.stringify(payload) });
}

async function updateReservation(id, payload) {
  return apiFetch(`/reservations/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

/* =========================
   Rendering functions (آمنة — لا تستخدم innerHTML مع بيانات خارجية)
   ========================= */
function renderLoading(show = true) {
  if (!DOM.refs.spinner) return;
  DOM.refs.spinner.style.display = show ? 'inline-block' : 'none';
}

function clearReservationsContainer() {
  const c = DOM.refs.reservationsTableContainer;
  if (!c) return;
  c.innerHTML = '';
}

function renderReservationsTable(dataRecords) {
  const container = DOM.refs.reservationsTableContainer;
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(dataRecords) || dataRecords.length === 0) {
    const p = createEl('p', { class: 'info status-message active info-message-block' }, 'لا توجد حجوزات قادمة مؤكدة حالياً.');
    container.appendChild(p);
    return;
  }

  const table = createEl('table', { class: 'reservations-table' });

  // thead
  const thead = createEl('thead');
  const headRow = createEl('tr');
  headRow.appendChild(createEl('th', {}, 'النزيل (معرف الحجز)'));
  headRow.appendChild(createEl('th', {}, 'تفاصيل الحجز'));
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = createEl('tbody');

  dataRecords.forEach(record => {
    const fields = record.fields || {};
    const guestName = fields[FIELD_IDS.GUEST_NAME] || '—';
    const summaryText = fields[FIELD_IDS.SUMMARY_COLUMN] || '- لا توجد تفاصيل -';
    const recId = record.id || '';

    const tr = createEl('tr');

    // left cell: guest name + id
    const tdLeft = createEl('td');
    tdLeft.style.textAlign = 'right';
    const nameDiv = createEl('div', {}, guestName);
    const idSmall = createEl('small', {}, recId);
    idSmall.style.display = 'block';
    idSmall.style.color = '#666';
    tdLeft.appendChild(nameDiv);
    tdLeft.appendChild(idSmall);

    // right cell: summary (safe insertion)
    const tdRight = createEl('td');
    tdRight.className = 'summary-cell';
    // use textContent to avoid XSS
    tdRight.textContent = summaryText;

    tr.appendChild(tdLeft);
    tr.appendChild(tdRight);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

/* =========================
   Form handlers (مثال للحفظ السريع)
   ========================= */
async function handleSaveNewReservation(evt) {
  evt.preventDefault();
  const form = DOM.refs.newForm;
  if (!form) return showMessage('نموذج الحجز غير موجود', 'error');

  // اقرأ الحقول بأمان — تأكد من أسماء الحقول في الفورم
  const formData = new FormData(form);
  // بناء نموذج الحقول المرسلة إلى الخادم (تكييف اسماء الحقول حسب API backend)
  const fields = {};
  // مثال: إذا حقل الإدخال name="guestName"
  if (formData.get('guestName')) fields[FIELD_IDS.GUEST_NAME] = formData.get('guestName').trim();
  if (formData.get('summary')) fields[FIELD_IDS.SUMMARY_COLUMN] = formData.get('summary').trim();
  if (formData.get('arrival')) fields[FIELD_IDS.ARRIVAL] = formData.get('arrival');
  if (formData.get('departure')) fields[FIELD_IDS.DEPARTURE] = formData.get('departure');

  // تحقق بسيط
  if (!fields[FIELD_IDS.GUEST_NAME]) {
    return showMessage('الرجاء إدخال اسم النزيل', 'error');
  }

  try {
    renderLoading(true);
    showMessage('جاري حفظ الحجز...', 'info');
    const payload = { fields };
    await createReservation(payload);
    showMessage('تم حفظ الحجز بنجاح', 'success');
    form.reset();

    // تفريغ أي ملخّصات مؤقتة (تم إصلاح selector مشكل سابقاً)
    qsa('span[id$="_summary_new"], span[id$="_summary_edit"]').forEach(s => s.textContent = '');

    // إعادة تحميل الجدول
    await loadAndRenderReservations();
  } catch (err) {
    console.error('saveNewReservation error', err);
    showMessage(`خطأ في الحفظ: ${err.message || 'تحقق من الشبكة'}`, 'error');
  } finally {
    renderLoading(false);
  }
}

/* =========================
   عمليات التحميل / البحث
   ========================= */
async function loadAndRenderReservations(searchQuery = '') {
  try {
    renderLoading(true);
    clearReservationsContainer();
    showMessage('جاري جلب الحجوزات...', 'info');

    const resp = await fetchReservations({ searchQuery, pageSize: CONFIG.PAGE_SIZE });
    // نفترض ان الـ proxy يعيد شكل { records: [...] } أو لو direct من Airtable نفس الصيغة
    const records = resp.records || resp.data || [];
    renderReservationsTable(records);
    showMessage(`تم جلب ${records.length} سجلًّا.`, 'success');
  } catch (err) {
    console.error('loadAndRenderReservations error', err);
    showMessage(`خطأ في جلب البيانات: ${err.message || err}`, 'error');
    clearReservationsContainer();
  } finally {
    renderLoading(false);
  }
}

/* =========================
   Init و Event Binding
   ========================= */
function bindEvents() {
  if (DOM.refs.btnRefresh) DOM.refs.btnRefresh.addEventListener('click', () => loadAndRenderReservations());
  if (DOM.refs.saveNewBtn && DOM.refs.newForm) DOM.refs.saveNewBtn.addEventListener('click', handleSaveNewReservation);

  // Debounced search
  if (DOM.refs.searchInput) {
    const onSearch = debounce((e) => {
      const q = e.target.value.trim();
      loadAndRenderReservations(q);
    }, 450);
    DOM.refs.searchInput.addEventListener('input', onSearch);
  }
}

function init() {
  cacheDOM();
  bindEvents();
  // عرض أولي
  loadAndRenderReservations();
}

/* تشغيل بعد تحميل DOM */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* =========================
   Debug / Dev helpers (اختياري — أطفئها في الإنتاج)
   ========================= */
window.__APP_DEBUG = {
  CONFIG,
  FIELD_IDS
};
