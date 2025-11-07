// =================================================================
// 1. إعدادات Airtable الأساسية والثوابت العالمية
// =================================================================
const AIRTABLE_API_KEY = "AIRTABLE_API_KEY_PLACEHOLDER"; // 🚨 يجب استبدال هذا المفتاح بمفتاحك الخاص
const BASE_ID = 'appZm1T1ecVIlWOwy';
const TABLE_NAME = 'tbloqjxnWuD2aH66H'; 
const CONFIG_TABLE_ID = 'tblbL4TOvGCv9eEmS'; 
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
const AIRTABLE_CONFIG_URL = `https://api.airtable.com/v0/${BASE_ID}/${CONFIG_TABLE_ID}`; 

// =================================================================
// 2. تعريفات الحقول والثوابت المطلوبة لدالة saveReservationEdits
// (يجب التأكد من مطابقة أرقام الحقول الخاصة بك)
// =================================================================
const FIELD_IDS = {
    // يجب استبدال الأرقام التسلسلية بأرقام حقولك الفعلية
    RES_TYPE: 'fld_RES_TYPE_ID', 
    GUEST_NAME: 'fld_GUEST_NAME_ID', 
    PHONE: 'fld_PHONE_ID', 
    COUNTER: 'fld_COUNTER_ID', 
    AMOUNT: 'fld_AMOUNT_ID', 
    NOTES: 'fld_NOTES_ID', 
    GUEST_COUNT: 'fld_GUEST_COUNT_ID',
    GUEST_ARRIVAL: 'fld_GUEST_ARRIVAL_ID',
    GUEST_DEPARTURE: 'fld_GUEST_DEPARTURE_ID',
    VIP_COUNT: 'fld_VIP_COUNT_ID', // مثال
    ROYAL_COUNT: 'fld_ROYAL_COUNT_ID', // مثال
};

const FIELD_NAMES = {
    RES_TYPE: 'نوع الحجز',
    GUEST_COUNT: 'عدد الضيوف',
    // ... أضف أسماء الحقول التي تحتاجها للمقارنة
};

const SUITE_CONFIG = {
    // هذا الكائن حيوي لمنع التكرار في دالة saveReservationEdits
    guest: {
        nameAr: 'الضيوف العاديين',
        count: FIELD_IDS.GUEST_COUNT,
        arrival: FIELD_IDS.GUEST_ARRIVAL,
        departure: FIELD_IDS.GUEST_DEPARTURE
    },
    // مثال لإضافة جناح VIP
    // vip: {
    //     nameAr: 'VIP',
    //     count: FIELD_IDS.VIP_COUNT,
    //     arrival: FIELD_IDS.VIP_ARRIVAL,
    //     departure: FIELD_IDS.VIP_DEPARTURE
    // },
};

// =================================================================
// 3. المتغيرات العالمية
// =================================================================
let APP_CONFIG = {}; 
let currentEditingReservation = null; // يجب أن يتم تعيينه عند فتح نموذج التعديل
// ... أي متغيرات عالمية أخرى

// =================================================================
// 4. الدوال المساعدة (دوال وهمية/ناقصة - يجب ملء منطقها الفعلي)
// =================================================================
function showStatus(message, type, divId, autoHide = true) {
    console.warn(`[Status] ${type}: ${message} on ${divId}`);
    // TODO: أضف منطق عرض الحالة الفعلي لديك هنا
}

function closeEditForm() {
    // TODO: أضف منطق إغلاق نموذج التعديل الفعلي
}

function closeReservationDetails() {
    // TODO: أضف منطق إغلاق تفاصيل الحجز الفعلي
}

function loadAllReservations() {
    // TODO: أضف منطق تحميل جميع الحجوزات الفعلي
}

/**
 * دالة غير متزامنة (async) لعد الغرف المتاحة
 * @returns {number} عدد الغرف المتاحة
 */
async function getAvailableCount(suiteKey, arrivalDate, departureDate, excludeRecordId) {
    // TODO: أضف منطق التحقق من التوفر الفعلي لديك هنا (مهم أن تكون async)
    return 100; // قيمة وهمية - يجب استبدالها بالمنطق الفعلي
}


// =================================================================
// 5. دالة getStatusColor (من الكود الأصلي)
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
    
    // TODO: أضف باقي منطق الألوان هنا
    
    // الحالة الافتراضية
    return '#28a745'; // 🟢 مؤكد (أخضر)
}


// =========================================================
// 6. الدالة المصححة والمحسّنة (saveReservationEdits)
// =========================================================

/**
 * دالة غير متزامنة لحفظ تعديلات الحجز.
 * ✅ تم تصحيح مشكلة 'await is only valid in async functions...' المحتملة.
 * ✅ تم تحسين منطق التحقق من التوفر وإزالة التكرار (استخدام SUITE_CONFIG).
 */
async function saveReservationEdits() {
    // 🚨 بداية الدالة التي كانت تحتوي على await
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
            // 💡 حقول الأجنحة
            [FIELD_IDS.GUEST_COUNT]: parseInt(document.getElementById('edit_guestCount')?.value) || undefined,
            [FIELD_IDS.GUEST_ARRIVAL]: document.getElementById('edit_guestArrival')?.value || undefined,
            [FIELD_IDS.GUEST_DEPARTURE]: document.getElementById('edit_guestDeparture')?.value || undefined,
            // (يجب إضافة حقول VIP و ROYAL هنا إذا كانت موجودة)
        };

        // ❌ إزالة الحقول التي قيمتها غير محددة (لتجنب إرسالها إلى Airtable بقيمة فارغة)
        Object.keys(updatedFields).forEach(key => {
            if (updatedFields[key] === undefined) delete updatedFields[key];
        });

        // ✅ التحقق فقط إذا تغيّر نوع الحجز من انتظار/ملغي إلى مؤكد (تأكيد الحجز)
        const oldType = currentEditingReservation.fields[FIELD_NAMES.RES_TYPE];
        const newType = updatedFields[FIELD_IDS.RES_TYPE];
        const isConfirmingNow =
            (oldType === "قيد الانتظار" || oldType === "ملغي") &&
            newType === "مؤكد";

        // =========================================================
        // ✅ منطق التحقق من التوفر المحسّن
        // =========================================================
        if (isConfirmingNow) {
            showStatus('🔍 جاري التحقق من التوفر 🔍', 'info', statusDivId, false);

            let allSuitesAvailable = true;
            let hasDates = false;

            // التكرار على جميع أنواع الأجنحة المعرفة في SUITE_CONFIG
            for (const suiteKey in SUITE_CONFIG) {
                const suiteConfig = SUITE_CONFIG[suiteKey];

                const requestedCount = updatedFields[suiteConfig.count] || 0;
                const newArrival = updatedFields[suiteConfig.arrival];
                const newDeparture = updatedFields[suiteConfig.departure];

                // إذا كان هناك عدد مطلوب وتم إدخال تواريخ، قم بالتحقق
                if (requestedCount > 0) {
                    if (!newArrival || !newDeparture) {
                         // إذا تم طلب عدد ولكن التواريخ مفقودة
                         showStatus(`❌ خطأ: يجب تحديد تواريخ الوصول والمغادرة لجناح ${suiteConfig.nameAr}.`, 'error', statusDivId);
                         return; // إيقاف العملية
                    }
                    hasDates = true; // تم تحديد تواريخ لنوع حجز واحد على الأقل

                    // هذا هو السطر الذي قد يكون سبب مشكلة النطاق (Scope) لديك
                    const availableCount = await getAvailableCount(
                        suiteKey,
                        newArrival,
                        newDeparture,
                        currentEditingReservation.id // استثناء الحجز الحالي من التحقق
                    );

                    if (availableCount < requestedCount) {
                        showStatus(
                            `❌ عذراً، لا يوجد غرف كافية متاحة في جناح ${suiteConfig.nameAr}. المتاح: ${availableCount} غرفة.`,
                            'error',
                            statusDivId
                        );
                        allSuitesAvailable = false;
                        break; // إيقاف التحقق عند أول فشل
                    }
                }
            }

            // إذا لم يتوفر أي جناح، أوقف الحفظ
            if (!allSuitesAvailable) {
                return;
            }

            // إذا كان الحجز مؤكداً ولكن لا توجد تواريخ محددة لأي جناح
            if (!hasDates) {
                 showStatus('❌ خطأ: يجب تحديد تواريخ الوصول والمغادرة عند تأكيد الحجز.', 'error', statusDivId);
                 return;
            }
        }
        // =========================================================

        // 4. إرسال طلب PATCH إلى Airtable لحفظ التعديلات
        const response = await fetch(`${AIRTABLE_API_URL}/${currentEditingReservation.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: updatedFields })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`فشل حفظ التعديلات: ${response.status} - ${errorText}`);
        }

        showStatus('✅ تم حفظ التعديلات بنجاح', 'success', statusDivId);

        // 5. إغلاق النموذج وتحديث البيانات
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
