import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Login() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock auth logic
    navigate('/dashboard');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="bg-slate-50 flex items-center justify-center min-h-screen p-4 dark:bg-slate-900 relative">
        <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                     <span className="material-symbols-outlined text-primary-600 text-4xl dark:text-primary-400">radiology</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Iniciar Sesión</h2>
                <p className="text-slate-500 mt-2 dark:text-slate-400">Accede a tu portal de análisis seguro</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Correo Electrónico / Usuario</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 text-xl">person</span>
                        </div>
                        <input type="email" required className="block w-full pl-10 rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400" placeholder="Ingresa tu correo" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Contraseña</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 text-xl">lock</span>
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            className="block w-full pl-10 pr-10 rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400" 
                            placeholder="••••••••" 
                        />
                        <div 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            onClick={togglePasswordVisibility}
                        >
                            <span className="material-symbols-outlined text-xl">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input id="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-600 border-slate-300 rounded dark:bg-slate-700 dark:border-slate-600" />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Recordarme</label>
                    </div>
                    <div className="text-sm">
                        <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">¿Olvidaste tu contraseña?</Link>
                    </div>
                </div>

                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 transition-colors">
                    Iniciar Sesión
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">¿No tienes cuenta?</span>
                <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Regístrate gratis</Link>
            </div>
        </div>
    </div>
  );
}
