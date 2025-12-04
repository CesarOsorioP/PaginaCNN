const nodemailer = require('nodemailer');

const getTransportConfig = () => {
    if (process.env.EMAIL_TRANSPORT === 'gmail') {
        return {
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
            }
        };
    }

    return {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER || process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
        }
    };
};

const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = nodemailer.createTransport(getTransportConfig());

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.FROM_EMAIL || `"MedScan AI" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`,
        to,
        subject,
        text,
        html
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

