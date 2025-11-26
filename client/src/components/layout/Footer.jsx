import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
            <div>
                <div className="flex items-center text-white mb-4">
                    <span className="material-symbols-outlined text-2xl mr-2">radiology</span>
                    <span className="font-bold text-lg">MedScan AI</span>
                </div>
                <p className="text-sm text-slate-400">Tecnología avanzada para el cuidado de la salud.</p>
            </div>
            <div>
                <h4 className="text-white font-semibold mb-4">Producto</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link to="#" className="hover:text-white">Características</Link></li>
                    <li><Link to="#" className="hover:text-white">Precios</Link></li>
                    <li><Link to="#" className="hover:text-white">API</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link to="/privacy" className="hover:text-white">Privacidad</Link></li>
                    <li><Link to="/terms" className="hover:text-white">Términos</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-semibold mb-4">Contacto</h4>
                <ul className="space-y-2 text-sm">
                    <li>soporte@medscan.ai</li>
                    <li>+1 234 567 890</li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            &copy; 2024 MedScan AI. Todos los derechos reservados.
        </div>
    </footer>
  );
}

