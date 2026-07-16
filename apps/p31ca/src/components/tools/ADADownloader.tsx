import React, { useState } from 'react';
import { generateADADocument } from '../../lib/ada-assembler';

export function ADADownloader() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const doc = await generateADADocument();
      const blob = new Blob([doc], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ada-request-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ADA document:', err);
      alert('Error generating document. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', margin: '24px 0' }}>
      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          padding: '14px 36px',
          border: 'none',
          borderRadius: 8,
          background: '#cda852',
          color: '#0A0A0F',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 12,
          cursor: 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '⏳ Generating…' : '📄 Download ADA Document'}
      </button>
      <p style={{ fontSize: 10, color: 'rgba(232,230,227,0.3)', marginTop: 10 }}>
        Combines your Cognitive Passport with visitation logs into a court-ready Markdown document.
      </p>
    </div>
  );
}
