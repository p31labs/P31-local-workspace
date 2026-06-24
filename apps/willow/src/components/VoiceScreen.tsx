import { useState } from 'react';

interface VoiceScreenProps {
  onBack: () => void;
}

export default function VoiceScreen({ onBack }: VoiceScreenProps) {
  const [recording, setRecording] = useState(false);

  return (
    <div className="screen">
      <h1>Voice Messages!</h1>
      <button onClick={onBack}>BACK</button>
      <button onClick={() => setRecording(!recording)}>
        {recording ? 'TAP TO STOP' : 'TAP TO RECORD'}
      </button>
      {recording && <span>Recording...</span>}
      <div className="effects">
        {['Normal', 'Chipmunk', 'Robot', 'Deep'].map((fx) => (
          <button key={fx}>{fx}</button>
        ))}
      </div>
      {!recording && <p>Tap the button to record a message for Dad</p>}
    </div>
  );
}
