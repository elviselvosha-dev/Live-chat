import React, { createContext, useContext, useState } from 'react';

interface FreeModeContextValue {
  freeMode: boolean;
  dataSavedKb: number;
  toggleFreeMode: () => void;
  recordSavedKb: (kb: number) => void;
  recordUnlockedKb: (kb: number) => void;
}

const FreeModeContext = createContext<FreeModeContextValue | null>(null);

export const FreeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [freeMode, setFreeMode] = useState(false);
  const [dataSavedKb, setDataSavedKb] = useState(0);

  const toggleFreeMode = () => setFreeMode((prev) => !prev);
  const recordSavedKb = (kb: number) => setDataSavedKb((prev) => prev + kb);
  const recordUnlockedKb = (kb: number) => setDataSavedKb((prev) => Math.max(0, prev - kb));

  return (
    <FreeModeContext.Provider
      value={{ freeMode, dataSavedKb, toggleFreeMode, recordSavedKb, recordUnlockedKb }}
    >
      {children}
    </FreeModeContext.Provider>
  );
};

export function useFreeMode() {
  const ctx = useContext(FreeModeContext);
  if (!ctx) throw new Error('useFreeMode must be used within FreeModeProvider');
  return ctx;
}
