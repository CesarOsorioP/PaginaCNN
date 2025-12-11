import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import NavigationButtons from '../../components/NavigationButtons';

export default function UserManagement() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        role: 'User',
        isActive: true,
        password: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setMessage({ type: 'error', text: 'Error al cargar usuarios' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setIsCreating(true);
        setEditingUser(null);
        setFormData({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            role: 'User',
            isActive: true,
            password: ''
        });
        setMessage({ type: '', text: '' });
    };

    const handleEdit = (user) => {
        setEditingUser(user._id);
        setIsCreating(false);
        setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            password: ''
        });
        setMessage({ type: '', text: '' });
    };

    const handleCancel = () => {
        setEditingUser(null);
        setIsCreating(false);
        setFormData({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            role: 'User',
            isActive: true,
            password: ''
        });
        setMessage({ type: '', text: '' });
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            if (isCreating) {
                // Create new user
                const createData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    username: formData.username || `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                };

                await api.post('/users', createData);
                setMessage({ type: 'success', text: 'Usuario creado correctamente' });
                setIsCreating(false);
            } else {
                // Update existing user
                const updateData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    username: formData.username,
                    email: formData.email,
                    role: formData.role,
                    isActive: formData.isActive
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                await api.put(`/users/${editingUser}`, updateData);
                setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
                setEditingUser(null);
            }
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || `Error al ${isCreating ? 'crear' : 'actualizar'} usuario`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('¿Estás seguro de que deseas desactivar este usuario?')) {
            return;
        }

        try {
            await api.delete(`/users/${userId}`);
            setMessage({ type: 'success', text: 'Usuario desactivado correctamente' });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error al desactivar usuario'
            });
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            Superadmin: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300',
            Admin: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
            User: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[role] || colors.User}`}>
                {role}
            </span>
        );
    };

    // Check if user can manage another user
    const canManageUser = (user) => {
        if (!currentUser) return false;
        if (currentUser.role === 'Superadmin') return true;
        if (currentUser.role === 'Admin' && user.role === 'User') return true;
        return false;
    };

    const filteredUsers = users.filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (user.username && user.username.toLowerCase().includes(searchLower)) ||
            (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
            (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower)
        );
    });

    if (loading && users.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
        );
    }

    return (
        <div className="max-w-full">
            <NavigationButtons />
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Administra usuarios, roles y permisos del sistema.</p>
                </div>
                {!isCreating && !editingUser && (
                    <button
                        onClick={handleCreate}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Nuevo Usuario
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o rol..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm dark:shadow-none"
                    />
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div
                    className={`mb-6 p-4 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr className="text-left text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                                <th className="px-4 sm:px-6 py-3">Usuario</th>
                                <th className="px-4 sm:px-6 py-3">Email</th>
                                <th className="px-4 sm:px-6 py-3">Rol</th>
                                <th className="px-4 sm:px-6 py-3">Estado</th>
                                <th className="px-4 sm:px-6 py-3">Fecha Registro</th>
                                <th className="px-4 sm:px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {isCreating && (
                                <tr className="text-xs sm:text-sm">
                                    <td colSpan="6" className="px-4 sm:px-6 py-4">
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                        Nombre
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                        Apellido
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                        Usuario (opcional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                        placeholder="Se generará automáticamente"
                                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                        Contraseña
                                                    </label>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                        Rol
                                                    </label>
                                                    <select
                                                        name="role"
                                                        value={formData.role}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                        disabled={currentUser?.role === 'Admin'}
                                                    >
                                                        <option value="User">User</option>
                                                        {currentUser?.role === 'Superadmin' && (
                                                            <>
                                                                <option value="Admin">Admin</option>
                                                                <option value="Superadmin">Superadmin</option>
                                                            </>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    Crear Usuario
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancel}
                                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded text-sm font-medium transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </form>
                                    </td>
                                </tr>
                            )}
                            {filteredUsers.length === 0 && !isCreating ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const canManage = canManageUser(user);
                                    return (
                                        <tr key={user._id} className="text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            {editingUser === user._id ? (
                                            <td colSpan="6" className="px-4 sm:px-6 py-4">
                                                <form onSubmit={handleSubmit} className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                                Nombre
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="firstName"
                                                                value={formData.firstName}
                                                                onChange={handleChange}
                                                                required
                                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                                Apellido
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="lastName"
                                                                value={formData.lastName}
                                                                onChange={handleChange}
                                                                required
                                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                                Usuario
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="username"
                                                                value={formData.username}
                                                                onChange={handleChange}
                                                                required
                                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                                Email
                                                            </label>
                                                            <input
                                                                type="email"
                                                                name="email"
                                                                value={formData.email}
                                                                onChange={handleChange}
                                                                required
                                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                                Rol
                                                            </label>
                                                            <select
                                                                name="role"
                                                                value={formData.role}
                                                                onChange={handleChange}
                                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                disabled={currentUser?.role === 'Admin'}
                                                            >
                                                                <option value="User">User</option>
                                                                {currentUser?.role === 'Superadmin' && (
                                                                    <>
                                                                        <option value="Admin">Admin</option>
                                                                        <option value="Superadmin">Superadmin</option>
                                                                    </>
                                                                )}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                                                                Nueva Contraseña (opcional)
                                                            </label>
                                                            <input
                                                                type="password"
                                                                name="password"
                                                                value={formData.password}
                                                                onChange={handleChange}
                                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            name="isActive"
                                                            checked={formData.isActive}
                                                            onChange={handleChange}
                                                            id={`active-${user._id}`}
                                                            className="w-4 h-4 text-cyan-500 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-cyan-500"
                                                        />
                                                        <label htmlFor={`active-${user._id}`} className="text-xs text-slate-700 dark:text-slate-300">
                                                            Usuario activo
                                                        </label>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="submit"
                                                            disabled={loading}
                                                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            {loading ? 'Guardando...' : 'Guardar'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleCancel}
                                                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded text-sm font-medium transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </form>
                                            </td>
                                        ) : (
                                            <>
                                                <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                    {user.firstName && user.lastName 
                                                        ? `${user.firstName} ${user.lastName}`
                                                        : user.username}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-slate-500 dark:text-slate-400">{user.email}</td>
                                                <td className="px-4 sm:px-6 py-4">{getRoleBadge(user.role)}</td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    {user.isActive ? (
                                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                                                            Activo
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                                                            Inactivo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {canManage && (
                                                            <button
                                                                onClick={() => handleEdit(user)}
                                                                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300"
                                                                title="Editar"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                            </button>
                                                        )}
                                                        {canManage && user._id !== currentUser?._id && (
                                                            <button
                                                                onClick={() => handleDelete(user._id)}
                                                                className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                                                title="Desactivar"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                            </button>
                                                        )}
                                                        {!canManage && (
                                                            <span className="text-slate-400 dark:text-slate-500 text-xs">Sin permisos</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

