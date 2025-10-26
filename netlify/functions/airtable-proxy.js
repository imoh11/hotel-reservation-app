const fetch = require('node-fetch');

// يجب تعريف هذه المتغيرات في إعدادات Netlify
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY; 
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME; 

// يجب أن يتطابق هذا مع ما تم تعيينه في CONFIG.API_BASE
const API_PREFIX = '/.netlify/functions/airtable-proxy/reservations'; 

exports.handler = async (event) => {
    try {
        if (!AIRTABLE_API_KEY) {
            return { statusCode: 500, body: 'Airtable API Key not configured.' };
        }
        
        const path = event.path;
        const method = event.httpMethod;
        
        // استخلاص ID السجل إن وجد (لـ PATCH أو GET سجل واحد)
        const recordIdMatch = path.match(/\/reservations\/(rec[A-Za-z0-9]+)$/);
        const recordId = recordIdMatch ? recordIdMatch[1] : null;

        // بناء URL Airtable الصحيح
        let airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
        
        // إضافة الفلاتر وعرض البيانات (View)
        if (method === 'GET') {
            const queryParams = event.queryStringParameters;
            
            // في هذا المثال سنعتمد على View جاهز باسم 'حجوزات قادمة' للجلب الأولي
            // لتبسيط الأمر، يمكن استبدال هذه بـ filterByFormula لو كنت تبحث عن سجل واحد
            airtableUrl += `?view=${encodeURIComponent('حجوزات قادمة')}`;
            
            // إضافة logic البحث عن سجل واحد هنا
            if (queryParams && queryParams.search) {
                // هنا يجب أن يتم بناء filterByFormula للبحث عن ID أو رقم جوال
                // هذا الجزء معقد ويتطلب منطقًا إضافيًا، لذا نبدأ بالأبسط.
                // للتطبيق الكامل، يجب نقل منطق filterFormula من دالة searchReservation السابقة إلى هنا.
            }
        }
        
        // بناء طلب الشبكة لـ Airtable
        const response = await fetch(airtableUrl + (method === 'GET' ? event.path.split('?')[1] || '' : ''), {
            method: method,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: ['POST', 'PATCH'].includes(method) ? event.body : undefined,
        });

        // قراءة الاستجابة وإعادتها للعميل
        const data = await response.json();

        return {
            statusCode: response.status,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        };

    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
