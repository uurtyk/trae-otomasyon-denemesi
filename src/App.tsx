import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientForm } from './pages/PatientForm';
import { Appointments } from './pages/Appointments';

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/new"
            element={
              <ProtectedRoute>
                <PatientForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id/edit"
            element={
              <ProtectedRoute>
                <PatientForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}
