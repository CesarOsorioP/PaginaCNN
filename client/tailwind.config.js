/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 
          DEFAULT: '#0284c7', 
          50: '#f0f9ff', 
          100: '#e0f2fe', 
          600: '#0284c7', 
          700: '#0369a1', 
          800: '#075985', 
          900: '#0c4a6e' 
        },
        secondary: { 
          DEFAULT: '#64748b', 
          50: '#f8fafc', 
          100: '#f1f5f9', 
          900: '#0f172a' 
        },
      },
      fontFamily: { 
        sans: ['Manrope', 'sans-serif'] 
      },
      animation: {
        // Más suave: duración 1s y curva cubic-bezier más natural
        'fade-in-up': 'fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'scroll': 'scroll 30s linear infinite', // Un poco más lento para leer mejor
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' }, // Mayor desplazamiento inicial
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
