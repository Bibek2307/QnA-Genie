import React, { useState } from "react"
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Eye, EyeOff } from 'lucide-react'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { useDarkMode } from '../context/DarkModeContext'
import api from '../utils/api'

const ConferenceIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    className="w-8 h-8 text-purple-600 dark:text-purple-400"
    fill="currentColor"
  >
    <path d="M19 3H5C3.89 3 3 3.89 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
    <path d="M12 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    <path d="M17 15v2H7v-2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2z"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'listener'
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      
      console.log(`${isLogin ? 'Login' : 'Registration'} attempt with:`, { 
        email: formData.email, 
        role: formData.role, 
        password: '***' 
      });
      
      const response = await api.post(endpoint, {
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (isLogin) {
        // Handle login success
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.role);
        
        // Navigate based on role
        if (response.data.role === 'speaker') {
          navigate('/speaker-dashboard');
        } else {
          navigate('/submit-question');
        }
      } else {
        // Handle registration success
        setError('');
        setIsLogin(true); // Switch to login form
        setFormData(prev => ({
          ...prev,
          password: '' // Clear password but keep email and role
        }));
        alert('Registration successful! Please login with your credentials.');
      }

    } catch (error) {
      console.error(`${isLogin ? 'Login' : 'Registration'} error details:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      role: 'listener'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900">
      <div className="absolute inset-0 bg-grid-slate-200/[0.2] bg-[size:20px_20px] dark:bg-grid-slate-700/[0.2]" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/[0.03] to-purple-500/[0.07] dark:from-purple-500/0 dark:via-purple-500/[0.02] dark:to-purple-500/[0.05]" />
      <Card className="w-full max-w-md relative shadow-xl backdrop-blur-[2px] bg-white/80 dark:bg-gray-950/80 border-white/20">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ConferenceIcon />
              <CardTitle className="text-2xl font-bold bg-gradient-to-br from-purple-600 to-purple-900 bg-clip-text text-transparent dark:from-purple-500 dark:to-purple-200">
                Q&A Genie
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </Button>
          </div>
          <CardDescription>
            {isLogin 
              ? 'Enter your credentials to access your account' 
              : 'Fill in your details to create an account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                required
              >
                <option value="listener">Conference Listener</option>
                <option value="speaker">Conference Speaker</option>
              </select>
            </div>
            <Button type="submit" className="w-full">
              {isLogin ? 'Sign in' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="w-full text-center text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={switchMode}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 