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
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER || process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
        }
    };
};

const sendEmail = async ({ to, subject, html, text }) => {
    try {
        console.log('📧 [sendEmail] Intentando enviar email a:', to);
        console.log('📧 [sendEmail] Configuración de transporte:', process.env.EMAIL_TRANSPORT || 'SMTP');
        console.log('📧 [sendEmail] EMAIL_USER configurado:', !!process.env.EMAIL_USER || !!process.env.EMAIL_USERNAME);
        console.log('📧 [sendEmail] EMAIL_PASS configurado:', !!process.env.EMAIL_PASS || !!process.env.EMAIL_PASSWORD);
        
        const transportConfig = getTransportConfig();
        console.log('📧 [sendEmail] Configuración de transporte creada:', {
            service: transportConfig.service || 'SMTP',
            host: transportConfig.host || 'Gmail',
            port: transportConfig.port,
            secure: transportConfig.secure
        });
        
        const transporter = nodemailer.createTransport({
            ...transportConfig,
            connectionTimeout: 10000, // 10 segundos
            greetingTimeout: 10000,
            socketTimeout: 10000
        });
        
        // Verificar la conexión antes de enviar
        console.log('📧 [sendEmail] Verificando conexión con el servidor de email...');
        await transporter.verify();
        console.log('✅ [sendEmail] Conexión con el servidor de email verificada exitosamente');

        const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || `"MedScan AI" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME}>`;
        console.log('📧 [sendEmail] Remitente configurado:', fromEmail);

        const mailOptions = {
            from: fromEmail,
            to,
            subject,
            text,
            html
        };

        console.log('📧 [sendEmail] Enviando email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [sendEmail] Email enviado exitosamente');
        console.log('   - MessageId:', info.messageId);
        console.log('   - Response:', info.response);
        return info;
    } catch (error) {
        console.error('❌ [sendEmail] Error detallado al enviar email:');
        console.error('   - Tipo de error:', error.constructor.name);
        console.error('   - Mensaje:', error.message);
        console.error('   - Código:', error.code);
        console.error('   - Command:', error.command);
        console.error('   - Response:', error.response);
        console.error('   - ResponseCode:', error.responseCode);
        console.error('   - Stack completo:', error.stack);
        
        // Errores específicos de nodemailer
        if (error.code === 'EAUTH') {
            console.error('   ⚠️ Error de autenticación: Verifica EMAIL_USER y EMAIL_PASS');
        } else if (error.code === 'ECONNECTION') {
            console.error('   ⚠️ Error de conexión: No se pudo conectar al servidor SMTP');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('   ⚠️ Timeout: El servidor no respondió a tiempo');
        } else if (error.code === 'EENVELOPE') {
            console.error('   ⚠️ Error de sobre: Problema con las direcciones de email');
        }
        
        throw error; // Re-lanzar el error para que el controlador lo capture
    }
};

module.exports = sendEmail;