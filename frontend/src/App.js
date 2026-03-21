
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/common/NewLandingPage';
import LoginPage from './components/auth/LoginPage';
import ResetPassword from './components/auth/ResetPassword';
import GoogleOAuthSuccess from './components/auth/GoogleOAuthSuccess';
import GoogleSignupConfirmation from './components/auth/GoogleSignupConfirmation';
import UserDashboard from './components/user/UserDashboard';
import OwnerDashboard from './components/owner/OwnerDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/google/success" element={<GoogleOAuthSuccess />} />
            <Route path="/auth/google/error" element={<GoogleOAuthSuccess />} />
            <Route path="/auth/google/signup" element={<GoogleSignupConfirmation />} />
            
            <Route path="/user/*" element={
              <ProtectedRoute allowedRoles={['USER']}>
                <UserDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/owner/*" element={
              <ProtectedRoute allowedRoles={['OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            

            
            <Route path="/unauthorized" element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1>
                  <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;