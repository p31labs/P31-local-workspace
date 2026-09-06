import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CageApp } from './CageApp';
const root = document.getElementById('root');
if (!root)
    throw new Error('Root missing');
createRoot(root).render(_jsx(StrictMode, { children: _jsx(CageApp, {}) }));
//# sourceMappingURL=main.js.map