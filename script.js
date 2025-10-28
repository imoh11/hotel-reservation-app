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
            detailsHTML += `<div class="detail-row"><span class="detail-label">الكونتر:</span><span class="detail-value">${counter}</span></div>`;
            detailsHTML += `<div class="detail-row"><span class="detail-label">المبلغ:</span><span class="detail-value">${amount}</span></div>`;
            
            if (guestCount) {
                detailsHTML += `<div class="detail-row"><span class="detail-label">جناح ضيافة:</span><span class="detail-value">${guestCount} غرف (${arrivalDate} ← ${guestDeparture})</span></div>`;
            }
            if (vipCount) {
                detailsHTML += `<div class="detail-row"><span class="detail-label">جناح VIP:</span><span class="detail-value">${vipCount} غرف (${vipArrival} ← ${vipDeparture})</span></div>`;
            }
            if (royalCount) {
                detailsHTML += `<div class="detail-row"><span class="detail-label">جناح ملكي:</span><span class="detail-value">${royalCount} غرف (${royalArrival} ← ${royalDeparture})</span></div>`;
            }
            if (notes) {
                detailsHTML += `<div class="detail-row full-width"><span class="detail-label">ملاحظات:</span><span class="detail-value">${notes}</span></div>`;
            }
            detailsHTML += '</div>';
            detailsHTML += `
                <div class="detail-actions">
                    <button class="btn btn-primary edit-reservation-btn">تحرير الحجز</button>
                    <button class="btn btn-success send-whatsapp-btn">إرسال</button>
                </div>
            `;
            
            contentDiv.innerHTML = detailsHTML;
            
            // تجميع العناصر
            accordionDiv.appendChild(headerDiv);
            accordionDiv.appendChild(contentDiv);
            listDiv.appendChild(accordionDiv);
            
            // فتح/إغلاق التفاصيل عند النقر على العنوان
            headerDiv.addEventListener('click', (e) => {
                // تجاهل النقر على زر التحرير
                if (e.target.closest('.edit-icon-btn')) return;
                
                const isActive = headerDiv.classList.contains('active');
                
                // إغلاق جميع القوائم الأخرى
                document.querySelectorAll('.reservation-accordion-header').forEach(h => {
                    h.classList.remove('active');
                    const c = h.nextElementSibling;
                    if (c) c.classList.remove('active');
                });
                
                // فتح القائمة الحالية إذا لم تكن مفتوحة
                if (!isActive) {
                    headerDiv.classList.add('active');
                    contentDiv.classList.add('active');
                }
            });
            
            // فتح نموذج التعديل عند النقر على زر التحرير
            setTimeout(() => {
                const editBtn = contentDiv.querySelector('.edit-reservation-btn');
                const sendBtn = contentDiv.querySelector('.send-whatsapp-btn');
                
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        currentEditingReservation = reservation;
                        openEditForm();
                    });
                }
                
                if (sendBtn) {
                    sendBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // إرسال رسالة WhatsApp مباشرة بدون حفظ
                        sendWhatsAppDirectly(reservation);
                    });
                }
            }, 100);
        });
        
    } catch (error) {
        console.error('Error loading reservations:', error);
        loadingDiv.innerHTML = `<p class="error">❌ فشل تحميل الحجوزات: ${error.message}</p>`;
    }
}

/**
 * تم حذف showReservationDetails - التفاصيل الآن داخل accordion
 */

/**
 * تم حذف closeReservationDetails - لم تعد مطلوبة
 */

/**
 * إرسال رسالة WhatsApp مباشرة بدون حفظ
 */
function sendWhatsAppDirectly(reservation) {
    const fields = reservation.fields;
    
    const resNumber = fields[FIELD_NAMES.RES_NUMBER] || 'غير محدد';
    const resType = fields[FIELD_NAMES.RES_TYPE] || '';
    const guestName = fields[FIELD_NAMES.GUEST_NAME] || 'غير محدد';
    const phone = fields[FIELD_NAMES.PHONE] || '';
    
    // الحصول على أول تاريخ متاح
    const guestArrival = fields[FIELD_NAMES.GUEST_ARRIVAL];
    const vipArrival = fields[FIELD_NAMES.VIP_ARRIVAL];
    const royalArrival = fields[FIELD_NAMES.ROYAL_ARRIVAL];
    const arrivalDate = guestArrival || vipArrival || royalArrival || 'غير محدد';
    
    const guestDeparture = fields[FIELD_NAMES.GUEST_DEPARTURE];
    const vipDeparture = fields[FIELD_NAMES.VIP_DEPARTURE];
    const royalDeparture = fields[FIELD_NAMES.ROYAL_DEPARTURE];
    const departureDate = guestDeparture || vipDeparture || royalDeparture || 'غير محدد';
    
    // ✅ بناء الرسالة من القوالب في Airtable
    let messageTemplate = '';
    if (resType === 'ملغي') {
        messageTemplate = APP_CONFIG.msg_cancelled || 'ضيفنا العزيز: {name}\nتم إلغاء حجزك';
    } else if (resType === 'قيد الانتظار') {
        messageTemplate = APP_CONFIG.msg_waiting || 'ضيفنا العزيز: {name}\nحجزك قيد الانتظار';
    } else {
        messageTemplate = APP_CONFIG.msg_confirmed || 'ضيفنا العزيز: {name}\nتم تأكيد حجزك';
    }
    
    // ✅ استبدال المتغيرات
    const guestCount = (fields[FIELD_NAMES.GUEST_COUNT] || 0) + (fields[FIELD_NAMES.VIP_COUNT] || 0) + (fields[FIELD_NAMES.ROYAL_COUNT] || 0);
    const amount = fields[FIELD_NAMES.AMOUNT] || 'غير محدد';
    
    const message = messageTemplate
        .replace(/{name}/g, guestName)
        .replace(/{hotel}/g, APP_CONFIG.hotel_name || 'الفندق')
        .replace(/{resNumber}/g, resNumber)
        .replace(/{phone}/g, phone)
        .replace(/{guestCount}/g, guestCount)
        .replace(/{arrival}/g, arrivalDate)
        .replace(/{departure}/g, departureDate)
        .replace(/{amount}/g, amount);
    
    // تحويل الرقم إلى الصيغة الدولية
    let phoneNumber = phone.replace(/\s+/g, '');
    if (phoneNumber.startsWith('05')) {
        phoneNumber = '966' + phoneNumber.substring(1);
    }
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

/**
 * فتح نموذج تعديل الحجز
 */
function openEditForm_OLD_DELETED(reservation) {
    currentEditingReservation = reservation;
    
    const listContainer = document.querySelector('.reservations-list-container');
    const detailsDiv = document.getElementById('reservationDetails');
    const contentDiv = document.getElementById('detailsContent');
    
    listContainer.style.display = 'none';
    detailsDiv.classList.remove('hidden');
    
    const fields = reservation.fields;
    
    let html = '<div class="details-content">';
    
    // ✅ قراءة البيانات باستخدام FIELD_NAMES
    const fieldMappings = [
        { label: 'رقم الحجز', value: fields[FIELD_NAMES.RES_NUMBER] },
        { label: 'نوع الحجز', value: fields[FIELD_NAMES.RES_TYPE] },
        { label: 'اسم النزيل', value: fields[FIELD_NAMES.GUEST_NAME] },
        { label: 'رقم الجوال', value: fields[FIELD_NAMES.PHONE] },
        { label: 'الكونتر', value: fields[FIELD_NAMES.COUNTER] },
        { label: 'المبلغ', value: fields[FIELD_NAMES.AMOUNT] },
        { label: 'جناح ضيافة - عدد الغرف', value: fields[FIELD_NAMES.GUEST_COUNT] },
        { label: 'جناح ضيافة - الوصول', value: fields[FIELD_NAMES.GUEST_ARRIVAL] },
        { label: 'جناح ضيافة - المغادرة', value: fields[FIELD_NAMES.GUEST_DEPARTURE] },
        { label: 'جناح VIP - عدد الغرف', value: fields[FIELD_NAMES.VIP_COUNT] },
        { label: 'جناح VIP - الوصول', value: fields[FIELD_NAMES.VIP_ARRIVAL] },
        { label: 'جناح VIP - المغادرة', value: fields[FIELD_NAMES.VIP_DEPARTURE] },
        { label: 'جناح ملكي - عدد الغرف', value: fields[FIELD_NAMES.ROYAL_COUNT] },
        { label: 'جناح ملكي - الوصول', value: fields[FIELD_NAMES.ROYAL_ARRIVAL] },
        { label: 'جناح ملكي - المغادرة', value: fields[FIELD_NAMES.ROYAL_DEPARTURE] },
        { label: 'ملاحظات', value: fields[FIELD_NAMES.NOTES] }
    ];
    
    fieldMappings.forEach(field => {
        if (field.value !== undefined && field.value !== null && field.value !== '') {
            html += `
                <div class="detail-item">
                    <div class="detail-label">${field.label}</div>
                    <div class="detail-value">${field.value}</div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    contentDiv.innerHTML = html;
}

function closeReservationDetails_OLD_DELETED() {
    const listContainer = document.querySelector('.reservations-list-container');
    const detailsDiv = document.getElementById('reservationDetails');
    
    detailsDiv.classList.add('hidden');
    listContainer.style.display = 'block';
}

/**
 * فتح نموذج تعديل الحجز
 */
function openEditForm() {
    if (!currentEditingReservation) return;
    
    // ✅ إخفاء قائمة الحجوزات وإظهار نموذج التعديل
    const listContainer = document.querySelector('.reservations-list-container');
    const editFormDiv = document.getElementById('editReservationForm');
    const formContent = document.getElementById('editFormContent');
    
    if (listContainer) listContainer.style.display = 'none';
    editFormDiv.classList.remove('hidden');
    
    const fields = currentEditingReservation.fields;
    
    // ✅ سجلات تصحيح
    console.log('[DEBUG] Opening edit form for reservation:', currentEditingReservation.id);
    console.log('[DEBUG] All fields:', fields);
    console.log('[DEBUG] Available field names:', Object.keys(fields));
    
    // ✅ قراءة البيانات باستخدام FIELD_NAMES
    const resType = fields[FIELD_NAMES.RES_TYPE] || '';
    const guestName = fields[FIELD_NAMES.GUEST_NAME] || '';
    const phone = fields[FIELD_NAMES.PHONE] || '';
    const counter = fields[FIELD_NAMES.COUNTER] || '';
    const amount = fields[FIELD_NAMES.AMOUNT] || '';
    const notes = fields[FIELD_NAMES.NOTES] || '';
    const guestCount = fields[FIELD_NAMES.GUEST_COUNT] || '';
    const guestArrival = fields[FIELD_NAMES.GUEST_ARRIVAL] || '';
    const guestDeparture = fields[FIELD_NAMES.GUEST_DEPARTURE] || '';
    
    console.log('[DEBUG] Extracted values:');
    console.log('  - guestCount:', guestCount);
    console.log('  - guestArrival:', guestArrival);
    console.log('  - guestDeparture:', guestDeparture);
    
    formContent.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>نوع الحجز</label>
                <select id="edit_type" class="form-control">
                    <option value="مؤكد" ${resType === 'مؤكد' ? 'selected' : ''}>مؤكد</option>
                    <option value="قيد الانتظار" ${resType === 'قيد الانتظار' ? 'selected' : ''}>انتظار</option>
                    <option value="ملغي" ${resType === 'ملغي' ? 'selected' : ''}>ملغي</option>
                </select>
            </div>
            <div class="form-group">
                <label>اسم النزيل</label>
                <input type="text" id="edit_guestName" class="form-control" value="${guestName}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>رقم الجوال</label>
                <input type="tel" id="edit_phone" class="form-control" value="${phone}">
            </div>
            <div class="form-group">
                <label>الكونتر</label>
                <select id="edit_counter" class="form-control">
                    <option value="A1" ${counter === 'A1' ? 'selected' : ''}>A1</option>
                    <option value="A2" ${counter === 'A2' ? 'selected' : ''}>A2</option>
                    <option value="A3" ${counter === 'A3' ? 'selected' : ''}>A3</option>
                    <option value="A4" ${counter === 'A4' ? 'selected' : ''}>A4</option>
                    <option value="A5" ${counter === 'A5' ? 'selected' : ''}>A5</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>المبلغ</label>
                <input type="number" id="edit_amount" class="form-control" value="${amount}">
            </div>
            <div class="form-group">
                <label>ملاحظات</label>
                <textarea id="edit_notes" class="form-control" rows="2">${notes}</textarea>
            </div>
        </div>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: var(--primary);">تفاصيل الأجنحة</h4>
        
        <div class="form-row">
            <div class="form-group">
                <label>جناح ضيافة - عدد الغرف</label>
                <input type="number" id="edit_guestCount" class="form-control" value="${guestCount}">
            </div>
            <div class="form-group">
                <label>تاريخ الوصول</label>
                <input type="date" id="edit_guestArrival" class="form-control" value="${guestArrival}">
            </div>
            <div class="form-group">
                <label>تاريخ المغادرة</label>
                <input type="date" id="edit_guestDeparture" class="form-control" value="${guestDeparture}">
            </div>
        </div>
    `;
}

/**
 * إغلاق نموذج التعديل
 */
function closeEditForm() {
    // ✅ إخفاء نموذج التعديل وإظهار قائمة الحجوزات
    const listContainer = document.querySelector('.reservations-list-container');
    const editFormDiv = document.getElementById('editReservationForm');
    
    editFormDiv.classList.add('hidden');
    if (listContainer) listContainer.style.display = 'block';
}

/**
 * حفظ التعديلات
 */
async function saveReservationEdits() {
    if (!currentEditingReservation) return;
    
    const statusDivId = 'editReservation';
    
    try {
        showStatus('جاري حفظ التعديلات... ⏳', 'info', statusDivId, false);
        
        const updatedFields = {
            [FIELD_IDS.RES_TYPE]: document.getElementById('edit_type').value,
            [FIELD_IDS.GUEST_NAME]: document.getElementById('edit_guestName').value,
            [FIELD_IDS.PHONE]: document.getElementById('edit_phone').value,
            [FIELD_IDS.COUNTER]: document.getElementById('edit_counter').value,
            [FIELD_IDS.AMOUNT]: parseFloat(document.getElementById('edit_amount').value) || undefined,
            [FIELD_IDS.NOTES]: document.getElementById('edit_notes').value || undefined,
            [FIELD_IDS.GUEST_COUNT]: parseInt(document.getElementById('edit_guestCount').value) || undefined,
            [FIELD_IDS.GUEST_ARRIVAL]: document.getElementById('edit_guestArrival').value || undefined,
            [FIELD_IDS.GUEST_DEPARTURE]: document.getElementById('edit_guestDeparture').value || undefined
        };
        
        // ✅ التحقق من التوفر إذا تم تغيير التواريخ
        const newArrival = updatedFields[FIELD_IDS.GUEST_ARRIVAL];
        const newDeparture = updatedFields[FIELD_IDS.GUEST_DEPARTURE];
        
        // إذا تم تغيير التواريخ
        if (newArrival && newDeparture) {
            showStatus('جاري التحقق من التوفر... 🔍', 'info', statusDivId, false);
            
            // ✅ الحصول على نوع الجناح من الحجز الأصلي
            let suiteKey = null;
            const fields = currentEditingReservation.fields;
            
            // التحقق من أي جناح يحتوي على بيانات
            if (fields[FIELD_NAMES.GUEST_COUNT] > 0 || fields[FIELD_NAMES.GUEST_ARRIVAL]) {
                suiteKey = 'guest';
            } else if (fields[FIELD_NAMES.VIP_COUNT] > 0 || fields[FIELD_NAMES.VIP_ARRIVAL]) {
                suiteKey = 'vip';
            } else if (fields[FIELD_NAMES.ROYAL_COUNT] > 0 || fields[FIELD_NAMES.ROYAL_ARRIVAL]) {
                suiteKey = 'royal';
            }
            
            if (!suiteKey) {
                showStatus('❌ خطأ: لم يتم التعرف على نوع الجناح', 'error', statusDivId);
                return;
            }
            
            const requestedCount = updatedFields[FIELD_IDS.GUEST_COUNT] || updatedFields[FIELD_IDS.VIP_COUNT] || updatedFields[FIELD_IDS.ROYAL_COUNT] || 1;
            
            // ✅ استثناء الحجز الحالي من التحقق
            const availableCount = await getAvailableCount(suiteKey, newArrival, newDeparture, currentEditingReservation.id);
            
            if (availableCount < requestedCount) {
                showStatus(`❌ عذراً، لا يوجد غرف متاحة كافية. المتاح: ${availableCount} غرفة`, 'error', statusDivId);
                return;
            }
        }
        
        Object.keys(updatedFields).forEach(key => {
            if (updatedFields[key] === undefined) delete updatedFields[key];
        });
        
        const response = await fetch(`${AIRTABLE_API_URL}/${currentEditingReservation.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: updatedFields })
        });
        
        if (!response.ok) {
            throw new Error(`فشل حفظ التعديلات: ${response.status}`);
        }
        
        showStatus('✅ تم حفظ التعديلات بنجاح', 'success', statusDivId);
        
        setTimeout(() => {
            closeEditForm();
            closeReservationDetails();
            loadAllReservations();
        }, 1500);
        
    } catch (error) {
        console.error('Error saving edits:', error);
        showStatus(`❌ فشل حفظ التعديلات: ${error.message}`, 'error', statusDivId);
    }
}

/**
 * حفظ وإرسال عبر WhatsApp
 */
async function saveEditAndSendWhatsApp() {
    if (!currentEditingReservation) return;
    
    const guestName = document.getElementById('edit_guestName').value;
    const phone = document.getElementById('edit_phone').value;
    const resType = document.getElementById('edit_type').value;
    // ✅ قراءة رقم الحجز باستخدام FIELD_NAMES
    const resNumber = currentEditingReservation.fields[FIELD_NAMES.RES_NUMBER];
    
    const guestArrival = document.getElementById('edit_guestArrival').value;
    const guestDeparture = document.getElementById('edit_guestDeparture').value;
    
    if (!guestName || !phone || !resType) {
        showStatus('الرجاء إدخال جميع البيانات المطلوبة.', 'error', 'editReservation');
        return;
    }
    
    // ✅ بناء الرسالة من القوالب في Airtable
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
    const fields = currentEditingReservation.fields;
    const guestCount = (fields[FIELD_NAMES.GUEST_COUNT] || 0) + (fields[FIELD_NAMES.VIP_COUNT] || 0) + (fields[FIELD_NAMES.ROYAL_COUNT] || 0);
    const amount = fields[FIELD_NAMES.AMOUNT] || 'غير محدد';
    
    // ✅ استبدال المتغيرات
    const message = messageTemplate
        .replace(/{name}/g, guestName)
        .replace(/{hotel}/g, APP_CONFIG.hotel_name || 'الفندق')
        .replace(/{resNumber}/g, resNumber)
        .replace(/{phone}/g, phone)
        .replace(/{guestCount}/g, guestCount)
        .replace(/{arrival}/g, guestArrival)
        .replace(/{departure}/g, guestDeparture)
        .replace(/{amount}/g, amount);
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('05')) {
        cleanPhone = '966' + cleanPhone.substring(1);
    }
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    await saveReservationEdits();
}

// ===============================================
// 8. وظيفة تبديل التبويبات وتهيئة الأحداث
// ===============================================

function switchTab(tabName, button) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        document.querySelectorAll('.status-message').forEach(msg => {
            msg.classList.add('hidden');
            msg.innerHTML = '';
        });
    });

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    button.classList.add('active');
}


/**
 * تحديث واجهة المستخدم من الإعدادات
 */
function updateUIFromConfig() {
    // ✅ تحديث اسم الفندق
    const hotelNameElement = document.getElementById('hotel-name');
    if (hotelNameElement && APP_CONFIG.hotel_name) {
        hotelNameElement.textContent = APP_CONFIG.hotel_name;
    }
    
    // ✅ تحديث أسماء الأجنحة
    document.querySelectorAll('[data-suite-name="guest"]').forEach(el => {
        if (APP_CONFIG.guest_name_ar) {
            el.textContent = APP_CONFIG.guest_name_ar;
        }
    });
    
    document.querySelectorAll('[data-suite-name="vip"]').forEach(el => {
        if (APP_CONFIG.vip_name_ar) {
            el.textContent = APP_CONFIG.vip_name_ar;
        }
    });
    
    document.querySelectorAll('[data-suite-name="royal"]').forEach(el => {
        if (APP_CONFIG.royal_name_ar) {
            el.textContent = APP_CONFIG.royal_name_ar;
        }
    });
    
    console.log('✅ تم تحديث واجهة المستخدم');
}

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
        guestCell.innerHTML = `<span class="occupancy-cell ${getOccupancyClass(day.guest, 14)}">${day.guest}</span>`;
        row.appendChild(guestCell);
        
        // VIP
        const vipCell = document.createElement('td');
        vipCell.innerHTML = `<span class="occupancy-cell ${getOccupancyClass(day.vip, 4)}">${day.vip}</span>`;
        row.appendChild(vipCell);
        
        // ملكي
        const royalCell = document.createElement('td');
        royalCell.innerHTML = `<span class="occupancy-cell ${getOccupancyClass(day.royal, 2)}">${day.royal}</span>`;
        row.appendChild(royalCell);
        
        // الإجمالي
        const totalCell = document.createElement('td');
        totalCell.innerHTML = `<span class="total-cell">${day.total}</span>`;
        row.appendChild(totalCell);
        
        tbody.appendChild(row);
    });
}

/**
 * الحصول على فئة الإشغال (للألوان)
 */
function getOccupancyClass(occupied, capacity) {
    if (occupied === 0) return 'cell-empty';
    
    const percentage = (occupied / capacity) * 100;
    
    if (percentage <= 50) return 'cell-low';
    if (percentage <= 80) return 'cell-medium';
    return 'cell-high';
}

/**
 * تحديث ملخص الإشغال
 */
function updateOccupancySummary(dataToRender = null) {
    const data = dataToRender || occupancyData;
    const daysCount = data.length;
    let guestTotal = 0;
    let vipTotal = 0;
    let royalTotal = 0;
    
    data.forEach(day => {
        guestTotal += day.guest;
        vipTotal += day.vip;
        royalTotal += day.royal;
    });
    
    const guestCapacity = 14 * daysCount;
    const vipCapacity = 4 * daysCount;
    const royalCapacity = 2 * daysCount;
    
    // حساب الإجمالي
    const totalOccupied = guestTotal + vipTotal + royalTotal;
    const totalCapacity = guestCapacity + vipCapacity + royalCapacity;
    
    // تمرير daysCount للدالة
    updateSummaryCard('guestSummary', 'guestBar', guestTotal, guestCapacity, daysCount);
    updateSummaryCard('vipSummary', 'vipBar', vipTotal, vipCapacity, daysCount);
    updateSummaryCard('royalSummary', 'royalBar', royalTotal, royalCapacity, daysCount);
    updateSummaryCard('totalSummary', 'totalBar', totalOccupied, totalCapacity, daysCount);
}

/**
 * تحديث بطاقة ملخص واحدة
 */
function updateSummaryCard(summaryId, barId, occupied, capacity, daysCount) {
    const summaryDiv = document.getElementById(summaryId);
    const barDiv = document.getElementById(barId);
    
    const percentage = Math.round((occupied / capacity) * 100);
    
    // عرض مجموع الغرف-يوم (بدلاً من المتوسط)
    summaryDiv.querySelector('.occupied').textContent = occupied;
    summaryDiv.querySelector('.total').textContent = capacity;
    
    const percentageSpan = summaryDiv.querySelector('.percentage');
    percentageSpan.textContent = `${percentage}%`;
    
    // الألوان - تدرج من أحمر (قليل) إلى أخضر (كثير)
    percentageSpan.className = 'percentage';
    barDiv.className = 'summary-bar-fill';
    
    if (percentage === 0) {
        percentageSpan.classList.add('occupancy-empty');
        barDiv.style.width = '0%';
        barDiv.style.backgroundColor = '#28a745'; // أخضر
    } else if (percentage <= 30) {
        percentageSpan.classList.add('occupancy-low');
        barDiv.style.width = `${percentage}%`;
        barDiv.style.backgroundColor = '#28a745'; // أخضر
    } else if (percentage <= 50) {
        percentageSpan.classList.add('occupancy-low-medium');
        barDiv.style.width = `${percentage}%`;
        barDiv.style.backgroundColor = '#28a745'; // أخضر
    } else if (percentage <= 70) {
        percentageSpan.classList.add('occupancy-medium');
        barDiv.style.width = `${percentage}%`;
        barDiv.style.backgroundColor = '#28a745'; // أخضر
    } else if (percentage <= 85) {
        percentageSpan.classList.add('occupancy-medium-high');
        barDiv.style.width = `${percentage}%`;
        barDiv.style.backgroundColor = '#28a745'; // أخضر
    } else {
        percentageSpan.classList.add('occupancy-high');
        barDiv.style.width = `${percentage}%`;
        barDiv.style.backgroundColor = '#28a745'; // أخضر
    }
}

/**
 * الحصول على سعة الغرف حسب نوع الجناح
 */
function getRoomCapacity(summaryId) {
    switch(summaryId) {
        case 'guestSummary': return 14;
        case 'vipSummary': return 4;
        case 'royalSummary': return 2;
        default: return 1;
    }
}

/**
 * تعيين اختصار الفترة
 */
function setFilterShortcut(type) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromInput = document.getElementById('filterFromDate');
    const toInput = document.getElementById('filterToDate');
    
    // إزالة active من جميع الأزرار
    document.querySelectorAll('.filter-shortcuts .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إضافة active للزر المحدد
    const buttonMap = {
        'today': 'filterTodayBtn',
        'tomorrow': 'filterTomorrowBtn',
        'week': 'filterWeekBtn',
        'month': 'filterMonthBtn',
        'all': 'filterAllBtn'
    };
    const activeButton = document.getElementById(buttonMap[type]);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // دالة لتحويل التاريخ إلى نص بالتوقيت المحلي
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    switch(type) {
        case 'today':
            const todayStr = formatLocalDate(today);
            fromInput.value = todayStr;
            toInput.value = todayStr;
            break;
        case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const tomorrowStr = formatLocalDate(tomorrow);
            fromInput.value = tomorrowStr;
            toInput.value = tomorrowStr;
            break;
        case 'week':
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 6);
            fromInput.value = formatLocalDate(today);
            toInput.value = formatLocalDate(weekEnd);
            break;
        case 'month':
            const monthEnd = new Date(today);
            monthEnd.setDate(today.getDate() + 29);
            fromInput.value = formatLocalDate(today);
            toInput.value = formatLocalDate(monthEnd);
            break;
        case 'all':
            const fiftyDaysEnd = new Date(today);
            fiftyDaysEnd.setDate(today.getDate() + 49);
            fromInput.value = formatLocalDate(today);
            toInput.value = formatLocalDate(fiftyDaysEnd);
            break;
    }
    
    applyOccupancyFilter();
}

/**
 * تطبيق الفلترة
 */
function applyOccupancyFilter() {
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;
    
    // إذا كان كلاهما فارغ → عرض الكل
    if (!fromDate && !toDate) {
        renderOccupancyTable();
        updateOccupancySummary();
        return;
    }
    
    // فلترة البيانات
    let filteredData = occupancyData;
    
    if (fromDate && toDate) {
        // فترة محددة
        filteredData = occupancyData.filter(day => {
            return day.date >= fromDate && day.date <= toDate;
        });
    } else if (fromDate) {
        // من تاريخ فقط
        filteredData = occupancyData.filter(day => day.date >= fromDate);
    } else if (toDate) {
        // إلى تاريخ فقط
        filteredData = occupancyData.filter(day => day.date <= toDate);
    }
    
    // عرض البيانات المفلترة
    renderOccupancyTable(filteredData);
    updateOccupancySummary(filteredData);
}

