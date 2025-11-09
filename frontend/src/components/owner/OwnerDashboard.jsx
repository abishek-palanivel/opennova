

import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OwnerLayout from './OwnerLayout';
import Dashboard from './Dashboard';
import HotelOwnerManagement from './HotelOwnerManagement';
import HospitalOwnerManagement from './HospitalOwnerManagement';
import ShopOwnerManagement from './ShopOwnerManagement';
import EstablishmentSettings from './EstablishmentSettings';
import BookingManagement from './BookingManagement';
import MenuManagement from './MenuManagement';
import ReviewManagement from './ReviewManagement';
import OrderManagement from './OrderManagement';

import ErrorBoundary from '../common/ErrorBoundary';

const OwnerDashboard = () => {
  const { user } = useAuth();

  // Get the appropriate management component based on user role
  const getManagementComponent = () => {
    switch (user?.role) {
      case 'HOTEL_OWNER':
        return HotelOwnerManagement;
      case 'HOSPITAL_OWNER':
        return HospitalOwnerManagement;
      case 'SHOP_OWNER':
        return ShopOwnerManagement;
      default:
        return Dashboard;
    }
  };

  const ManagementComponent = getManagementComponent();

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Fallback component for unknown roles
  const FallbackComponent = () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Owner Dashboard</h1>
      <p className="text-gray-600">Welcome to your owner portal. Your role: {user?.role}</p>
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          This is a fallback view. Please contact support if you're seeing this message.
        </p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <OwnerLayout>
        <Routes>
          <Route path="/" element={<ManagementComponent />} />
          <Route path="/bookings" element={<BookingManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/menus" element={<MenuManagement />} />
          <Route path="/items" element={<ManagementComponent />} />
          <Route path="/reviews" element={<ReviewManagement />} />
          <Route path="/settings" element={<EstablishmentSettings />} />
          <Route path="*" element={<FallbackComponent />} />
        </Routes>
      </OwnerLayout>
    </ErrorBoundary>
  );
};

export default OwnerDashboard;