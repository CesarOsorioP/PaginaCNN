import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Landing from './pages/public/Landing';
import Privacy from './pages/public/Privacy';
import Terms from './pages/public/Terms';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/dashboard/Profile';
import Upload from './pages/dashboard/Upload';
import Report from './pages/dashboard/Report';
import UploadSuccess from './pages/dashboard/UploadSuccess';
import UploadError from './pages/dashboard/UploadError';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Dashboard Routes (Protected in real app) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/report" element={<Navigate to="/report/1" replace />} />
          </Route>
          
           {/* Standalone Dashboard Pages (Full screen but part of flow) */}
           <Route path="/upload-success" element={<UploadSuccess />} />
           <Route path="/upload-error" element={<UploadError />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
