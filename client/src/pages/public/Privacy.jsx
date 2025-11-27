import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100 prose prose-slate prose-blue">
            <Link to="/" className="no-underline text-primary-600 font-bold mb-8 block">&larr; Volver al inicio</Link>
            
            <h1 className="text-3xl font-bold mb-4">Política de Privacidad</h1>
            <p className="text-xl text-slate-600 mb-6">La privacidad de los usuarios es nuestra prioridad.</p>

            <h3 className="text-xl font-bold mb-2">1. Recopilación de Información</h3>
            <p className="mb-4">Recopilamos información necesaria para proporcionar nuestros servicios de análisis de radiografías, incluyendo imágenes médicas anonimizadas y datos de cuenta de usuario.</p>

            <h3 className="text-xl font-bold mb-2">2. Uso de la Información</h3>
            <p className="mb-4">Las imágenes subidas son procesadas automáticamente por nuestros algoritmos y no son almacenadas permanentemente a menos que el usuario opte explícitamente por guardarlas en su historial.</p>

            <h3 className="text-xl font-bold mb-2">3. Seguridad</h3>
            <p className="mb-4">Implementamos medidas de seguridad, incluyendo encriptación en tránsito y en reposo, para proteger contra el acceso no autorizado.</p>

            <h3 className="text-xl font-bold mb-2">4. Compartir Información</h3>
            <p className="mb-4">No vendemos ni compartimos información personal con terceros, excepto cuando sea requerido por ley o para la prestación esencial del servicio (ej. proveedores de nube seguros).</p>
        </div>
    </div>
  );
}

