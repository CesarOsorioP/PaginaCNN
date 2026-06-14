const axios = require('axios');
const isDebug = process.env.EMAIL_DEBUG === 'true' || process.env.NODE_ENV === 'development';

/**
 * sendEmail via Brevo HTTP API only.
 * Env required:
 *  - BREVO_API_KEY
 *  - FROM_EMAIL or EMAIL_FROM (or FROM_NAME + FROM_EMAIL)
 */
const sendEmail = async ({ to, subject, html, text }) => {
    if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY no está configurada en .env');
    }

    if (!to) throw new Error('Missing `to` address for sendEmail');

    // Build sender object
    const rawFrom = process.env.EMAIL_FROM || (process.env.FROM_NAME && process.env.FROM_EMAIL ? `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>` : process.env.FROM_EMAIL) || '';
    let senderObj = {};
    const m = String(rawFrom).match(/^(.*)<([^>]+)>$/);
    if (m) {
        senderObj = { name: m[1].replace(/"/g, '').trim(), email: m[2].trim() };
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawFrom)) {
        senderObj = { email: rawFrom };
    } else {
        // fallback
        senderObj = { email: process.env.FROM_EMAIL || 'no-reply@medscan.ai' };
    }

    const payload = {
        sender: senderObj,
        to: [{ email: to }],
        subject: subject || '',
        htmlContent: html || undefined,
        textContent: text || undefined
    };

    if (isDebug) console.log('📧 [sendEmail] Enviando via Brevo API', { to, subject, sender: senderObj });

    try {
        const resp = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        if (isDebug) console.log('✅ [sendEmail] Email enviado via Brevo API:', resp.status);
        return resp.data;
    } catch (error) {
        console.error('❌ [sendEmail] Error al enviar email via Brevo API:');
        console.error('   - Mensaje:', error.message);
        if (error.response) {
            console.error('   - Status:', error.response.status);
            console.error('   - Data:', JSON.stringify(error.response.data));
        }
        console.error('   - Stack:', error.stack);
        throw error;
    }
};

module.exports = sendEmail;
