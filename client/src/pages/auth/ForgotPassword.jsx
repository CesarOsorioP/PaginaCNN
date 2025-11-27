import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="bg-slate-50 flex items-center justify-center min-h-screen p-4 dark:bg-slate-900">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-4 dark:bg-slate-700">
                    <span className="material-symbols-outlined text-primary-600 dark:text-primary-400">lock_reset</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recuperar Contraseña</h2>
                <p className="text-slate-500 mt-2 text-sm dark:text-slate-400">Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.</p>
            </div>

            <form className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Correo Electrónico</label>
                    <input type="email" required className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="email@example.com" />
                </div>

                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 transition-colors">
                    Enviar Instrucciones
                </button>
            </form>

            <div className="mt-6 text-center">
                <Link to="/login" className="font-medium text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 dark:text-slate-400 dark:hover:text-white">
                    <span className="material-symbols-outlined text-base">arrow_back</span> Volver al inicio de sesión
                </Link>
            </div>
        </div>
    </div>
  );
}

