import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './ui/Toast';
import SpaceshipEarth from './SpaceshipEarth';
import { MvpHub } from './MvpHub';
import AndromedaCommandCenter from './AndromedaCommandCenter';

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MvpHub />} />
          <Route path="/cockpit" element={<SpaceshipEarth />} />
          <Route path="/command-center" element={<AndromedaCommandCenter userId="will" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
