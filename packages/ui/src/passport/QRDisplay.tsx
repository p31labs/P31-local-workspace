import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export interface QRDisplayProps {
  data: string;
  size?: number;
  label?: string;
}

export function QRDisplay({ data, size = 200, label }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data, { width: size, margin: 2 }, (err) => {
      if (err) console.error('QR render error:', err);
    });
  }, [data, size]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 8 }} />
      {label && <span style={{ fontSize: 10, color: 'rgba(240,242,245,0.4)', fontFamily: 'monospace' }}>{label}</span>}
    </div>
  );
}

export default QRDisplay;
