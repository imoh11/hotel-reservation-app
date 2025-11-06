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
            throw new Error(`فشل تحميل بيانات التوفر: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        let totalReserved = 0;
        
        data.records.forEach(record => {
            // ✅ استثناء السجل الذي يتم تعديله حالياً
            if (excludeRecordId && record.id === excludeRecordId) {
                return;
            }
            
            const reservedCount = record.fields[config.countName] || 0;
            totalReserved += reservedCount;
        });
        
        const availableCount = maxCapacity - totalReserved;
        
        console.log(`[DEBUG] Total Reserved: ${totalReserved}, Available: ${availableCount}`);
        
        return availableCount;

    } catch (error) {
        console.error(`❌ فشل التحقق من التوفر لجناح ${suiteKey}:`, error);
        return 0; // في حالة الخطأ، نفترض عدم التوفر لتجنب الحجز الزائد
    }
}

async function checkAndValidateAvailability(suiteKey, prefix) {
    const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);
    const arrivalInput = document.getElementById(`${suiteKey}Arrival_${prefix}`);
    const departureInput = document.getElementById(`${suiteKey}Departure_${prefix}`);
    const statusElement = document.getElementById(`${suiteKey}_status_${prefix}`);
    const saveButton = document.getElementById(`${prefix}SaveBtn`);
    
    const requestedCount = parseInt(countInput.value) || 0;
    const arrivalDate = arrivalInput.value;
    const departureDate = departureInput.value;
    
    // ✅ التحقق من وجود تواريخ وعدد غرف مطلوب
    if (requestedCount === 0 || !arrivalDate || !departureDate) {
        statusElement.textContent = '';
        statusElement.className = 'availability-status';
        return;
    }
    
    // ✅ التحقق من أن تاريخ المغادرة بعد تاريخ الوصول
    if (new Date(departureDate) <= new Date(arrivalDate)) {
        statusElement.textContent = '❌ المغادرة يجب أن تكون بعد الوصول';
        statusElement.className = 'availability-status error';
        saveButton.disabled = true;
        return;
    }
    
    statusElement.textContent = 'جاري التحقق... ⏳';
    statusElement.className = 'availability-status info';
    saveButton.disabled = true;
    
    const excludeRecordId = prefix === 'edit' ? currentEditingReservation.id : null;
    
    const availableCount = await getAvailableCount(suiteKey, arrivalDate, departureDate, excludeRecordId);
    
    if (requestedCount <= availableCount) {
        statusElement.textContent = `✅ متوفر (${availableCount} غرفة متاحة)`;
        statusElement.className = 'availability-status success';
        saveButton.disabled = false;
    } else {
        statusElement.textContent = `❌ غير متوفر (المتاح: ${availableCount} غرفة)`;
        statusElement.className = 'availability-status error';
        saveButton.disabled = true;
    }
}

// ===============================================
// 5. وظائف الحجز
// ===============================================

let currentEditingReservation = null;
let allReservations = [];

/**
 * حفظ حجز جديد
 */
async function saveNewReservation() {
    const statusDivId = 'newReservation';
    
    // ✅ قراءة البيانات من النموذج
    const resType = document.getElementById('new_type').value;
    const guestName = document.getElementById('new_guestName').value;
    const phone = document.getElementById('new_phone').value;
    const counter = document.getElementById('new_counter').value;
    const amount = document.getElementById('new_amount').value;
    const notes = document.getElementById('new_notes').value;
    
    const guestCount = document.getElementById('guestSuiteCount_new').value;
    const guestArrival = document.getElementById('guestArrival_new').value;
    const guestDeparture = document.getElementById('guestDeparture_new').value;
    
    const vipCount = document.getElementById('vipSuiteCount_new').value;
    const vipArrival = document.getElementById('vipArrival_new').value;
    const vipDeparture = document.getElementById('vipDeparture_new').value;
    
    const royalCount = document.getElementById('royalSuiteCount_new').value;
    const royalArrival = document.getElementById('royalArrival_new').value;
    const royalDeparture = document.getElementById('royalDeparture_new').value;
    
    // ✅ التحقق من الحقول المطلوبة
    if (!guestName || !phone || !resType) {
        showStatus('❌ يرجى ملء اسم النزيل ورقم الجوال ونوع الحجز.', 'error', statusDivId);
        return;
    }
    
    // ✅ التحقق من وجود حجز واحد على الأقل
    if (
        (!guestCount || guestCount == 0) &&
        (!vipCount || vipCount == 0) &&
        (!royalCount || royalCount == 0)
    ) {
        showStatus('❌ يجب حجز غرفة واحدة على الأقل.', 'error', statusDivId);
        return;
    }
    
    // ✅ التحقق من توفر الأجنحة
    const guestStatus = document.getElementById('guest_status_new').className;
    const vipStatus = document.getElementById('vip_status_new').className;
    const royalStatus = document.getElementById('royal_status_new').className;
    
    if (guestStatus.includes('error') || vipStatus.includes('error') || royalStatus.includes('error')) {
        showStatus('❌ يرجى تصحيح أخطاء التوفر قبل الحفظ.', 'error', statusDivId);
        return;
    }
    
    showStatus('جاري حفظ الحجز... ⏳', 'info', statusDivId, false);
    
    try {
        const newResNumber = generateResNumber();
        
        const fields = {
            [FIELD_NAMES.RES_NUMBER]: newResNumber,
            [FIELD_NAMES.RES_TYPE]: resType,
            [FIELD_NAMES.GUEST_NAME]: guestName,
            [FIELD_NAMES.PHONE]: phone,
            [FIELD_NAMES.COUNTER]: counter || undefined,
            [FIELD_NAMES.AMOUNT]: parseFloat(amount) || undefined,
            [FIELD_NAMES.NOTES]: notes || undefined,
            
            // تفاصيل الأجنحة
            [FIELD_NAMES.GUEST_COUNT]: parseInt(guestCount) || undefined,
            [FIELD_NAMES.GUEST_ARRIVAL]: guestArrival || undefined,
            [FIELD_NAMES.GUEST_DEPARTURE]: guestDeparture || undefined,
            
            [FIELD_NAMES.VIP_COUNT]: parseInt(vipCount) || undefined,
            [FIELD_NAMES.VIP_ARRIVAL]: vipArrival || undefined,
            [FIELD_NAMES.VIP_DEPARTURE]: vipDeparture || undefined,
            
            [FIELD_NAMES.ROYAL_COUNT]: parseInt(royalCount) || undefined,
            [FIELD_NAMES.ROYAL_ARRIVAL]: royalArrival || undefined,
            [FIELD_NAMES.ROYAL_DEPARTURE]: royalDeparture || undefined,
        };
        
        // ✅ إزالة الحقول الفارغة
        Object.keys(fields).forEach(key => {
            if (fields[key] === undefined) {
                delete fields[key];
            }
        });
        
        const response = await fetch(AIRTABLE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: fields })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`فشل حفظ الحجز: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        showStatus(`✅ تم حفظ الحجز بنجاح! رقم الحجز: ${newResNumber}`, 'success', statusDivId);
        
        // ✅ إرسال رسالة واتساب بعد الحفظ
        sendWhatsAppMessage(data.fields);
        
        // ✅ إعادة تحميل قائمة الحجوزات
        loadAllReservations();
        
    } catch (error) {
        console.error('❌ فشل حفظ الحجز:', error);
        showStatus(`❌ فشل حفظ الحجز: ${error.message}`, 'error', statusDivId);
    }
}

/**
 * إرسال رسالة واتساب
 */
function sendWhatsAppMessage(fields) {
    const resType = fields[FIELD_NAMES.RES_TYPE] || 'غير محدد';
    const guestName = fields[FIELD_NAMES.GUEST_NAME] || 'غير محدد';
    const phone = fields[FIELD_NAMES.PHONE] || '';
    
    let messageTemplate = '';
    if (resType === 'مؤكد') {
        messageTemplate = APP_CONFIG.msg_confirmed;
    } else if (resType === 'قيد الانتظار') {
        messageTemplate = APP_CONFIG.msg_waiting;
    } else if (resType === 'ملغي') {
        messageTemplate = APP_CONFIG.msg_cancelled;
    } else {
        return; // لا يوجد قالب رسالة
    }
    
    // ✅ استبدال المتغيرات في القالب
    let message = messageTemplate.replace('{name}', guestName);
    
    // ✅ إضافة تفاصيل الحجز
    message += '\n\n**تفاصيل الحجز:**\n';
    
    const suites = ['guest', 'vip', 'royal'];
    suites.forEach(suiteKey => {
        const config = SUITE_CONFIG[suiteKey];
        const count = fields[config.countName];
        const arrival = fields[config.arrivalName];
        const departure = fields[config.departureName];
        
        if (count) {
            message += `- ${config.nameAr}: ${count} غرف (${arrival} ← ${departure})\n`;
        }
    });
    
    const phoneNumber = phone.replace(/\D/g, ''); // إزالة أي شيء غير رقمي
    
    if (!phoneNumber) {
        console.error('❌ لا يوجد رقم جوال لإرسال الرسالة.');
        return;
    }
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function sendWhatsAppDirectly(reservation) {
    const fields = reservation.fields;
    const phone = fields[FIELD_NAMES.PHONE] || '';
    
    if (!phone) {
        showStatus('❌ لا يوجد رقم جوال لهذا الحجز.', 'error', 'manageReservation');
        return;
    }
    
    const resType = fields[FIELD_NAMES.RES_TYPE] || 'غير محدد';
    const guestName = fields[FIELD_NAMES.GUEST_NAME] || 'غير محدد';
    
    let messageTemplate = '';
    if (resType === 'مؤكد') {
        messageTemplate = APP_CONFIG.msg_confirmed;
    } else if (resType === 'قيد الانتظار') {
        messageTemplate = APP_CONFIG.msg_waiting;
    } else if (resType === 'ملغي') {
        messageTemplate = APP_CONFIG.msg_cancelled;
    } else {
        messageTemplate = `مرحباً ${guestName}، \n\nتفاصيل حجزك:`;
    }
    
    // ✅ استبدال المتغيرات في القالب
    let message = messageTemplate.replace('{name}', guestName);
    
    // ✅ إضافة تفاصيل الحجز
    message += '\n\n**تفاصيل الحجز:**\n';
    
    const suites = ['guest', 'vip', 'royal'];
    suites.forEach(suiteKey => {
        const config = SUITE_CONFIG[suiteKey];
        const count = fields[config.countName];
        const arrival = fields[config.arrivalName];
        const departure = fields[config.departureName];
        
        if (count) {
            message += `- ${config.nameAr}: ${count} غرف (${arrival} ← ${departure})\n`;
        }
    });
    
    const phoneNumber = phone.replace(/\D/g, ''); // إزالة أي شيء غير رقمي
    
    if (!phoneNumber) {
        console.error('❌ لا يوجد رقم جوال لإرسال الرسالة.');
        return;
    }
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ===============================================
// 6. وظائف إدارة الحجوزات
// ===============================================

/**
 * تحميل جميع الحجوزات وعرضها في قائمة
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
    const guestDeparture = reservation.fields[FIELD_NAMES.GUEST_DEPARTURE];
    const vipDeparture = reservation.fields[FIELD_NAMES.VIP_DEPARTURE];
    const royalDeparture = reservation.fields[FIELD_NAMES.ROYAL_DEPARTURE];
    
    // اختيار أول تاريخ مغادرة متاح
    const departureDate = guestDeparture || vipDeparture || royalDeparture;
    
    if (!departureDate) return false; // لا توجد تواريخ
    
    const departure = new Date(departureDate);
    return departure >= today; // إبقاء الحجوزات التي لم تغادر بعد
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
            const guestDeparture = reservation.fields[FIELD_NAMES.GUEST_DEPARTURE];
            const vipDeparture = reservation.fields[FIELD_NAMES.VIP_DEPARTURE];
            const royalDeparture = reservation.fields[FIELD_NAMES.ROYAL_DEPARTURE];
            
            // تحديد تاريخ الوصول والمغادرة الرئيسي للحجز
            const arrivalDate = guestArrival || vipArrival || royalArrival || 'غير محدد';
            const departureDate = guestDeparture || vipDeparture || royalDeparture || 'غير محدد';
            
            // حساب لون الحالة
            const statusColor = getStatusColor(arrivalDate, departureDate);
            
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
                    <span class="status-circle" style="background-color: ${statusColor};"></span>
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
                const guestColor = getStatusColor(guestArrival, guestDeparture);
                detailsHTML += `<div class="detail-row"><span class="detail-label"><span class="status-dot" style="background-color:${guestColor}"></span> جناح ضيافة:</span><span class="detail-value">${guestCount} غرف (${guestArrival} ← ${guestDeparture})</span></div>`;
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
            }, 0);
        });
        
    } catch (error) {
        console.error('❌ فشل تحميل الحجوزات:', error);
        loadingDiv.style.display = 'none';
        listDiv.innerHTML = `<p class="error-message-block">❌ فشل تحميل الحجوزات: ${error.message}</p>`;
    }
}

/**
 * دالة مساعدة لتحويل التاريخ إلى تنسيق YYYY-MM-DD
 */
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

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
    if (arrivalDate <= today && departureDate > today) {
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

// ===============================================
// 7. التهيئة
// ===============================================

// ... (بقية الكود)
