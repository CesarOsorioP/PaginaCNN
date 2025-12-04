import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (password !== confirmPassword) {
            setMessage('Las contraseñas no coinciden.');
            setIsError(true);
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post(`/auth/reset-password/${token}`, { password });
            setMessage(data.message);
            setTimeout(() => navigate('/login'), 1800);
        } catch (error) {
            setIsError(true);
            setMessage(error.response?.data?.message || 'No pudimos actualizar la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 flex items-center justify-center min-h-screen p-4 dark:bg-slate-900">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-4 dark:bg-slate-700">
                        <span className="material-symbols-outlined text-primary-600 dark:text-primary-400">password</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Crear nueva contraseña</h2>
                    <p className="text-slate-500 mt-2 text-sm dark:text-slate-400">
                        Escribe una contraseña segura para tu cuenta MedScan AI.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nueva contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Confirmar contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="Repite tu contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {message && (
                        <div
                            className={`text-sm p-3 rounded-lg border ${isError
                                    ? 'bg-red-500/10 border-red-500 text-red-200'
                                    : 'bg-green-500/10 border-green-500 text-green-200'
                                }`}
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Guardando...' : 'Actualizar contraseña'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="font-medium text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 dark:text-slate-400 dark:hover:text-white"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span> Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}

