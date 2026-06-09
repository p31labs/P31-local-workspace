import React from 'react';

const BrandLogo = ({ size = 'w-10 h-10', className = '' }) => {
  return (
    <div className={`relative ${size} ${className}`}>
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-teal-600/30 bg-teal-600/10 animate-pulse-slow"></div>
      
      {/* Middle Ring */}
      <div className="absolute inset-1 rounded-full border-2 border-lavender/40 bg-lavender/10 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      
      {/* Inner Ring */}
      <div className="absolute inset-2 rounded-full border-2 border-coral-500/40 bg-coral-500/10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      
      {/* Central Atom */}
      <div className="absolute inset-3 bg-gradient-to-br from-teal-600 via-coral-500 to-lavender rounded-full shadow-lg flex items-center justify-center">
        {/* Nucleus */}
        <div className="w-2 h-2 bg-cloud rounded-full shadow-inner"></div>
        
        {/* Electron Orbit 1 */}
        <div className="absolute w-6 h-6 border-2 border-teal-600/60 rounded-full animate-orbit-slow"></div>
        
        {/* Electron Orbit 2 */}
        <div className="absolute w-8 h-8 border-2 border-coral-500/60 rounded-full animate-orbit-fast" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Electron Orbit 3 */}
        <div className="absolute w-10 h-10 border-2 border-lavender/60 rounded-full animate-orbit-medium" style={{ animationDelay: '1s' }}></div>
        
        {/* Electrons */}
        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-teal-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit-slow"></div>
        <div className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-coral-500 rounded-full transform translate-x-1/2 translate-y-1/2 animate-orbit-fast" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute left-0 top-1/2 w-1.5 h-1.5 bg-lavender rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit-medium" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Outer Glow */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-600/20 via-coral-500/20 to-lavender/20 blur-xl"></div>
    </div>
  );
};

export default BrandLogo;