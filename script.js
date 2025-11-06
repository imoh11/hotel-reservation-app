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


// ===============================================
// 4. وظائف التحقق من التوفر (المنطق المصحح والشامل للتواريخ)
// ===============================================

async function getAvailableCount(suiteKey, arrivalDate, departureDate, excludeRecordId = null) {
    const config = SUITE_CONFIG[suiteKey];
    const maxCapacity = SUITE_CAPACITIES[suiteKey];
    
    // ✅ المنطق المصحج: التحقق من التداخل بين التواريخ
    // الحجز الجديد يتداخل مع حجز موجود إذا:
    // - تاريخ وصول الحجز الموجود < تاريخ مغادرة الحجز الجديد
    // - تاريخ مغادرة الحجز الموجود > تاريخ وصول الحجز الجديد
    // ملاحظة: أزلنا شرط {count} > 0 لأنه قد يستثني حجوزات صحيحة
    const detailedFilter = `AND(` +
        `IS_BEFORE({${config.arrival}}, '${departureDate}'),` +
        `IS_AFTER({${config.departure}}, '${arrivalDate}')` +
    `)`;
    
    console.log(`[DEBUG] Checking availability for ${suiteKey}:`);
    console.log(`  - Requested: Arrival=${arrivalDate}, Departure=${departureDate}`);
    console.log(`  - Field IDs: arrival=${config.arrival}, departure=${config.departure}, count=${config.count}`);
    console.log(`  - Max Capacity: ${maxCapacity}`);
    console.log(`  - Filter: ${detailedFilter}`);
    
    try {
        const response = await fetch(`${AIRTABLE_API_URL}?filterByFormula=${encodeURIComponent(detailedFilter)}&fields[]=${config.count}&fields[]=${config.arrival}&fields[]=${config.departure}`, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Airtable fetch failed with status: ${response.status}. Response: ${errorText}`);
        }

        const data = await response.json();
        
        console.log(`  - Found ${data.records.length} overlapping reservations`);
        
        let totalReserved = 0;
        
        // ضمان قراءة الأرقام بشكل صحيح
        data.records.forEach((record, index) => {
            // ✅ استثناء الحجز الحالي عند التعديل
            if (excludeRecordId && record.id === excludeRecordId) {
                console.log(`    [${index + 1}] Record ID: ${record.id} - EXCLUDED (الحجز الحالي)`);
                return; // تجاهل هذا الحجز
            }
            
            // ✅ الحل: استخدام أسماء الحقول بدلاً من Field IDs
            const reservedCount = parseFloat(record.fields[config.countName]) || 0;
            const recordArrival = record.fields[config.arrivalName] || 'N/A';
            const recordDeparture = record.fields[config.departureName] || 'N/A';
            
            console.log(`    [${index + 1}] Record ID: ${record.id}`);
            console.log(`        Arrival: ${recordArrival}, Departure: ${recordDeparture}`);
            console.log(`        Reserved Rooms: ${reservedCount}`);
            console.log(`        Raw fields:`, JSON.stringify(record.fields));
            
            // فقط أضف الغرف إذا كان هناك عدد محجوز
            if (reservedCount > 0) {
                totalReserved += reservedCount;
            }
        });

        const available = maxCapacity - totalReserved;
        console.log(`  - Total Reserved: ${totalReserved}, Max Capacity: ${maxCapacity}, Available: ${available}`);
        return Math.max(0, available); 
    } catch (error) {
        console.error('Error fetching availability:', error);
        return -2; 
    }
}

/**
 * وظيفة التحقق من التوفر والتحقق من صحة الإدخال
 */
async function checkAndValidateAvailability(suiteKey, prefix) {
    const arrivalInput = document.getElementById(`${suiteKey}Arrival_${prefix}`);
    const departureInput = document.getElementById(`${suiteKey}Departure_${prefix}`);
    const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);
    const validationMessage = document.getElementById(`${suiteKey}_validation_new`);
    const submitButton = document.querySelector('#newReservationForm button[type="submit"]');

    const arrivalDate = arrivalInput.value;
    const departureDate = departureInput.value;
    const requestedCount = parseInt(countInput.value);
    
    validationMessage.textContent = '';
    validationMessage.classList.add('hidden');

    if (!arrivalDate || !departureDate || !requestedCount || requestedCount <= 0) {
        return; 
    }
    
    // ✅ التحقق من أن تاريخ الوصول ليس قبل اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0); // إزالة الوقت للمقارنة بالتاريخ فقط
    const arrivalDateObj = new Date(arrivalDate);
    
    if (arrivalDateObj < today) {
        validationMessage.textContent = '❌ لا يمكن الحجز في تاريخ قبل اليوم.';
        validationMessage.classList.remove('hidden');
        validationMessage.classList.remove('success');
        validationMessage.classList.add('error');
        submitButton.disabled = true;
        return;
    }
    
    // ✅ التحقق من أن تاريخ المغادرة بعد تاريخ الوصول
    if (Date.parse(departureDate) <= Date.parse(arrivalDate)) {
        validationMessage.textContent = '❌ تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول.';
        validationMessage.classList.remove('hidden');
        validationMessage.classList.remove('success');
        validationMessage.classList.add('error');
        submitButton.disabled = true;
        return;
    }
    
    validationMessage.textContent = 'جاري التحقق من التوفر... ⏳';
    validationMessage.classList.remove('hidden');
    validationMessage.classList.remove('success');
    validationMessage.classList.remove('error');
    validationMessage.classList.add('info');
    submitButton.disabled = true; 

    const availableCount = await getAvailableCount(suiteKey, arrivalDate, departureDate);
    
    validationMessage.classList.remove('info');

    if (availableCount === -2) {
        validationMessage.textContent = '❌ فشل الاتصال بقاعدة البيانات. تحقق من مفتاح الـ API. (انظر Console للمزيد).';
        validationMessage.classList.remove('hidden');
        validationMessage.classList.add('error');
        submitButton.disabled = true;
    } else {
        const maxCapacity = SUITE_CAPACITIES[suiteKey];
        if (requestedCount > availableCount) {
            // ✅ رسالة محسّنة عندما لا توجد غرف متاحة
            if (availableCount === 0) {
                validationMessage.textContent = '❌ لا يوجد غرف متاحة في هذا التاريخ';
            } else {
                validationMessage.textContent = `❌ لا يمكن حجز ${requestedCount} غرفة. المتاح هو ${availableCount} غرفة فقط`;
            }
            validationMessage.classList.remove('hidden');
            validationMessage.classList.add('error');
            submitButton.disabled = true;
        } else {
            // ✅ رسالة محسّنة عندما توجد غرف متاحة
            validationMessage.textContent = `✅ عدد الغرف المتاحة (${availableCount})`;
            validationMessage.classList.remove('hidden');
            validationMessage.classList.add('success');
            submitButton.disabled = false;
        }
    }
    
    setTimeout(() => {
        if (validationMessage.textContent.includes('✅')) {
            validationMessage.classList.add('hidden');
            validationMessage.classList.remove('success');
        }
    }, 5000);
}


// ===============================================
// 5. وظيفة حفظ حجز جديد (POST)
// ===============================================

async function saveNewReservation() {
    const statusDivId = 'newReservation';

    const guestName = document.getElementById('guestName_new').value;
    const phone = document.getElementById('phone_new').value;
    const counter = document.getElementById('counter_new').value;
    const resType = document.getElementById('type_new').value;

    if (!guestName || !phone || !counter || !resType) {
        showStatus('الرجاء إدخال اسم النزيل، رقم الجوال، الكونتر، ونوع الحجز.', 'error', statusDivId);
        return;
    }

    const getSuiteValue = (key, type) => {
        const element = document.getElementById(`${key}${type}_new`);
        if (!element) return undefined;

        if (type.includes('Count') || type.includes('Days')) {
            const val = parseInt(element.value);
            return isNaN(val) ? undefined : val;
        }
        return element.value.trim() === '' ? undefined : element.value;
    };

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
                showStatus(`❌ فشل الحفظ! ${SUITE_CONFIG[suiteKey].nameAr}: العدد المطلوب (${count}) يتجاوز المتاح (${availableCount}) في الفترة المحددة.`, 'error', statusDivId);
                allAvailable = false;
                break;
            }
        }
    }

    if (!allAvailable) {
        return;
    }
    
    try {
        showStatus('جاري إرسال الحجز... ⏳', 'info', statusDivId, false);

        const response = await fetch(AIRTABLE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: data
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = (response.status === 422 && errorData.error && errorData.error.message)
                ? errorData.error.message
                : (errorData.error ? errorData.error.type : 'غير معروف');
            throw new Error(`Airtable API Error: ${response.status} - ${errorMessage}`);
        }

        const savedRecord = await response.json();
        const newResNumber = savedRecord.fields[FIELD_NAMES.RES_NUMBER];
        
        let message;
        if (resType === 'مؤكد') {
            message = APP_CONFIG.msg_confirmed;
        } else {
            message = APP_CONFIG.msg_waiting;
        }
        
        message = message.replace('{name}', guestName);
        message += `\n\nرقم الحجز: ${newResNumber}`;


        showStatus(`✅ تم حفظ الحجز بنجاح. رقم الحجز: ${newResNumber}`, 'success', statusDivId);
        
        // إعادة تعيين النموذج
        document.getElementById('newReservationForm').reset();
        document.getElementById('currentDate_new').value = new Date().toISOString().substring(0, 10);
        document.querySelector('#newReservationForm button[type="submit"]').disabled = true;

        // نسخ الرسالة إلى الحافظة (لأجهزة الجوال)
        navigator.clipboard.writeText(message).then(() => {
            showStatus(`✅ تم حفظ الحجز ونسخ رسالة التأكيد إلى الحافظة. رقم الحجز: ${newResNumber}`, 'success', statusDivId);
        }).catch(err => {
            console.error('فشل نسخ الرسالة:', err);
            showStatus(`✅ تم حفظ الحجز بنجاح. رقم الحجز: ${newResNumber}. (فشل نسخ الرسالة تلقائياً)`, 'success', statusDivId);
        });

    } catch (error) {
        console.error('❌ خطأ في حفظ الحجز:', error);
        showStatus(`❌ فشل حفظ الحجز. السبب: ${error.message}`, 'error', statusDivId, false);
    }
}


// ===============================================
// 6. وظيفة تحديث/إلغاء حجز (PATCH)
// ===============================================

async function updateReservation(recordId, action) {
    const statusDivId = 'editReservationForm';
    const form = document.getElementById('editReservationForm');

    // تحديد الحقول المراد إرسالها بناءً على الإجراء
    let data = {};
    let fieldsToReset = [];
    let showResetMessage = false;
    let newResType = form.elements['type_edit'].value;
    
    if (action === 'update' || action === 'updateAndSms') {
        const getEditSuiteValue = (key, type) => {
            const element = form.elements[`${key}${type}_edit`];
            if (!element) return undefined;

            if (type.includes('Count')) {
                const val = parseInt(element.value);
                return isNaN(val) ? undefined : val;
            }
            return element.value.trim() === '' ? undefined : element.value;
        };

        let amountValue = form.elements['amount_edit'].value.replace(/[^0-9.]/g, '');
        const amount = (amountValue.trim() !== '' && !isNaN(parseFloat(amountValue))) ? parseFloat(amountValue) : undefined;

        data = {
            [FIELD_IDS.RES_TYPE]: newResType,
            [FIELD_IDS.COUNTER]: form.elements['counter_edit'].value,
            [FIELD_IDS.SOURCE]: form.elements['source_edit'].value,
            [FIELD_IDS.GUEST_NAME]: form.elements['guestName_edit'].value,
            [FIELD_IDS.PHONE]: form.elements['phone_edit'].value,
            [FIELD_IDS.AMOUNT]: amount,
            [FIELD_IDS.TRANSFERER_NAME]: form.elements['transfererName_edit'].value || undefined,
            [FIELD_IDS.TRANSFER_DATE]: form.elements['currentDate_edit'].value || undefined,
            [FIELD_IDS.NOTES]: form.elements['notes_edit'].value || undefined,
            
            // بيانات الأجنحة
            [FIELD_IDS.GUEST_COUNT]: getEditSuiteValue('guest', 'SuiteCount'),
            [FIELD_IDS.GUEST_ARRIVAL]: getEditSuiteValue('guest', 'Arrival'),
            [FIELD_IDS.GUEST_DEPARTURE]: getEditSuiteValue('guest', 'Departure'),
            [FIELD_IDS.VIP_COUNT]: getEditSuiteValue('vip', 'SuiteCount'),
            [FIELD_IDS.VIP_ARRIVAL]: getEditSuiteValue('vip', 'Arrival'),
            [FIELD_IDS.VIP_DEPARTURE]: getEditSuiteValue('vip', 'Departure'),
            [FIELD_IDS.ROYAL_COUNT]: getEditSuiteValue('royal', 'SuiteCount'),
            [FIELD_IDS.ROYAL_ARRIVAL]: getEditSuiteValue('royal', 'Arrival'),
            [FIELD_IDS.ROYAL_DEPARTURE]: getEditSuiteValue('royal', 'Departure'),
        };

        // مسح الحقول الفارغة أو غير المعرفة (لأنه PATCH)
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                delete data[key];
            } else if (key.includes('COUNT') && data[key] === 0) {
                // التأكد من إرسال القيمة صفر في حال تم إلغاء الغرف
                data[key] = 0;
            }
        });

        const totalReserved = (data[FIELD_IDS.GUEST_COUNT] || 0) + (data[FIELD_IDS.VIP_COUNT] || 0) + (data[FIELD_IDS.ROYAL_COUNT] || 0);
        if (totalReserved === 0 && newResType !== 'ملغي') {
            showStatus('الرجاء تحديد جناح واحد على الأقل أو تعيين حالة الحجز إلى "ملغي".', 'error', statusDivId);
            return;
        }

        // فحص التوفر النهائي قبل الإرسال للتعديل
        let allAvailable = true;
        for (const suiteKey of Object.keys(SUITE_CONFIG)) {
            const count = data[SUITE_CONFIG[suiteKey].count];
            const arrival = data[SUITE_CONFIG[suiteKey].arrival];
            const departure = data[SUITE_CONFIG[suiteKey].departure];
            
            if (count && arrival && departure) {
                const availableCount = await getAvailableCount(suiteKey, arrival, departure, recordId); // إرسال recordId
                
                if (availableCount === -2) {
                    showStatus(`❌ فشل التحقق النهائي من توفر ${SUITE_CONFIG[suiteKey].nameAr}. يرجى التحقق من المفاتيح.`, 'error', statusDivId);
                    return;
                }
                if (count > availableCount) {
                    showStatus(`❌ فشل التعديل! ${SUITE_CONFIG[suiteKey].nameAr}: العدد المطلوب (${count}) يتجاوز المتاح (${availableCount}) في الفترة المحددة.`, 'error', statusDivId);
                    allAvailable = false;
                    break;
                }
            }
        }

        if (!allAvailable) {
            return;
        }


    } else if (action === 'cancel') {
        newResType = 'ملغي';
        data[FIELD_IDS.RES_TYPE] = 'ملغي';
        
        // مسح جميع تفاصيل الأجنحة عند الإلغاء لزيادة التوفر
        for (const suiteKey of Object.keys(SUITE_CONFIG)) {
            data[SUITE_CONFIG[suiteKey].count] = 0;
            data[SUITE_CONFIG[suiteKey].arrival] = null;
            data[SUITE_CONFIG[suiteKey].departure] = null;
        }
        
        showResetMessage = true;

    } else {
        showStatus('إجراء غير صالح.', 'error', statusDivId);
        return;
    }

    try {
        const actionText = action === 'cancel' ? 'إلغاء الحجز' : 'تحديث الحجز';
        showStatus(`جاري ${actionText}... ⏳`, 'info', statusDivId, false);

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
            const errorData = await response.json();
            const errorMessage = errorData.error ? errorData.error.type : 'غير معروف';
            throw new Error(`Airtable API Error: ${response.status} - ${errorMessage}`);
        }

        const updatedRecord = await response.json();
        const guestName = updatedRecord.fields[FIELD_NAMES.GUEST_NAME] || 'النزيل';
        let message;
        let smsText;

        if (newResType === 'ملغي') {
            smsText = APP_CONFIG.msg_cancelled.replace('{name}', guestName);
            message = `✅ تم إلغاء الحجز بنجاح. حالة الحجز: ملغي.`;
        } else if (newResType === 'مؤكد') {
            smsText = APP_CONFIG.msg_confirmed.replace('{name}', guestName);
            smsText += `\n\nرقم الحجز: ${updatedRecord.fields[FIELD_NAMES.RES_NUMBER]}`;
            message = `✅ تم تحديث الحجز بنجاح. حالة الحجز: مؤكد.`;
        } else {
            smsText = APP_CONFIG.msg_waiting.replace('{name}', guestName);
            smsText += `\n\nرقم الحجز: ${updatedRecord.fields[FIELD_NAMES.RES_NUMBER]}`;
            message = `✅ تم تحديث الحجز بنجاح. حالة الحجز: ${newResType}.`;
        }

        if (action === 'updateAndSms' || action === 'cancel') {
            navigator.clipboard.writeText(smsText).then(() => {
                message += ` (تم نسخ رسالة ${newResType === 'ملغي' ? 'الإلغاء' : 'التأكيد/الانتظار'} إلى الحافظة)`;
            }).catch(err => {
                console.error('فشل نسخ الرسالة:', err);
                message += ` (فشل نسخ الرسالة تلقائياً)`;
            });
        }
        
        showStatus(message, 'success', statusDivId);
        
        // إخفاء نموذج التعديل وتحديث القائمة
        document.getElementById('editReservationForm').classList.add('hidden');
        document.getElementById('searchReservation').value = '';
        loadAllReservations(true); 

    } catch (error) {
        console.error('❌ خطأ في تحديث الحجز:', error);
        showStatus(`❌ فشل ${actionText}. السبب: ${error.message}`, 'error', statusDivId, false);
    }
}


// ===============================================
// 7. وظيفة تحميل جميع الحجوزات (READ)
// ===============================================

async function loadAllReservations(forceReload = false) {
    const listContainer = document.getElementById('reservationsList');
    const loadingMessage = document.getElementById('loadingReservations');
    const searchInput = document.getElementById('searchReservation');
    const tabId = 'editReservation';

    // استخدام الـ Cache لتجنب طلبات متكررة
    const CACHE_KEY = 'reservations_cache';
    const CACHE_TIME_KEY = 'reservations_cache_time';
    const CACHE_DURATION = 1 * 60 * 1000; // 1 دقيقة

    loadingMessage.classList.remove('hidden');
    listContainer.innerHTML = '';

    let records;
    let cachedData = localStorage.getItem(CACHE_KEY);
    let cacheTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION && !forceReload) {
        records = JSON.parse(cachedData);
        console.log('✅ تحميل الحجوزات من cache');
    } else {
        try {
            console.log('🔄 تحميل الحجوزات من Airtable...');
            // ✅ طلب جميع الحقول المطلوبة للعرض والفلترة
            const fieldsQuery = Object.values(FIELD_NAMES).map(name => `fields[]=${name}`).join('&');
            
            const response = await fetch(`${AIRTABLE_API_URL}?${fieldsQuery}&maxRecords=500&sort%5B0%5D%5Bfield%5D=RES_NUMBER&sort%5B0%5D%5Bdirection%5D=desc`, {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`Airtable fetch failed with status: ${response.status}`);
            }

            const data = await response.json();
            records = data.records;
            
            // ✅ حفظ في localStorage
            localStorage.setItem(CACHE_KEY, JSON.stringify(records));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            
        } catch (error) {
            console.error('❌ خطأ في تحميل الحجوزات:', error);
            loadingMessage.classList.add('error');
            loadingMessage.textContent = '❌ فشل تحميل قائمة الحجوزات. يرجى التحقق من مفتاح الـ API.';
            return;
        }
    }
    
    // إخفاء رسالة التحميل بعد جلب البيانات
    loadingMessage.classList.add('hidden');
    
    // تصفية الحجوزات القديمة والمغادرة
    const filteredRecords = records
    .filter(record => {
        const fields = record.fields;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const guestDeparture = fields[FIELD_NAMES.GUEST_DEPARTURE];
        const vipDeparture = fields[FIELD_NAMES.VIP_DEPARTURE];
        const royalDeparture = fields[FIELD_NAMES.ROYAL_DEPARTURE];
        
        // اختيار أول تاريخ مغادرة متاح
        const departureDate = guestDeparture || vipDeparture || royalDeparture;

        if (fields[FIELD_NAMES.RES_TYPE] === 'ملغي') {
            return false; // استثناء الملغاة نهائيا من القائمة الرئيسية
        }
        
        if (!departureDate) return true; // إبقاء الحجوزات التي لا تحتوي على تواريخ (مثل حجوزات الإيرادات)
        
        return new Date(departureDate) >= today; // إبقاء الحجوزات التي لم تغادر بعد
    })
    // 💡 يمكن إضافة فلترة إضافية هنا (مثل فلترة نص البحث)
    ;
    
    
    if (filteredRecords.length === 0) {
        listContainer.innerHTML = '<div class="empty-message">لا يوجد حجوزات نشطة أو قيد الانتظار حالياً.</div>';
    } else {
        renderReservationsList(filteredRecords, listContainer);
    }

    // تطبيق الفلترة على الإدخال الحالي إذا كان موجوداً
    filterReservations(searchInput.value, filteredRecords);
}

/**
 * وظيفة تطبيق فلترة البحث على القائمة المعروضة
 */
function filterReservations(searchText, allRecords) {
    const listContainer = document.getElementById('reservationsList');
    const normalizedSearchText = searchText.toLowerCase().trim();
    
    if (!allRecords || allRecords.length === 0) {
         // إذا لم يكن هناك سجلات أصلاً، اخرج
        return;
    }
    
    if (normalizedSearchText === '') {
        // إذا كان حقل البحث فارغاً، أظهر جميع السجلات المفلترة مسبقاً
        renderReservationsList(allRecords, listContainer);
        return;
    }

    const filtered = allRecords.filter(record => {
        const fields = record.fields;
        const resNumber = (fields[FIELD_NAMES.RES_NUMBER] || '').toString();
        const guestName = (fields[FIELD_NAMES.GUEST_NAME] || '').toLowerCase();
        const phone = (fields[FIELD_NAMES.PHONE] || '').toLowerCase();

        return (
            resNumber.includes(normalizedSearchText) ||
            guestName.includes(normalizedSearchText) ||
            phone.includes(normalizedSearchText)
        );
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="empty-message">لا توجد حجوزات تطابق معايير البحث.</div>';
    } else {
        renderReservationsList(filtered, listContainer);
    }
}


/**
 * دالة مساعدة لإنشاء وعرض عناصر الحجوزات في القائمة
 */
function renderReservationsList(records, listContainer) {
    listContainer.innerHTML = ''; 
    
    records.forEach(record => {
        const fields = record.fields;
        const resType = fields[FIELD_NAMES.RES_TYPE] || 'مؤكد';
        const resNumber = fields[FIELD_NAMES.RES_NUMBER] || 'N/A';
        const guestName = fields[FIELD_NAMES.GUEST_NAME] || 'غير معروف';
        const phone = fields[FIELD_NAMES.PHONE] || 'N/A';
        
        let typeClass = 'confirmed';
        if (resType === 'ملغي') typeClass = 'cancelled';
        if (resType === 'قيد الانتظار') typeClass = 'waiting';

        const item = document.createElement('div');
        item.className = 'reservation-item';
        item.setAttribute('data-record-id', record.id);
        item.setAttribute('data-res-number', resNumber);
        
        item.innerHTML = `
            <div class="reservation-item-info">
                <span class="reservation-number">#${resNumber}</span>
                <span class="reservation-type ${typeClass}">${resType}</span>
                <span class="reservation-guest">${guestName} (${phone})</span>
            </div>
            <i class="collapsible-icon" style="border-top-color: var(--dark);"></i>
        `;
        
        listContainer.appendChild(item);
        
        // إضافة محتوى الـ accordion
        const accordionContent = document.createElement('div');
        accordionContent.className = 'reservation-accordion-content collapsible-content';
        accordionContent.setAttribute('data-record-id', record.id);
        accordionContent.innerHTML = `
            <div class="reservation-details-wrapper">
                ${renderReservationDetails(record)}
                <div class="detail-actions">
                    <button class="btn btn-primary btn-sm" onclick="showEditForm('${record.id}')">تعديل الحجز</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmCancel('${record.id}', '${resNumber}')">إلغاء الحجز</button>
                </div>
            </div>
        `;
        listContainer.appendChild(accordionContent);
    });
    
    // إضافة مستمعي الأحداث لـ accordion
    document.querySelectorAll('.reservation-item').forEach(item => {
        item.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const icon = this.querySelector('.collapsible-icon');

            // إغلاق أي محتوى مفتوح آخر
            document.querySelectorAll('.reservation-item').forEach(otherItem => {
                if (otherItem !== this) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.collapsible-icon').style.transform = 'none';
                    otherItem.nextElementSibling.classList.remove('active');
                }
            });

            // فتح أو إغلاق المحتوى الحالي
            this.classList.toggle('active');
            content.classList.toggle('active');
            if (content.classList.contains('active')) {
                icon.style.transform = 'rotate(180deg)';
            } else {
                icon.style.transform = 'none';
            }
        });
    });
}

/**
 * دالة مساعدة لإنشاء محتوى تفاصيل الحجز (يُستخدم في العرض وفي نموذج التعديل)
 */
function renderReservationDetails(record) {
    const fields = record.fields;
    const resNumber = fields[FIELD_NAMES.RES_NUMBER] || 'N/A';
    const phone = fields[FIELD_NAMES.PHONE] || 'N/A';
    const counter = fields[FIELD_NAMES.COUNTER] || 'N/A';
    const amount = (fields[FIELD_NAMES.AMOUNT] !== undefined && fields[FIELD_NAMES.AMOUNT] !== null) ? `${fields[FIELD_NAMES.AMOUNT].toLocaleString()} ريال` : 'N/A';
    const transfererName = fields[FIELD_NAMES.TRANSFERER_NAME] || 'N/A';
    const transferDate = fields[FIELD_NAMES.TRANSFER_DATE] || 'N/A';
    const notes = fields[FIELD_NAMES.NOTES] || 'لا توجد ملاحظات';
    
    // تحديد حقول العرض وتنسيقها مع الدائرة (التعديل من الطلب السابق)
    let fieldMappings = [
        { label: 'رقم الحجز:', value: resNumber },
        { label: 'الاسم:', value: fields[FIELD_NAMES.GUEST_NAME] || 'N/A' },
        { label: 'الحالة:', value: fields[FIELD_NAMES.RES_TYPE] || 'N/A' },
        { label: 'رقم الجوال:', value: phone },
        { label: 'الكونتر:', value: counter },
        { label: 'المبلغ:', value: amount },
        { label: 'المصدر:', value: fields[FIELD_NAMES.SOURCE] || 'N/A' },
        { label: 'المحول:', value: transfererName },
        { label: 'تاريخ التحويل:', value: transferDate },
        // ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // 🚨 التعديل المطلوب: نقل الدائرة إلى قبل تاريخ الوصول
        { label: 'جناح ضيافة - عدد الغرف', value: fields[FIELD_NAMES.GUEST_COUNT] || '0' },
        { label: `<span class="status-circle" style="background-color: ${getStatusColor(fields[FIELD_NAMES.GUEST_ARRIVAL], fields[FIELD_NAMES.GUEST_DEPARTURE])};"></span> جناح ضيافة - الوصول`, value: fields[FIELD_NAMES.GUEST_ARRIVAL] || 'N/A' }, // <-- MODIFIED GUEST ARRIVAL
        { label: 'جناح ضيافة - المغادرة', value: fields[FIELD_NAMES.GUEST_DEPARTURE] || 'N/A' },
        { label: 'جناح VIP - عدد الغرف', value: fields[FIELD_NAMES.VIP_COUNT] || '0' }, // <-- MODIFIED VIP COUNT (removed circle)
        { label: `<span class="status-circle" style="background-color: ${getStatusColor(fields[FIELD_NAMES.VIP_ARRIVAL], fields[FIELD_NAMES.VIP_DEPARTURE])};"></span> جناح VIP - الوصول`, value: fields[FIELD_NAMES.VIP_ARRIVAL] || 'N/A' }, // <-- MODIFIED VIP ARRIVAL
        { label: 'جناح VIP - المغادرة', value: fields[FIELD_NAMES.VIP_DEPARTURE] || 'N/A' },
        { label: 'جناح ملكي - عدد الغرف', value: fields[FIELD_NAMES.ROYAL_COUNT] || '0' }, // <-- MODIFIED ROYAL COUNT (removed circle)
        { label: `<span class="status-circle" style="background-color: ${getStatusColor(fields[FIELD_NAMES.ROYAL_ARRIVAL], fields[FIELD_NAMES.ROYAL_DEPARTURE])};"></span> جناح ملكي - الوصول`, value: fields[FIELD_NAMES.ROYAL_ARRIVAL] || 'N/A' }, // <-- MODIFIED ROYAL ARRIVAL
        { label: 'جناح ملكي - المغادرة', value: fields[FIELD_NAMES.ROYAL_DEPARTURE] || 'N/A' },
        { label: 'ملاحظات', value: notes }
    ];
    
    // إزالة الصفوف التي لا تحتوي على معلومات أساسية (مثل 'N/A' في تواريخ الأجنحة)
    const validMappings = fieldMappings.filter(mapping => {
        // إذا كان رقم حجز أو اسم أو حالة أو هاتف، يجب أن يظهر
        if (['رقم الحجز:', 'الاسم:', 'الحالة:', 'رقم الجوال:'].includes(mapping.label)) return true;
        // إزالة تفاصيل الأجنحة إذا كان عدد الغرف صفر وتاريخ الوصول N/A
        if (mapping.label.includes('عدد الغرف') && mapping.value === '0') {
            const suiteType = mapping.label.split(' - ')[0];
            const arrivalEntry = fieldMappings.find(f => f.label.includes(suiteType) && f.label.includes('الوصول'));
            if (arrivalEntry && arrivalEntry.value === 'N/A') return false; 
        }
        // إظهار التواريخ إذا كانت غير N/A
        if (mapping.label.includes('الوصول') && mapping.value === 'N/A') return false; 
        if (mapping.label.includes('المغادرة') && mapping.value === 'N/A') return false; 
        if (mapping.label.includes('المحول:') && mapping.value === 'N/A') return false; 
        if (mapping.label.includes('تاريخ التحويل:') && mapping.value === 'N/A') return false; 
        if (mapping.label.includes('المصدر:') && mapping.value === 'N/A') return false; 
        if (mapping.label.includes('المبلغ:') && mapping.value === 'N/A') return false;
        
        return true;
    });

    let html = '<div class="reservation-details-grid">';
    
    validMappings.forEach(mapping => {
        const isFullWidth = mapping.label === 'ملاحظات';
        const notesValue = isFullWidth ? `<textarea readonly>${mapping.value}</textarea>` : mapping.value;
        html += `
            <div class="detail-row ${isFullWidth ? 'full-width' : ''}">
                <div class="detail-label">${mapping.label}</div>
                <div class="detail-value">${notesValue}</div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

/**
 * وظيفة عرض نموذج التعديل
 */
function showEditForm(recordId) {
    const form = document.getElementById('editReservationForm');
    const records = JSON.parse(localStorage.getItem('reservations_cache') || '[]');
    const record = records.find(r => r.id === recordId);
    
    if (!record) {
        showStatus('❌ لم يتم العثور على بيانات الحجز للتعديل.', 'error', 'editReservationForm');
        return;
    }
    
    const fields = record.fields;

    // ملء حقول النموذج بالبيانات الحالية
    form.setAttribute('data-record-id', recordId);
    form.elements['resNumber_edit'].value = fields[FIELD_NAMES.RES_NUMBER] || '';
    form.elements['guestName_edit'].value = fields[FIELD_NAMES.GUEST_NAME] || '';
    form.elements['phone_edit'].value = fields[FIELD_NAMES.PHONE] || '';
    form.elements['counter_edit'].value = fields[FIELD_NAMES.COUNTER] || '';
    form.elements['type_edit'].value = fields[FIELD_NAMES.RES_TYPE] || 'مؤكد';
    form.elements['amount_edit'].value = fields[FIELD_NAMES.AMOUNT] || '';
    form.elements['source_edit'].value = fields[FIELD_NAMES.SOURCE] || '';
    form.elements['transfererName_edit'].value = fields[FIELD_NAMES.TRANSFERER_NAME] || '';
    form.elements['currentDate_edit'].value = fields[FIELD_NAMES.TRANSFER_DATE] || '';
    form.elements['notes_edit'].value = fields[FIELD_NAMES.NOTES] || '';

    // ملء تفاصيل الأجنحة
    form.elements['guestSuiteCount_edit'].value = fields[FIELD_NAMES.GUEST_COUNT] || '';
    form.elements['guestArrival_edit'].value = fields[FIELD_NAMES.GUEST_ARRIVAL] || '';
    form.elements['guestDeparture_edit'].value = fields[FIELD_NAMES.GUEST_DEPARTURE] || '';
    form.elements['vipSuiteCount_edit'].value = fields[FIELD_NAMES.VIP_COUNT] || '';
    form.elements['vipArrival_edit'].value = fields[FIELD_NAMES.VIP_ARRIVAL] || '';
    form.elements['vipDeparture_edit'].value = fields[FIELD_NAMES.VIP_DEPARTURE] || '';
    form.elements['royalSuiteCount_edit'].value = fields[FIELD_NAMES.ROYAL_COUNT] || '';
    form.elements['royalArrival_edit'].value = fields[FIELD_NAMES.ROYAL_ARRIVAL] || '';
    form.elements['royalDeparture_edit'].value = fields[FIELD_NAMES.ROYAL_DEPARTURE] || '';

    // إظهار النموذج
    form.classList.remove('hidden');
    document.getElementById('editReservation').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // إخفاء أي رسالة حالة سابقة
    showStatus('', 'info', 'editReservationForm', false);
    
    // تحديث ملخص الأجنحة
    updateSuiteSummary('edit', 'guest');
    updateSuiteSummary('edit', 'vip');
    updateSuiteSummary('edit', 'royal');
}


/**
 * دالة تأكيد الإلغاء
 */
function confirmCancel(recordId, resNumber) {
    if (confirm(`هل أنت متأكد من إلغاء الحجز رقم: ${resNumber}؟`)) {
        updateReservation(recordId, 'cancel');
    }
}

// ===============================================
// 8. وظيفة تحديث الإشغال (Occupancy)
// ===============================================

async function loadOccupancy(startDate = null, endDate = null) {
    const tableBody = document.getElementById('occupancyTableBody');
    const loadingMessage = document.getElementById('loadingOccupancy');
    const summaryTotal = document.getElementById('totalSummary');
    const summaryGuest = document.getElementById('guestSummary');
    const summaryVip = document.getElementById('vipSummary');
    const summaryRoyal = document.getElementById('royalSummary');
    const table = document.getElementById('occupancyTable');
    
    loadingMessage.classList.remove('hidden');
    table.classList.add('hidden');
    tableBody.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // تحديد التواريخ الافتراضية إذا لم يتم تمريرها
    if (!startDate) {
        startDate = today.toISOString().substring(0, 10);
    }
    if (!endDate) {
        // نهاية فترة 60 يوماً
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 59);
        endDate = futureDate.toISOString().substring(0, 10);
    }
    
    // تحديث حقول الفلترة
    document.getElementById('occupancyStart').value = startDate;
    document.getElementById('occupancyEnd').value = endDate;


    // 1. جلب جميع الحجوزات النشطة التي تتداخل مع الفترة المطلوبة
    let records;
    try {
        console.log('🔄 جلب بيانات الإشغال...');
        
        // جلب الحقول المطلوبة لجميع الأجنحة وحالة الحجز فقط
        const fieldsQuery = [
            FIELD_NAMES.RES_TYPE,
            FIELD_NAMES.GUEST_COUNT, FIELD_NAMES.GUEST_ARRIVAL, FIELD_NAMES.GUEST_DEPARTURE,
            FIELD_NAMES.VIP_COUNT, FIELD_NAMES.VIP_ARRIVAL, FIELD_NAMES.VIP_DEPARTURE,
            FIELD_NAMES.ROYAL_COUNT, FIELD_NAMES.ROYAL_ARRIVAL, FIELD_NAMES.ROYAL_DEPARTURE
        ].map(name => `fields[]=${name}`).join('&');
        
        // 🚨 المنطق المصحح لفلترة الإشغال: يجب أن نرى الحجوزات التي تبدأ قبل نهاية الفترة وتنتهي بعد بداية الفترة
        const filterFormula = `AND(` +
            `OR(` + 
                `IS_BEFORE({GUEST_ARRIVAL}, '${endDate}'), IS_BEFORE({VIP_ARRIVAL}, '${endDate}'), IS_BEFORE({ROYAL_ARRIVAL}, '${endDate}')` +
            `),` +
            `OR(` + 
                `IS_AFTER({GUEST_DEPARTURE}, '${startDate}'), IS_AFTER({VIP_DEPARTURE}, '${startDate}'), IS_AFTER({ROYAL_DEPARTURE}, '${startDate}')` +
            `),` +
            `{RES_TYPE} != 'ملغي'` + // استثناء الملغاة
        `)`;
        
        const response = await fetch(`${AIRTABLE_API_URL}?${fieldsQuery}&filterByFormula=${encodeURIComponent(filterFormula)}`, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable fetch failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        records = data.records;
        
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات الإشغال:', error);
        loadingMessage.classList.remove('hidden');
        loadingMessage.textContent = '❌ فشل تحميل بيانات الإشغال. يرجى التحقق من المفاتيح.';
        return;
    }

    // 2. معالجة البيانات وتجميع الإشغال اليومي
    const occupancyData = {};
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // مجموع الغرف القصوى
    const MAX_GUEST = parseInt(APP_CONFIG.guest_capacity) || SUITE_CAPACITIES.guest;
    const MAX_VIP = parseInt(APP_CONFIG.vip_capacity) || SUITE_CAPACITIES.vip;
    const MAX_ROYAL = parseInt(APP_CONFIG.royal_capacity) || SUITE_CAPACITIES.royal;
    const MAX_TOTAL = MAX_GUEST + MAX_VIP + MAX_ROYAL;

    let maxTotalOccupied = 0;
    
    while (currentDate <= end) {
        const dateString = currentDate.toISOString().substring(0, 10);
        const dayOfWeek = dayNames[currentDate.getDay()];
        
        let guestOccupied = 0;
        let vipOccupied = 0;
        let royalOccupied = 0;
        
        // تصفير الوقت عند منتصف الليل
        currentDate.setHours(0, 0, 0, 0);

        records.forEach(record => {
            const fields = record.fields;
            
            // تحقق من إشغال جناح الضيافة
            guestOccupied += getOccupancyForSuite(fields, FIELD_NAMES.GUEST_ARRIVAL, FIELD_NAMES.GUEST_DEPARTURE, FIELD_NAMES.GUEST_COUNT, currentDate);
            // تحقق من إشغال جناح VIP
            vipOccupied += getOccupancyForSuite(fields, FIELD_NAMES.VIP_ARRIVAL, FIELD_NAMES.VIP_DEPARTURE, FIELD_NAMES.VIP_COUNT, currentDate);
            // تحقق من إشغال الجناح الملكي
            royalOccupied += getOccupancyForSuite(fields, FIELD_NAMES.ROYAL_ARRIVAL, FIELD_NAMES.ROYAL_DEPARTURE, FIELD_NAMES.ROYAL_COUNT, currentDate);
        });
        
        const totalOccupied = guestOccupied + vipOccupied + royalOccupied;
        maxTotalOccupied = Math.max(maxTotalOccupied, totalOccupied);

        occupancyData[dateString] = {
            day: dayOfWeek,
            guest: Math.min(guestOccupied, MAX_GUEST),
            vip: Math.min(vipOccupied, MAX_VIP),
            royal: Math.min(royalOccupied, MAX_ROYAL),
            total: Math.min(totalOccupied, MAX_TOTAL)
        };
        
        // الانتقال إلى اليوم التالي
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 3. عرض البيانات في الجدول
    renderOccupancyTable(occupancyData, MAX_GUEST, MAX_VIP, MAX_ROYAL, MAX_TOTAL);
    
    // 4. تحديث الملخص
    updateOccupancySummary(occupancyData, MAX_GUEST, MAX_VIP, MAX_ROYAL, MAX_TOTAL, maxTotalOccupied);
    
    loadingMessage.classList.add('hidden');
    table.classList.remove('hidden');
}


/**
 * دالة مساعدة لحساب الإشغال ليوم واحد لجناح معين
 */
function getOccupancyForSuite(fields, arrivalField, departureField, countField, targetDate) {
    const arrivalDateStr = fields[arrivalField];
    const departureDateStr = fields[departureField];
    const count = parseFloat(fields[countField]) || 0;
    
    if (count === 0 || !arrivalDateStr || !departureDateStr) {
        return 0;
    }
    
    const arrivalDate = new Date(arrivalDateStr);
    arrivalDate.setHours(0, 0, 0, 0);
    
    const departureDate = new Date(departureDateStr);
    departureDate.setHours(0, 0, 0, 0);

    // إذا كان اليوم المستهدف يقع بين أو يساوي تاريخ الوصول (شاملاً) وأقل من تاريخ المغادرة
    // (حيث أن الحجز ينتهي في بداية يوم المغادرة، لذا يجب أن يكون الإشغال قبل يوم المغادرة)
    if (targetDate >= arrivalDate && targetDate < departureDate) {
        return count;
    }
    
    return 0;
}


/**
 * دالة مساعدة لإنشاء الجدول
 */
function renderOccupancyTable(data, maxGuest, maxVip, maxRoyal, maxTotal) {
    const tableBody = document.getElementById('occupancyTableBody');
    tableBody.innerHTML = '';
    
    // دالة لتحديد الفئة بناءً على نسبة الإشغال
    const getOccupancyClass = (occupied, total) => {
        if (total === 0) return 'occupancy-low'; // تجنب القسمة على صفر
        const percentage = (occupied / total) * 100;
        if (percentage <= 25) return 'occupancy-low';
        if (percentage <= 50) return 'occupancy-low-medium';
        if (percentage <= 75) return 'occupancy-medium';
        if (percentage < 100) return 'occupancy-medium-high';
        return 'occupancy-high';
    };

    // دالة لتنسيق الخلية
    const formatCell = (occupied, total, isTotalRow = false) => {
        const totalText = total === 0 ? '0' : total;
        const occupiedText = occupied === 0 ? '0' : occupied;
        const className = getOccupancyClass(occupied, total);
        
        // تمكين التحديد في حالة الإشغال الزائد
        const statusText = occupied > total ? 'فائض' : `${occupiedText} / ${totalText}`;
        const finalClass = occupied > total ? 'occupancy-low' : className; // استخدام اللون الأحمر للفائض

        return `<td class="${isTotalRow ? 'occupancy-cell' : ''} ${finalClass}">${statusText}</td>`;
    };


    Object.keys(data).forEach(dateString => {
        const rowData = data[dateString];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${dateString}</td>
            <td><span class="day-name">${rowData.day}</span></td>
            ${formatCell(rowData.guest, maxGuest)}
            ${formatCell(rowData.vip, maxVip)}
            ${formatCell(rowData.royal, maxRoyal)}
            ${formatCell(rowData.total, maxTotal, true)}
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * دالة مساعدة لتحديث ملخص الإشغال العلوي
 */
function updateOccupancySummary(data, maxGuest, maxVip, maxRoyal, maxTotal, maxTotalOccupied) {
    
    // دالة حساب المتوسطات والحد الأقصى للإشغال
    const calculateStats = (key, maxCapacity) => {
        if (maxCapacity === 0) return { maxOccupied: 0, avgOccupied: 0 };
        
        const allOccupied = Object.values(data).map(d => d[key]);
        const maxOccupied = Math.max(...allOccupied);
        const sumOccupied = allOccupied.reduce((a, b) => a + b, 0);
        const avgOccupied = sumOccupied / allOccupied.length;
        
        return { maxOccupied, avgOccupied };
    };

    const guestStats = calculateStats('guest', maxGuest);
    const vipStats = calculateStats('vip', maxVip);
    const royalStats = calculateStats('royal', maxRoyal);

    // دالة لتنسيق شريط التقدم
    const renderSummaryCard = (summaryElement, maxOccupied, maxCapacity, name) => {
        if (maxCapacity === 0) {
            summaryElement.querySelector('.summary-value').innerHTML = `<span class="occupied">0</span> / 0 <span class="percentage">0%</span>`;
            summaryElement.querySelector('.summary-bar-fill').style.width = '0%';
            summaryElement.querySelector('.summary-bar-fill').style.backgroundColor = 'var(--gray-light)';
            return;
        }

        const percentage = Math.min(100, (maxOccupied / maxCapacity) * 100);
        const barFill = summaryElement.querySelector('.summary-bar-fill');
        
        // تحديد لون الشريط
        let color = '#28a745'; // أخضر
        if (percentage >= 100) color = '#dc3545'; // أحمر
        else if (percentage > 70) color = '#ffc107'; // أصفر
        
        summaryElement.querySelector('.summary-label').textContent = name;
        summaryElement.querySelector('.summary-value').innerHTML = `
            <span class="occupied">${maxOccupied}</span> / <span class="total">${maxCapacity}</span>
            <span class="percentage" style="color: ${color};">${Math.round(percentage)}%</span>
        `;
        barFill.style.width = `${percentage}%`;
        barFill.style.backgroundColor = color;
    };
    
    // عرض الملخصات الفردية
    renderSummaryCard(summaryGuest, guestStats.maxOccupied, maxGuest, APP_CONFIG.guest_name_ar || 'جناح ضيافة');
    renderSummaryCard(summaryVip, vipStats.maxOccupied, maxVip, APP_CONFIG.vip_name_ar || 'جناح VIP');
    renderSummaryCard(summaryRoyal, royalStats.maxOccupied, maxRoyal, APP_CONFIG.royal_name_ar || 'جناح ملكي');

    // عرض الملخص الإجمالي (بناءً على الحد الأقصى في الفترة)
    const totalPercentage = Math.min(100, (maxTotalOccupied / maxTotal) * 100);
    const totalBarFill = document.getElementById('totalBar');
    
    let totalColor = '#28a745'; // أخضر
    if (totalPercentage >= 100) totalColor = '#dc3545'; // أحمر
    else if (totalPercentage > 70) totalColor = '#ffc107'; // أصفر
    
    summaryTotal.innerHTML = `
        <span class="occupied">${maxTotalOccupied}</span> / <span class="total">${maxTotal}</span>
        <span class="percentage" style="color: ${totalColor};">${Math.round(totalPercentage)}%</span>
    `;
    totalBarFill.style.width = `${totalPercentage}%`;
    totalBarFill.style.backgroundColor = totalColor;
}

// ===============================================
// 9. تهيئة الأحداث (Event Handlers)
// ===============================================

/**
 * دالة التبديل بين التبويبات
 */
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // إجراء خاص بتبويب تعديل/إلغاء حجز
    if (tabId === 'editReservation') {
        loadAllReservations(); 
        document.getElementById('editReservationForm').classList.add('hidden');
        document.getElementById('searchReservation').value = '';
    }
    
    // إجراء خاص بتبويب الإشغال
    if (tabId === 'query') {
        loadOccupancy();
    }
    
    // إخفاء نموذج التعديل في جميع الأحوال ما عدا عند الحاجة
    if (tabId !== 'editReservation') {
        document.getElementById('editReservationForm').classList.add('hidden');
    }
}

/**
 * دالة تهيئة المستمعين بعد تحميل الصفحة
 */
function initializeEventListeners() {
    
    // تبديل التبويبات
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // تهيئة أقسام Collapsible
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('active');
            this.nextElementSibling.classList.toggle('active');
        });
    });

    // تهيئة نموذج الحجز الجديد
    const newForm = document.getElementById('newReservationForm');
    newForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveNewReservation();
    });
    
    // تهيئة نموذج التعديل
    const editForm = document.getElementById('editReservationForm');
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const recordId = this.getAttribute('data-record-id');
        if (recordId) {
            updateReservation(recordId, 'update');
        }
    });
    
    // تهيئة أزرار الإجراءات في نموذج التعديل
    document.getElementById('updateAndSmsBtn').addEventListener('click', function() {
        const recordId = editForm.getAttribute('data-record-id');
        if (recordId) {
            updateReservation(recordId, 'updateAndSms');
        }
    });

    // إلغاء نموذج التعديل
    document.getElementById('cancelEditBtn').addEventListener('click', function() {
        editForm.classList.add('hidden');
        showStatus('', 'info', 'editReservationForm', false);
    });

    // تهيئة حقول التاريخ والعدد في نماذج الحجز
    const suiteFields = ['guest', 'vip', 'royal'];
    ['new', 'edit'].forEach(prefix => {
        suiteFields.forEach(suiteKey => {
            const arrivalInput = document.getElementById(`${suiteKey}Arrival_${prefix}`);
            const departureInput = document.getElementById(`${suiteKey}Departure_${prefix}`);
            const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);
            
            if (arrivalInput) {
                arrivalInput.addEventListener('change', () => calculateDaysPerSuite(prefix, suiteKey));
            }
            if (departureInput) {
                departureInput.addEventListener('change', () => calculateDaysPerSuite(prefix, suiteKey));
            }
            if (countInput) {
                countInput.addEventListener('input', () => {
                    updateSuiteSummary(prefix, suiteKey);
                    if (prefix === 'new') {
                        // لا حاجة لإعادة الحساب، فقط التحقق
                        checkAndValidateAvailability(suiteKey, prefix);
                    }
                });
            }
        });
    });
    
    // تهيئة حقل بحث الحجوزات
    const searchInput = document.getElementById('searchReservation');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // جلب القائمة الكاملة المفلترة مسبقاً من الـ cache
            const allRecords = JSON.parse(localStorage.getItem('reservations_cache') || '[]')
                               .filter(record => record.fields[FIELD_NAMES.RES_TYPE] !== 'ملغي'); // استثناء الملغاة
            filterReservations(e.target.value, allRecords);
        });
    }
    
    // تهيئة فلاتر الإشغال
    document.getElementById('occupancyFilterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const start = document.getElementById('occupancyStart').value;
        const end = document.getElementById('occupancyEnd').value;
        loadOccupancy(start, end);
    });
    
    // أزرار الاختصار لفلترة الإشغال
    document.getElementById('filter30Days').addEventListener('click', () => {
        const today = new Date().toISOString().substring(0, 10);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 29);
        const end = futureDate.toISOString().substring(0, 10);
        loadOccupancy(today, end);
    });
    
    document.getElementById('filter60Days').addEventListener('click', () => {
        const today = new Date().toISOString().substring(0, 10);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 59);
        const end = futureDate.toISOString().substring(0, 10);
        loadOccupancy(today, end);
    });
    
    // إظهار التاريخ الحالي في نموذج الحجز الجديد
    document.getElementById('currentDate_new').value = new Date().toISOString().substring(0, 10);
    
    // تعطيل زر الحفظ الجديد حتى التحقق من التوفر
    document.querySelector('#newReservationForm button[type="submit"]').disabled = true;

}

// ===============================================
// 10. تشغيل التطبيق (Run)
// ===============================================

async function runApplication() {
    // 1. تحميل الإعدادات أولاً
    APP_CONFIG = await loadConfig();
    
    // 2. تحديث أسماء الفنادق والأجنحة من الإعدادات
    document.getElementById('hotel-name').textContent = APP_CONFIG.hotel_name || 'نظام إدارة الحجوزات';

    // 3. تهيئة مستمعي الأحداث
    initializeEventListeners();

    // 4. تحميل البيانات الأولية (تحميل الإشغال والتبديل إليه)
    switchTab('query'); // البدء بتبويب الإشغال لعدم تأخير بدء التشغيل
    
    // 5. ضبط قيم الأجنحة القصوى من الإعدادات
    SUITE_CAPACITIES.guest = parseInt(APP_CONFIG.guest_capacity) || SUITE_CAPACITIES.guest;
    SUITE_CAPACITIES.vip = parseInt(APP_CONFIG.vip_capacity) || SUITE_CAPACITIES.vip;
    SUITE_CAPACITIES.royal = parseInt(APP_CONFIG.royal_capacity) || SUITE_CAPACITIES.royal;
}

document.addEventListener('DOMContentLoaded', runApplication);
