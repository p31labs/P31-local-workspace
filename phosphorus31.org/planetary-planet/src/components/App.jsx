import React, { useState, useEffect } from 'react';

const App = ({ children }) => {
  const [currentView, setView] = useState('home');
  const [isDyslexic, setIsDyslexic] = useState(false);

  // Handle the physical rendering toggle for neurodivergent readability
  useEffect(() => {
    if (isDyslexic) {
      document.body.classList.add('dyslexia-mode');
    } else {
      document.body.classList.remove('dyslexia-mode');
    }
  }, [isDyslexic]);

  const toggleDyslexia = () => setIsDyslexic(!isDyslexic);

  return (
    <div>
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          currentView, 
          setView, 
          isDyslexic, 
          toggleDyslexia 
        })
      )}
    </div>
  );
};

export default App;