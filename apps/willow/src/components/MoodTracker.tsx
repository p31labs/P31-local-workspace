interface MoodTrackerProps {
  onBack: () => void;
}

export default function MoodTracker({ onBack }: MoodTrackerProps) {
  return (
    <div className="screen">
      <h1>How are you feeling?</h1>
      <button onClick={onBack}>BACK</button>
      <div className="mood-options">
        {['Happy', 'Calm', 'Tired', 'Silly'].map((mood) => (
          <button key={mood}>{mood}</button>
        ))}
      </div>
    </div>
  );
}
