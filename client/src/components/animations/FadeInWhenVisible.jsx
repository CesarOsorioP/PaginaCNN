import React, { useState, useEffect, useRef } from 'react';

export default function FadeInWhenVisible({ children, delay = '0s', className = '', threshold = 0.1 }) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Si ya es visible, no hacemos nada para evitar reinicios
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target); // Dejar de observar inmediatamente
        }
      });
    }, {
      threshold: threshold, // Umbral configurable
      rootMargin: '0px 0px -50px 0px' // Margen para disparar un poco antes
    });

    const { current } = domRef;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [threshold]);

  return (
    <div
      ref={domRef}
      // Usamos clases condicionales más limpias. Si es visible, aplica la animación.
      // Si no, mantiene opacidad 0 y desplazamiento.
      className={`${className} ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}
