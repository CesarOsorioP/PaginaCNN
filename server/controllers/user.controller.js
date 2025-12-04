const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        let users;
        // Superadmin can see all users, Admin can only see regular users
        if (req.user.role === 'Superadmin') {
            users = await User.find({});
        } else if (req.user.role === 'Admin') {
            users = await User.find({ role: 'User' });
        } else {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role, firstName, lastName } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Admin can only create regular users, Superadmin can create any role
        let allowedRole = role || 'User';
        if (req.user.role === 'Admin' && allowedRole !== 'User') {
            return res.status(403).json({ message: 'Admins can only create regular users' });
        }

        const user = await User.create({
            username,
            email,
            password,
            role: allowedRole,
            firstName,
            lastName
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Admin can only update regular users, Superadmin can update anyone
        if (req.user.role === 'Admin' && user.role !== 'User') {
            return res.status(403).json({ message: 'Admins can only update regular users' });
        }

        // Prevent Admin from changing role to Admin or Superadmin
        if (req.user.role === 'Admin' && req.body.role && req.body.role !== 'User') {
            return res.status(403).json({ message: 'Admins cannot assign admin roles' });
        }

        user.username = req.body.username || user.username;
        user.firstName = req.body.firstName !== undefined ? req.body.firstName : user.firstName;
        user.lastName = req.body.lastName !== undefined ? req.body.lastName : user.lastName;
        user.email = req.body.email || user.email;
        
        // Only Superadmin can change roles
        if (req.user.role === 'Superadmin' && req.body.role) {
            user.role = req.body.role;
        }
        
        user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

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
            role: updatedUser.role,
            isActive: updatedUser.isActive
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user (Logical delete or physical?)
// Req says "eliminarlas lógicamente" (logical delete) but also "desactivar".
// We already have isActive. Let's assume delete means setting isActive to false or a separate deleted flag.
// But usually "delete" in admin panel might mean hard delete or soft delete.
// Let's implement soft delete via isActive for now, or if they want explicit delete, we can add isDeleted.
// The requirement says "desactivar cuentas... y eliminarlas lógicamente".
// So we probably need two states or just one. Let's add isDeleted to schema if needed, or just use isActive.
// Actually, let's add `isDeleted` to User model or just use `isActive` for deactivation and maybe `isDeleted` for logical deletion.
// For simplicity, I will implement a delete endpoint that sets `isActive` to false (deactivate) or maybe I should add a real `isDeleted` field.
// Let's stick to `isActive` for deactivation. For logical delete, I'll add `isDeleted` to the schema in a separate step if I was strict, but for now let's just use `isActive` as the main switch.
// Wait, "desactivar" AND "eliminar lógicamente" implies two different actions.
// "Desactivar" -> User exists but can't login.
// "Eliminar" -> User shouldn't appear in normal lists?
// I'll add `isDeleted` to the schema.

// @desc    Delete user (Logical delete)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Admin can only delete regular users, Superadmin can delete anyone
        if (req.user.role === 'Admin' && user.role !== 'User') {
            return res.status(403).json({ message: 'Admins can only delete regular users' });
        }

        // Logical delete: set isActive to false
        user.isActive = false;
        await user.save();
        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
