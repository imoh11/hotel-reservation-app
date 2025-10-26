// =================================================================
// 1. إعدادات Airtable الأساسية - يجب تعديلها
// =================================================================
const AIRTABLE_API_KEY = "AIRTABLE_API_KEY_PLACEHOLDER"; // 🚨 تأكد من استبدال هذا المفتاح
const BASE_ID = 'appZm1T1ecVIlWOwy';
const TABLE_NAME = 'tbloqjxnWuD2aH66H'; 
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

// =================================================================
// 2. FIELD IDS & CONFIGS (معرّفات الحقول الثابتة والإعدادات)
// =================================================================
const FIELD_IDS = {
    // الحقول الأساسية
    RES_NUMBER: 'fldMTOwOZ7jM8axbf',
    RES_TYPE: 'fldMUvsWgpp2LuTf2',
    COUNTER: 'flduEC9m8ruQ6tzi8',
    SOURCE: 'fldHrwuzi8LxIeKVX',
    GUEST_NAME: 'fldI2sYu4qIu2PIGe',
    PHONE: 'fldZxjo1fzU9FQR2Q',
    AMOUNT: 'fldbsNQcjGZni1Z6w',

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

// الحد الأقصى لعدد الغرف المتاحة لكل نوع جناح (يجب تعديلها حسب الفندق)
const SUITE_CAPACITIES = {
    guest: 14,  // جناح ضيافة
    vip: 4,     // جناح VIP
    royal: 2    // جناح ملكي
};

// ربط مفاتيح الأجنحة بمعرفات الحقول
const SUITE_CONFIG = {
    guest: {
        count: FIELD_IDS.GUEST_COUNT,
        arrival: FIELD_IDS.GUEST_ARRIVAL,
        departure: FIELD_IDS.GUEST_DEPARTURE,
        nameAr: 'جناح ضيافة',
        prefix: 'guest'
    },
    vip: {
        count: FIELD_IDS.VIP_COUNT,
        arrival: FIELD_IDS.VIP_ARRIVAL,
        departure: FIELD_IDS.VIP_DEPARTURE,
        nameAr: 'جناح VIP',
        prefix: 'vip'
    },
    royal: {
        count: FIELD_IDS.ROYAL_COUNT,
        arrival: FIELD:IDS.ROYAL_ARRIVAL,
        departure: FIELD_IDS.ROYAL_DEPARTURE,
        nameAr: 'جناح ملكي',
        prefix: 'royal'
    }
};

// ===============================================
// 3. وظائف الواجهة المساعدة
// ===============================================

function showStatus(message, type = 'info', tabId, autoHide = true) {
    const statusDiv = document.getElementById(`statusMessage_${tabId}`); 
    if (!statusDiv) return;

    statusDiv.classList.remove('info', 'success', 'error', 'hidden');
    statusDiv.classList.add(type);
    statusDiv.innerHTML = message;
    statusDiv.classList.remove('hidden');

    if (autoHide && type !== 'error') { // لا تخفِ رسائل الخطأ تلقائياً
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
        
        // التحقق من التوفر عند إدخال التواريخ
        if (parseInt(countInput.value) > 0) {
             checkAndValidateAvailability(suiteKey, prefix);
        }
    } else {
        daysInput.value = '';
    }
}


// ===============================================
// 4. وظائف التحقق من التوفر (المنطق الجديد)
// ===============================================

/**
 * دالة جلب الحجوزات القائمة والتحقق من التوفر
 * @param {string} suiteKey - مفتاح الجناح (guest, vip, royal)
 * @param {string} arrivalDate - تاريخ الوصول بتنسيق YYYY-MM-DD
 * @param {string} departureDate - تاريخ المغادرة بتنسيق YYYY-MM-DD
 * @returns {Promise<number>} - العدد المتبقي من الغرف الشاغرة
 */
async function getAvailableCount(suiteKey, arrivalDate, departureDate) {
    const config = SUITE_CONFIG[suiteKey];
    const maxCapacity = SUITE_CAPACITIES[suiteKey];
    
    // فلتر Airtable: جلب الحجوزات التي تتداخل مع الفترة المطلوبة
    const filterFormula = `AND(` +
        // يجب أن تكون تواريخ الحجز الجديدة محصورة بين
        `IS_AFTER({${config.arrival}}, '${arrivalDate}'),` + 
        `IS_BEFORE({${config.departure}}, '${departureDate}'),` + 
        // أو أن يكون الحجز القديم يبدأ قبل انتهاء الحجز الجديد
        `OR(` + 
            `AND(IS_BEFORE({${config.arrival}}, '${departureDate}'), IS_AFTER({${config.departure}}, '${arrivalDate}')),` +
            `AND(IS_BEFORE({${config.arrival}}, '${departureDate}'), IS_EMPTY({${config.departure}})),` + // حجز مفتوح المغادرة
            `AND(IS_EMPTY({${config.arrival}}), IS_AFTER({${config.departure}}, '${arrivalDate}')),` + // حجز مفتوح الوصول
            `AND(IS_EMPTY({${config.arrival}}), IS_EMPTY({${config.departure}}))` // حجز لا توجد به تواريخ (غير عملي، لكن للاحتياط)
        + `)`
        // للتسهيل، نستخدم فلتر بسيط يغطي التداخل
        // OR(AND({Arrival} < EndDate, {Departure} > StartDate), ...)
    + `)`;

    // صيغة أكثر دقة للتداخل الزمني: (Start1 < End2) AND (End1 > Start2)
    const detailedFilter = `AND(` +
        `{${config.arrival}} < '${departureDate}',` +
        `{${config.departure}} > '${arrivalDate}'` +
    `)`;

    try {
        const response = await fetch(`${AIRTABLE_API_URL}?filterByFormula=${encodeURIComponent(detailedFilter)}&fields[]=${config.count}`, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable fetch failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        let totalReserved = 0;
        data.records.forEach(record => {
            const reservedCount = record.fields[config.count] || 0;
            totalReserved += reservedCount;
        });

        const available = maxCapacity - totalReserved;
        return Math.max(0, available); // لا يمكن أن يكون أقل من صفر
    } catch (error) {
        console.error('Error fetching availability:', error);
        return -1; // رمز يشير إلى وجود خطأ
    }
}

/**
 * وظيفة التحقق من التوفر والتحقق من صحة الإدخال
 * @param {string} suiteKey - مفتاح الجناح (guest, vip, royal)
 * @param {string} prefix - البادئة (new)
 */
async function checkAndValidateAvailability(suiteKey, prefix) {
    const statusDivId = `${prefix}Reservation`;
    const config = SUITE_CONFIG[suiteKey];
    
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
    submitButton.disabled = false; // افتراضياً، قم بتفعيل الزر

    if (!arrivalDate || !departureDate || !requestedCount || requestedCount <= 0) {
        return; 
    }
    
    // التحقق من صلاحية التاريخ
    if (Date.parse(departureDate) <= Date.parse(arrivalDate)) {
        validationMessage.textContent = '❌ تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول.';
        validationMessage.classList.remove('hidden');
        submitButton.disabled = true;
        return;
    }
    
    validationMessage.textContent = 'جاري التحقق من التوفر... ⏳';
    validationMessage.classList.remove('hidden');
    submitButton.disabled = true;

    const availableCount = await getAvailableCount(suiteKey, arrivalDate, departureDate);
    
    if (availableCount === -1) {
        validationMessage.textContent = '❌ حدث خطأ أثناء الاتصال بقاعدة البيانات. حاول مرة أخرى.';
        validationMessage.classList.remove('hidden');
        submitButton.disabled = true;
    } else {
        const maxCapacity = SUITE_CAPACITIES[suiteKey];
        if (requestedCount > availableCount) {
            validationMessage.textContent = `❌ لا يمكن حجز ${requestedCount} غرفة. المتاح هو ${availableCount} غرفة فقط من أصل ${maxCapacity} في هذه الفترة.`;
            validationMessage.classList.remove('hidden');
            submitButton.disabled = true;
        } else {
            validationMessage.textContent = `✅ تم التأكد. ${availableCount} غرفة متاحة من أصل ${maxCapacity} في هذه الفترة.`;
            validationMessage.classList.remove('hidden');
            validationMessage.classList.remove('error');
            validationMessage.classList.add('success');
            submitButton.disabled = false;
        }
    }
    
    // استعادة شكل الرسالة بعد 5 ثواني
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
// تم تعديل هذه الدالة لإضافة فحص نهائي للتوفر قبل الإرسال الفعلي
async function saveNewReservation() {
    const statusDivId = 'newReservation';
    // ... (جلب البيانات كما في النسخة السابقة) ...
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
    
    // ==============================================
    // فحص التوفر النهائي قبل الإرسال
    // ==============================================
    let allAvailable = true;
    for (const suiteKey of Object.keys(SUITE_CONFIG)) {
        const count = data[SUITE_CONFIG[suiteKey].count];
        const arrival = data[SUITE_CONFIG[suiteKey].arrival];
        const departure = data[SUITE_CONFIG[suiteKey].departure];
        
        if (count && arrival && departure) {
            const availableCount = await getAvailableCount(suiteKey, arrival, departure);
            
            if (availableCount === -1) {
                showStatus(`❌ فشل التحقق النهائي من توفر ${SUITE_CONFIG[suiteKey].nameAr}. يرجى المحاولة لاحقاً.`, 'error', statusDivId);
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
    // ==============================================
    
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

        // ... (معالجة الاستجابة كما في النسخة السابقة) ...
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = (response.status === 422 && errorData.error && errorData.error.message)
                ? errorData.error.message
                : (errorData.error ? errorData.error.type : 'غير معروف');
            throw new Error(`Airtable API Error: ${response.status} - ${errorMessage}`);
        }

        const savedRecord = await response.json();
        const newResId = savedRecord.id;

        const successMessage = `✅ تم حفظ الحجز بنجاح! <br> <strong>رقم الحجز (ID) هو: ${newResId}</strong>. <br> <em>للتعديل، ستحتاج إلى رقم الحجز هذا.</em>`;
        showStatus(successMessage, 'success', statusDivId);

        document.getElementById('newReservationForm').reset();

        document.querySelectorAll('span[id$="_summary_new').forEach(span => span.textContent = '');
        document.querySelectorAll('p[id$="_validation_new').forEach(p => {
             p.classList.add('hidden');
             p.textContent = '';
        });

    } catch (error) {
        console.error('Error saving reservation:', error);
        showStatus(`❌ فشل حفظ الحجز. (خطأ: ${error.message || 'غير معروف'}).`, 'error', statusDivId);
    }
}


// ===============================================
// 6. وظيفة تبديل التبويبات وتهيئة الأحداث
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

document.addEventListener('DOMContentLoaded', () => {

    // 1. معالج إرسال نموذج الحجز الجديد
    document.getElementById('newReservationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        saveNewReservation();
    });

    // 2. أحداث تحديث الملخص وحساب الأيام والتحقق من التوفر
    const prefix = 'new'; 
    ['guest', 'vip', 'royal'].forEach(suiteKey => {
        const arrivalInput = document.getElementById(`${suiteKey}Arrival_${prefix}`);
        const departureInput = document.getElementById(`${suiteKey}Departure_${prefix}`);
        const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);

        // التحقق من التوفر عند تغيير التواريخ أو العدد
        if (arrivalInput) arrivalInput.addEventListener('change', () => {
            calculateDaysPerSuite(prefix, suiteKey);
        });
        if (departureInput) departureInput.addEventListener('change', () => {
            calculateDaysPerSuite(prefix, suiteKey);
        });
        if (countInput) countInput.addEventListener('input', () => {
            updateSuiteSummary(prefix, suiteKey);
            checkAndValidateAvailability(suiteKey, prefix); // التحقق من التوفر عند تغيير العدد
        });
    });

    // 3. منطق الأقسام المطوية (Collapsible)
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            header.classList.toggle('active');
            content.classList.toggle('active');
        });
    });

    // 4. إضافة مُستمعي الأحداث لأزرار التبويبات
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName, button);
        });
    });
    
    // 5. تفعيل أول تبويبة وفتح الأقسام المطوية افتراضياً
    document.querySelector('.tab-button.active')?.click(); 
    document.querySelectorAll('#newReservation .collapsible-header').forEach(header => {
        header.classList.add('active');
        const content = header.nextElementSibling;
        if(content) content.classList.add('active');
    });

});
