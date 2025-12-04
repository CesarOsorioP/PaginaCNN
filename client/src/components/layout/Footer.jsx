import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-2 text-primary-400 mb-4">
                            <span className="material-symbols-outlined text-2xl">medical_services</span>
                            <span className="font-bold text-lg">MedScan AI</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            Análisis de radiografías con inteligencia artificial.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4">Producto</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-primary-400 transition-colors">Inicio</Link></li>
                            <li><Link to="/demo" className="hover:text-primary-400 transition-colors">Demo interactiva</Link></li>
                            <li><Link to="/login" className="hover:text-primary-400 transition-colors">Iniciar Sesión</Link></li>
                            <li><Link to="/signup" className="hover:text-primary-400 transition-colors">Registrarse</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/privacy" className="hover:text-primary-400 transition-colors">Privacidad</Link></li>
                            <li><Link to="/terms" className="hover:text-primary-400 transition-colors">Términos</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4">Contacto</h3>
                        <p className="text-sm text-slate-400">
                            Email: info@medscan.ai<br />
                            Tel: +1 (555) 123-4567
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
                    © 2025 MedScan AI. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
}
