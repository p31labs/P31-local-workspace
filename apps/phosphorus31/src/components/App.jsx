import React, { createContext, useContext, useEffect } from 'react';
import { isDyslexic, toggleDyslexia, initDyslexiaState } from '../store/accessibility';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  useEffect(() => {
    initDyslexiaState();
  }, []);

  return React.createElement(
    AppContext.Provider,
    { value: { isDyslexic, toggleDyslexia } },
    children
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default function App({ children }) {
  return React.createElement(AppProvider, null, children);
}
