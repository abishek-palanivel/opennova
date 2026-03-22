

import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
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

  // Debug logging to help identify role issues
  useEffect(() => {
    if (user) {
      console.log('🔍 OwnerDashboard - User loaded:', {
        name: user.name,
        email: user.email,
        role: user.role,
        id: user.id
      });
    }
  }, [user]);

  // Get the appropriate management component based on user role
  const getManagementComponent = () => {
    switch (user?.role) {
      case 'HOTEL_OWNER':
        return HotelOwnerManagement;
      case 'HOSPITAL_OWNER':
        return HospitalOwnerManagement;
      case 'SHOP_OWNER':
        return ShopOwnerManagement;
      case 'OWNER':
        // For generic OWNER role, show the general Dashboard
        return Dashboard;
      default:
        // For any other role, also show Dashboard
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

  // Fallback component for unknown routes (not roles)
  const FallbackComponent = () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
      <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">
          <strong>Available pages:</strong>
        </p>
        <ul className="text-blue-700 mt-2 list-disc list-inside">
          <li>Dashboard - /owner/</li>
          <li>Bookings - /owner/bookings</li>
          <li>Orders - /owner/orders</li>
          <li>Reviews - /owner/reviews</li>
          <li>Settings - /owner/settings</li>
          {(user?.role === 'HOTEL_OWNER') && <li>Menu - /owner/menus</li>}
          {(user?.role === 'HOSPITAL_OWNER' || user?.role === 'SHOP_OWNER') && <li>Items - /owner/items</li>}
        </ul>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <OwnerLayout>
        <Routes>
          <Route path="/" element={<ManagementComponent />} />
          <Route path="/dashboard" element={<ManagementComponent />} />
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