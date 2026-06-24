import { useState } from 'react';

interface FamilyScreenProps {
  onBack: () => void;
}

export function FamilyMesh() {
  return null;
}

export default function FamilyScreen({ onBack }: FamilyScreenProps) {
  const [calling, setCalling] = useState<string | null>(null);
  const contacts = ['Dad', 'Nana', 'Uncle Tony', 'Auntie'];

  const handleContact = (name: string) => {
    setCalling(name);
    localStorage.setItem('willow-last-contact', JSON.stringify({ [name]: Date.now() }));
  };

  return (
    <div className="screen">
      <h1>Family</h1>
      <button onClick={onBack}>BACK</button>
      <p>Tap someone to say hi</p>
      <div className="contacts">
        {contacts.map((name) => (
          <button
            key={name}
            className="contact-card"
            onClick={() => handleContact(name)}
          >
            <span className="avatar-letter">{name[0]}</span>
            <span>{name}</span>
            {calling === name && <span className="calling">Calling...</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
