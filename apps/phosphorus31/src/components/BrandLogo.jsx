import React from 'react';

const BrandLogo = ({ size = 'w-10 h-10', className = '' }) => {
  return (
    <div className={`relative ${size} ${className}`}>
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-quantum-cyan/30 bg-quantum-cyan/10 animate-pulse-slow"></div>
      
      {/* Middle Ring */}
      <div className="absolute inset-1 rounded-full border-2 border-quantum-violet/40 bg-quantum-violet/10 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      
      {/* Inner Ring */}
      <div className="absolute inset-2 rounded-full border-2 border-quantum-red/40 bg-quantum-red/10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      
      {/* Central Atom */}
      <div className="absolute inset-3 bg-gradient-to-br from-quantum-cyan via-quantum-red to-quantum-violet rounded-full shadow-lg flex items-center justify-center">
        {/* Nucleus */}
        <div className="w-2 h-2 bg-void rounded-full shadow-inner"></div>
        
        {/* Electron Orbit 1 */}
        <div className="absolute w-6 h-6 border-2 border-quantum-cyan/60 rounded-full animate-orbit-slow"></div>
        
        {/* Electron Orbit 2 */}
        <div className="absolute w-8 h-8 border-2 border-quantum-red/60 rounded-full animate-orbit-fast" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Electron Orbit 3 */}
        <div className="absolute w-10 h-10 border-2 border-quantum-violet/60 rounded-full animate-orbit-medium" style={{ animationDelay: '1s' }}></div>
        
        {/* Electrons */}
        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-quantum-cyan rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit-slow"></div>
        <div className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-quantum-red rounded-full transform translate-x-1/2 translate-y-1/2 animate-orbit-fast" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute left-0 top-1/2 w-1.5 h-1.5 bg-quantum-violet rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit-medium" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Outer Glow */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-quantum-cyan/20 via-quantum-red/20 to-quantum-violet/20 blur-xl"></div>
    </div>
  );
};

export default BrandLogo;