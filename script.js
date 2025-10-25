// =================================================================
// 1. إعدادات Airtable الأساسية - يجب تعديلها
// =================================================================
const AIRTABLE_API_KEY = "AIRTABLE_API_KEY_PLACEHOLDER";
const BASE_ID = 'appZm1T1ecVIlWOwy';
const TABLE_NAME = 'tbloqjxnWuD2aH66H'; // Table ID الخاص بك
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

// =================================================================
// 2. FIELD IDS (معرّفات الحقول الثابتة) - تم تأكيدها
// =================================================================
const FIELD_IDS = {
    // ... (باقي تعريفات الحقول لم تتغير)
    RES_NUMBER: 'fldMTOwOZ7jM8axbf',
    RES_TYPE: 'fldMUvsWgpp2LuTf2',
    COUNTER: 'flduEC9m8ruQ6tzi8',
    SOURCE: 'fldHrwuzi8LxIeKVX',
    GUEST_NAME: 'fldI2sYu4qIu2PIGe',
    PHONE: 'fldZxjo1fzU9FQR2Q',
    AMOUNT: 'fldbsNQcjGZni1Z6w',
    SUMMARY_COLUMN: 'fldv0jKm0o4PWiQbX',
    GUEST_ARRIVAL: 'fldMUosyFGqomDcy0',
    GUEST_DEPARTURE: 'fldqigNkyfC2ZRfxJ',
    GUEST_COUNT: 'fldm5R1GFdeJaNCwp',
    VIP_ARRIVAL: 'fldCnuObF607viGRo',
    VIP_DEPARTURE: 'fldvW7j98Xb2JR0Zk',
    VIP_COUNT: 'flde1QyYM73ezs565',
    ROYAL_ARRIVAL: 'fldbjG9dQHT0inlXx',
    ROYAL_DEPARTURE: 'fldkC8A1Bh7iIrBwk',
    ROYAL_COUNT: 'fldQeliMpdLeT3Zdb',
    TRANSFERER_NAME: 'fldWIoRdNmBtAX3zt',
    TRANSFER_DATE: 'fldXVNY3cwQ99Zcpn',
    NOTES: 'fld6J3886d7hSle25'
};

// ... (الدوال المساعدة showStatus, updateSuiteSummary, calculateDaysPerSuite لم تتغير)
function showStatus(message, type = 'info', tabId, autoHide = true) {
    const statusDiv = document.getElementById(`statusMessage_${tabId}`);
    if (!statusDiv) return;

    statusDiv.classList.remove('info', 'success', 'error', 'hidden');
    statusDiv.classList.add(type);
    statusDiv.innerHTML = message;
    statusDiv.classList.remove('hidden');

    if (autoHide) {
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

// ... (دالة saveNewReservation لم تتغير)
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
    if (totalReserved === 0 && !Object.keys(data).some(key => key.includes('ARRIVAL'))) {
        showStatus('الرجاء تحديد جناح واحد على الأقل وإدخال عدد غرف وتواريخ.', 'error', statusDivId);
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

        const successMessage = `✅ تم حفظ الحجز بنجاح! <br> <strong>رقم الحجز (ID) هو: ${newResId}</strong>. <br> <em>الرجاء استخدامه في قسم التعديل.</em>`;
        showStatus(successMessage, 'success', statusDivId);

        document.getElementById('newReservationForm').reset();

        document.querySelectorAll('span[id$="_summary_new').forEach(span => span.textContent = '');
    } catch (error) {
        console.error('Error saving reservation:', error);
        showStatus(`❌ فشل حفظ الحجز. (خطأ: ${error.message || 'غير معروف'}).`, 'error', statusDivId);
    }
}

// ===============================================
// 4. وظيفة البحث عن الحجز (المراجعة والتأكيد)
// ===============================================

async function searchReservation() {
    const statusDivId = 'editReservation';
    const searchValue = document.getElementById('searchReservationInput').value.trim();

    document.getElementById('editReservationForm').classList.add('hidden');

    if (!searchValue) {
        showStatus('الرجاء إدخال رقم الجوال أو رقم الحجز (ID) للبحث.', 'error', statusDivId);
        return;
    }

    // بناء فلتر Airtable
    let filterFormula;
    // 🚨 التحقق مما إذا كانت القيمة المدخلة هي Airtable Record ID (يبدأ بـ rec)
    if (searchValue.toLowerCase().startsWith('rec')) {
        filterFormula = `RECORD_ID() = '${searchValue}'`;
    } else {
        // 🚨 البحث برقم الجوال: استخدام مطابقة كاملة لضمان الدقة
        filterFormula = `{${FIELD_IDS.PHONE}} = '${searchValue}'`;
        
        // 🚨 ملاحظة: إذا كنت تريد البحث أيضاً برقم الحجز التسلسلي (إذا كان حقل نصي):
        // filterFormula = `OR(RECORD_ID() = '${searchValue}', {${FIELD_IDS.PHONE}} = '${searchValue}', {${FIELD_IDS.RES_NUMBER}} = '${searchValue}')`;
    }

    const encodedFilter = encodeURIComponent(filterFormula);
    const url = `${AIRTABLE_API_URL}?filterByFormula=${encodedFilter}&maxRecords=1`;

    try {
        showStatus('جاري البحث عن الحجز... 🔍', 'info', statusDivId);
        
        // 🚨 التأكد من أن مفتاح الـ API يملك صلاحية القراءة (Read permission)
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            // إظهار رسالة خطأ واضحة في حال مشكلة في الاتصال أو الصلاحيات
             const errorData = await response.json();
             const errorMessage = errorData.error ? (errorData.error.message || errorData.error.type) : 'غير معروف';
             showStatus(`❌ فشل الاتصال. تحقق من مفتاح API (صلاحية القراءة) أو ${errorMessage}`, 'error', statusDivId);
             throw new Error(`Airtable API Error: ${response.status} - ${errorMessage}`);
        }

        const data = await response.json();
        const records = data.records;

        if (records.length === 0) {
            showStatus(`❌ لم يتم العثور على حجز يطابق المدخل: ${searchValue}.`, 'error', statusDivId);
            return;
        }

        const record = records[0];
        showStatus(`✅ تم العثور على حجز (${record.id}). يرجى تعديل البيانات وحفظها.`, 'success', statusDivId, false);

        populateEditForm(record);

    } catch (error) {
        console.error('Error searching reservation:', error);
        showStatus(`❌ فشل البحث. (خطأ: ${error.message || 'غير معروف'}).`, 'error', statusDivId);
    }
}

// ... (باقي الدوال populateEditForm, updateReservation, loadFutureReservations لم تتغير)
function populateEditForm(record) {
    const fields = record.fields;
    const recordId = record.id;
    const prefix = 'edit';

    document.getElementById('recordId_edit').value = recordId;
    document.getElementById('editReservationForm').classList.remove('hidden');

    document.getElementById(`type_${prefix}`).value = fields[FIELD_IDS.RES_TYPE] || '';
    document.getElementById(`counter_${prefix}`).value = fields[FIELD_IDS.COUNTER] || '';
    document.getElementById(`guestName_${prefix}`).value = fields[FIELD_IDS.GUEST_NAME] || '';
    document.getElementById(`phone_${prefix}`).value = fields[FIELD_IDS.PHONE] || '';
    document.getElementById(`source_${prefix}`).value = fields[FIELD_IDS.SOURCE] || '';
    document.getElementById(`amount_${prefix}`).value = fields[FIELD_IDS.AMOUNT] !== undefined ? fields[FIELD_IDS.AMOUNT].toString() : '';

    const suites = ['guest', 'vip', 'royal'];
    suites.forEach(suiteKey => {
        const arrival = fields[FIELD_IDS[`${suiteKey.toUpperCase()}_ARRIVAL`]];
        const departure = fields[FIELD_IDS[`${suiteKey.toUpperCase()}_DEPARTURE`]];
        const count = fields[FIELD_IDS[`${suiteKey.toUpperCase()}_COUNT`]];

        document.getElementById(`${suiteKey}Arrival_${prefix}`).value = arrival || '';
        document.getElementById(`${suiteKey}Departure_${prefix}`).value = departure || '';

        document.getElementById(`${suiteKey}SuiteCount_${prefix}`).value = count !== undefined ? count.toString() : '';

        calculateDaysPerSuite(prefix, suiteKey);
    });

    document.getElementById('transfererName_edit').value = fields[FIELD_IDS.TRANSFERER_NAME] || '';
    document.getElementById('currentDate_edit').value = fields[FIELD_IDS.TRANSFER_DATE] || '';
    document.getElementById('notes_edit').value = fields[FIELD_IDS.NOTES] || '';

    document.querySelectorAll('#editReservation .collapsible-content').forEach(content => {
        content.classList.add('active');
        content.previousElementSibling.classList.add('active');
    });
}
async function updateReservation() {
    const statusDivId = 'editReservation';
    const recordId = document.getElementById('recordId_edit').value;

    if (!recordId) {
        showStatus('❌ لا يوجد سجل حجز محدد للتعديل.', 'error', statusDivId);
        return;
    }

    const prefix = 'edit';

    const getSuiteValue = (key, type) => {
        const element = document.getElementById(`${key}${type}_${prefix}`);
        if (!element) return undefined;

        if (type.includes('Count') || type.includes('Days')) {
            const val = parseInt(element.value);
            return isNaN(val) ? undefined : val;
        }
        return element.value.trim() === '' ? undefined : element.value;
    };

    let amountValue = document.getElementById('amount_edit').value.replace(/[^0-9.]/g, '');
    const amount = (amountValue.trim() !== '' && !isNaN(parseFloat(amountValue))) ? parseFloat(amountValue) : undefined;

    const data = {
        [FIELD_IDS.RES_TYPE]: document.getElementById(`type_${prefix}`).value,
        [FIELD_IDS.COUNTER]: document.getElementById(`counter_${prefix}`).value,
        [FIELD_IDS.GUEST_NAME]: document.getElementById(`guestName_${prefix}`).value,
        [FIELD_IDS.PHONE]: document.getElementById(`phone_${prefix}`).value,
        [FIELD_IDS.SOURCE]: document.getElementById(`source_${prefix}`).value,
        [FIELD_IDS.AMOUNT]: amount,
        [FIELD_IDS.TRANSFERER_NAME]: document.getElementById('transfererName_edit').value || undefined,
        [FIELD_IDS.TRANSFER_DATE]: getSuiteValue('currentDate', ''),
        [FIELD_IDS.NOTES]: document.getElementById('notes_edit').value || undefined,
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
        if (data[key] === null || data[key] === '') {
            data[key] = undefined;
        }
        if (key === FIELD_IDS.RES_NUMBER || key.includes('DAYS')) {
            delete data[key];
        }
    });

    const totalReserved = (data[FIELD_IDS.GUEST_COUNT] || 0) + (data[FIELD_IDS.VIP_COUNT] || 0) + (data[FIELD_IDS.ROYAL_COUNT] || 0);
    if (totalReserved === 0 && data[FIELD_IDS.RES_TYPE] !== 'ملغي' && !Object.keys(data).some(key => key.includes('ARRIVAL'))) {
        showStatus('الرجاء تحديد جناح واحد على الأقل وتواريخ، أو تعيين حالة الحجز إلى "ملغي".', 'error', statusDivId);
        return;
    }

    const isCancellation = data[FIELD_IDS.RES_TYPE] === 'ملغي';
    const actionText = isCancellation ? 'إلغاء' : 'تعديل';

    try {
        showStatus(`جاري ${actionText} الحجز... ⏳`, 'info', statusDivId);

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
            const errorMessage = errorData.error ? (errorData.error.message || errorData.error.type) : 'غير معروف';
            throw new Error(`Airtable API Error: ${response.status} - ${errorMessage}`);
        }

        showStatus(`✅ تم ${actionText} الحجز بنجاح! رقم السجل: ${recordId}.`, 'success', statusDivId, false);
        document.getElementById('editReservationForm').classList.add('hidden');
    } catch (error) {
        console.error('Error updating reservation:', error);
        showStatus(`❌ فشل ${actionText} الحجز. (خطأ: ${error.message || 'غير معروف'}).`, 'error', statusDivId);
    }
}
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
                <th>النزيل (<small>معرف الحجز</small>)</th>
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
        const recordId = record.id;
        const summaryText = fields[FIELD_IDS.SUMMARY_COLUMN] || '- لا توجد تفاصيل -';

        const tr = document.createElement('tr');


        tr.innerHTML = `
            <td>${guestName} <small style="display:block; color:var(--gray);">${recordId}</small></td>
            <td class="summary-cell">${summaryText}</td>
        `;
        tbody.appendChild(tr);
    });

    container.appendChild(table);
}
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('newReservationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        saveNewReservation();
    });

    // 🚨 تأكد من أن زر البحث له ID: searchButton في ملف HTML
    const searchButton = document.getElementById('searchButton');
    if(searchButton) {
        searchButton.addEventListener('click', searchReservation);
    }
    
    document.getElementById('editReservationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        updateReservation();
    });

    ['new', 'edit'].forEach(prefix => {
        ['guest', 'vip', 'royal'].forEach(suiteKey => {
            const arrivalInput = document.getElementById(`${suiteKey}Arrival_${prefix}`);
            const departureInput = document.getElementById(`${suiteKey}Departure_${prefix}`);
            const countInput = document.getElementById(`${suiteKey}SuiteCount_${prefix}`);

            if (arrivalInput) arrivalInput.addEventListener('change', () => calculateDaysPerSuite(prefix, suiteKey));
            if (departureInput) departureInput.addEventListener('change', () => calculateDaysPerSuite(prefix, suiteKey));
            if (countInput) countInput.addEventListener('input', () => updateSuiteSummary(prefix, suiteKey));
        });
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

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

            if (tabName === 'query') {
                loadFutureReservations();
            }
        });
    });

    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            header.classList.toggle('active');
            content.classList.toggle('active');
        });
    });

    document.querySelector('.tab-button')?.click();
});
