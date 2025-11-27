import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100 prose prose-slate prose-blue">
            <Link to="/" className="no-underline text-primary-600 font-bold mb-8 block">&larr; Volver al inicio</Link>
            
            <h1 className="text-3xl font-bold mb-4">Términos de Uso</h1>
            <p className="text-xl text-slate-600 mb-6">Última actualización: 20 de Noviembre, 2025</p>

            <h3 className="text-xl font-bold mb-2">1. Aceptación de los Términos</h3>
            <p className="mb-4">Al acceder y utilizar nombrePagina, usted acepta estar sujeto a estos Términos de Uso y a nuestra Política de Privacidad.</p>

            <h3 className="text-xl font-bold mb-2">2. Uso del Servicio</h3>
            <p className="mb-4">nombrePagina es una herramienta de apoyo al diagnóstico. <strong>No sustituye el juicio profesional de un médico.</strong> Los resultados generados por la IA deben ser validados por un profesional de la salud cualificado.</p>

            <h3 className="text-xl font-bold mb-2">3. Responsabilidad</h3>
            <p className="mb-4">nombrePagina no se hace responsable de decisiones médicas tomadas basándose únicamente en los resultados de este software. El usuario asume toda la responsabilidad por el uso de la información proporcionada.</p>

            <h3 className="text-xl font-bold mb-2">4. Privacidad de Datos</h3>
            <p className="mb-4">Nos comprometemos a proteger la privacidad de los datos de los pacientes. Consulte nuestra Política de Privacidad para más detalles.</p>
        </div>
    </div>
  );
}

