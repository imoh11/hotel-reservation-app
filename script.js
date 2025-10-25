// =================================================================
// مفاتيح API (سيتم جلبها من Netlify Environment Variables)
// =================================================================
// 🚨🚨🚨 هام: يجب أن يكون هذا Placeholder ليتم استبداله بأمر البناء في Netlify 🚨🚨🚨
const AIRTABLE_API_KEY = "AIRTABLE_API_KEY_PLACEHOLDER"; 
const BASE_ID = 'appZm1T1ecVIlWOwy';
const TABLE_NAME = 'tbloqjxnWuD2aH66H'; // يجب أن يكون Table ID
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

// =================================================================
// FIELD IDS  (معرّفات الحقول الثابتة)
// =================================================================
const FIELD_IDS = {
    // الحقول الأساسية
    RES_TYPE: 'fldMUvsWgpp2LuTf2',
    COUNTER: 'flduEC9m8ruQ6tzi8',
    SOURCE: 'fldHrwuzi8LxIeKVX',
    GUEST_NAME: 'fldI2sYu4qIu2PIGe', 
    PHONE: 'fldZxjo1fzU9FQR2Q',
    AMOUNT: 'fldbsNQcjGZni1Z6w',

    // حقل الملخص الذي يجب عرضه
    SUMMARY_COLUMN: 'fldv0jKm0o4PWiQbX', 

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

// ===============================================
// وظائف الواجهة
// ===============================================
function showStatus(message, type = 'info', tabId) {
    const statusDiv = document.getElementById(`statusMessage_${tabId}`);
    if (!statusDiv) return;
    
    // إزالة الفئات القديمة
    statusDiv.classList.remove('info', 'success', 'error', 'hidden'); 
    
    // إضافة الفئة الجديدة
    statusDiv.classList.add(type);
    statusDiv.innerText = message;
    
    // إظهار الرسالة (إزالة 'hidden')
    statusDiv.classList.remove('hidden'); 
    
    // إخفاء الرسالة بعد 5 ثواني
    setTimeout(() => { 
        statusDiv.classList.add('hidden'); 
    }, 5000);
}


function updateSuiteSummary(prefix, suiteKey) {
    const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);
    // تم تعديل هذا الجزء للتعامل مع الحقل كنص والتحقق من قيمته
    const count = parseInt(countInput.value) || 0; 
    const summaryElement = document.getElementById(`${suiteKey}_summary_${prefix}`);

    // في حال إدخال قيمة سالبة أو غير رقمية
    if (isNaN(parseInt(countInput.value)) || parseInt(countInput.value) < 0) {
        countInput.value = ''; // تركه فارغاً أفضل
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

// ===============================================
// وظيفة حفظ حجز جديد (POST)
// ===============================================

document.getElementById('newReservationForm').addEventListener('submit', function(event) {
    event.preventDefault();
    saveNewReservation();
});

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
            // يتم استخدام parseInt هنا لتحويل النص إلى رقم
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

    const suiteCounts = [FIELD_IDS.GUEST_COUNT, FIELD_IDS.VIP_COUNT, FIELD_IDS.ROYAL_COUNT, FIELD_IDS.AMOUNT];
    suiteCounts.forEach(key => {
        // إذا كانت القيمة 0، يجب إرسالها كـ 0 (وليس undefined)
        if (data.hasOwnProperty(key) && data[key] === 0) { 
            data[key] = 0; 
        }
    });
    
    const totalReserved = (data[FIELD_IDS.GUEST_COUNT] || 0) + (data[FIELD_IDS.VIP_COUNT] || 0) + (data[FIELD_IDS.ROYAL_COUNT] || 0);
    // تم إضافة شرط للتحقق من أن مجموع الغرف ليس صفراً في حال إدخال تواريخ
    if (totalReserved === 0 && !Object.keys(data).some(key => key.includes('ARRIVAL'))) {
        showStatus('الرجاء تحديد جناح واحد على الأقل وإدخال عدد غرف وتواريخ.', 'error', statusDivId);
        return;
    }

    try {
        showStatus('جاري إرسال الحجز... ⏳', 'info', statusDivId);
        
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
                : errorData.error.type;

            throw new Error(`Airtable API Error: ${response.status} - ${errorMessage}`);
        }

        const savedRecord = await response.json();
        const newResId = savedRecord.id; 
        
        showStatus(`✅ تم حفظ الحجز بنجاح! رقم السجل في Airtable هو: ${newResId}.`, 'success', statusDivId);
        document.getElementById('newReservationForm').reset();
        
        // مسح ملخصات الأجنحة بعد إعادة التعيين
        document.querySelectorAll('span[id$="_summary_new').forEach(span => span.textContent = '');
    } catch (error) {
        console.error('Error saving reservation:', error);
        showStatus(`❌ فشل حفظ الحجز. (خطأ: ${error.message || 'غير معروف'}).`, 'error', statusDivId);
    }
}
 
// ===============================================
// وظيفة جلب الحجوزات القادمة (GET)
// ===============================================

async function loadFutureReservations() {
    const statusDivId = 'query';
    
    const viewName = 'حجوزات قادمة'; 

    const queryString = `view=${encodeURIComponent(viewName)}&sort[0][field]=${FIELD_IDS.GUEST_ARRIVAL}&sort[0][direction]=asc`;
    const url = `${AIRTABLE_API_URL}?${queryString}`;


    try {
        showStatus('جاري جلب الحجوزات القادمة... ⏳', 'info', statusDivId);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = errorData.error ? (errorData.error.message || errorData.error.type) : 'غير معروف';
            
            console.error('Airtable API Error during Fetch:', response.status, errorData); 
            showStatus(`❌ فشل API: ${response.status} - ${errorMessage}`, 'error', statusDivId);
            throw new Error(`Airtable API Error: ${response.status} - ${errorMessage}`);
        }

        const data = await response.json();
        const reservations = data.records;
        
        console.log('Fetched Reservations Data:', reservations); 

        showStatus(`✅ تم جلب ${reservations.length} حجزاً قادماً ومؤكداً.`, 'success', statusDivId);
        
        renderReservationsTable(reservations);

    } catch (error) {
        console.error('General Error loading reservations:', error); 
        showStatus(`❌ فشل جلب الحجوزات. (خطأ: ${error.message || 'غير معروف'}).`, 'error', statusDivId);
    }
}


function renderReservationsTable(reservations) {
    const container = document.getElementById('reservationsTableContainer');
    container.innerHTML = ''; 

    if (!reservations || reservations.length === 0) {
        container.innerHTML = `<p class="info status-message active info-message-block">لا توجد حجوزات قادمة مؤكدة حالياً.</p>`;
        return;
    }

    const table = document.createElement('table');
    table.className = 'reservations-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>النزيل (معرف الحجز)</th> 
                <th>تفاصيل الحجز</th> 
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    reservations.forEach(record => {
        const fields = record.fields;
        
        const guestName = fields[FIELD_IDS.GUEST_NAME] || 'غير محدد';
        const summaryText = fields[FIELD_IDS.SUMMARY_COLUMN] || '- لا توجد تفاصيل -';

        const tr = document.createElement('tr');
        

        tr.innerHTML = `
            <td>${guestName}</td>
            <td class="summary-cell">${summaryText}</td>
        `;
        tbody.appendChild(tr);
    });

    container.appendChild(table);
}

// ===============================================
// منطق التبويبات والأقسام المطوية
// ===============================================

// للتبويبات
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // إخفاء جميع المحتويات
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            // إخفاء جميع رسائل الحالة عند التبديل
            document.querySelectorAll('.status-message').forEach(msg => msg.classList.add('hidden'));
        });
        
        // إلغاء تنشيط جميع الأزرار
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // إظهار المحتوى المحدد
        document.getElementById(tabName).classList.add('active');
        button.classList.add('active');

        // إذا كان التبويب هو 'query'، قم بجلب البيانات
        if (tabName === 'query') {
            loadFutureReservations(); 
        }
    });
});

// للأقسام المطوية (Collapsible) - للتأكد من أنها تفتح وتغلق بشكل صحيح
document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        header.classList.toggle('active');
        content.classList.toggle('active');
    });
});
