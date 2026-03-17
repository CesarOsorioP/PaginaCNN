import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import FadeInWhenVisible from '../../components/animations/FadeInWhenVisible';
import { useAuth } from '../../context/AuthContext';

export default function Landing() {
    const { isAuthenticated } = useAuth();

    const techs = [
        { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
        { name: 'Tailwind CSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
        { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
        { name: 'Kaggle', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kaggle/kaggle-original.svg' },
        { name: 'TensorFlow', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg' },
        { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
        { name: 'Express', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg' },
        { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
    ];

    const duplicatedTechs = [...techs, ...techs, ...techs, ...techs];

    const analyzedClasses = [
        { name: 'Neumonía', description: 'Infección pulmonar inflamatoria', colorClass: 'blue' },
        { name: 'COVID-19', description: 'Patrones virales característicos', colorClass: 'rose' },
        { name: 'Tuberculosis', description: 'Infección bacteriana crónica', colorClass: 'amber' },
        { name: 'Nódulo', description: 'Crecimiento anormal de tejido', colorClass: 'emerald' },
        { name: 'Masa', description: 'Lesión mayor a 3 cm', colorClass: 'purple' },
        { name: 'Atelectasia', description: 'Colapso parcial del pulmón', colorClass: 'cyan' },
        { name: 'Edema', description: 'Acumulación de líquido', colorClass: 'indigo' },
        { name: 'Normal', description: 'Sin hallazgos patológicos', colorClass: 'green' }
    ];

    const getColorClasses = (color) => {
        const classes = {
            blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'hover:border-blue-300 dark:hover:border-blue-700', shadow: 'hover:shadow-blue-500/20', icon: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500/5 dark:from-blue-500/10' },
            rose: { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'hover:border-rose-300 dark:hover:border-rose-700', shadow: 'hover:shadow-rose-500/20', icon: 'text-rose-600 dark:text-rose-400', gradient: 'from-rose-500/5 dark:from-rose-500/10' },
            amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'hover:border-amber-300 dark:hover:border-amber-700', shadow: 'hover:shadow-amber-500/20', icon: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500/5 dark:from-amber-500/10' },
            emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'hover:border-emerald-300 dark:hover:border-emerald-700', shadow: 'hover:shadow-emerald-500/20', icon: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500/5 dark:from-emerald-500/10' },
            purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'hover:border-purple-300 dark:hover:border-purple-700', shadow: 'hover:shadow-purple-500/20', icon: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500/5 dark:from-purple-500/10' },
            cyan: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'hover:border-cyan-300 dark:hover:border-cyan-700', shadow: 'hover:shadow-cyan-500/20', icon: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-500/5 dark:from-cyan-500/10' },
            indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'hover:border-indigo-300 dark:hover:border-indigo-700', shadow: 'hover:shadow-indigo-500/20', icon: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-500/5 dark:from-indigo-500/10' },
            green: { bg: 'bg-green-50 dark:bg-green-500/10', border: 'hover:border-green-300 dark:hover:border-green-700', shadow: 'hover:shadow-green-500/20', icon: 'text-green-600 dark:text-green-400', gradient: 'from-green-500/5 dark:from-green-500/10' },
        };
        return classes[color];
    };

    return (
        <div className="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 font-sans overflow-x-hidden min-h-screen flex flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-b from-primary-50 via-white to-white pt-32 pb-20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl dark:bg-primary-900/20"></div>
                    <div className="absolute bottom-0 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl dark:bg-blue-900/20"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                    <FadeInWhenVisible delay="0.1s">

                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 dark:text-white leading-tight mt-8">
                            Diagnóstico de Radiografías<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-500 dark:from-primary-400 dark:to-blue-300">
                                Potenciado por IA
                            </span>
                        </h1>
                        <p className="text-xl sm:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto dark:text-slate-300 leading-relaxed">
                            Obtén una segunda opinión instantánea y precisa. Nuestra tecnología detecta anomalías pulmonares en segundos para apoyar tu decisión médica.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
                            {isAuthenticated ? (
                                <Link to="/dashboard" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                                    Ir al Dashboard <span className="material-symbols-outlined ml-2">dashboard</span>
                                </Link>
                            ) : (
                                <Link to="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                                    Comenzar ahora <span className="material-symbols-outlined ml-2">arrow_forward</span>
                                </Link>
                            )}
                            <a href="#features" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl text-lg font-bold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700 flex items-center justify-center">
                                <span className="material-symbols-outlined mr-2">play_circle</span> Saber más
                            </a>
                            <Link to="/demo" className="bg-slate-900 text-white border border-slate-200/50 px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-slate-900/40 hover:-translate-y-1 transition-all duration-300 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 flex items-center justify-center">
                                Ver demo en vivo
                                <span className="material-symbols-outlined ml-2">neurology</span>
                            </Link>
                        </div>
                    </FadeInWhenVisible>
                </div>
            </section>

            {/* Features / AI Explanation */}
            <section id="features" className="py-24 bg-white dark:bg-slate-900 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeInWhenVisible>
                        <div className="text-center mb-20">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Por qué elegir MedScan AI</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                Combinamos la experiencia médica con la potencia del aprendizaje profundo para ofrecer resultados en los que puedes confiar.
                            </p>
                        </div>
                    </FadeInWhenVisible>

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                        {[
                            { icon: 'speed', title: 'Resultados Rápidos', desc: 'Análisis completo en menos de 30 segundos. Ahorra tiempo valioso en el triaje inicial.', delay: '0s', colorClass: 'cyan' },
                            { icon: 'security', title: 'Privacidad Total', desc: 'Los datos de los pacientes están encriptados de extremo a extremo.', delay: '0.2s', colorClass: 'blue' },
                            { icon: 'psychology', title: 'Precisión IA', desc: 'Entrenada con miles de imágenes validadas por radiólogos expertos para alta sensibilidad.', delay: '0.4s', colorClass: 'indigo' }
                        ].map((feature, idx) => {
                            const styles = getColorClasses(feature.colorClass);
                            return (
                                <FadeInWhenVisible key={idx} delay={feature.delay} className="h-full">
                                    <div className={`group h-full relative rounded-3xl border border-slate-200 dark:border-slate-800/80 p-8 bg-white dark:bg-slate-800 hover:-translate-y-2 hover:shadow-xl ${styles.shadow} ${styles.border} transition-all duration-300 overflow-hidden flex flex-col`}>
                                        {/* Background hover gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                        
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${styles.bg} group-hover:scale-110 transition-transform duration-300 mb-6 shadow-sm`}>
                                                <span className={`material-symbols-outlined text-3xl ${styles.icon}`}>{feature.icon}</span>
                                            </div>
                                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">{feature.title}</h3>
                                            <p className="text-slate-600 leading-relaxed dark:text-slate-400">{feature.desc}</p>
                                        </div>
                                    </div>
                                </FadeInWhenVisible>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Analyzed classes */}
            <section className="py-20 bg-slate-50 dark:bg-slate-800/50 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeInWhenVisible>
                        <div className="text-center mb-12">
                            <p className="text-sm font-semibold text-cyan-300 uppercase tracking-widest">Cobertura diagnóstica</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-3">Clases que analizamos con IA</h2>
                            <p className="text-slate-600 dark:text-slate-400 mt-3 max-w-3xl mx-auto">
                                Nuestros modelos están entrenados para detectar las patologías torácicas más frecuentes y urgentes. Cada clase se valida con radiólogos y se muestra con explicabilidad visual.
                            </p>
                        </div>
                    </FadeInWhenVisible>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {analyzedClasses.map((item, idx) => {
                            const styles = getColorClasses(item.colorClass);
                            return (
                                <FadeInWhenVisible key={item.name} delay={`${idx * 0.05}s`} className="h-full">
                                    <div className={`group h-full relative rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 bg-white dark:bg-slate-800 hover:-translate-y-2 hover:shadow-xl ${styles.shadow} ${styles.border} transition-all duration-300 overflow-hidden flex flex-col`}>
                                        {/* Background hover gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">{item.name}</h3>
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.bg} group-hover:scale-110 transition-transform duration-300`}>
                                                    <span className={`material-symbols-outlined ${styles.icon}`}>radiology</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                </FadeInWhenVisible>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Tech Stack Carousel */}

            {/* Tech Stack Carousel */}
            <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
                    <FadeInWhenVisible>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Tecnología de Vanguardia</p>
                    </FadeInWhenVisible>
                </div>

                {/* Contenedor del Carrusel Infinito */}
                <div className="relative w-full flex overflow-hidden mask-image-gradient group">
                    <div className="flex animate-scroll whitespace-nowrap hover:pause items-center">
                        {duplicatedTechs.map((tech, idx) => (
                            <div key={idx} className="mx-12 flex flex-col items-center justify-center cursor-default transition-transform hover:scale-110 duration-300">
                                <div className="w-16 h-16 mb-4 flex items-center justify-center opacity-70 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                                    <img src={tech.icon} alt={tech.name} className="w-full h-full object-contain" />
                                </div>
                                <span className="text-slate-500 font-medium text-sm dark:text-slate-400">{tech.name}</span>
                            </div>
                        ))}
                    </div>
                    {/* Shadow gradients for fading edges */}
                    <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-primary-700 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <FadeInWhenVisible>
                    <div className="relative max-w-4xl mx-auto px-4">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">¿Listo para modernizar tu diagnóstico?</h2>
                        <p className="text-primary-100 text-xl mb-10 max-w-2xl mx-auto font-light">Únete a la revolución de la salud digital hoy mismo.</p>
                        {isAuthenticated ? (
                            <Link to="/upload" className="bg-white text-primary-700 hover:bg-primary-50 px-10 py-4 rounded-xl text-lg font-bold shadow-xl transition-transform hover:-translate-y-1 inline-flex items-center">
                                Analizar radiografía
                                <span className="material-symbols-outlined ml-2">radiology</span>
                            </Link>
                        ) : (
                            <Link to="/signup" className="bg-white text-primary-700 hover:bg-primary-50 px-10 py-4 rounded-xl text-lg font-bold shadow-xl transition-transform hover:-translate-y-1 inline-flex items-center">
                                Crear cuenta gratuita
                            </Link>
                        )}
                    </div>
                </FadeInWhenVisible>
            </section>

            <Footer />
        </div>
    );
}
