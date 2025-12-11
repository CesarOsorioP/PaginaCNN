const nodemailer = require('nodemailer');

const getTransportConfig = () => {
    const emailUser = process.env.EMAIL_USER || process.env.EMAIL_USERNAME;
    const emailHost = process.env.EMAIL_HOST;
    
    // Detectar Gmail automáticamente si:
    // 1. EMAIL_TRANSPORT está configurado como 'gmail'
    // 2. EMAIL_HOST es smtp.gmail.com
    // 3. El email del usuario termina en @gmail.com
    const isGmail = process.env.EMAIL_TRANSPORT === 'gmail' || 
                   emailHost === 'smtp.gmail.com' ||
                   (emailUser && emailUser.toLowerCase().includes('@gmail.com'));
    
    if (isGmail) {
        console.log('📧 [getTransportConfig] Detectado Gmail, usando servicio "gmail"');
        return {
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
            }
        };
    }

    return {
        host: emailHost,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: emailUser,
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
        
        // Configuración optimizada para entornos cloud como Render
        const transporterConfig = {
            ...transportConfig,
            connectionTimeout: 60000, // 60 segundos (aumentado para Render)
            greetingTimeout: 30000,   // 30 segundos
            socketTimeout: 60000,     // 60 segundos
        };
        
        // Configuraciones adicionales para Gmail
        if (transportConfig.service === 'gmail') {
            transporterConfig.pool = true;
            transporterConfig.maxConnections = 1;
            transporterConfig.maxMessages = 3;
            // Usar TLS explícito para mejor compatibilidad
            transporterConfig.requireTLS = true;
        } else {
            // Para SMTP directo, agregar opciones de TLS
            transporterConfig.requireTLS = !transportConfig.secure;
            transporterConfig.tls = {
                rejectUnauthorized: false // Permitir certificados autofirmados si es necesario
            };
        }
        
        const transporter = nodemailer.createTransport(transporterConfig);
        
        // Verificar la conexión antes de enviar (con timeout más largo)
        console.log('📧 [sendEmail] Verificando conexión con el servidor de email...');
        console.log('📧 [sendEmail] Timeouts configurados:', {
            connection: transporterConfig.connectionTimeout,
            greeting: transporterConfig.greetingTimeout,
            socket: transporterConfig.socketTimeout
        });
        
        // Intentar verificar con un timeout personalizado
        const verifyPromise = transporter.verify();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Verification timeout after 60 seconds')), 60000)
        );
        
        await Promise.race([verifyPromise, timeoutPromise]);
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
            console.error('   💡 Render puede estar bloqueando conexiones salientes a Gmail');
            console.error('   💡 Considera usar un servicio de email de terceros (SendGrid, Mailgun, Resend)');
            console.error('   💡 O verifica las restricciones de red de Render');
        } else if (error.code === 'EENVELOPE') {
            console.error('   ⚠️ Error de sobre: Problema con las direcciones de email');
        }
        
        throw error; // Re-lanzar el error para que el controlador lo capture
    }
};

module.exports = sendEmail;