const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Validar que el email tenga formato válido
        if (!email || !email.includes('@')) {
            return res.status(400).json({ message: 'El formato del correo electrónico no es válido.' });
        }

        // Validación de dominios permitidos
        const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'live.com', 'yahoo.com', 'icloud.com'];
        const emailParts = email.split('@');
        
        if (emailParts.length !== 2) {
            return res.status(400).json({ message: 'El formato del correo electrónico no es válido.' });
        }

        const domain = emailParts[1].toLowerCase().trim();
        
        // Verificar si el dominio está en la lista de permitidos
        if (!allowedDomains.includes(domain)) {
            return res.status(400).json({ 
                message: `El dominio de correo electrónico "${domain}" no está permitido. Solo se permiten los siguientes dominios: ${allowedDomains.join(', ')}.` 
            });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            username,
            email,
            password
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (!user.isActive) {
                return res.status(401).json({ message: 'Account is disabled' });
            }
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.username = req.body.username || user.username;
            user.firstName = req.body.firstName !== undefined ? req.body.firstName : user.firstName;
            user.lastName = req.body.lastName !== undefined ? req.body.lastName : user.lastName;
            user.email = req.body.email || user.email;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Initiate password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        console.log('🔐 [forgotPassword] Solicitud de recuperación de contraseña recibida');
        console.log('   - Email solicitado:', email);
        console.log('   - FRONTEND_URL:', process.env.FRONTEND_URL || 'No configurado (usando localhost:3000)');
        
        const user = await User.findOne({ email });

        if (!user) {
            console.log('⚠️ [forgotPassword] Usuario no encontrado con email:', email);
            return res.status(200).json({ message: 'Si el correo existe, enviaremos instrucciones para restablecer la contraseña.' });
        }

        console.log('✅ [forgotPassword] Usuario encontrado:');
        console.log('   - ID:', user._id);
        console.log('   - Username:', user.username);
        console.log('   - Email:', user.email);
        
        console.log('🔐 [forgotPassword] Generando token de reset...');
        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });
        console.log('✅ [forgotPassword] Token de reset generado y guardado en la base de datos');

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
        console.log('🔗 [forgotPassword] URL de reset generada:', resetUrl);

        const message = `
            <p>Hola ${user.firstName || user.username},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
            <p style="text-align:center;margin:24px 0;">
                <a href="${resetUrl}" style="background-color:#0284c7;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
                    Restablecer contraseña
                </a>
            </p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo. El enlace expirará en 10 minutos.</p>
            <p>— Equipo MedScan AI</p>
        `;

        console.log('📧 [forgotPassword] Preparando envío de email...');
        await sendEmail({
            to: user.email,
            subject: 'Restablece tu contraseña - MedScan AI',
            html: message,
            text: `Visita este enlace para restablecer tu contraseña: ${resetUrl}`
        });
        console.log('✅ [forgotPassword] Email enviado exitosamente');

        res.json({ message: 'Enviamos un correo con instrucciones para restablecer tu contraseña.' });
    } catch (error) {
        console.error('❌ [forgotPassword] Error completo en el proceso de recuperación de contraseña:');
        console.error('   - Tipo de error:', error.constructor.name);
        console.error('   - Mensaje:', error.message);
        console.error('   - Código:', error.code);
        console.error('   - Stack completo:', error.stack);
        
        // Errores específicos
        if (error.code === 'EAUTH') {
            console.error('   ⚠️ Error de autenticación con el servidor de email');
        } else if (error.code === 'ECONNECTION') {
            console.error('   ⚠️ Error de conexión con el servidor de email');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('   ⚠️ Timeout al conectar con el servidor de email');
        }
        
        res.status(500).json({ 
            message: 'No pudimos procesar la solicitud. Intenta más tarde.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'La nueva contraseña es requerida.' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado.' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'No pudimos actualizar la contraseña. Intenta nuevamente.' });
    }
};