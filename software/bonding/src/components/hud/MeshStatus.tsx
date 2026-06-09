import React, { useState, useEffect } from 'react';

export const MeshStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [spoons] = useState(12);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setQueueCount(prev => prev + 1);
      } else {
        setQueueCount(0);
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 flex flex-col items-end gap-2 font-mono text-xs z-50">
      <div className="flex items-center gap-2 bg-[#050510] border border-[#1f2937] p-2 rounded-md shadow-lg">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#00FF88] shadow-[0_0_8px_#00FF88]' : 'bg-[#EF4444] shadow-[0_0_8px_#EF4444] animate-pulse'}`} />
        <span className={isOnline ? 'text-[#00FF88]' : 'text-[#EF4444]'}>
          {isOnline ? 'DELTA MESH : CONNECTED' : 'WYE SEVERED : OFFLINE'}
        </span>
      </div>

      {!isOnline && queueCount > 0 && (
        <div className="flex items-center gap-2 bg-[#050510] border border-[#F59E0B] p-2 rounded-md">
          <span className="text-[#F59E0B]">PACKETS QUEUED: {queueCount}</span>
        </div>
      )}

      <div className="flex items-center gap-2 bg-[#050510] border border-[#1f2937] p-2 rounded-md mt-1">
        <span className="text-[#00D4FF]">SPOONS:</span>
        <div className="flex gap-1">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-4 rounded-sm transition-all duration-300 ${
                i < spoons 
                  ? 'bg-[#00D4FF] shadow-[0_0_5px_#00D4FF]' 
                  : 'bg-[#1f2937]'
              }`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeshStatus;