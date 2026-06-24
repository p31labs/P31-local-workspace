interface DrawScreenProps {
  onBack: () => void;
}

export default function DrawScreen({ onBack }: DrawScreenProps) {
  return (
    <div className="screen">
      <h1>Draw a Picture</h1>
      <button onClick={onBack}>BACK</button>
      <canvas width="300" height="300" data-testid="draw-canvas" />
    </div>
  );
}
