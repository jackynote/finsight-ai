import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModule } from '../features/auth/Auth';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return <AuthModule onLogin={(token, userData) => login(token, userData)} />;
};

export default LoginPage;
