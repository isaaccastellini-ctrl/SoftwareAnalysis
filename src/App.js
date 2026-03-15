import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

function App() {
  const [isRegistering, setIsRegistering] = useState(false);

  if (isRegistering) {
    return (
      <Register 
        onSwitch={() => setIsRegistering(false)} 
        onRegisterSuccess={() => setIsRegistering(false)} 
      />
    );
  }

  return (
    <Login 
      onLogin={(userData) => {
        console.log("Usuário logado:", userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }} 
      onSwitch={() => setIsRegistering(true)} 
    />
  );
}

export default App;