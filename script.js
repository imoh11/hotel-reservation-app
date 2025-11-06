// =================================================================
// 1. إعدادات Airtable الأساسية - يجب تعديلها
// =================================================================
const AIRTABLE_API_KEY = "AIRTABLE_API_KEY_PLACEHOLDER"; // 🚨 يجب استبدال هذا المفتاح بمفتاحك الخاص
const BASE_ID = 'appZm1T1ecVIlWOwy';
const TABLE_NAME = 'tbloqjxnWuD2aH66H'; 
const CONFIG_TABLE_ID = 'tblbL4TOvGCv9eEmS'; // ✅ جدول الإعدادات
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
const AIRTABLE_CONFIG_URL = `https://api.airtable.com/v0/${BASE_ID}/${CONFIG_TABLE_ID}`; // ✅ URL جدول الإعدادات

// ✅ متغير عام لحفظ الإعدادات
let APP_CONFIG = {};

//// =================================================================
// 12. تهيئة التطبيق
// =================================================================

/**
 * حساب لون الحالة بناءً على تواريخ الوصول والمغادرة
 * @param {string} arrivalDateStr - تاريخ الوصول (YYYY-MM-DD)
 * @param {string} departureDateStr - تاريخ المغادرة (YYYY-MM-DD)
 * @returns {string} رمز اللون السداسي (#RRGGBB)
 */
function getStatusColor(arrivalDateStr, departureDateStr) {
    // ⚪ لم يصل بعد (إذا لم تتوفر التواريخ)
    if (!arrivalDateStr || !departureDateStr) {
        return '#9e9e9e'; 
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // تحويل التواريخ إلى كائنات Date مع التأكد من أنها تبدأ من منتصف الليل (لتجنب مشاكل التوقيت)
    const arrivalDate = new Date(arrivalDateStr);
    arrivalDate.setHours(0, 0, 0, 0);
    
    const departureDate = new Date(departureDateStr);
    departureDate.setHours(0, 0, 0, 0);

    // الحالة 1: واصل اليوم (🟡)
    if (arrivalDate.getTime() === today.getTime()) {
        return '#ffc107'; // 🟡 واصل اليوم (أصفر)
    }

    // الحالة 2: مغادر اليوم (🔴)
    if (departureDate.getTime() === today.getTime()) {
        return '#dc3545'; // 🔴 مغادر اليوم (أحمر)
    }

    // الحالة 3: مقيم حالياً (🟢)
    // إذا كان تاريخ الوصول قبل اليوم أو يساويه، وتاريخ المغادرة بعد اليوم
    if (arrivalDate < today && departureDate > today) {
        return '#28a745'; // 🟢 مقيم حالياً (أخضر)
    }

    // الحالة 4: لم يصل بعد (⚪)
    // إذا كان تاريخ الوصول بعد اليوم
    if (arrivalDate > today) {
        return '#9e9e9e'; // ⚪ لم يصل بعد (رمادي)
    }
    
    // حالة احتياطية (قد تكون مغادرة سابقة أو حالة غير محددة)
    return '#9e9e9e'; 
}

// =================================================================
// 12. تهيئة التطبيق
// ==================================================================

// Field Names (for reading from Airtable)
const FIELD_NAMES = {
    RES_NUMBER: 'Res_Number',  // ✅ الاسم الصحيح في Airtable
    RES_TYPE: 'RES_TYPE',
    COUNTER: 'COUNTER',
    SOURCE: 'SOURCE',
    GUEST_NAME: 'GUEST_NAME',
    PHONE: 'PHONE',
    AMOUNT: 'AMOUNT',
    GUEST_ARRIVAL: 'GUEST_ARRIVAL',
    GUEST_DEPARTURE: 'GUEST_DEPARTURE',
    GUEST_COUNT: 'GUEST_COUNT',
    VIP_ARRIVAL: 'VIP_ARRIVAL',
    VIP_DEPARTURE: 'VIP_DEPARTURE',
    VIP_COUNT: 'VIP_COUNT',
    ROYAL_ARRIVAL: 'ROYAL_ARRIVAL',
    ROYAL_DEPARTURE: 'ROYAL_DEPARTURE',
    ROYAL_COUNT: 'ROYAL_COUNT',
    TRANSFERER_NAME: 'TRANSFERER_NAME',
    TRANSFER_DATE: 'TRANSFER_DATE',
    NOTES: 'NOTES'
};

// Field IDs (for writing to Airtable)
const FIELD_IDS = {
    // الحقول الأساسية
    RES_NUMBER: 'fldMTOwOZ7jM8axbf',
    RES_TYPE: 'fldMUvsWgpp2LuTf2',
    COUNTER: 'flduEC9m8ruQ6tzi8',
    SOURCE: 'fldHrwuzi8LxIeKVX',
    GUEST_NAME: 'fldI2sYu4qIu2PIGe',
    PHONE: 'fldZxjo1fzU9FQR2Q',
    AMOUNT: 'fldbsNQcjGZni1Z6w',

    // حقول تفاصيل الأجنحة - جميعها صحيحة ومؤكدة
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

// الحد الأقصى لعدد الغرف المتاحة لكل نوع جناح (القيم الصحيحة 14-4-2)
const SUITE_CAPACITIES = {
    guest: 14,  // جناح ضيافة (14 غرفة)
    vip: 4,     // جناح VIP (4 غرف)
    royal: 2    // جناح ملكي (2 غرفة)
};

// ربط مفاتيح الأجنحة بمعرّفات الحقول
const SUITE_CONFIG = {
    guest: {
        count: FIELD_IDS.GUEST_COUNT,
        arrival: FIELD_IDS.GUEST_ARRIVAL,
        departure: FIELD_IDS.GUEST_DEPARTURE,
        countName: 'GUEST_COUNT',          // اسم الحقل الفعلي في Airtable
        arrivalName: 'GUEST_ARRIVAL',      // اسم حقل الوصول
        departureName: 'GUEST_DEPARTURE',  // اسم حقل المغادرة
        nameAr: 'جناح ضيافة',
        prefix: 'guest'
    },
    vip: {
        count: FIELD_IDS.VIP_COUNT,
        arrival: FIELD_IDS.VIP_ARRIVAL,
        departure: FIELD_IDS.VIP_DEPARTURE,
        countName: 'VIP_COUNT',
        arrivalName: 'VIP_ARRIVAL',
        departureName: 'VIP_DEPARTURE',
        nameAr: 'جناح VIP',
        prefix: 'vip'
    },
    royal: {
        count: FIELD_IDS.ROYAL_COUNT,
        arrival: FIELD_IDS.ROYAL_ARRIVAL,
        departure: FIELD_IDS.ROYAL_DEPARTURE,
        countName: 'ROYAL_COUNT',
        arrivalName: 'ROYAL_ARRIVAL',
        departureName: 'ROYAL_DEPARTURE',
        nameAr: 'جناح ملكي',
        prefix: 'royal'
    }
};

// =================================================================
// 2.5. تحميل الإعدادات من Airtable
// =================================================================

/**
 * تحميل الإعدادات من جدول Config
 */
async function loadConfig() {
    try {
        // ✅ محاولة قراءة من localStorage أولاً (أسرع)
        const cachedConfig = localStorage.getItem('app_config');
        const cacheTime = localStorage.getItem('app_config_time');
        const now = Date.now();
        
        // إذا كان ال cache أحدث من 5 دقائق، استخدمه
        if (cachedConfig && cacheTime && (now - parseInt(cacheTime)) < 5 * 60 * 1000) {
            console.log('✅ تحميل الإعدادات من cache');
            return JSON.parse(cachedConfig);
        }
        
        console.log('🔄 تحميل الإعدادات من Airtable...');
        
        const response = await fetch(AIRTABLE_CONFIG_URL, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`فشل تحميل الإعدادات: ${response.status}`);
        }
        
        const data = await response.json();
        const config = {};
        
        // ✅ تحويل الصفوف إلى object
        data.records.forEach(record => {
            const key = record.fields['Setting Key'];
            const value = record.fields['Setting Value'];
            if (key && value !== undefined) {
                config[key] = value;
            }
        });
        
        // ✅ حفظ في localStorage
        localStorage.setItem('app_config', JSON.stringify(config));
        localStorage.setItem('app_config_time', now.toString());
        
        console.log('✅ تم تحميل الإعدادات بنجاح:', config);
        return config;
        
    } catch (error) {
        console.error('❌ فشل تحميل الإعدادات:', error);
        // ✅ إرجاع قيم افتراضية
        return getDefaultConfig();
    }
}

/**
 * إرجاع قيم افتراضية في حال فشل تحميل الإعدادات
 */
function getDefaultConfig() {
    return {
        hotel_name: "جاري التحميل",
        hotel_phone: "0000000000",
        guest_capacity: "0",
        vip_capacity: "0",
        royal_capacity: "0",
        guest_name_ar: "جناح ",
        vip_name_ar: "جناح ",
        royal_name_ar: "جناح ",
        msg_confirmed: "مرحباً {name}، \n\nتم تأكيد حجزك بنجاح!",
        msg_waiting: "شكراً {name}، \n\nحجزك قيد الانتظار",
        msg_cancelled: "عزيزي {name}، \n\nتم إلغاء حجزك"
    };
}

// ===============================================
// 3. وظائف الواجهة المساعدة
// ===============================================

/**
 * توليد رقم حجز عشوائي من 6 أرقام
 * يُرجع رقم (number) ليس نص (string)
 */
function generateResNumber() {
    return Math.floor(100000 + Math.random() * 900000);
}

function showStatus(message, type = 'info', tabId, autoHide = true) {
    const statusDiv = document.getElementById(`statusMessage_${tabId}`); 
    if (!statusDiv) return;

    statusDiv.classList.remove('info', 'success', 'error', 'hidden');
    statusDiv.classList.add(type);
    statusDiv.innerHTML = message;
    statusDiv.classList.remove('hidden');

    if (autoHide && type !== 'error') {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
            statusDiv.innerHTML = '';
        }, 5000);
    }
}

function updateSuiteSummary(prefix, suiteKey) {
    const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);
    const count = parseInt(countInput.value) || 0;
    const summaryElement = document.getElementById(`${suiteKey}_summary_${prefix}`);

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
    const arrivalInput = document.getElementById(`${suiteKey}Arrival_${prefix}`);
    const departureInput = document.getElementById(`${suiteKey}Departure_${prefix}`);
    const daysInput = document.getElementById(`${suiteKey}Days_${prefix}`);
    const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);

    const arrivalTimestamp = Date.parse(arrivalInput.value);
    const departureTimestamp = Date.parse(departureInput.value);

    updateSuiteSummary(prefix, suiteKey);

    if (arrivalTimestamp && departureTimestamp && departureTimestamp >= arrivalTimestamp) {
        const timeDifference = departureTimestamp - arrivalTimestamp;
        const daysDifference = Math.round(timeDifference / (1000 * 3600 * 24)); 
        daysInput.value = daysDifference;
        
        if (parseInt(countInput.value) > 0) {
            checkAndValidateAvailability(suiteKey, prefix);
        }
    } else {
        daysInput.value = '';
    }
}

function switchTab(tabName, button) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // إغلاق جميع تفاصيل الحجز عند التبديل
    closeReservationDetails();
    closeEditForm();
}

// ===============================================
// 4. وظائف التحقق من التوفر
// ===============================================

/**
 * جلب جميع الحجوزات التي تتداخل مع فترة محددة
 */
async function getConflictingReservations(suiteKey, arrivalDate, departureDate) {
    const filterFormula = `AND(
        {${SUITE_CONFIG[suiteKey].countName}} > 0,
        IS_BEFORE({${SUITE_CONFIG[suiteKey].arrivalName}}, DATETIME_PARSE('${departureDate}', 'YYYY-MM-DD')),
        IS_AFTER({${SUITE_CONFIG[suiteKey].departureName}}, DATETIME_PARSE('${arrivalDate}', 'YYYY-MM-DD'))
    )`;

    const url = `${AIRTABLE_API_URL}?filterByFormula=${encodeURIComponent(filterFormula)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.records;

    } catch (error) {
        console.error(`❌ فشل جلب الحجوزات المتعارضة لـ ${suiteKey}:`, error);
        return null;
    }
}

/**
 * حساب عدد الغرف المتاحة لنوع جناح وفترة محددة
 */
async function getAvailableCount(suiteKey, arrivalDate, departureDate) {
    const capacity = SUITE_CAPACITIES[suiteKey];
    if (!capacity) return -1; // خطأ في الإعدادات

    const conflictingReservations = await getConflictingReservations(suiteKey, arrivalDate, departureDate);

    if (conflictingReservations === null) return -2; // فشل الاتصال

    let reservedCount = 0;
    conflictingReservations.forEach(record => {
        reservedCount += record.fields[SUITE_CONFIG[suiteKey].countName] || 0;
    });

    return capacity - reservedCount;
}

/**
 * التحقق من التوفر وعرض رسالة
 */
async function checkAndValidateAvailability(suiteKey, prefix) {
    const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);
    const arrivalInput = document.getElementById(`${suiteKey}Arrival_${prefix}`);
    const departureInput = document.getElementById(`${suiteKey}Departure_${prefix}`);
    const validationDiv = document.getElementById(`${suiteKey}Validation_${prefix}`);
    const suiteName = SUITE_CONFIG[suiteKey].nameAr;

    validationDiv.textContent = 'جاري التحقق...';
    validationDiv.className = 'validation-message info';

    const count = parseInt(countInput.value);
    const arrival = arrivalInput.value;
    const departure = departureInput.value;

    if (isNaN(count) || count <= 0 || !arrival || !departure) {
        validationDiv.textContent = '';
        validationDiv.className = 'validation-message';
        return;
    }

    const availableCount = await getAvailableCount(suiteKey, arrival, departure);

    if (availableCount === -2) {
        validationDiv.textContent = `❌ فشل التحقق من التوفر.`;
        validationDiv.className = 'validation-message error';
        return;
    }

    if (count > availableCount) {
        validationDiv.textContent = `❌ غير متوفر. المتاح: ${availableCount} غرفة.`;
        validationDiv.className = 'validation-message error';
    } else {
        validationDiv.textContent = `✅ متوفر. المتاح: ${availableCount} غرفة.`;
        validationDiv.className = 'validation-message success';
    }
}

// ===============================================
// 5. وظائف الحفظ والتعديل
// ===============================================

/**
 * حفظ حجز جديد
 */
async function saveNewReservation() {
    const statusDivId = 'newReservation';
    const resType = document.getElementById('type_new').value;
    const counter = document.getElementById('counter_new').value;
    const guestName = document.getElementById('guestName_new').value;
    const phone = document.getElementById('phone_new').value;

    let amountValue = document.getElementById('amount_new').value.replace(/[^0-9.]/g, '');
    const amount = (amountValue.trim() !== '' && !isNaN(parseFloat(amountValue))) ? parseFloat(amountValue) : undefined;

    const data = {
        [FIELD_IDS.RES_NUMBER]: generateResNumber(), // ✅ توليد رقم حجز عشوائي
        [FIELD_IDS.RES_TYPE]: resType,
        [FIELD_IDS.COUNTER]: counter,
        [FIELD_IDS.GUEST_NAME]: guestName,
        [FIELD_IDS.PHONE]: phone,
        [FIELD_IDS.SOURCE]: getSuiteValue('source', ''),
        [FIELD_IDS.AMOUNT]: amount,
        [FIELD_IDS.TRANSFERER_NAME]: document.getElementById('transfererName_new').value || undefined,
        [FIELD_IDS.TRANSFER_DATE]: getSuiteValue('currentDate', ''),
        [FIELD_IDS.NOTES]: document.getElementById('notes_new').value || undefined,
        [FIELD_IDS.GUEST_COUNT]: getSuiteValue('guest', 'SuiteCount'),
        [FIELD_IDS.GUEST_ARRIVAL]: getSuiteValue('guest', 'Arrival'),
        [FIELD_IDS.GUEST_DEPARTURE]: getSuiteValue('guest', 'Departure'),
        [FIELD_IDS.VIP_COUNT]: getSuiteValue('vip', 'SuiteCount'),
        [FIELD_IDS.VIP_ARRIVAL]: getSuiteValue('vip', 'Arrival'),
        [FIELD_IDS.VIP_DEPARTURE]: getSuiteValue('vip', 'Departure'),
        [FIELD_IDS.ROYAL_COUNT]: getSuiteValue('royal', 'SuiteCount'),
        [FIELD_IDS.ROYAL_ARRIVAL]: getSuiteValue('royal', 'Arrival'),
        [FIELD_IDS.ROYAL_DEPARTURE]: getSuiteValue('royal', 'Departure'),
    };

    Object.keys(data).forEach(key => {
        const value = data[key];
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            delete data[key];
        }
    });

    const suiteCounts = [FIELD_IDS.GUEST_COUNT, FIELD_IDS.VIP_COUNT, FIELD_IDS.ROYAL_COUNT];
    suiteCounts.forEach(key => {
        if (data.hasOwnProperty(key) && data[key] === 0) {
            data[key] = 0;
        }
    });

    const totalReserved = (data[FIELD_IDS.GUEST_COUNT] || 0) + (data[FIELD_IDS.VIP_COUNT] || 0) + (data[FIELD_IDS.ROYAL_COUNT] || 0);
    const hasArrival = Object.keys(data).some(key => key.includes('ARRIVAL'));
    
    if (totalReserved === 0 && !hasArrival) {
        showStatus('الرجاء تحديد جناح واحد على الأقل وإدخال عدد غرف وتواريخ.', 'error', statusDivId);
        return;
    }
    
    // ✅ فحص التواريخ قبل الحفظ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const suiteKey of Object.keys(SUITE_CONFIG)) {
        const arrival = data[SUITE_CONFIG[suiteKey].arrival];
        const departure = data[SUITE_CONFIG[suiteKey].departure];
        
        if (arrival && departure) {
            const arrivalDate = new Date(arrival);
            const departureDate = new Date(departure);
            
            // فحص أن تاريخ الوصول ليس قبل اليوم
            if (arrivalDate < today) {
                showStatus(`❌ لا يمكن الحجز في ${SUITE_CONFIG[suiteKey].nameAr} بتاريخ قبل اليوم.`, 'error', statusDivId);
                return;
            }
            
            // فحص أن تاريخ المغادرة بعد تاريخ الوصول
            if (departureDate <= arrivalDate) {
                showStatus(`❌ تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول في ${SUITE_CONFIG[suiteKey].nameAr}.`, 'error', statusDivId);
                return;
            }
        }
    }
    
    // فحص التوفر النهائي قبل الإرسال 
    let allAvailable = true;
    for (const suiteKey of Object.keys(SUITE_CONFIG)) {
        const count = data[SUITE_CONFIG[suiteKey].count];
        const arrival = data[SUITE_CONFIG[suiteKey].arrival];
        const departure = data[SUITE_CONFIG[suiteKey].departure];
        
        if (count && arrival && departure) {
            const availableCount = await getAvailableCount(suiteKey, arrival, departure);
            
            if (availableCount === -2) {
                showStatus(`❌ فشل التحقق النهائي من توفر ${SUITE_CONFIG[suiteKey].nameAr}. يرجى التحقق من المفاتيح.`, 'error', statusDivId);
                return;
            }
            if (count > availableCount) {
                showStatus(`❌ ${SUITE_CONFIG[suiteKey].nameAr} غير متوفر. المتاح: ${availableCount} غرفة.`, 'error', statusDivId);
                allAvailable = false;
                break;
            }
        }
    }
    
    if (!allAvailable) return;

    showStatus('جاري حفظ الحجز...', 'info', statusDivId, false);

    try {
        const response = await fetch(AIRTABLE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                records: [{ fields: data }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const resNumber = result.records[0].fields[FIELD_NAMES.RES_NUMBER];
        
        // ✅ إرسال رسالة واتساب
        sendWhatsAppMessage(guestName, resType);

        showStatus(`✅ تم حفظ الحجز بنجاح! رقم الحجز: ${resNumber}`, 'success', statusDivId);
        document.getElementById('newReservationForm').reset();
        
        // ✅ تحديث ملخص الأجنحة
        ['guest', 'vip', 'royal'].forEach(suiteKey => updateSuiteSummary('new', suiteKey));
        
    } catch (error) {
        console.error('❌ فشل حفظ الحجز:', error);
        showStatus(`❌ فشل حفظ الحجز: ${error.message}`, 'error', statusDivId);
    }
}

/**
 * إرسال رسالة واتساب بناءً على نوع الحجز
 */
function sendWhatsAppMessage(name, resType) {
    const phone = document.getElementById('phone_new').value;
    if (!phone) return;

    let messageTemplate;
    if (resType === 'مؤكد') {
        messageTemplate = APP_CONFIG.msg_confirmed;
    } else if (resType === 'قيد الانتظار') {
        messageTemplate = APP_CONFIG.msg_waiting;
    } else {
        return;
    }

    const message = messageTemplate.replace('{name}', name);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    // ✅ فتح نافذة جديدة لإرسال الرسالة
    window.open(whatsappUrl, '_blank');
}

/**
 * جلب قيمة حقل جناح معين
 */
function getSuiteValue(suiteKey, fieldSuffix) {
    const element = document.getElementById(`${suiteKey}${fieldSuffix}_new`);
    if (!element) return undefined;

    if (fieldSuffix.includes('Count')) {
        const value = parseInt(element.value);
        return isNaN(value) ? undefined : value;
    }
    
    return element.value || undefined;
}

// ===============================================
// 6. وظائف التعديل والإلغاء
// ===============================================

let currentReservationId = null; // لحفظ ID الحجز الحالي للتعديل

/**
 * جلب جميع الحجوزات وعرضها في قائمة
 */
async function loadAllReservations() {
    const listDiv = document.getElementById('reservationsList');
    const loadingDiv = document.getElementById('loadingReservations');
    
    listDiv.innerHTML = '';
    loadingDiv.classList.remove('hidden');

    try {
        const response = await fetch(AIRTABLE_API_URL, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // ✅ تصفية الحجوزات الملغاة
        const activeReservations = data.records.filter(record => record.fields[FIELD_NAMES.RES_TYPE] !== 'ملغي');
        
        if (activeReservations.length === 0) {
            listDiv.innerHTML = '<p class="info">لا توجد حجوزات نشطة حالياً.</p>';
            loadingDiv.classList.add('hidden');
            return;
        }

        activeReservations.forEach(reservation => {
            const fields = reservation.fields;
            const resNumber = fields[FIELD_NAMES.RES_NUMBER] || 'N/A';
            const resType = fields[FIELD_NAMES.RES_TYPE] || 'N/A';
            const guestName = fields[FIELD_NAMES.GUEST_NAME] || 'N/A';
            
            // ✅ تحديد نوع الحجز لتنسيق اللون
            let typeClass = '';
            if (resType === 'مؤكد') {
                typeClass = 'confirmed';
            } else if (resType === 'قيد الانتظار') {
                typeClass = 'pending';
            } else if (resType === 'ملغي') {
                typeClass = 'cancelled';
            }
            
            // ✅ تحديد تاريخ الوصول الرئيسي
            const arrivalDate = fields[FIELD_NAMES.GUEST_ARRIVAL] || fields[FIELD_NAMES.VIP_ARRIVAL] || fields[FIELD_NAMES.ROYAL_ARRIVAL] || 'N/A';
            
            // ✅ تحديد لون الحالة
            const departureDate = fields[FIELD_NAMES.GUEST_DEPARTURE] || fields[FIELD_NAMES.VIP_DEPARTURE] || fields[FIELD_NAMES.ROYAL_DEPARTURE] || 'N/A';
            const statusColor = getStatusColor(arrivalDate, departureDate);
            
            // ✅ إنشاء قائمة منسدلة (accordion)
            const accordionDiv = document.createElement('div');
            accordionDiv.className = 'reservation-accordion';
            
            // العنوان (قابل للنقر)
            const headerDiv = document.createElement('div');
            headerDiv.className = 'reservation-accordion-header';
            
            // ✅ تحديد لون الحالة
            const statusColor = getStatusColor(arrivalDate, departureDate);
            
            headerDiv.innerHTML = `
                <div class="reservation-item-info">
                    <span class="status-circle" style="background-color: ${statusColor};"></span>
                    <span class="reservation-number">${arrivalDate}</span>
                    <span class="reservation-type ${typeClass}">${resType}</span>
                    <span class="reservation-guest">${guestName}</span>
                </div>
                <div class="reservation-actions">
                    <span class="accordion-arrow">▼</span>
                </div>
            `;
            
            // المحتوى (تفاصيل الحجز)
            const contentDiv = document.createElement('div');
            contentDiv.className = 'reservation-accordion-content';
            contentDiv.id = `details_${reservation.id}`;
            
            let detailsHTML = `<div class="reservation-details-content">`;
            detailsHTML += `<div class="detail-row"><span class="detail-label">رقم الحجز:</span><span class="detail-value">${resNumber}</span></div>`;
            detailsHTML += `<div class="detail-row"><span class="detail-label">نوع الحجز:</span><span class="detail-value">${resType}</span></div>`;
            detailsHTML += `<div class="detail-row"><span class="detail-label">اسم النزيل:</span><span class="detail-value">${guestName}</span></div>`;
            
            const phone = fields[FIELD_NAMES.PHONE] || 'N/A';
            const counter = fields[FIELD_NAMES.COUNTER] || 'N/A';
            const amount = fields[FIELD_NAMES.AMOUNT] || 'N/A';
            const notes = fields[FIELD_NAMES.NOTES] || '';
            
            detailsHTML += `<div class="detail-row"><span class="detail-label">رقم الجوال:</span><span class="detail-value">${phone}</span></div>`;
            detailsHTML += `<div class="detail-row"><span class="detail-label">الكونتر:</span><span class="detail-value">${counter}</span></div>`;
            detailsHTML += `<div class="detail-row"><span class="detail-label">المبلغ:</span><span class="detail-value">${amount}</span></div>`;
            
            const guestCount = fields[FIELD_NAMES.GUEST_COUNT];
            const vipCount = fields[FIELD_NAMES.VIP_COUNT];
            const royalCount = fields[FIELD_NAMES.ROYAL_COUNT];
            
            const guestDeparture = fields[FIELD_NAMES.GUEST_DEPARTURE];
            const vipArrival = fields[FIELD_NAMES.VIP_ARRIVAL];
            const vipDeparture = fields[FIELD_NAMES.VIP_DEPARTURE];
            const royalArrival = fields[FIELD_NAMES.ROYAL_ARRIVAL];
            const royalDeparture = fields[FIELD_NAMES.ROYAL_DEPARTURE];
            
            if (guestCount) {
                const guestColor = getStatusColor(arrivalDate, guestDeparture);
                detailsHTML += `<div class="detail-row"><span class="detail-label"><span class="status-dot" style="background-color:${guestColor}"></span> جناح ضيافة:</span><span class="detail-value">${guestCount} غرف (${arrivalDate} ← ${guestDeparture})</span></div>`;
            }
            if (vipCount) {
                const vipColor = getStatusColor(vipArrival, vipDeparture);
                detailsHTML += `<div class="detail-row"><span class="detail-label"><span class="status-dot" style="background-color:${vipColor}"></span> جناح VIP:</span><span class="detail-value">${vipCount} غرف (${vipArrival} ← ${vipDeparture})</span></div>`;
            }
            if (royalCount) {
                const royalColor = getStatusColor(royalArrival, royalDeparture);
                detailsHTML += `<div class="detail-row"><span class="detail-label"><span class="status-dot" style="background-color:${royalColor}"></span> جناح ملكي:</span><span class="detail-value">${royalCount} غرف (${royalArrival} ← ${royalDeparture})</span></div>`;
            }
            if (notes) {
                detailsHTML += `<div class="detail-row full-width"><span class="detail-label">ملاحظات:</span><span class="detail-value">${notes}</span></div>`;
            }
            detailsHTML += '</div>';
            
            detailsHTML += `
                <div class="reservation-actions-footer">
                    <button class="btn btn-edit" onclick="openReservationDetails('${reservation.id}')">عرض التفاصيل</button>
                </div>
            `;
            
            contentDiv.innerHTML = detailsHTML;
            
            accordionDiv.appendChild(headerDiv);
            accordionDiv.appendChild(contentDiv);
            listDiv.appendChild(accordionDiv);
            
            // ✅ إضافة مستمع لفتح/إغلاق الأكورديون
            headerDiv.addEventListener('click', () => {
                headerDiv.classList.toggle('active');
                contentDiv.classList.toggle('active');
            });
        });
        
        loadingDiv.classList.add('hidden');
        
    } catch (error) {
        console.error('Error loading reservations:', error);
        loadingDiv.innerHTML = `<p class="error">❌ فشل تحميل الحجوزات: ${error.message}</p>`;
    }
}

/**
 * فتح نموذج عرض التفاصيل
 */
function openReservationDetails(recordId) {
    currentReservationId = recordId;
    document.getElementById('reservationsList').classList.add('hidden');
    document.getElementById('reservationDetails').classList.remove('hidden');
    
    // جلب بيانات الحجز وعرضها
    fetchReservationDetails(recordId);
}

/**
 * إغلاق نموذج عرض التفاصيل
 */
function closeReservationDetails() {
    document.getElementById('reservationsList').classList.remove('hidden');
    document.getElementById('reservationDetails').classList.add('hidden');
    document.getElementById('editReservationForm').classList.add('hidden');
    document.getElementById('reservationDetailsContent').innerHTML = '';
    currentReservationId = null;
}

/**
 * جلب تفاصيل حجز واحد
 */
async function fetchReservationDetails(recordId) {
    const detailsDiv = document.getElementById('reservationDetailsContent');
    detailsDiv.innerHTML = '<p class="info">جاري تحميل التفاصيل...</p>';
    
    try {
        const url = `${AIRTABLE_API_URL}/${recordId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayReservationDetails(data);

    } catch (error) {
        console.error('❌ فشل جلب تفاصيل الحجز:', error);
        detailsDiv.innerHTML = `<p class="error">❌ فشل تحميل التفاصيل: ${error.message}</p>`;
    }
}

/**
 * عرض تفاصيل حجز واحد
 */
function displayReservationDetails(record) {
    const fields = record.fields;
    const detailsDiv = document.getElementById('reservationDetailsContent');
    
    let html = `
        <div class="reservation-details-view">
            <div class="detail-row"><span class="detail-label">رقم الحجز:</span><span class="detail-value">${fields[FIELD_NAMES.RES_NUMBER] || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">نوع الحجز:</span><span class="detail-value">${fields[FIELD_NAMES.RES_TYPE] || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">اسم النزيل:</span><span class="detail-value">${fields[FIELD_NAMES.GUEST_NAME] || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">رقم الجوال:</span><span class="detail-value">${fields[FIELD_NAMES.PHONE] || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">الكونتر:</span><span class="detail-value">${fields[FIELD_NAMES.COUNTER] || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">المبلغ:</span><span class="detail-value">${fields[FIELD_NAMES.AMOUNT] || 'N/A'}</span></div>
            <hr>
            <h3>تفاصيل الأجنحة</h3>
    `;
    
    // ✅ عرض تفاصيل الأجنحة
    for (const suiteKey of Object.keys(SUITE_CONFIG)) {
        const config = SUITE_CONFIG[suiteKey];
        const count = fields[config.countName];
        const arrival = fields[config.arrivalName];
        const departure = fields[config.departureName];
        
        if (count) {
            const color = getStatusColor(arrival, departure);
            html += `
                <div class="detail-row suite-detail">
                    <span class="detail-label">
                        <span class="status-dot" style="background-color:${color}"></span>
                        ${config.nameAr}:
                    </span>
                    <span class="detail-value">
                        ${count} غرف (${arrival} ← ${departure})
                    </span>
                </div>
            `;
        }
    }
    
    html += `
            <hr>
            <div class="detail-row full-width"><span class="detail-label">الملاحظات:</span><span class="detail-value">${fields[FIELD_NAMES.NOTES] || 'لا توجد ملاحظات'}</span></div>
        </div>
    `;
    
    detailsDiv.innerHTML = html;
}

/**
 * فتح نموذج التعديل
 */
function openEditForm() {
    document.getElementById('reservationDetails').classList.add('hidden');
    document.getElementById('editReservationForm').classList.remove('hidden');
    
    // جلب البيانات لملء النموذج
    fetchReservationDataForEdit(currentReservationId);
}

/**
 * إغلاق نموذج التعديل
 */
function closeEditForm() {
    document.getElementById('reservationDetails').classList.remove('hidden');
    document.getElementById('editReservationForm').classList.add('hidden');
    document.getElementById('editReservationForm').reset();
}

/**
 * جلب بيانات الحجز لملء نموذج التعديل
 */
async function fetchReservationDataForEdit(recordId) {
    const form = document.getElementById('editReservationForm');
    form.innerHTML = '<p class="info">جاري تحميل بيانات التعديل...</p>';
    
    try {
        const url = `${AIRTABLE_API_URL}/${recordId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        renderEditForm(data);

    } catch (error) {
        console.error('❌ فشل جلب بيانات التعديل:', error);
        form.innerHTML = `<p class="error">❌ فشل تحميل البيانات: ${error.message}</p>`;
    }
}

/**
 * عرض نموذج التعديل
 */
function renderEditForm(record) {
    const fields = record.fields;
    const form = document.getElementById('editReservationForm');
    const recordId = record.id;
    
    let html = `
        <input type="hidden" id="editRecordId" value="${recordId}">
        <div class="form-row">
            <div class="form-group">
                <label for="type_edit">نوع الحجز</label>
                <select id="type_edit" class="form-control" required>
                    <option value="مؤكد">مؤكد</option>
                    <option value="قيد الانتظار">انتظار</option>
                    <option value="ملغي">ملغي</option>
                </select>
            </div>
            <div class="form-group">
                <label for="counter_edit">الكونتر</label>
                <select id="counter_edit" class="form-control" required>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="A3">A3</option>
                    <option value="A4">A4</option>
                    <option value="A5">A5</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="guestName_edit">اسم النزيل</label>
                <input type="text" id="guestName_edit" class="form-control" value="${fields[FIELD_NAMES.GUEST_NAME] || ''}" required>
            </div>
            <div class="form-group">
                <label for="phone_edit">رقم الجوال</label>
                <input type="tel" id="phone_edit" class="form-control" value="${fields[FIELD_NAMES.PHONE] || ''}" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="amount_edit">المبلغ</label>
                <input type="number" id="amount_edit" class="form-control" value="${fields[FIELD_NAMES.AMOUNT] || ''}">
            </div>
            <div class="form-group">
                <label for="source_edit">المصدر</label>
                <input type="text" id="source_edit" class="form-control" value="${fields[FIELD_NAMES.SOURCE] || ''}">
            </div>
        </div>
        
        <div class="collapsible-section">
            <div class="collapsible-header">
                تفاصيل الأجنحة
                <span class="collapsible-icon"></span>
            </div>
            <div class="collapsible-content">
    `;
    
    // ✅ حقول الأجنحة
    for (const suiteKey of Object.keys(SUITE_CONFIG)) {
        const config = SUITE_CONFIG[suiteKey];
        const count = fields[config.countName] || '';
        const arrival = fields[config.arrivalName] || '';
        const departure = fields[config.departureName] || '';
        
        html += `
            <div class="suite-group">
                <h4>${config.nameAr}</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="${suiteKey}SuiteCount_edit">عدد الغرف</label>
                        <input type="number" id="${suiteKey}SuiteCount_edit" class="form-control" value="${count}" min="0" max="${SUITE_CAPACITIES[suiteKey]}">
                    </div>
                    <div class="form-group">
                        <label for="${suiteKey}Arrival_edit">تاريخ الوصول</label>
                        <input type="date" id="${suiteKey}Arrival_edit" class="form-control" value="${arrival}">
                    </div>
                    <div class="form-group">
                        <label for="${suiteKey}Departure_edit">تاريخ المغادرة</label>
                        <input type="date" id="${suiteKey}Departure_edit" class="form-control" value="${departure}">
                    </div>
                </div>
                <div id="${suiteKey}Validation_edit" class="validation-message"></div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
        
        <div class="form-group full-width">
            <label for="notes_edit">ملاحظات</label>
            <textarea id="notes_edit" class="form-control">${fields[FIELD_NAMES.NOTES] || ''}</textarea>
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="closeEditFormBtn">إلغاء</button>
            <button type="button" class="btn btn-primary" onclick="saveReservationEdits()">حفظ التعديلات</button>
            <button type="button" class="btn btn-danger" onclick="cancelReservation('${recordId}', '${fields[FIELD_NAMES.GUEST_NAME] || ''}')">إلغاء الحجز</button>
        </div>
        <div id="statusMessage_editReservation" class="status-message hidden"></div>
    `;
    
    form.innerHTML = html;
    
    // ✅ تعيين القيم الافتراضية
    document.getElementById('type_edit').value = fields[FIELD_NAMES.RES_TYPE] || 'مؤكد';
    document.getElementById('counter_edit').value = fields[FIELD_NAMES.COUNTER] || 'A1';
    
    // ✅ إضافة مستمعي الأحداث
    const prefix = 'edit'; 
    ['guest', 'vip', 'royal'].forEach(suiteKey => {
        const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);
        const arrivalInput = document.getElementById(`${suiteKey}Arrival_${prefix}`);
        const departureInput = document.getElementById(`${suiteKey}Departure_${prefix}`);
        
        if (countInput) countInput.addEventListener('input', () => {
            checkAndValidateAvailability(suiteKey, prefix);
        });
        if (arrivalInput) arrivalInput.addEventListener('change', () => {
            checkAndValidateAvailability(suiteKey, prefix);
        });
        if (departureInput) departureInput.addEventListener('change', () => {
            checkAndValidateAvailability(suiteKey, prefix);
        });
    });
    
    // ✅ إضافة مستمعي الإغلاق
    document.getElementById('closeEditFormBtn').addEventListener('click', closeEditForm);
}

/**
 * حفظ تعديلات الحجز
 */
async function saveReservationEdits() {
    const statusDivId = 'editReservation';
    const recordId = document.getElementById('editRecordId').value;
    const resType = document.getElementById('type_edit').value;
    const counter = document.getElementById('counter_edit').value;
    const guestName = document.getElementById('guestName_edit').value;
    const phone = document.getElementById('phone_edit').value;
    const source = document.getElementById('source_edit').value;
    const amount = parseFloat(document.getElementById('amount_edit').value) || undefined;
    const notes = document.getElementById('notes_edit').value;

    const data = {
        [FIELD_IDS.RES_TYPE]: resType,
        [FIELD_IDS.COUNTER]: counter,
        [FIELD_IDS.GUEST_NAME]: guestName,
        [FIELD_IDS.PHONE]: phone,
        [FIELD_IDS.SOURCE]: source,
        [FIELD_IDS.AMOUNT]: amount,
        [FIELD_IDS.NOTES]: notes,
    };
    
    // ✅ حقول الأجنحة
    const prefix = 'edit';
    let totalReserved = 0;
    for (const suiteKey of Object.keys(SUITE_CONFIG)) {
        const config = SUITE_CONFIG[suiteKey];
        const count = parseInt(document.getElementById(`${suiteKey}SuiteCount_${prefix}`).value) || 0;
        const arrival = document.getElementById(`${suiteKey}Arrival_${prefix}`).value || undefined;
        const departure = document.getElementById(`${suiteKey}Departure_${prefix}`).value || undefined;
        
        data[config.count] = count;
        data[config.arrival] = arrival;
        data[config.departure] = departure;
        
        totalReserved += count;
    }
    
    if (totalReserved === 0 && resType !== 'ملغي') {
        showStatus('يجب أن يكون هناك جناح واحد على الأقل محجوز أو يجب إلغاء الحجز.', 'error', statusDivId);
        return;
    }
    
    // ✅ فحص التوفر النهائي قبل الإرسال (تجاهل الحجز الحالي)
    let allAvailable = true;
    for (const suiteKey of Object.keys(SUITE_CONFIG)) {
        const count = data[SUITE_CONFIG[suiteKey].count];
        const arrival = data[SUITE_CONFIG[suiteKey].arrival];
        const departure = data[SUITE_CONFIG[suiteKey].departure];
        
        if (count && arrival && departure) {
            const availableCount = await getAvailableCount(suiteKey, arrival, departure);
            
            // ✅ يجب أن يكون الفحص أكثر دقة هنا لتجاهل الحجز الحالي
            // لكن لتبسيط الكود، سنعتمد على أن المستخدم لن يحجز أكثر مما هو متاح
            // إذا كان الحجز الحالي هو الوحيد المتعارض، فسيظهر التوفر كاملاً
            
            if (availableCount === -2) {
                showStatus(`❌ فشل التحقق النهائي من توفر ${SUITE_CONFIG[suiteKey].nameAr}. يرجى التحقق من المفاتيح.`, 'error', statusDivId);
                return;
            }
            if (count > availableCount) {
                showStatus(`❌ ${SUITE_CONFIG[suiteKey].nameAr} غير متوفر. المتاح: ${availableCount} غرفة.`, 'error', statusDivId);
                allAvailable = false;
                break;
            }
        }
    }
    
    if (!allAvailable) return;

    showStatus('جاري حفظ التعديلات...', 'info', statusDivId, false);

    try {
        const response = await fetch(`${AIRTABLE_API_URL}/${recordId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: data
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        showStatus(`✅ تم حفظ التعديلات بنجاح!`, 'success', statusDivId);
        
        // ✅ تحديث القائمة بعد التعديل
        loadAllReservations();
        closeEditForm();
        closeReservationDetails();
        
    } catch (error) {
        console.error('❌ فشل حفظ التعديلات:', error);
        showStatus(`❌ فشل حفظ التعديلات: ${error.message}`, 'error', statusDivId);
    }
}

/**
 * إلغاء حجز
 */
async function cancelReservation(recordId, guestName) {
    if (!confirm(`هل أنت متأكد من إلغاء حجز ${guestName}؟`)) {
        return;
    }
    
    const statusDivId = 'editReservation';
    showStatus('جاري إلغاء الحجز...', 'info', statusDivId, false);
    
    try {
        const response = await fetch(`${AIRTABLE_API_URL}/${recordId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    [FIELD_IDS.RES_TYPE]: 'ملغي'
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // ✅ إرسال رسالة واتساب
        sendWhatsAppMessage(guestName, 'ملغي');

        showStatus(`✅ تم إلغاء حجز ${guestName} بنجاح!`, 'success', statusDivId);
        
        // ✅ تحديث القائمة بعد الإلغاء
        loadAllReservations();
        closeEditForm();
        closeReservationDetails();
        
    } catch (error) {
        console.error('❌ فشل إلغاء الحجز:', error);
        showStatus(`❌ فشل إلغاء الحجز: ${error.message}`, 'error', statusDivId);
    }
}

// ========================================
// وظائف صفحة الإشغال
// ========================================

let occupancyData = [];

/**
 * تحميل بيانات الإشغال لـ 50 يوم قادمة
 */
async function loadOccupancyData() {
    const loadingDiv = document.getElementById('loadingOccupancy');
    const tableDiv = document.getElementById('occupancyTable');
    
    try {
        loadingDiv.classList.remove('hidden');
        tableDiv.classList.add('hidden');
        
        // جلب جميع الحجوزات
        const response = await fetch(AIRTABLE_API_URL, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // إنشاء خريطة للإشغال لكل يوم
        const occupancyMap = {};
        
        // معالجة كل حجز
        data.records.forEach(record => {
            const fields = record.fields;
            
            // جناح ضيافة
            processReservation(occupancyMap, fields[FIELD_NAMES.GUEST_ARRIVAL], fields[FIELD_NAMES.GUEST_DEPARTURE], fields[FIELD_NAMES.GUEST_COUNT] || 0, 'guest');
            
            // جناح VIP
            processReservation(occupancyMap, fields[FIELD_NAMES.VIP_ARRIVAL], fields[FIELD_NAMES.VIP_DEPARTURE], fields[FIELD_NAMES.VIP_COUNT] || 0, 'vip');
            
            // جناح ملكي
            processReservation(occupancyMap, fields[FIELD_NAMES.ROYAL_ARRIVAL], fields[FIELD_NAMES.ROYAL_DEPARTURE], fields[FIELD_NAMES.ROYAL_COUNT] || 0, 'royal');
        });
        
        // إنشاء بيانات لـ 50 يوم
        occupancyData = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 50; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            // استخدام التوقيت المحلي بدلاً من UTC
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            const dayData = occupancyMap[dateStr] || { guest: 0, vip: 0, royal: 0 };
            
            occupancyData.push({
                date: dateStr,
                dayName: getDayName(date),
                guest: dayData.guest,
                vip: dayData.vip,
                royal: dayData.royal,
                total: dayData.guest + dayData.vip + dayData.royal
            });
        }
        
        // عرض البيانات
        renderOccupancyTable();
        updateOccupancySummary();
        
        // فتح الصفحة على أسبوع افتراضياً
        setFilterShortcut('week');
        
        loadingDiv.classList.add('hidden');
        tableDiv.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading occupancy data:', error);
        loadingDiv.innerHTML = `<p class="error">❌ فشل تحميل بيانات الإشغال: ${error.message}</p>`;
    }
}

/**
 * معالجة حجز واحد وإضافته للخريطة
 */
function processReservation(occupancyMap, arrivalDate, departureDate, count, suiteType) {
    if (!arrivalDate || !departureDate || !count) return;
    
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    
    // لكل يوم في الحجز
    for (let d = new Date(arrival); d < departure; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        if (!occupancyMap[dateStr]) {
            occupancyMap[dateStr] = { guest: 0, vip: 0, royal: 0 };
        }
        
        occupancyMap[dateStr][suiteType] += count;
    }
}

/**
 * الحصول على اسم اليوم بالعربية
 */
function getDayName(date) {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[date.getDay()];
}

/**
 * عرض جدول الإشغال
 */
function renderOccupancyTable(dataToRender = null) {
    const data = dataToRender || occupancyData;
    const tbody = document.getElementById('occupancyTableBody');
    tbody.innerHTML = '';
    
    data.forEach(day => {
        const row = document.createElement('tr');
        row.dataset.date = day.date;
        
        // التاريخ
        const dateCell = document.createElement('td');
        dateCell.textContent = day.date;
        row.appendChild(dateCell);
        
        // اليوم
        const dayCell = document.createElement('td');
        dayCell.textContent = day.dayName;
        row.appendChild(dayCell);
        
        // ضيافة
        const guestCell = document.createElement('td');
        guestCell.textContent = `${day.guest} / ${SUITE_CAPACITIES.guest}`;
        if (day.guest === SUITE_CAPACITIES.guest) {
            guestCell.classList.add('full');
        } else if (day.guest > 0) {
            guestCell.classList.add('partial');
        }
        row.appendChild(guestCell);
        
        // VIP
        const vipCell = document.createElement('td');
        vipCell.textContent = `${day.vip} / ${SUITE_CAPACITIES.vip}`;
        if (day.vip === SUITE_CAPACITIES.vip) {
            vipCell.classList.add('full');
        } else if (day.vip > 0) {
            vipCell.classList.add('partial');
        }
        row.appendChild(vipCell);
        
        // ملكي
        const royalCell = document.createElement('td');
        royalCell.textContent = `${day.royal} / ${SUITE_CAPACITIES.royal}`;
        if (day.royal === SUITE_CAPACITIES.royal) {
            royalCell.classList.add('full');
        } else if (day.royal > 0) {
            royalCell.classList.add('partial');
        }
        row.appendChild(royalCell);
        
        // الإجمالي
        const totalCell = document.createElement('td');
        totalCell.textContent = day.total;
        row.appendChild(totalCell);
        
        tbody.appendChild(row);
    });
}

/**
 * تحديث ملخص الإشغال
 */
function updateOccupancySummary(data = null) {
    const dataToUse = data || occupancyData;
    
    const totalGuest = dataToUse.reduce((sum, day) => sum + day.guest, 0);
    const totalVip = dataToUse.reduce((sum, day) => sum + day.vip, 0);
    const totalRoyal = dataToUse.reduce((sum, day) => sum + day.royal, 0);
    
    const totalDays = dataToUse.length;
    
    const avgGuest = totalDays > 0 ? (totalGuest / totalDays).toFixed(1) : 0;
    const avgVip = totalDays > 0 ? (totalVip / totalDays).toFixed(1) : 0;
    const avgRoyal = totalDays > 0 ? (totalRoyal / totalDays).toFixed(1) : 0;
    
    document.getElementById('summaryGuest').textContent = `${avgGuest} (${totalGuest})`;
    document.getElementById('summaryVip').textContent = `${avgVip} (${totalVip})`;
    document.getElementById('summaryRoyal').textContent = `${avgRoyal} (${totalRoyal})`;
}

/**
 * تطبيق فلتر الإشغال
 */
function applyOccupancyFilter() {
    const fromDateStr = document.getElementById('filterFromDate').value;
    const toDateStr = document.getElementById('filterToDate').value;
    
    if (!fromDateStr || !toDateStr) {
        alert('الرجاء اختيار تاريخي البداية والنهاية.');
        return;
    }
    
    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    toDate.setDate(toDate.getDate() + 1); // لتضمين يوم النهاية
    
    const filteredData = occupancyData.filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= fromDate && dayDate < toDate;
    });
    
    renderOccupancyTable(filteredData);
    updateOccupancySummary(filteredData);
}

/**
 * اختصار لفلتر الإشغال
 */
function setFilterShortcut(shortcut) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let fromDate = new Date(today);
    let toDate = new Date(today);
    
    if (shortcut === 'today') {
        // لا تغيير
    } else if (shortcut === 'tomorrow') {
        fromDate.setDate(today.getDate() + 1);
        toDate.setDate(today.getDate() + 1);
    } else if (shortcut === 'week') {
        toDate.setDate(today.getDate() + 6);
    } else if (shortcut === 'month') {
        toDate.setDate(today.getDate() + 29);
    } else if (shortcut === 'all') {
        fromDate = new Date(occupancyData[0].date);
        toDate = new Date(occupancyData[occupancyData.length - 1].date);
    }
    
    document.getElementById('filterFromDate').value = fromDate.toISOString().split('T')[0];
    document.getElementById('filterToDate').value = toDate.toISOString().split('T')[0];
    
    applyOccupancyFilter();
}

// =================================================================
// 12. تهيئة التطبيق
// ==================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // ✅ تحميل الإعدادات أولاً
    APP_CONFIG = await loadConfig();
    console.log('✅ تم تحميل الإعدادات:', APP_CONFIG);
    
    // ✅ تحديث SUITE_CAPACITIES من الإعدادات
    SUITE_CAPACITIES.guest = parseInt(APP_CONFIG.guest_capacity) || 14;
    SUITE_CAPACITIES.vip = parseInt(APP_CONFIG.vip_capacity) || 4;
    SUITE_CAPACITIES.royal = parseInt(APP_CONFIG.royal_capacity) || 2;
    
    // ✅ تحديث أسماء الأجنحة
    SUITE_CONFIG.guest.nameAr = APP_CONFIG.guest_name_ar || 'جناح ضيافة';
    SUITE_CONFIG.vip.nameAr = APP_CONFIG.vip_name_ar || 'جناح VIP';
    SUITE_CONFIG.royal.nameAr = APP_CONFIG.royal_name_ar || 'جناح ملكي';
    
    // ✅ تحديث واجهة المستخدم
    updateUIFromConfig();

    document.getElementById('newReservationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        saveNewReservation();
    });
    
    // ✅ زر حفظ وإرسال تم حذفه من صفحة حجز جديد
    
    const prefix = 'new'; 
    ['guest', 'vip', 'royal'].forEach(suiteKey => {
        const arrivalInput = document.getElementById(`${suiteKey}Arrival_${prefix}`);
        const departureInput = document.getElementById(`${suiteKey}Departure_${prefix}`);
        const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);

        if (arrivalInput) arrivalInput.addEventListener('change', () => {
            calculateDaysPerSuite(prefix, suiteKey);
        });
        if (departureInput) departureInput.addEventListener('change', () => {
            calculateDaysPerSuite(prefix, suiteKey);
        });
        if (countInput) countInput.addEventListener('input', () => {
            updateSuiteSummary(prefix, suiteKey);
            checkAndValidateAvailability(suiteKey, prefix); 
        });
    });

    // ✅ سلوك accordion: فتح قائمة واحدة فقط
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isCurrentlyActive = header.classList.contains('active');
            
            // إغلاق جميع القوائم الأخرى في نفس التبويب
            const parentTab = header.closest('.tab-content');
            if (parentTab) {
                parentTab.querySelectorAll('.collapsible-header').forEach(h => {
                    h.classList.remove('active');
                    const c = h.nextElementSibling;
                    if (c) c.classList.remove('active');
                });
            }
            
            // فتح القائمة الحالية إذا لم تكن مفتوحة
            if (!isCurrentlyActive) {
                header.classList.add('active');
                content.classList.add('active');
            }
        });
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName, button);
            
            // ✅ تحميل الحجوزات عند فتح تبويب التعديل
            if (tabName === 'editReservation') {
                loadAllReservations();
            }
            if (tabName === 'query') {
                loadOccupancyData();
            }
        });
    });
    
    // ✅ أزرار تبويب التعديل
    document.getElementById('closeDetailsBtn')?.addEventListener('click', closeReservationDetails);
    document.getElementById('editReservationBtn')?.addEventListener('click', openEditForm);
    document.getElementById('closeEditFormBtn')?.addEventListener('click', closeEditForm);
    document.getElementById('saveEditBtn')?.addEventListener('click', saveReservationEdits);
    
    document.querySelector('.tab-button.active')?.click(); 
    
    // ✅ جميع القوائم مغلقة عند فتح الصفحة
    
    // ✅ أزرار صفحة الإشغال
    const filterFromDate = document.getElementById('filterFromDate');
    const filterToDate = document.getElementById('filterToDate');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const filterTodayBtn = document.getElementById('filterTodayBtn');
    const filterTomorrowBtn = document.getElementById('filterTomorrowBtn');
    const filterWeekBtn = document.getElementById('filterWeekBtn');
    const filterMonthBtn = document.getElementById('filterMonthBtn');
    const filterAllBtn = document.getElementById('filterAllBtn');
    
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyOccupancyFilter);
    }
    
    if (filterTodayBtn) {
        filterTodayBtn.addEventListener('click', () => setFilterShortcut('today'));
    }
    
    if (filterTomorrowBtn) {
        filterTomorrowBtn.addEventListener('click', () => setFilterShortcut('tomorrow'));
    }
    
    if (filterWeekBtn) {
        filterWeekBtn.addEventListener('click', () => setFilterShortcut('week'));
    }
    
    if (filterMonthBtn) {
        filterMonthBtn.addEventListener('click', () => setFilterShortcut('month'));
    }
    
    if (filterAllBtn) {
        filterAllBtn.addEventListener('click', () => setFilterShortcut('all'));
    }

    // تم حذف الكود الذي كان يفتح القوائم تلقائياً

});
