import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { path: '/upload', icon: 'upload_file', label: 'Nuevo Análisis' },
        { path: '/history', icon: 'history', label: 'Historial' },
        { path: '/profile', icon: 'person', label: 'Perfil' },
    ];

    // Add admin menu items if user is admin or superadmin
    if (user && (user.role === 'Admin' || user.role === 'Superadmin')) {
        menuItems.push({ path: '/users', icon: 'people', label: 'Gestionar Usuarios' });
    }

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-52 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                        <span className="material-symbols-outlined text-2xl">medical_services</span>
                        <span className="font-bold text-lg">NombrePagina</span>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen && setMobileOpen(false)}
                            className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${isActive(item.path)
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-l-4 border-cyan-600 dark:border-cyan-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <button 
                        onClick={toggleTheme}
                        className="flex items-center gap-3 px-6 py-3 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors w-full text-left mt-4"
                    >
                        <span className="material-symbols-outlined text-xl">{isDark ? 'light_mode' : 'dark_mode'}</span>
                        <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
