import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export default function Landing() {
  return (
    <div className="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 font-sans">
        <Navbar />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-20 dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6 dark:text-white">
                    Diagnóstico de Radiografías<br />Potenciado por <span className="text-primary-600 dark:text-primary-400">Inteligencia Artificial</span>
                </h1>
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto dark:text-slate-300">
                    Obtén una segunda opinión instantánea y precisa. Nuestra IA analiza radiografías de tórax para detectar anomalías en segundos.
                </p>
                <div className="flex justify-center gap-4">
                    <Link to="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all">Comenzar ahora</Link>
                    <a href="#how-it-works" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-8 py-3 rounded-lg text-lg font-semibold shadow-sm hover:shadow transition-all dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700">Saber más</a>
                </div>
            </div>
        </section>

        {/* Features / AI Explanation */}
        <section id="features" className="py-16 bg-white dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Por qué elegir MedScan AI</h2>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Tecnología avanzada al servicio de la salud</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                        <span className="material-symbols-outlined text-primary-600 text-4xl mb-4 dark:text-primary-400">speed</span>
                        <h3 className="text-xl font-semibold mb-2 dark:text-white">Resultados Rápidos</h3>
                        <p className="text-slate-600 dark:text-slate-300">Análisis completo en menos de 30 segundos. Ahorra tiempo valioso en el triaje inicial.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                        <span className="material-symbols-outlined text-primary-600 text-4xl mb-4 dark:text-primary-400">security</span>
                        <h3 className="text-xl font-semibold mb-2 dark:text-white">Privacidad Total</h3>
                        <p className="text-slate-600 dark:text-slate-300">Cumplimos con estándares HIPAA/GDPR. Los datos de los pacientes están encriptados y seguros.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                        <span className="material-symbols-outlined text-primary-600 text-4xl mb-4 dark:text-primary-400">psychology</span>
                        <h3 className="text-xl font-semibold mb-2 dark:text-white">Precisión IA</h3>
                        <p className="text-slate-600 dark:text-slate-300">Entrenada con millones de imágenes validadas por radiólogos expertos para alta sensibilidad.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary-700 text-white text-center">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">¿Listo para modernizar tu diagnóstico?</h2>
                <p className="text-primary-100 text-lg mb-8">Únete a miles de profesionales médicos que ya usan MedScan AI.</p>
                <Link to="/signup" className="bg-white text-primary-700 hover:bg-primary-50 px-8 py-3 rounded-lg text-lg font-bold shadow-lg transition-colors">Crear cuenta gratuita</Link>
            </div>
        </section>

        <Footer />
    </div>
  );
}

