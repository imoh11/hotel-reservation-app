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

// =================================================================
// 2. FIELD NAMES & IDS
// =================================================================

// Field Names (for reading from Airtable)
const FIELD_NAMES = {
    RES_NUMBER: 'Res_Number',  // ✅ الاسم الصحيح في Airtable
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
    guest: 14,  // جناح ضيافة (14 غرفة)
    vip: 4,     // جناح VIP (4 غرف)
    royal: 2    // جناح ملكي (2 غرفة)
};

// ربط مفاتيح الأجنحة بمعرّفات الحقول
const SUITE_CONFIG = {
    guest: {
        count: FIELD_IDS.GUEST_COUNT,
        arrival: FIELD_IDS.GUEST_ARRIVAL,
        departure: FIELD_IDS.GUEST_DEPARTURE,
        countName: 'GUEST_COUNT',          // اسم الحقل الفعلي في Airtable
        arrivalName: 'GUEST_ARRIVAL',      // اسم حقل الوصول
        departureName: 'GUEST_DEPARTURE',  // اسم حقل المغادرة
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
        hotel_name: "فندق الضيافة",
        hotel_phone: "0501234567",
        guest_capacity: "14",
        vip_capacity: "4",
        royal_capacity: "2",
        guest_name_ar: "جناح ضيافة",
        vip_name_ar: "جناح VIP",
        royal_name_ar: "جناح ملكي",
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
    console.log(`  - Requested: Arrival=${arrivalDate}, Departure=${departureDate}`);
    console.log(`  - Field IDs: arrival=${config.arrival}, departure=${config.departure}, count=${config.count}`);
    console.log(`  - Max Capacity: ${maxCapacity}`);
    console.log(`  - Filter: ${detailedFilter}`);
    
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
        
        console.log(`  - Found ${data.records.length} overlapping reservations`);
        
        let totalReserved = 0;
        
        // ضمان قراءة الأرقام بشكل صحيح
        data.records.forEach((record, index) => {
            // ✅ استثناء الحجز الحالي عند التعديل
            if (excludeRecordId && record.id === excludeRecordId) {
                console.log(`    [${index + 1}] Record ID: ${record.id} - EXCLUDED (الحجز الحالي)`);
                return; // تجاهل هذا الحجز
            }
            
            // ✅ الحل: استخدام أسماء الحقول بدلاً من Field IDs
            const reservedCount = parseFloat(record.fields[config.countName]) || 0;
            const recordArrival = record.fields[config.arrivalName] || 'N/A';
            const recordDeparture = record.fields[config.departureName] || 'N/A';
            
            console.log(`    [${index + 1}] Record ID: ${record.id}`);
            console.log(`        Arrival: ${recordArrival}, Departure: ${recordDeparture}`);
            console.log(`        Reserved Rooms: ${reservedCount}`);
            console.log(`        Raw fields:`, JSON.stringify(record.fields));
            
            // فقط أضف الغرف إذا كان هناك عدد محجوز
            if (reservedCount > 0) {
                totalReserved += reservedCount;
            }
        });

        const available = maxCapacity - totalReserved;
        console.log(`  - Total Reserved: ${totalReserved}, Max Capacity: ${maxCapacity}, Available: ${available}`);
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
        const newResId = savedRecord.id;

        const successMessage = `✅ تم حفظ الحجز بنجاح`;
        showStatus(successMessage, 'success', statusDivId);

        document.getElementById('newReservationForm').reset();

        document.querySelectorAll('span[id$="_summary_new"]').forEach(span => span.textContent = '');
        document.querySelectorAll('p[id$="_validation_new"]').forEach(p => {
             p.classList.add('hidden');
             p.textContent = '';
        });

    } catch (error) {
        console.error('Error saving reservation:', error);
        showStatus(`❌ فشل حفظ الحجز. (خطأ: ${error.message || 'غير معروف'}).`, 'error', statusDivId);
    }
}


// ===============================================
// 6. وظيفة حفظ وإرسال عبر WhatsApp
// ===============================================

/**
 * حفظ الحجز وإرسال ملخص عبر WhatsApp Web
 */
async function saveAndSendWhatsApp() {
    const statusDivId = 'newReservation';
    
    // أولاً: حفظ الحجز
    const guestName = document.getElementById('guestName_new').value;
    const phone = document.getElementById('phone_new').value;
    const resType = document.getElementById('type_new').value;
    
    if (!guestName || !phone || !resType) {
        showStatus('الرجاء إدخال اسم النزيل، رقم الجوال، ونوع الحجز.', 'error', statusDivId);
        return;
    }
    
    // جمع بيانات التواريخ من جميع الأجنحة
    const getSuiteValue = (key, type) => {
        const element = document.getElementById(`${key}${type}_new`);
        if (!element) return undefined;
        if (type.includes('Count') || type.includes('Days')) {
            const val = parseInt(element.value);
            return isNaN(val) ? undefined : val;
        }
        return element.value.trim() === '' ? undefined : element.value;
    };
    
    const guestArrival = getSuiteValue('guest', 'Arrival');
    const guestDeparture = getSuiteValue('guest', 'Departure');
    const vipArrival = getSuiteValue('vip', 'Arrival');
    const vipDeparture = getSuiteValue('vip', 'Departure');
    const royalArrival = getSuiteValue('royal', 'Arrival');
    const royalDeparture = getSuiteValue('royal', 'Departure');
    
    // اختيار أول تاريخ متاح
    const arrivalDate = guestArrival || vipArrival || royalArrival;
    const departureDate = guestDeparture || vipDeparture || royalDeparture;
    
    if (!arrivalDate || !departureDate) {
        showStatus('الرجاء إدخال تواريخ الوصول والمغادرة.', 'error', statusDivId);
        return;
    }
    
    // توليد رقم الحجز
    const resNumber = generateResNumber();
    
    // ✅ إعداد رسالة WhatsApp من القوالب في Airtable
    let messageTemplate = '';
    
    if (resType === 'مؤكد') {
        messageTemplate = APP_CONFIG.msg_confirmed || 'ضيفنا العزيز: {name}\nتم تأكيد حجزك';
    } else if (resType === 'قيد الانتظار') {
        messageTemplate = APP_CONFIG.msg_waiting || 'ضيفنا العزيز: {name}\nحجزك قيد الانتظار';
    } else if (resType === 'ملغي') {
        messageTemplate = APP_CONFIG.msg_cancelled || 'ضيفنا العزيز: {name}\nتم إلغاء حجزك';
    } else {
        messageTemplate = APP_CONFIG.msg_confirmed || 'ضيفنا العزيز: {name}\nتم حجزك';
    }
    
    // ✅ حساب عدد الضيوف والمبلغ
    const guestCount = (getSuiteValue('guest', 'Count') || 0) + (getSuiteValue('vip', 'Count') || 0) + (getSuiteValue('royal', 'Count') || 0);
    const amount = getSuiteValue('amount', '') || 'غير محدد';
    
    // ✅ استبدال المتغيرات
    const message = messageTemplate
        .replace(/{name}/g, guestName)
        .replace(/{hotel}/g, APP_CONFIG.hotel_name || 'الفندق')
        .replace(/{resNumber}/g, resNumber)
        .replace(/{phone}/g, phone)
        .replace(/{guestCount}/g, guestCount)
        .replace(/{arrival}/g, arrivalDate)
        .replace(/{departure}/g, departureDate)
        .replace(/{amount}/g, amount);
    
    // ✅ تنظيف وتحويل رقم الجوال
    let cleanPhone = phone.replace(/\D/g, ''); // إزالة المسافات والرموز
    
    // إذا كان الرقم يبدأ بـ 05، حوله إلى 966
    if (cleanPhone.startsWith('05')) {
        cleanPhone = '966' + cleanPhone.substring(1); // إزالة 0 وإضافة 966
    }
    
    // ✅ فتح WhatsApp باستخدام wa.me
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // فتح في نافذة جديدة
    window.open(whatsappUrl, '_blank');
    
    // حفظ الحجز في Airtable
    await saveNewReservation();
}

// ===============================================
// 7. وظائف تعديل وإلغاء الحجز
// ===============================================

let allReservations = [];
let currentEditingReservation = null;

/**
 * تحميل الحجوزات القادمة فقط من Airtable
 */
async function loadAllReservations() {
    const loadingDiv = document.getElementById('loadingReservations');
    const listDiv = document.getElementById('reservationsList');
    
    try {
        loadingDiv.style.display = 'block';
        listDiv.innerHTML = '';
        
        const response = await fetch(`${AIRTABLE_API_URL}`, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`فشل تحميل الحجوزات: ${response.status}`);
        }
        
        const data = await response.json();
        
        // ✅ فلترة الحجوزات القادمة فقط (تاريخ الوصول >= اليوم)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        allReservations = data.records.filter(reservation => {
            const guestArrival = reservation.fields[FIELD_NAMES.GUEST_ARRIVAL];
            const vipArrival = reservation.fields[FIELD_NAMES.VIP_ARRIVAL];
            const royalArrival = reservation.fields[FIELD_NAMES.ROYAL_ARRIVAL];
            
            // اختيار أول تاريخ متاح
            const arrivalDate = guestArrival || vipArrival || royalArrival;
            
            if (!arrivalDate) return false; // لا توجد تواريخ
            
            const arrival = new Date(arrivalDate);
            return arrival >= today; // فقط الحجوزات القادمة
        });
        
        // ترتيب حسب تاريخ الوصول (الأقرب أولاً)
        allReservations.sort((a, b) => {
            const aDate = new Date(a.fields[FIELD_NAMES.GUEST_ARRIVAL] || a.fields[FIELD_NAMES.VIP_ARRIVAL] || a.fields[FIELD_NAMES.ROYAL_ARRIVAL]);
            const bDate = new Date(b.fields[FIELD_NAMES.GUEST_ARRIVAL] || b.fields[FIELD_NAMES.VIP_ARRIVAL] || b.fields[FIELD_NAMES.ROYAL_ARRIVAL]);
            return aDate - bDate;
        });
        
        loadingDiv.style.display = 'none';
        
        if (allReservations.length === 0) {
            listDiv.innerHTML = '<p class="info-message-block">لا توجد حجوزات قادمة.</p>';
            return;
        }
        
        allReservations.forEach(reservation => {
            // ✅ قراءة البيانات
            const resType = reservation.fields[FIELD_NAMES.RES_TYPE] || 'غير محدد';
            const guestName = reservation.fields[FIELD_NAMES.GUEST_NAME] || 'غير محدد';
            
            // ✅ استبدال رقم الحجز بتاريخ الوصول
            const guestArrival = reservation.fields[FIELD_NAMES.GUEST_ARRIVAL];
            const vipArrival = reservation.fields[FIELD_NAMES.VIP_ARRIVAL];
            const royalArrival = reservation.fields[FIELD_NAMES.ROYAL_ARRIVAL];
            const arrivalDate = guestArrival || vipArrival || royalArrival || 'غير محدد';
            
            let typeClass = '';
            if (resType === 'مؤكد') typeClass = 'confirmed';
            else if (resType === 'قيد الانتظار') typeClass = 'waiting';
            else if (resType === 'ملغي') typeClass = 'cancelled';
            
            // ✅ إنشاء قائمة منسدلة (accordion)
            const accordionDiv = document.createElement('div');
            accordionDiv.className = 'reservation-accordion';
            
            // العنوان (قابل للنقر)
            const headerDiv = document.createElement('div');
            headerDiv.className = 'reservation-accordion-header';
            headerDiv.innerHTML = `
                <div class="reservation-item-info">
                    <span class="reservation-number">${arrivalDate}</span>
                    <span class="reservation-type ${typeClass}">${resType}</span>
                    <span class="reservation-guest">${guestName}</span>
                </div>
                <div class="reservation-actions">
                    <span class="accordion-arrow">▼</span>
                </div>
            `;
            
            // التفاصيل (مخفية بشكل افتراضي)
            const contentDiv = document.createElement('div');
            contentDiv.className = 'reservation-accordion-content';
            
            // بناء التفاصيل
            const fields = reservation.fields;
            const resNumber = fields[FIELD_NAMES.RES_NUMBER] || 'غير محدد';
            const phone = fields[FIELD_NAMES.PHONE] || 'غير محدد';
            const counter = fields[FIELD_NAMES.COUNTER] || 'غير محدد';
            const amount = fields[FIELD_NAMES.AMOUNT] || 'غير محدد';
            const guestCount = fields[FIELD_NAMES.GUEST_COUNT] || '';
            const guestDeparture = fields[FIELD_NAMES.GUEST_DEPARTURE] || '';
            const vipCount = fields[FIELD_NAMES.VIP_COUNT] || '';
            const vipDeparture = fields[FIELD_NAMES.VIP_DEPARTURE] || '';
            const royalCount = fields[FIELD_NAMES.ROYAL_COUNT] || '';
            const royalDeparture = fields[FIELD_NAMES.ROYAL_DEPARTURE] || '';
            const notes = fields[FIELD_NAMES.NOTES] || '';
            
            let detailsHTML = '<div class="reservation-details-grid">';
            detailsHTML += `<div class="detail-row"><span class="detail-label">رقم الحجز:</span><span class="detail-value">${resNumber}</span></div>`;
            detailsHTML += `<div class="detail-row"><span class="detail-label">رقم الجوال:</span><span class="detail-value">${phone}</span></div>`;
            detailsHTML += `<div class="detail-row"><span class="detail-labe
