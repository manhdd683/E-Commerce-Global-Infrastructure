import React, { useState } from 'react';
import LoginForm from '../../components/Common/Auth/LoginForm';
import RegisterForm from '../../components/Common/Auth/RegisterForm';

const AuthPage = () => {
  const [currentView, setCurrentView] = useState('login');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {currentView === 'login' ? (
        <LoginForm onSwitchToRegister={() => setCurrentView('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setCurrentView('login')} />
      )}
    </div>
  );
};

export default AuthPage;