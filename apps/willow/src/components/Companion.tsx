interface CompanionProps {
  onClose: () => void;
}

export default function Companion({ onClose }: CompanionProps) {
  return (
    <div className="companion-overlay">
      <button onClick={onClose}>Close</button>
      <h2>Hi, I'm your companion!</h2>
    </div>
  );
}
