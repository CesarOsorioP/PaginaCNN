import React from 'react';

export default function Profile() {
  return (
    <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6 dark:text-white">Configuración de Perfil</h1>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 max-w-3xl dark:bg-slate-800 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Información Personal</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Actualiza tus datos y preferencias.</p>
            </div>
            
            <form className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre</label>
                        <input type="text" defaultValue="Juan" className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Apellido</label>
                        <input type="text" defaultValue="Pérez" className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Correo Electrónico</label>
                    <input type="email" defaultValue="email@example.com" className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <h3 className="text-md font-bold text-slate-900 mb-4 dark:text-white">Seguridad</h3>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nueva Contraseña</label>
                        <input type="password" placeholder="Dejar en blanco para mantener la actual" className="w-full rounded-lg border-slate-300 focus:border-primary-600 focus:ring-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">Guardar Cambios</button>
                </div>
            </form>
        </div>
    </div>
  );
}

