
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import DocumentsPage from '@/pages/DocumentsPage';
import CredentialsPage from '@/pages/CredentialsPage';
import TasksPage from '@/pages/TasksPage';
import GpaCalculatorPage from '@/pages/GpaCalculatorPage';
import CvBuilderPage from '@/pages/CvBuilderPage'; 
import TimetablePage from '@/pages/TimetablePage';
import NotFoundPage from '@/pages/NotFoundPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react'; 
import { useTheme } from '@/contexts/ThemeContext';

const AppRoutes = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { theme } = useTheme(); // Access theme for potential conditional rendering if needed

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/credentials" 
            element={
              <ProtectedRoute>
                <CredentialsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gpa-calculator" 
            element={
              <ProtectedRoute>
                <GpaCalculatorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cv-builder" 
            element={
              <ProtectedRoute>
                <CvBuilderPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <TimetablePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}


const App = () => {
  return <AppRoutes />;
};

export default App;
