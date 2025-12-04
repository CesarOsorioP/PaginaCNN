import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const username = `${formData.firstName} ${formData.lastName}`;
            await register(username, formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 flex items-center justify-center min-h-screen p-4 dark:bg-slate-900 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl dark:bg-primary-900/10 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl dark:bg-blue-900/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <button 
                onClick={toggleTheme} 
                className="absolute top-4 right-4 p-2 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-110 z-10"
            >
                <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 relative z-10 transform transition-all duration-500 animate-fade-in">
                <div className="text-center mb-8 animate-slide-down">
                    <div className="flex justify-center mb-4 transform transition-transform duration-300 hover:scale-110">
                        <span className="material-symbols-outlined text-primary-600 text-5xl dark:text-primary-400">person_add</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Crear Cuenta</h2>
                    <p className="text-slate-500 dark:text-slate-400">Únete a MedScan AI para empezar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative dark:bg-red-900/30 dark:border-red-700 dark:text-red-200 animate-shake" role="alert">
                            <span className="block sm:inline flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Nombre</label>
                            <div className="relative rounded-lg shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-50">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                                </div>
                                <input
                                    type="text"
                                    name="firstName"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 transition-all duration-300"
                                    placeholder="Juan"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Apellido</label>
                            <div className="relative rounded-lg shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-50">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                                </div>
                                <input
                                    type="text"
                                    name="lastName"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 transition-all duration-300"
                                    placeholder="Pérez"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Correo Electrónico</label>
                        <div className="relative rounded-lg shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-50">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 text-xl">email</span>
                            </div>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 transition-all duration-300"
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Contraseña</label>
                        <div className="relative rounded-lg shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-50">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 text-xl">lock</span>
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 transition-all duration-300"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 dark:text-slate-400">Mínimo 8 caracteres, una mayúscula y un número.</p>
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input 
                                    id="terms" 
                                    type="checkbox" 
                                    required 
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-600 border-slate-300 rounded dark:bg-slate-700 dark:border-slate-600" 
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="terms" className="font-medium text-slate-700 dark:text-slate-300">
                                    Acepto los{' '}
                                    <Link to="/terms" className="text-primary-600 hover:underline dark:text-primary-400">
                                        Términos de Uso
                                    </Link>
                                    {' '}y la{' '}
                                    <Link to="/privacy" className="text-primary-600 hover:underline dark:text-primary-400">
                                        Política de Privacidad
                                    </Link>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
                        <button
                            type="submit"
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    Crear Cuenta
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">¿Ya tienes cuenta?</span>
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Inicia sesión</Link>
                </div>
            </div>
        </div>
    );
}
