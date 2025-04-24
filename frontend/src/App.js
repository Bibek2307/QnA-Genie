import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import QuestionSubmission from './pages/QuestionSubmission';
import SpeakerDashboard from './pages/SpeakerDashboard';
import { DarkModeProvider } from './context/DarkModeContext';

// Protected Route component
const ProtectedRoute = ({ children, allowedRole }) => {
  const userRole = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route 
            path="/submit-question" 
            element={
              <ProtectedRoute allowedRole="listener">
                <QuestionSubmission />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/speaker-dashboard" 
            element={
              <ProtectedRoute allowedRole="speaker">
                <SpeakerDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App; 