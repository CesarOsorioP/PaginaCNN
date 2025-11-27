import React, { createContext, useContext, useState, useEffect } from 'react';

const HistoryContext = createContext();

// Datos iniciales de ejemplo
const initialMockData = [
    { id: 'PT-4829', date: '20 Nov 2025', time: '14:30', type: 'Tórax AP', result: 'Neumonía', status: 'red', confidence: '98.2%' },
    { id: 'PT-4828', date: '20 Nov 2025', time: '10:15', type: 'Tórax AP', result: 'Normal', status: 'green', confidence: '99.5%' },
    { id: 'PT-4827', date: '19 Nov 2025', time: '16:45', type: 'Tórax Lateral', result: 'Nódulo', status: 'yellow', confidence: '85.4%' },
    { id: 'PT-4826', date: '18 Nov 2025', time: '09:20', type: 'Tórax AP', result: 'Normal', status: 'green', confidence: '97.1%' },
    { id: 'PT-4825', date: '18 Nov 2025', time: '08:55', type: 'Tórax PA', result: 'Edema pulmonar', status: 'red', confidence: '92.3%' },
];

export const HistoryProvider = ({ children }) => {
  const [history, setHistory] = useState(() => {
    // Intentar cargar desde localStorage
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('medical_history_v1');
        return saved ? JSON.parse(saved) : initialMockData;
    }
    return initialMockData;
  });

  useEffect(() => {
    localStorage.setItem('medical_history_v1', JSON.stringify(history));
  }, [history]);

  const addToHistory = (newReport) => {
    // Agregar al inicio de la lista
    setHistory(prev => [newReport, ...prev]);
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => useContext(HistoryContext);

