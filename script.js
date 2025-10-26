/**
 * script.js - النسخة النهائية المدمجة والآمنة
 *
 * تم دمج منطق التبويبات (حجز/تعديل/استعلام) مع بنية الأمان والتحسين (Proxy API).
 * ملاحظة: يجب أن يعمل الخادم الوسيط (Netlify Function) بشكل صحيح لتنفيذ هذا الكود.
 */

/* =========================
   إعدادات Airtable والموقع
   ========================= */
const CONFIG = {
    // 🚨 يجب أن يتطابق هذا مع المسار المُعدّل في Netlify Function
    API_BASE: '/.netlify/functions/airtable-proxy',
    USE_DIRECT: false, // لا نستخدم الاتصال المباشر للأمان
    AIRTABLE_API_KEY: '', // يُترك فارغاً
    AIRTABLE_BASE_ID: 'appZm1T1ecVIlWOwy', // استخدم ID القاعدة الخاصة بك
    AIRTABLE_TABLE_NAME: 'tbloqjxnWuD2aH66H', // استخدم اسم الجدول الخاص بك
    PAGE_SIZE: 50
};

/* =========================
   ثوابت الحقول (Field IDs)
   ========================= */
const FIELD_IDS = {
    // الحقول الأساسية
    RES_NUMBER: 'fldMTOwOZ7jM8axbf',
    RES_TYPE: 'fldMUvsWgpp2LuTf2',
    COUNTER: 'flduEC9m8ruQ6tzi8',
    SOURCE: 'fldHrwuzi8LxIeKVX',
    GUEST_NAME: 'fldI2sYu4qIu2PIGe',
    PHONE: 'fldZxjo1fzU9FQR2Q',
    AMOUNT: 'fldbsNQcjGZni1Z6w',
    SUMMARY_COLUMN: 'fldv0jKm0o4PWiQbX', // حقل الملخص الذي يتم عرضه

    // حقول تفاصيل الأجنحة
    GUEST_ARRIVAL: 'fldMUosyFGqomDcy0',
    GUEST_DEPARTURE: 'fldqigNkyfC2ZRfxJ',
    GUEST_COUNT: 'fldm5R1GFdeJaNCwp',
    VIP_ARRIVAL: 'fldCnuObF607viGRo',
    VIP_DEPARTURE: 'fldvW7j98Xb2JR0Zk',
    VIP_COUNT: 'flde1QyYM73ezs565',
    ROYAL_ARRIVAL: 'fldbjG9dQHT0inlXx',
    ROYAL_DEPARTURE: 'fldkC8A1Bh7iIrBwk',
    ROYAL_COUNT: 'fldQeliMpdLeT3Zdb',

    // حقول التحويل والملاحظات
    TRANSFERER_NAME: 'fldWIoRdNmBtAX3zt',
    TRANSFER_DATE: 'fldXVNY3cwQ99Zcpn',
    NOTES: 'fld6J3886d7hSle25'
};

/* =========================
   DOM Caching & Selectors
   ========================= */
function qs(sel, parent = document) { return parent.querySelector(sel); }
function qsa(sel, parent = document) { return Array.from(parent.querySelectorAll(sel)); }

const DOM = { refs: {} };

function cacheDOM() {
    DOM.refs = {
        // التبويبات والأزرار
        tabButtons: qsa('.tab-button'),
        newReservationTab: qs('#newReservation'),
        editReservationTab: qs('#editReservation'),
        queryTab: qs('#query'),
        
        // النموذج الجديد
        newReservationForm: qs('#newReservationForm'),
        statusMessage_newReservation: qs('#statusMessage_newReservation'),
        
        // نموذج التعديل/البحث
        searchReservationInput: qs('#searchReservationInput'),
        searchButton: qs('#searchButton'), // 🚨 الزر المُعدل
        editReservationForm: qs('#editReservationForm'),
        statusMessage_editReservation: qs('#statusMessage_editReservation'),
        recordId_edit: qs('#recordId_edit'),
        
        // نموذج الاستعلام
        reservationsTableContainer: qs('#reservationsTableContainer'),
        statusMessage_query: qs('#statusMessage_query'),
        btnRefresh: qs('#query .btn-primary'),

        // الـ Status العام (لرسائل المساعدة/الخطأ)
        statusMessages: qsa('.status-message-container')
    };
}

/* =========================
   وظائف الواجهة المساعدة
   ========================= */

function createEl(tag, attrs = {}, text = '') {
    const el = document.createElement(tag);
    for (const k in attrs) {
        if (k === 'class') el.className = attrs[k];
        else el.setAttribute(k, attrs[k]);
    }
    if (text) el.textContent = text;
    return el;
}

function showStatus(message, type = 'info', tabId, autoHide = true) {
    const statusDiv = DOM.refs[`statusMessage_${tabId}`];
    if (!statusDiv) return;

    statusDiv.classList.remove('info', 'success', 'error', 'hidden');
    statusDiv.classList.add(type);
    statusDiv.textContent = message; // استخدام textContent للأمان
    statusDiv.classList.remove('hidden');

    if (autoHide && type !== 'error') {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
            statusDiv.textContent = '';
        }, 6000);
    }
}

/* وظيفة Debounce */
function debounce(fn, wait = 350) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

function getSuiteValue(prefix, key, type) {
    const element = qs(`#${key}${type}_${prefix}`);
    if (!element) return undefined;

    if (type.includes('Count')) {
        const val = parseInt(element.value);
        return isNaN(val) ? undefined : val;
    }
    return element.value.trim() === '' ? undefined : element.value;
}

function updateSuiteSummary(prefix, suiteKey) {
    const countInput = qs(`#${suiteKey}SuiteCount_${prefix}`);
    const summaryElement = qs(`#${suiteKey}_summary_${prefix}`);

    const count = parseInt(countInput.value) || 0;
    
    if (isNaN(parseInt(countInput.value)) || parseInt(countInput.value) < 0) {
         countInput.value = '';
    }

    if (count > 0) {
        summaryElement.textContent = `(${count} غرف محجوزة)`;
    } else {
        summaryElement.textContent = '';
    }
}

function calculateDaysPerSuite(prefix, suiteKey) {
    const arrivalInput = qs(`#${suiteKey}Arrival_${prefix}`);
    const departureInput = qs(`#${suiteKey}Departure_${prefix}`);
    const daysInput = qs(`#${suiteKey}Days_${prefix}`);

    const arrivalTimestamp = Date.parse(arrivalInput.value);
    const departureTimestamp = Date.parse(departureInput.value);

    updateSuiteSummary(prefix, suiteKey);

    if (arrivalTimestamp && departureTimestamp && departureTimestamp >= arrivalTimestamp) {
        const timeDifference = departureTimestamp - arrivalTimestamp;
        const daysDifference = Math.round(timeDifference / (1000 * 3600 * 24));
        daysInput.value = daysDifference;
    } else {
        daysInput.value = '';
    }
}

/* =========================
   API layer (يتواصل مع Netlify Function)
   ========================= */
async function apiFetch(path, opts = {}, tabId = 'newReservation') {
    const url = `${CONFIG.API_BASE}${path}`;
    const defaultHeaders = { 'Content-Type': 'application/json' };

    // نضيف المفتاح الأساسي للتحقق من الأمان في الـ Function إذا كان مفعل (نادراً)
    opts.headers = Object.assign({}, opts.headers || {}, defaultHeaders);

    try {
        const res = await fetch(url, opts);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            const errorMsg = data.error ? (data.error.message || data.error.type || 'خطأ غير معروف في الخادم الوسيط') : data.message || 'خطأ في الاتصال بالخادم';
            showStatus(`❌ فشل الاتصال: ${errorMsg}`, 'error', tabId);
            throw new Error(errorMsg);
        }
        return data;
    } catch (err) {
        // هذا يتعامل مع أخطاء الشبكة قبل الوصول إلى الخادم
        if (err.message.includes('Failed to fetch')) {
             showStatus(`❌ فشل الشبكة. تأكد من أن Netlify Function مُنشأة ومسار ${CONFIG.API_BASE} صحيح.`, 'error', tabId, false);
        } else {
             showStatus(`❌ فشل: ${err.message}`, 'error', tabId);
        }
        throw err; 
    }
}

// دالة مساعد API لإنشاء حجز
async function createReservation(payload) {
    return apiFetch('/reservations', { method: 'POST', body: JSON.stringify({ fields: payload }) }, 'newReservation');
}

// دالة مساعد API لتحديث حجز
async function updateReservation(id, payload) {
    return apiFetch(`/reservations/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ fields: payload }) }, 'editReservation');
}

// دالة مساعد API لجلب البيانات (مع فلاتر البحث أو الاستعلام)
async function fetchReservations({ type = 'all', value = '', tabId = 'query' } = {}) {
    let path = '/reservations';
    
    // بناء معلمات الاستعلام (Query Parameters) للخادم الوسيط
    const queryParams = new URLSearchParams();
    
    if (type === 'view') {
        // جلب الحجوزات القادمة بناءً على View في Airtable
        queryParams.append('view', 'حجوزات قادمة');
    } else if (type === 'search' && value) {
        // البحث عن سجل واحد
        queryParams.append('search', value); 
        // 🚨 ملاحظة: يجب أن يعالج الخادم الوسيط queryParams.search لبناء filterByFormula
    }
    
    if (queryParams.toString()) {
        path += `?${queryParams.toString()}`;
    }

    return apiFetch(path, { method: 'GET' }, tabId);
}

/* =========================
   1. وظيفة حفظ حجز جديد (Create)
   ========================= */
async function handleSaveNewReservation(evt) {
    evt.preventDefault();
    const form = DOM.refs.newReservationForm;
    const statusDivId = 'newReservation';
    if (!form) return;

    // ... (منطق التحقق من الحقول كما في النسخة السابقة) ...
    const guestName = qs('#guestName_new').value;
    const phone = qs('#phone_new').value;
    const counter = qs('#counter_new').value;
    const resType = qs('#type_new').value;

    if (!guestName || !phone || !counter || !resType) {
        showStatus('الرجاء إدخال اسم النزيل، رقم الجوال، الكونتر، ونوع الحجز.', 'error', statusDivId);
        return;
    }

    const suites = ['guest', 'vip', 'royal'];
    const payloa    // تعبئة البيانات من حقول النموذج
    const amountValue = qs('#amount_edit').value.replace(/[^0-9.]/g, '');
    const amount = (amountValue.trim() !== '' && !isNaN(parseFloat(amountValue))) ? parseFloat(amountValue) : undefined;
    
    // 🚨 إضافة حقل رقم الحجز
    payload[FIELD_IDS.RES_NUMBER] = qs('#resNumber_edit').value || undefined; 
    payload[FIELD_IDS.RES_TYPE] = resType;
    payload[FIELD_IDS.COUNTER] = counter;
    payload[FIELD_IDS.GUEST_NAME] = guestName;
    payload[FIELD_IDS.PHONE] = phone;
    payload[FIELD_IDS.SOURCE] = qs('#source_edit').value || undefined;
    payload[FIELD_IDS.AMOUNT] = amount;
    payload[FIELD_IDS.TRANSFERER_NAME] = qs('#transfererName_edit').value || undefined;
    // 🚨 تصحيح ID حقل تاريخ التحويل
    payload[FIELD_IDS.TRANSFER_DATE] = qs('#transferDate_edit').value || undefined; 
    payload[FIELD_IDS.NOTES] = qs('#notes_edit').value || undefined;;
    suites.forEach(suiteKey => {
        const count = getSuiteValue('new', suiteKey, 'SuiteCount');
        const arrival = getSuiteValue('new', suiteKey, 'Arrival');
        const departure = getSuiteValue('new', suiteKey, 'Departure');
        
        if (count !== undefined && count > 0) totalReserved += count;
        
        payload[FIELD_IDS[`${suiteKey.toUpperCase()}_COUNT`]] = count;
        payload[FIELD_IDS[`${suiteKey.toUpperCase()}_ARRIVAL`]] = arrival;
        payload[FIELD_IDS[`${suiteKey.toUpperCase()}_DEPARTURE`]] = departure;
    });

    if (totalReserved === 0 && !Object.keys(payload).some(key => key.includes('ARRIVAL'))) {
        showStatus('الرجاء تحديد جناح واحد على الأقل وإدخال عدد غرف وتواريخ.', 'error', statusDivId);
        return;
    }
    
    // حذف الحقول الفارغة (Undefined)
    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) delete payload[key];
    });


    try {
        showStatus('جاري إرسال الحجز... ⏳', 'info', statusDivId, false);

        const response = await createReservation(payload);
        const newResId = response.id || 'N/A';

        const successMessage = `✅ تم حفظ الحجز بنجاح! <br> <strong>رقم الحجز (ID) هو: ${newResId}</strong>.`;
        showStatus(successMessage, 'success', statusDivId);

        form.reset();
        qsa('span[id$="_summary_new"]').forEach(span => span.textContent = '');
        
    } catch (error) {
        // تم التعامل مع رسائل الخطأ في apiFetch
        console.error('Error saving reservation:', error);
    }
}


/* =========================
   2. وظيفة البحث عن الحجز (Read Single Record)
   ========================= */

async function searchReservation() {
    const statusDivId = 'editReservation';
    const searchInput = DOM.refs.searchReservationInput;
    const searchValue = searchInput.value.trim();
    
    const formElement = DOM.refs.editReservationForm;

    // 🚨 الحل القسري للإخفاء قبل البحث 🚨
    formElement.classList.add('hidden');
    formElement.style.display = 'none';

    if (!searchValue) {
        showStatus('الرجاء إدخال رقم الجوال أو رقم الحجز (ID) للبحث.', 'error', statusDivId);
        return;
    }

    try {
        showStatus('جاري البحث عن حجز... 🔍', 'info', statusDivId);
        
        // استخدام طبقة الـ API الجديدة، نوع البحث: search
        const resp = await fetchReservations({ type: 'search', value: searchValue, tabId: statusDivId });
        const records = resp.records || [];

        if (records.length === 0) {
            showStatus(`❌ لم يتم العثور على حجز يطابق المدخل: ${searchValue}.`, 'error', statusDivId);
            return;
        }

        const record = records[0];
        showStatus(`✅ تم العثور على حجز (${record.id}). يرجى تعديل البيانات وحفظها.`, 'success', statusDivId, false);

        populateEditForm(record);
        searchInput.value = '';

    } catch (error) {
        // تم التعامل مع رسائل الخطأ في apiFetch
        console.error('Error searching reservation:', error);
    }
}

/* =========================
   3. وظيفة تعبئة نموذج التعديل (Populate Form)
   ========================= */

function populateEditForm(record) {
    const fields = record.fields;
    const recordId = record.id;
    const prefix = 'edit';
    
    const formElement = DOM.refs.editReservationForm;

    // 1. حفظ ID السجل
    DOM.refs.recordId_edit.value = recordId;
    
    // 🚨 الحل القسري للإظهار لتجاوز مشاكل CSS 🚨
    formElement.classList.remove('hidden'); 
    formElement.style.display = 'block'; 
    console.log(`[FINAL CHECK] Form Visibility Status: ${formElement.style.display}`); 
    
    // تعبئة الحقول الأساسية
    // 🚨 إضافة حقل رقم الحجز
    qs(`#resNumber_${prefix}`).value = fields[FIELD_IDS.RES_NUMBER] || ''; 
    qs(`#guestName_${prefix}`).value = fields[FIELD_IDS.GUEST_NAME] || '';
    qs(`#phone_${prefix}`).value = fields[FIELD_IDS.PHONE] || '';
    qs(`#type_${prefix}`).value = fields[FIELD_IDS.RES_TYPE] || '';
    qs(`#counter_${prefix}`).value = fields[FIELD_IDS.COUNTER] || '';
    qs(`#source_${prefix}`).value = fields[FIELD_IDS.SOURCE] || '';
    
    qs(`#amount_${prefix}`).value = fields[FIELD_IDS.AMOUNT] !== undefined ? fields[FIELD_IDS.AMOUNT].toString() : '';

    // تعبئة تفاصيل الأجنحة (التواريخ والعدد)
    const suites = ['guest', 'vip', 'royal'];
    suites.forEach(suiteKey => {
        const arrival = fields[FIELD_IDS[`${suiteKey.toUpperCase()}_ARRIVAL`]];
        const departure = fields[FIELD_IDS[`${suiteKey.toUpperCase()}_DEPARTURE`]];
        const count = fields[FIELD_IDS[`${suiteKey.toUpperCase()}_COUNT`]];

        qs(`#${suiteKey}Arrival_${prefix}`).value = arrival || '';
        qs(`#${suiteKey}Departure_${prefix}`).value = departure || '';

        qs(`#${suiteKey}SuiteCount_${prefix}`).value = count !== undefined ? count.toString() : '';
        
        calculateDaysPerSuite(prefix, suiteKey);
    });

    // تعبئة الملاحظات والتحويل
    qs('#transfererName_edit').value = fields[FIELD_IDS.TRANSFERER_NAME] || '';
    // 🚨 تصحيح ID حقل تاريخ التحويل من currentDate_edit إلى transferDate_edit
    qs('#transferDate_edit').value = fields[FIELD_IDS.TRANSFER_DATE] || ''; 
    qs('#notes_edit').value = fields[FIELD_IDS.NOTES] || '';

    // تفعيل الأقسام المطوية (لإظهار البيانات التي كانت مخفية)
    qsa('#editReservationForm .collapsible-content').forEach(content => {
        content.classList.add('active');
        const header = content.previousElementSibling;
        if(header) header.classList.add('active'); 
    });
}


/* =========================
   4. وظيفة تحديث/إلغاء الحجز (Update/Patch)
   ========================= */

async function handleUpdateReservation(evt) {
    evt.preventDefault();
    const statusDivId = 'editReservation';
    const recordId = DOM.refs.recordId_edit.value;

    if (!recordId) {
        showStatus('❌ لا يوجد سجل حجز محدد للتعديل.', 'error', statusDivId);
        return;
    }

    const prefix = 'edit';
    const payload = {};
    const suites = ['guest', 'vip', 'royal'];
    
    // ... (منطق بناء الـ payload للتعديل/الإلغاء) ...
    const amountValue = qs('#amount_edit').value.replace(/[^0-9.]/g, '');
    const amount = (amountValue.trim() !== '' && !isNaN(parseFloat(amountValue))) ? parseFloat(amountValue) : undefined;

    payload[FIELD_IDS.RES_TYPE] = qs(`#type_${prefix}`).value;
    payload[FIELD_IDS.COUNTER] = qs(`#counter_${prefix}`).value;
    payload[FIELD_IDS.GUEST_NAME] = qs(`#guestName_${prefix}`).value;
    payload[FIELD_IDS.PHONE] = qs(`#phone_${prefix}`).value;
    payload[FIELD_IDS.SOURCE] = qs(`#source_${prefix}`).value;
    payload[FIELD_IDS.AMOUNT] = amount;
    payload[FIELD_IDS.TRANSFERER_NAME] = qs('#transfererName_edit').value || undefined;
    payload[FIELD_IDS.TRANSFER_DATE] = getSuiteValue('edit', 'currentDate', '');
    payload[FIELD_IDS.NOTES] = qs('#notes_edit').value || undefined;

    let totalReserved = 0;
    suites.forEach(suiteKey => {
        const count = getSuiteValue('edit', suiteKey, 'SuiteCount');
        const arrival = getSuiteValue('edit', suiteKey, 'Arrival');
        const departure = getSuiteValue('edit', suiteKey, 'Departure');
        
        if (count !== undefined && count > 0) totalReserved += count;
        
        payload[FIELD_IDS[`${suiteKey.toUpperCase()}_COUNT`]] = count;
        payload[FIELD_IDS[`${suiteKey.toUpperCase()}_ARRIVAL`]] = arrival;
        payload[FIELD_IDS[`${suiteKey.toUpperCase()}_DEPARTURE`]] = departure;
    });

    const isCancellation = payload[FIELD_IDS.RES_TYPE] === 'ملغي';
    const actionText = isCancellation ? 'إلغاء' : 'تعديل';
    
    if (totalReserved === 0 && !isCancellation) {
        showStatus('الرجاء تحديد جناح واحد على الأقل وتواريخ، أو تعيين حالة الحجز إلى "ملغي".', 'error', statusDivId);
        return;
    }

    // حذف الحقول الفارغة (Undefined)
    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) delete payload[key];
    });

    try {
        showStatus(`جاري ${actionText} الحجز... ⏳`, 'info', statusDivId);

        await updateReservation(recordId, payload);

        showStatus(`✅ تم ${actionText} الحجز بنجاح! رقم السجل: ${recordId}.`, 'success', statusDivId, false);
        
        // إخفاء النموذج بالـ class hidden و style.display بعد التعديل
        DOM.refs.editReservationForm.classList.add('hidden');
        DOM.refs.editReservationForm.style.display = 'none';

    } catch (error) {
        // تم التعامل مع رسائل الخطأ في apiFetch
        console.error('Error updating reservation:', error);
    }
}

/* =========================
   5. وظيفة جلب الحجوزات القادمة (Query)
   ========================= */

async function loadFutureReservations() {
    const statusDivId = 'query';
    const container = DOM.refs.reservationsTableContainer;

    try {
        showStatus('جاري جلب الحجوزات القادمة... ⏳', 'info', statusDivId);
        container.innerHTML = '';
        
        // نوع الجلب: view (لاعتماد الـ View 'حجوزات قادمة' في Airtable)
        const resp = await fetchReservations({ type: 'view', tabId: statusDivId });
        const reservations = resp.records || [];

        showStatus(`✅ تم جلب ${reservations.length} حجزاً قادماً ومؤكداً.`, 'success', statusDivId);

        renderReservationsTable(reservations);

    } catch (error) {
        // تم التعامل مع رسائل الخطأ في apiFetch
        console.error('General Error loading reservations:', error);
        container.innerHTML = `<p class="info status-message active info-message-block">فشل في جلب البيانات.</p>`;
    }
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
    table.innerHTML = `
        <thead>
            <tr>
                <th>النزيل (<small>معرف الحجز</small>)</th>
                <th>تفاصيل الحجز</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    dataRecords.forEach(record => {
        const fields = record.fields || {};
        const guestName = fields[FIELD_IDS.GUEST_NAME] || '—';
        const summaryText = fields[FIELD_IDS.SUMMARY_COLUMN] || '- لا توجد تفاصيل -';
        const recId = record.id || '';

        const tr = createEl('tr');
        tr.innerHTML = `
            <td>${guestName} <small style="display:block; color:#666;">${recId}</small></td>
            <td class="summary-cell">${summaryText}</td>
        `;
        tbody.appendChild(tr);
    });

    container.appendChild(table);
}


/* =========================
   Init و Event Binding
   ========================= */

function bindEvents() {
    // 1. التبويبات (Tabs)
    DOM.refs.tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');

            // 🚨 التأكد من إزالة وإضافة الفئة 'active' بشكل صحيح
            qsa('.tab-content').forEach(content => content.classList.remove('active'));
            DOM.refs.tabButtons.forEach(btn => btn.classList.remove('active'));
            DOM.refs.statusMessages.forEach(c => { // إخفاء جميع رسائل الحالة
                c.querySelector('.status-message')?.classList.add('hidden');
            });
            
            qs(`#${tabName}`).classList.add('active');
            e.target.classList.add('active');

            if (tabName === 'query') {
                loadFutureReservations();
            } else if (tabName === 'editReservation') {
                // عند الانتقال إلى التعديل، تأكد من إخفاء النموذج
                DOM.refs.editReservationForm.classList.add('hidden');
                DOM.refs.editReservationForm.style.display = 'none';
            }
        });
    });
    
    // 2. نموذج الحجز الجديد
    if (DOM.refs.newReservationForm) DOM.refs.newReservationForm.addEventListener('submit', handleSaveNewReservation);
    
    // 3. زر البحث (للتعديل)
    if (DOM.refs.searchButton) DOM.refs.searchButton.addEventListener('click', searchReservation);
    
    // 4. نموذج التعديل/الإلغاء
    if (DOM.refs.editReservationForm) DOM.refs.editReservationForm.addEventListener('submit', handleUpdateReservation);
    
    // 5. زر تحديث الاستعلام
    if (DOM.refs.btnRefresh) DOM.refs.btnRefresh.addEventListener('click', loadFutureReservations);

    // 6. منطق حساب الأيام والملخص
    ['new', 'edit'].forEach(prefix => {
        ['guest', 'vip', 'royal'].forEach(suiteKey => {
            const suiteId = `#${suiteKey}`;
            
            qs(`${suiteId}Arrival_${prefix}`)?.addEventListener('change', () => calculateDaysPerSuite(prefix, suiteKey));
            qs(`${suiteId}Departure_${prefix}`)?.addEventListener('change', () => calculateDaysPerSuite(prefix, suiteKey));
            qs(`${suiteId}SuiteCount_${prefix}`)?.addEventListener('input', () => updateSuiteSummary(prefix, suiteKey));
        });
    });
    
    // 7. منطق الأقسام المطوية (Collapsible)
    qsa('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            header.classList.toggle('active');
            content.classList.toggle('active');
        });
    });

}

function init() {
    cacheDOM();
    bindEvents();
    
    // تفعيل أول تبويبة عند التحميل
    qs('.tab-button')?.click();
}

/* تشغيل بعد تحميل DOM */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

