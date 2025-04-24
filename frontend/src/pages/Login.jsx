import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Moon, Sun, Mail, Lock, User } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('listener');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Login attempt with:', { email, role, password: '***' });
      
      const response = await api.post('/auth/login', {
        email,
        password,
        role
      });

      console.log('Login response:', {
        status: response.status,
        data: response.data,
        token: response.data.token ? 'exists' : 'missing'
      });

      if (response.data.token) {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.role);
        
        console.log('Stored in localStorage:', {
          email: localStorage.getItem('userEmail'),
          token: localStorage.getItem('token') ? 'exists' : 'missing',
          role: localStorage.getItem('userRole')
        });
        
        if (response.data.role === 'speaker') {
          navigate('/speaker-dashboard');
        } else {
          navigate('/question-submission');
        }
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card p-4`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDarkMode}
        className="fixed top-4 right-4"
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <Card className="w-full max-w-md p-8 space-y-8 backdrop-blur-sm bg-card/50 shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Q&A Genie</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to {role === 'speaker' ? 'manage your conferences' : 'ask questions'}
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={role === 'listener' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setRole('listener')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Listener
                </Button>
                <Button
                  type="button"
                  variant={role === 'speaker' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setRole('speaker')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Speaker
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Button 
            variant="link" 
            className="p-0 h-auto font-semibold"
            onClick={() => navigate('/register')}
          >
            Register here
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login; 