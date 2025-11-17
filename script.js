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
// 2. وظائف مساعدة عامة
// =================================================================

/**
 * عرض رسالة حالة (نجاح/خطأ) في التبويبات
 * @param {string} message - نص الرسالة
 * @param {('success'|'error'|'info')} type - نوع الرسالة
 * @param {('newReservation'|'editReservation'|'query')} tabId - مُعرّف التبويب لعرض الرسالة فيه
 */
function showStatus(message, type, tabId) {
    const statusDiv = document.getElementById(`statusMessage_${tabId}`);
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.classList.remove('hidden');
    
    // إخفاء الرسالة بعد 5 ثواني ما لم تكن خطأ
    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);
    }
}

/**
 * تنسيق التاريخ إلى صيغة YYYY-MM-DD
 * @param {Date} date - كائن التاريخ
 * @returns {string} التاريخ المنسق
 */
function getFormattedDate(date) {
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * تحويل اسم نوع الجناح (guest, vip, royal) إلى الاسم العربي (ضيافة، إلخ)
 * @param {string} type - نوع الجناح (guest, vip, royal)
 * @returns {string} اسم الجناح العربي
 */
function getSuiteLabel(type) {
    switch (type) {
        case 'guest': return 'ضيافة';
        case 'vip': return 'VIP';
        case 'royal': return 'ملكي';
        default: return '';
    }
}

/**
 * حساب عدد الأيام بين تاريخين
 * @param {string} date1Str - تاريخ البداية (YYYY-MM-DD)
 * @param {string} date2Str - تاريخ النهاية (YYYY-MM-DD)
 * @returns {number} عدد الأيام (أيام إشغال)
 */
function calculateDaysBetweenDates(date1Str, date2Str) {
    if (!date1Str || !date2Str) return 0;
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    const firstDate = new Date(date1Str);
    const secondDate = new Date(date2Str);
    
    if (isNaN(firstDate.getTime()) || isNaN(secondDate.getTime())) return 0;

    const diffDays = Math.round((secondDate.getTime() - firstDate.getTime()) / oneDay);
    
    return Math.max(0, diffDays);
}


// =================================================================
// 3. وظائف الإشغال (Occupancy) - التعديلات الرئيسية هنا
// =================================================================

/**
 * دالة للتحكم في إظهار وإخفاء مدخلات التاريخ المخصصة وزر البحث
 * @param {boolean} [show=null] - لتحديد حالة العرض (true للإظهار، false للإخفاء). إذا كانت null، يتم التبديل.
 */
function toggleCustomDateInputs(show = null) {
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const labelDateFrom = document.getElementById('labelDateFrom');
    const labelDateTo = document.getElementById('labelDateTo');
    const customSearchButton = document.getElementById('customSearchButton');
    const filterCustomButton = document.getElementById('filterCustom');
    
    // تحديد حالة العرض/الإخفاء
    const isHidden = show === null ? dateFrom.classList.contains('hidden') : !show;

    // تبديل حالة الإخفاء
    dateFrom.classList.toggle('hidden', isHidden);
    dateTo.classList.toggle('hidden', isHidden);
    labelDateFrom.classList.toggle('hidden', isHidden);
    labelDateTo.classList.toggle('hidden', isHidden);
    customSearchButton.classList.toggle('hidden', isHidden);

    // إزالة حالة التفعيل من جميع الأزرار الأخرى
    document.querySelectorAll('.occupancy-filter .filter-button').forEach(btn => {
        if (btn.id !== 'filterCustom') {
            btn.classList.remove('active');
        }
    });

    // تفعيل زر "مخصوص" عند إظهار المدخلات
    if (filterCustomButton) {
        filterCustomButton.classList.toggle('active', !isHidden);
    }
}


/**
 * جلب بيانات الإشغال من Airtable وعرضها (محدث مع التحقق من التواريخ)
 * @param {string} filterType - نوع الفلتر المستخدم ('today', 'last7', 'last30', 'customSearch')
 * @param {string} [dateFromStr=null] - تاريخ البداية المطلوب (YYYY-MM-DD)
 * @param {string} [dateToStr=null] - تاريخ النهاية المطلوب (YYYY-MM-DD)
 */
async function fetchAndDisplayOccupancy(filterType, dateFromStr = null, dateToStr = null) {
    const loadingDiv = document.getElementById('loadingOccupancy');
    const table = document.getElementById('occupancyTable');
    const tableBody = document.getElementById('occupancyTableBody');
    const statusDiv = document.getElementById('statusMessage_query');

    loadingDiv.style.display = 'block';
    table.classList.add('hidden');
    tableBody.innerHTML = '';
    statusDiv.classList.add('hidden');
    statusDiv.textContent = '';

    // 1. تحديد نطاق التقرير والتحقق من التواريخ
    let dateFrom, dateTo;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterType === 'today') {
        dateFrom = today;
        dateTo = today;
    } else if (filterType === 'last7') {
        dateFrom = new Date(today);
        dateFrom.setDate(today.getDate() - 6);
        dateTo = today;
    } else if (filterType === 'last30') {
        dateFrom = new Date(today);
        dateFrom.setDate(today.getDate() - 29);
        dateTo = today;
    } else if (filterType === 'customSearch') {
        if (!dateFromStr || !dateToStr) {
            showStatus('❌ الرجاء تحديد تاريخي البداية والنهاية للبحث المخصص.', 'error', 'query');
            loadingDiv.style.display = 'none';
            return;
        }
        dateFrom = new Date(dateFromStr);
        dateTo = new Date(dateToStr);
    } else {
        dateFrom = today;
        dateTo = today;
    }

    // ⚠️ التحقق من منطق التواريخ: تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية
    if (dateTo < dateFrom) {
        showStatus('❌ منطق خاطئ: تاريخ "إلى" لا يمكن أن يكون قبل تاريخ "من". الرجاء تصحيح المدخلات.', 'error', 'query');
        loadingDiv.style.display = 'none';
        table.classList.add('hidden');
        return;
    }

    const finalDateFromStr = getFormattedDate(dateFrom);
    const finalDateToStr = getFormattedDate(dateTo);
    
    // 2. بناء فلتر Airtable (فلترة التقاطع)
    const filterFormula = `AND({تاريخ الوصول} <= '${finalDateToStr}', {تاريخ المغادرة} > '${finalDateFromStr}', {نوع الحجز} != 'ملغي')`;
    
    const url = `${AIRTABLE_API_URL}?filterByFormula=${encodeURIComponent(filterFormula)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.statusText}`);
        }

        const data = await response.json();
        const records = data.records;
        
        // 3. تحليل بيانات الإشغال
        const occupancyData = {};
        const suiteTypes = ['guest', 'vip', 'royal'];
        const totalSuites = {
            guest: APP_CONFIG.guest_total || 14, 
            vip: APP_CONFIG.vip_total || 4, 
            royal: APP_CONFIG.royal_total || 2
        };
        
        let currentDate = new Date(dateFrom);
        let loopEnd = new Date(dateTo);
        loopEnd.setDate(loopEnd.getDate() + 1);

        while (currentDate < loopEnd) {
            const dateStr = getFormattedDate(currentDate);
            occupancyData[dateStr] = {
                date: dateStr,
                dayName: new Date(dateStr).toLocaleDateString('ar-EG', { weekday: 'long' }),
                guest: 0,
                vip: 0,
                royal: 0,
                total: 0
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        records.forEach(record => {
            const fields = record.fields;
            const arrivalDate = fields['تاريخ الوصول'] ? new Date(fields['تاريخ الوصول']) : null;
            const departureDate = fields['تاريخ المغادرة'] ? new Date(fields['تاريخ المغادرة']) : null;

            if (arrivalDate && departureDate) {
                let day = new Date(arrivalDate);
                const endDate = new Date(departureDate);

                while (day < endDate) {
                    const dateStr = getFormattedDate(day);
                    if (occupancyData[dateStr]) {
                        suiteTypes.forEach(type => {
                            const countKey = `عدد أجنحة ${getSuiteLabel(type)}`;
                            const count = fields[countKey] || 0;
                            if (count > 0) {
                                occupancyData[dateStr][type] += count;
                            }
                        });
                    }
                    day.setDate(day.getDate() + 1);
                }
            }
        });

        // 4. عرض البيانات في الجدول والملخص
        let grandTotalOccupied = 0;
        let grandTotalPossible = 0;
        const totalSummary = { guest: 0, vip: 0, royal: 0 };
        const datesArray = Object.keys(occupancyData).sort();

        datesArray.forEach(dateStr => {
            const dayData = occupancyData[dateStr];
            let dailyTotalOccupied = 0;

            let rowHTML = `<tr><td>${dateStr}</td><td>${dayData.dayName}</td>`;
            
            suiteTypes.forEach(type => {
                const count = dayData[type];
                const total = totalSuites[type];
                const occupancy = (count / total) * 100;
                
                let cellClass = '';
                if (occupancy >= 90) {
                    cellClass = 'cell-critical';
                } else if (occupancy >= 70) {
                    cellClass = 'cell-medium';
                } else {
                    cellClass = 'cell-low';
                }

                rowHTML += `<td class="${cellClass}">${count} / ${total}</td>`;
                dailyTotalOccupied += count;
                
                totalSummary[type] += count;
            });

            const dailyTotalAvailable = totalSuites.guest + totalSuites.vip + totalSuites.royal;
            const totalOccupancy = (dailyTotalOccupied / dailyTotalAvailable) * 100;
            const totalCellClass = totalOccupancy >= 90 ? 'cell-critical' : totalOccupancy >= 70 ? 'cell-medium' : 'cell-low';

            rowHTML += `<td class="total-cell ${totalCellClass}">${dailyTotalOccupied} / ${dailyTotalAvailable}</td></tr>`;
            tableBody.insertAdjacentHTML('beforeend', rowHTML);

            grandTotalOccupied += dailyTotalOccupied;
            grandTotalPossible += dailyTotalAvailable;
        });

        // 5. تحديث ملخص الأجنحة
        suiteTypes.forEach(type => {
            const occupied = totalSummary[type] / datesArray.length;
            const total = totalSuites[type];
            const percentage = (occupied / total) * 100;

            const summaryDiv = document.getElementById(`${type}Summary`);
            const barFill = document.getElementById(`${type}Bar`);

            summaryDiv.querySelector('.occupied').textContent = occupied.toFixed(1);
            summaryDiv.querySelector('.total').textContent = total;
            summaryDiv.querySelector('.percentage').textContent = `${percentage.toFixed(1)}%`;
            barFill.style.width = `${Math.min(100, percentage)}%`;
            barFill.className = `summary-bar-fill ${percentage >= 90 ? 'critical' : percentage >= 70 ? 'medium' : ''}`;
        });
        
        // تحديث الملخص الإجمالي
        const avgDailyOccupied = grandTotalOccupied / datesArray.length;
        const avgDailyPossible = grandTotalPossible / datesArray.length;
        const overallPercentage = (avgDailyOccupied / avgDailyPossible) * 100;

        const totalSummaryDiv = document.getElementById('totalSummary');
        const totalBarFill = document.getElementById('totalBar');

        totalSummaryDiv.querySelector('.occupied').textContent = avgDailyOccupied.toFixed(1);
        totalSummaryDiv.querySelector('.total').textContent = avgDailyPossible;
        totalSummaryDiv.querySelector('.percentage').textContent = `${overallPercentage.toFixed(1)}%`;
        totalBarFill.style.width = `${Math.min(100, overallPercentage)}%`;
        totalBarFill.className = `summary-bar-fill ${overallPercentage >= 90 ? 'critical' : overallPercentage >= 70 ? 'medium' : ''}`;


        // 6. إنهاء التحميل وإظهار الجدول
        loadingDiv.style.display = 'none';
        table.classList.remove('hidden');
        showStatus(`✅ تم عرض تقرير الإشغال بنجاح للفترة من ${finalDateFromStr} إلى ${finalDateToStr}.`, 'success', 'query');

    } catch (error) {
        console.error('Error fetching occupancy data:', error);
        loadingDiv.style.display = 'none';
        showStatus(`❌ حدث خطأ أثناء جلب بيانات الإشغال. ${error.message}`, 'error', 'query');
    }
}


/**
 * تحديد التواريخ ونوع الفلتر وتحديث حالة الأزرار
 * @param {string} filterType - نوع الفلتر المطلوب
 */
function filterOccupancy(filterType) {
    document.querySelectorAll('.occupancy-filter .filter-button').forEach(button => {
        button.classList.remove('active');
    });

    // ⚠️ الحالة الجديدة: 'مخصوص' - لا يقوم بالبحث، بل يفتح حقول الإدخال
    if (filterType === 'custom') {
        document.getElementById('filterCustom').classList.add('active');
        return; 
    }
    
    // ⚠️ الحالة الجديدة: 'بحث مخصص' - يتم استدعاؤه عند الضغط على زر "بحث"
    if (filterType === 'customSearch') {
        const dateFromInput = document.getElementById('dateFrom').value;
        const dateToInput = document.getElementById('dateTo').value;
        fetchAndDisplayOccupancy('customSearch', dateFromInput, dateToInput);
        document.getElementById('filterCustom').classList.add('active');
        return;
    }

    // لجميع الفلاتر المحددة مسبقًا الأخرى
    const buttonId = `filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    const button = document.getElementById(buttonId);
    if (button) {
        button.classList.add('active');
    }
    
    fetchAndDisplayOccupancy(filterType);
}

// =================================================================
// 16. معالجة الأحداث (Event Listeners) - تم تعديل قسم الإشغال
// =================================================================
// ... (يجب أن تضع هنا جميع معالجات الأحداث الأخرى لصفحات الحجز والتعديل)
// ...

// ✅ معالجة ضغطات أزرار فلترة الإشغال
document.querySelectorAll('.occupancy-filter .filter-button').forEach(button => {
    button.addEventListener('click', function() {
        // إزالة "days" في حال وجودها
        const filterType = this.id.replace('filter', '').replace('days', '').toLowerCase();
        
        // ⚠️ إذا ضغط المستخدم على زر "مخصوص"
        if (filterType === 'custom') {
            toggleCustomDateInputs();
            filterOccupancy(filterType);
            return;
        }

        // إذا ضغط على أي زر آخر، يتم التأكد من إخفاء المدخلات المخصصة
        toggleCustomDateInputs(false); 

        filterOccupancy(filterType);
    });
});

// ✅ معالجة ضغطة زر "بحث" المخصص (جديد)
const customSearchButton = document.getElementById('customSearchButton');
if (customSearchButton) {
    customSearchButton.addEventListener('click', function() {
        filterOccupancy('customSearch');
    });
}
// ... (يجب أن تضع هنا بقية معالجات الأحداث الأخرى ودالة init)
// ...
