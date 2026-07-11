import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@p31/design-system/tokens';
import '@p31/design-system/themes';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
