import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Signup() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
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
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Crear Cuenta</h2>
                <p className="text-slate-500 mt-2 dark:text-slate-400">Únete a NombrePagina para empezar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre</label>
                        <input type="text" required className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400" placeholder="Juan" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Apellido</label>
                        <input type="text" required className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400" placeholder="Pérez" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Correo Electrónico</label>
                    <input type="email" required className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400" placeholder="email@example.com" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Contraseña</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 pr-10" 
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
                    <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Mínimo 8 caracteres, una mayúscula y un número.</p>
                </div>

                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input id="terms" type="checkbox" required className="h-4 w-4 text-primary-600 focus:ring-primary-600 border-slate-300 rounded dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="terms" className="font-medium text-slate-700 dark:text-slate-300">Acepto los <Link to="/terms" className="text-primary-600 hover:underline dark:text-primary-400">Términos de Uso</Link> y la <Link to="/privacy" className="text-primary-600 hover:underline dark:text-primary-400">Política de Privacidad</Link></label>
                    </div>
                </div>

                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 transition-colors">
                    Registrarse
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">¿Ya tienes cuenta?</span>
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Inicia sesión</Link>
            </div>
        </div>
    </div>
  );
}
