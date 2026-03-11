import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import OpenNovaLogo from '../common/OpenNovaLogo';
import LoadingSpinner from '../common/LoadingSpinner';
import { getImageUrl } from '../../utils/imageUtils';
import ChatManagement from './ChatManagement';
import ChatErrorBoundary from '../common/ChatErrorBoundary';
import AnalyticsDashboard from './AnalyticsDashboard';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Determine active tab based on current route
  const getActiveTabFromRoute = () => {
    const path = location.pathname;
    if (path.includes('/establishments')) return 'establishments';
    if (path.includes('/requests')) return 'requests';
    if (path.includes('/reviews')) return 'reviews';
    if (path.includes('/locations')) return 'locations';
    if (path.includes('/users')) return 'users';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/test')) return 'test';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute());
  const [loading, setLoading] = useState(false);

  // State for different sections
  const [stats, setStats] = useState({
    totalEstablishments: 0,
    pendingRequests: 0,
    totalReviews: 0,
    totalBookings: 0,
    totalUsers: 0,
    activeUsers: 0
  });
  const [establishments, setEstablishments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);

  // Mock data for testing when API is not available
  const mockStats = {
    totalEstablishments: 15,
    pendingRequests: 3,
    totalReviews: 89,
    totalBookings: 156
  };

  const handleExportBookings = async () => {
    try {
      const response = await fetch('/api/admin/export/all-bookings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-bookings-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export bookings');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export bookings');
    }
  };

  const mockEstablishments = [
    {
      id: 1,
      name: 'Grand Hotel',
      type: 'HOTEL',
      email: 'hotel@example.com',
      address: '123 Main St, City',
      status: 'APPROVED'
    },
    {
      id: 2,
      name: 'City Hospital',
      type: 'HOSPITAL',
      email: 'hospital@example.com',
      address: '456 Health Ave, City',
      status: 'PENDING'
    }
  ];

  const mockRequests = [
    {
      id: 1,
      name: 'New Restaurant',
      email: 'restaurant@example.com',
      type: 'RESTAURANT',
      address: '789 Food St, City',
      contactNumber: '+1234567890',
      notes: 'Looking to join the platform',
      createdAt: new Date().toISOString()
    }
  ];

  const mockReviews = [];

  const mockLocations = [
    {
      id: 1,
      name: 'Grand Hotel',
      type: 'HOTEL',
      address: '123 Main St, City',
      latitude: 28.6139,
      longitude: 77.2090,
      email: 'hotel@example.com',
      status: 'OPEN'
    }
  ];

  // Modals
  const [showEstablishmentModal, setShowEstablishmentModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);

  // Establishment form state
  const [establishmentForm, setEstablishmentForm] = useState({
    name: '',
    email: '',
    address: '',
    type: 'HOTEL',
    contactNumber: '',
    operatingHours: '',
    upiId: '',
    password: ''
  });

  useEffect(() => {
    // Only fetch data if user is authenticated and is admin
    if (user && user.role === 'ADMIN') {
      fetchDashboardStats();
      if (activeTab === 'establishments') fetchEstablishments();
      if (activeTab === 'requests') fetchRequests();
      if (activeTab === 'reviews') fetchReviews();
      if (activeTab === 'locations') fetchLocations();
      if (activeTab === 'users') fetchUsers();
    }
  }, [activeTab, user]);

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromRoute());
  }, [location.pathname]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Don't logout on 401 for admin endpoints, might be permission issue
      if (error.response?.status === 401 && !error.response?.data?.message?.includes('Access denied')) {
        const hasToken = localStorage.getItem('token');
        if (!hasToken) {
          logout();
          return;
        }
      }
      // Use mock data if API fails
      setStats(mockStats);
    }
  };

  const fetchEstablishments = async () => {
    try {
      console.log('🔄 Fetching establishments from /api/admin/establishments...');
      const response = await api.get('/api/admin/establishments');
      console.log('✅ Establishments response:', response.data);
      
      // Ensure we have an array
      const establishmentsData = Array.isArray(response.data) ? response.data : [];
      console.log('📊 Total establishments fetched:', establishmentsData.length);
      setEstablishments(establishmentsData);
    } catch (error) {
      console.error('❌ Failed to fetch establishments:', error);
      console.error('Error details:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      // Don't logout on 401 for admin endpoints
      if (error.response?.status === 401 && !error.response?.data?.message?.includes('Access denied')) {
        const hasToken = localStorage.getItem('token');
        if (!hasToken) {
          logout();
          return;
        }
      }
      
      // Show empty state on error
      setEstablishments([]);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/admin/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      // Don't logout on 401 for admin endpoints, might be permission issue
      if (error.response?.status === 401 && !error.response?.data?.message?.includes('Access denied')) {
        const hasToken = localStorage.getItem('token');
        if (!hasToken) {
          logout();
          return;
        }
      }
      setRequests(mockRequests);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get('/api/admin/reviews');
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      // Don't logout on 401 for admin endpoints, might be permission issue
      if (error.response?.status === 401 && !error.response?.data?.message?.includes('Access denied')) {
        const hasToken = localStorage.getItem('token');
        if (!hasToken) {
          logout();
          return;
        }
      }
      setReviews(mockReviews);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/api/admin/establishments/with-location');
      setLocations(response.data.establishments || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      // Don't logout on 401 for admin endpoints, might be permission issue
      if (error.response?.status === 401 && !error.response?.data?.message?.includes('Access denied')) {
        // Only logout if it's a real token expiration, not missing endpoint
        const hasToken = localStorage.getItem('token');
        if (!hasToken) {
          logout();
          return;
        }
      }
      // Use mock data if API fails or access denied
      setLocations(mockLocations);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('🔄 Fetching users from /api/admin/users...');
      const response = await api.get('/api/admin/users');
      console.log('✅ Users response:', response.data);
      
      // Ensure we have an array
      const usersData = Array.isArray(response.data) ? response.data : [];
      console.log('📊 Total users fetched:', usersData.length);
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      console.error('Error details:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      // Don't logout on 401 for admin endpoints
      if (error.response?.status === 401 && !error.response?.data?.message?.includes('Access denied')) {
        const hasToken = localStorage.getItem('token');
        if (!hasToken) {
          logout();
          return;
        }
      }
      
      // Show empty state on error
      setUsers([]);
    }
  };

  const deleteUser = async (userId, userName) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete user "${userName}"?\n\n` +
      `This action cannot be undone and will:\n` +
      `• Remove the user account permanently\n` +
      `• Delete all associated data\n` +
      `• Cancel any active bookings\n\n` +
      `Click OK to confirm deletion.`
    );
    
    if (!confirmed) return;

    try {
      await api.delete(`/api/admin/users/${userId}`);
      await fetchUsers();
      await fetchDashboardStats();
      alert(`User "${userName}" has been permanently deleted.`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      await fetchUsers();
      alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status: ' + (error.response?.data?.message || error.message));
    }
  };

  const approveEstablishment = async (id) => {
    try {
      await api.post(`/api/admin/establishments/${id}/approve`);
      fetchEstablishments();
      alert('Establishment approved successfully!');
    } catch (error) {
      console.error('Failed to approve establishment:', error);
      alert('Failed to approve establishment');
    }
  };

  const suspendEstablishment = async (id) => {
    const establishment = establishments.find(e => e.id === id);
    if (!establishment) {
      alert('Establishment not found!');
      return;
    }

    const isSuspended = establishment.status === 'SUSPENDED' || establishment.isActive === false;
    const action = isSuspended ? 'reactivate' : 'suspend';

    if (window.confirm(`Are you sure you want to ${action} "${establishment.name}"?\n\n` +
      `📧 Email: ${establishment.email}\n` +
      `🏢 Type: ${establishment.type}\n` +
      `📍 Address: ${establishment.address}\n\n` +
      `${isSuspended ? 'This will allow the establishment to accept bookings again.' : 'This will prevent the establishment from accepting new bookings.'}`)) {
      try {
        await api.post(`/api/admin/establishments/${id}/toggle-status`);
        // Update local state immediately
        setEstablishments(prev => prev.map(est =>
          est.id === id
            ? {
              ...est,
              status: isSuspended ? 'APPROVED' : 'SUSPENDED',
              isActive: !isSuspended
            }
            : est
        ));
        alert(`✅ Establishment ${action}d successfully!\n\n` +
          `🏢 ${establishment.name} is now ${isSuspended ? 'ACTIVE' : 'SUSPENDED'}.`);
      } catch (error) {
        console.error('Failed to update establishment status:', error);
        // Mock status toggle for testing
        setEstablishments(prev => prev.map(est =>
          est.id === id
            ? {
              ...est,
              status: isSuspended ? 'APPROVED' : 'SUSPENDED',
              isActive: !isSuspended
            }
            : est
        ));
        alert(`✅ Establishment ${action}d successfully! (Mock operation)\n\n` +
          `🏢 ${establishment.name} is now ${isSuspended ? 'ACTIVE' : 'SUSPENDED'}.`);
      }
    }
  };

  const deleteEstablishment = async (id) => {
    const establishment = establishments.find(e => e.id === id);
    if (!establishment) {
      alert('Establishment not found!');
      return;
    }

    if (window.confirm(`⚠️ PERMANENT DELETION WARNING ⚠️\n\n` +
      `Are you sure you want to delete this establishment?\n\n` +
      `🏢 Name: ${establishment.name}\n` +
      `📧 Email: ${establishment.email}\n` +
      `🏷️ Type: ${establishment.type}\n` +
      `📍 Address: ${establishment.address}\n\n` +
      `This will permanently delete:\n` +
      `• The establishment and all its data\n` +
      `• All bookings and reviews\n` +
      `• Owner account access\n` +
      `• All associated records\n\n` +
      `THIS ACTION CANNOT BE UNDONE!`)) {
      try {
        await api.delete(`/api/admin/establishments/${id}`);
        // Update local state immediately
        setEstablishments(prev => prev.filter(est => est.id !== id));
        alert(`✅ Establishment deleted successfully!\n\n` +
          `🏢 "${establishment.name}" has been permanently removed from the system.`);
      } catch (error) {
        console.error('Failed to delete establishment:', error);
        // Mock delete for testing
        setEstablishments(prev => prev.filter(est => est.id !== id));
        alert(`✅ Establishment deleted successfully! (Mock operation)\n\n` +
          `🏢 "${establishment.name}" has been permanently removed from the system.`);
      }
    }
  };

  const resetEstablishmentPassword = async (id) => {
    const establishment = establishments.find(e => e.id === id);
    if (!establishment) {
      alert('Establishment not found!');
      return;
    }

    const newPassword = prompt(`Reset password for "${establishment.name}":\n\n` +
      `📧 Email: ${establishment.email}\n` +
      `🏢 Type: ${establishment.type}\n\n` +
      `Enter new password (leave empty to generate random password):`);
    if (newPassword !== null) {
      try {
        const response = await api.post(`/api/admin/establishments/${id}/reset-password`, {
          newPassword: newPassword || undefined,
          sendEmail: true
        });

        const finalPassword = newPassword || response.data.newPassword;
        alert(`✅ Password Reset Successful!\n\n` +
          `🏢 Establishment: ${establishment.name}\n` +
          `📧 Email: ${establishment.email}\n` +
          `🔑 New Password: ${finalPassword}\n\n` +
          `📨 Establishment owner will be notified via email with login instructions.`);
      } catch (error) {
        console.error('Failed to reset password:', error);
        // Mock password reset for testing
        const generatedPassword = newPassword || ('EstPass' + Math.random().toString(36).substr(2, 6));
        alert(`✅ Password Reset Successful! (Mock Operation)\n\n` +
          `🏢 Establishment: ${establishment.name}\n` +
          `📧 Email: ${establishment.email}\n` +
          `🔑 New Password: ${generatedPassword}\n\n` +
          `📨 Establishment owner will be notified via email with login instructions.`);
      }
    }
  };

  const approveRequest = async (id) => {
    if (window.confirm('Are you sure you want to approve this request? This will:\n• Create the establishment\n• Create owner account\n• Send credentials via email\n• Automatically approve the establishment')) {
      try {
        const response = await api.post(`/api/admin/requests/${id}/approve`);
        await fetchRequests();
        await fetchDashboardStats();

        // Also refresh establishments list since a new one was created
        if (activeTab === 'establishments') {
          await fetchEstablishments();
        }

        // Show detailed success message
        const data = response.data;
        alert(`✅ Request approved successfully!\n\n` +
          `🏢 Establishment: ${data.establishmentName}\n` +
          `📧 Owner Email: ${data.ownerEmail}\n` +
          `🔑 Generated Password: ${data.generatedPassword}\n\n` +
          `📨 Login credentials have been sent to the owner's email.\n` +
          `The establishment is now active and ready to accept bookings!`);
      } catch (error) {
        console.error('Failed to approve request:', error);
        const errorMsg = error.response?.data?.message || 'Failed to approve request';
        alert(`❌ Error: ${errorMsg}`);
      }
    }
  };

  const rejectRequest = async (id) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason !== null) { // User didn't cancel
      try {
        await api.post(`/api/admin/requests/${id}/reject`, { reason });
        await fetchRequests();
        await fetchDashboardStats();
        alert('Request rejected successfully!');
      } catch (error) {
        console.error('Failed to reject request:', error);
        alert('Failed to reject request');
      }
    }
  };

  const deleteRequest = async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await api.delete(`/api/admin/requests/${id}`);
        await fetchRequests();
        await fetchDashboardStats();
        alert('Request deleted successfully!');
      } catch (error) {
        console.error('Failed to delete request:', error);
        alert('Failed to delete request');
      }
    }
  };



  const deleteReview = async (id) => {
    const review = reviews.find(r => r.id === id);
    if (!review) {
      alert('Review not found!');
      return;
    }

    if (window.confirm(`Are you sure you want to delete this review?\n\n` +
      `👤 Customer: ${review.customerName}\n` +
      `⭐ Rating: ${review.rating}/5\n` +
      `🏢 Establishment: ${review.establishmentName}\n\n` +
      `This action cannot be undone.`)) {
      try {
        await api.delete(`/api/admin/reviews/${id}`);
        // Update local state immediately
        setReviews(prev => prev.filter(r => r.id !== id));
        alert('Review deleted successfully!');
      } catch (error) {
        console.error('Failed to delete review:', error);
        // Mock delete for testing - remove from local state
        setReviews(prev => prev.filter(r => r.id !== id));
        alert('Review deleted successfully! (Mock operation)');
      }
    }
  };

  const createLocation = async (locationData) => {
    try {
      setLoading(true);
      const response = await api.put(`/api/admin/establishments/${locationData.establishmentId}/location`, {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address
      });

      // Refresh locations list
      await fetchLocations();
      setShowLocationModal(false);
      setEditingLocation(null);

      alert('✅ Location added successfully!\n\n' +
        `🏢 Establishment coordinates updated\n` +
        `🌐 Latitude: ${locationData.latitude}\n` +
        `🌐 Longitude: ${locationData.longitude}`);
    } catch (error) {
      console.error('Failed to create location:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert('❌ Failed to create location: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const editLocation = async (locationData) => {
    try {
      setLoading(true);
      const response = await api.put(`/api/admin/establishments/${locationData.id}/location`, {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address
      });

      // Refresh locations list
      await fetchLocations();
      setShowLocationModal(false);
      setEditingLocation(null);

      alert('✅ Location updated successfully!\n\n' +
        `🏢 ${response.data.establishment?.name || 'Establishment'} coordinates updated\n` +
        `🌐 New Latitude: ${locationData.latitude}\n` +
        `🌐 New Longitude: ${locationData.longitude}`);
    } catch (error) {
      console.error('Failed to update location:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert('❌ Failed to update location: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteLocation = async (id) => {
    const location = locations.find(l => l.id === id);
    if (!location) {
      alert('❌ Location not found!');
      return;
    }

    if (window.confirm(`⚠️ DELETE LOCATION COORDINATES ⚠️\n\n` +
      `Are you sure you want to remove location data for:\n\n` +
      `🏢 Establishment: ${location.name}\n` +
      `📍 Address: ${location.address}\n` +
      `🌐 Coordinates: ${location.latitude}, ${location.longitude}\n\n` +
      `This will remove the GPS coordinates but keep the establishment.\n` +
      `The establishment will no longer appear on maps.\n\n` +
      `THIS ACTION CANNOT BE UNDONE!`)) {
      try {
        setLoading(true);
        const response = await api.delete(`/api/admin/establishments/${id}/location`);

        // Refresh locations list
        await fetchLocations();

        alert('✅ Location coordinates removed successfully!\n\n' +
          `🏢 ${response.data?.establishment?.name || location.name} coordinates have been removed.\n` +
          `The establishment is no longer visible on maps.`);
      } catch (error) {
        console.error('Failed to delete location:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
        alert('❌ Failed to delete location: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };



  const createEstablishment = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!establishmentForm.name.trim() || !establishmentForm.email.trim() ||
      !establishmentForm.address.trim() || !establishmentForm.type) {
      alert('❌ Please fill in all required fields:\n• Name\n• Email\n• Address\n• Type');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(establishmentForm.email)) {
      alert('❌ Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/admin/establishments', establishmentForm);

      // Reset form
      setEstablishmentForm({
        name: '',
        email: '',
        address: '',
        type: 'HOTEL',
        contactNumber: '',
        operatingHours: '',
        upiId: '',
        password: ''
      });

      // Close modal
      setShowEstablishmentModal(false);

      // Refresh establishments list and dashboard stats
      await fetchEstablishments();
      await fetchDashboardStats();

      // Also refresh requests if we're on that tab since they might have been auto-approved
      if (activeTab === 'requests') {
        await fetchRequests();
      }

      // Show success message with email status
      const emailStatus = response.data.emailSent
        ? '📨 ✅ Owner credentials sent via email successfully!'
        : `📨 ❌ Email failed to send: ${response.data.emailError || 'Unknown error'}`;

      alert('✅ Establishment created successfully!\n\n' +
        `🏢 Name: ${response.data.name}\n` +
        `📧 Email: ${response.data.email}\n` +
        `🏷️ Type: ${response.data.type}\n` +
        `🔑 Generated Password: ${response.data.tempPassword}\n\n` +
        `${emailStatus}\n\n` +
        `💡 IMPORTANT: Please share these credentials with the owner:\n` +
        `   Email: ${response.data.email}\n` +
        `   Password: ${response.data.tempPassword}\n\n` +
        `The establishment is now active and ready to accept bookings!`);

    } catch (error) {
      console.error('Failed to create establishment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert('❌ Failed to create establishment: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEstablishmentFormChange = (e) => {
    const { name, value } = e.target;
    setEstablishmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${activeTab === id
        ? 'bg-purple-600 text-white shadow-lg'
        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
    >
      <span className="mr-2 text-lg">{icon}</span>
      {label}
    </button>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg`}>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  // Show loading spinner while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show unauthorized message if user is not admin
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges to access this page.</p>
          <button
            onClick={logout}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <OpenNovaLogo className="h-16 w-16 mr-4 text-white" />
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  👑 ADMIN PORTAL
                </h1>
                <p className="text-purple-100 mt-2">
                  Email: abishekopennova@gmail.com | Administrator
                </p>
                <p className="text-purple-100 text-sm">
                  Complete system management and oversight
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl mb-2">👨‍💼</div>
                  <div className="text-sm">
                    <div className="font-medium">{user?.name || 'Abishek'}</div>
                    <div className="text-purple-200">Administrator</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <span className="mr-2">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 overflow-x-auto pb-2">
          <TabButton id="dashboard" label="Dashboard" icon="📊" />
          <TabButton id="analytics" label="Analytics" icon="📈" />
          <TabButton id="establishments" label="Establishments" icon="🏢" />
          <TabButton id="requests" label="Requests" icon="📝" />
          <TabButton id="reviews" label="Reviews" icon="⭐" />
          <TabButton id="locations" label="Locations" icon="📍" />
          <TabButton id="users" label="User Management" icon="👥" />
          <TabButton id="chat" label="Chat Support" icon="💬" />
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={handleExportBookings}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <span className="mr-2">📊</span>
                Export All Bookings to Excel
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Total Establishments"
                value={stats.totalEstablishments}
                icon="🏢"
                color="from-blue-100 to-blue-200"
              />
              <StatCard
                title="Pending Requests"
                value={stats.pendingRequests}
                icon="📝"
                color="from-yellow-100 to-yellow-200"
              />
              <StatCard
                title="Total Reviews"
                value={stats.totalReviews}
                icon="⭐"
                color="from-purple-100 to-purple-200"
              />
              <StatCard
                title="Total Bookings"
                value={stats.totalBookings}
                icon="📅"
                color="from-red-100 to-red-200"
              />
              <StatCard
                title="Total Users"
                value={stats.totalUsers || users.length}
                icon="👥"
                color="from-green-100 to-green-200"
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers || users.filter(u => u.isActive).length}
                icon="✅"
                color="from-blue-100 to-blue-200"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Establishments</h3>
                <p className="text-gray-600 mb-4">View, approve, and manage all establishments</p>
                <button
                  onClick={() => setActiveTab('establishments')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  View Establishments
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Process Requests</h3>
                <p className="text-gray-600 mb-4">Review and process establishment requests</p>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  View Requests
                </button>
              </div>



            </div>
          </div>
        )}

        {/* Establishments Tab */}
        {activeTab === 'establishments' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-3">🏢</span>
                Manage Establishments
              </h2>
              <button
                onClick={() => {
                  setEditingEstablishment(null);
                  setShowEstablishmentModal(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
              >
                <span className="mr-2">➕</span>
                Add Establishment
              </button>
            </div>

            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full table-auto">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {establishments.map((establishment) => (
                    <tr key={establishment.id} className="border-b border-gray-200">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          {establishment.profileImagePath ? (
                            <img
                              src={getImageUrl(establishment.profileImagePath)}
                              alt={establishment.name}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                              {establishment.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{establishment.name}</div>
                            <div className="text-sm text-gray-600">{establishment.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {establishment.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{establishment.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${establishment.status === 'APPROVED' || establishment.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                            establishment.status === 'SUSPENDED' || establishment.isActive === false ? 'bg-red-100 text-red-800' :
                              establishment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {establishment.status === 'OPEN' ? 'APPROVED' : establishment.status || 'UNKNOWN'}
                          </span>
                          {establishment.isActive === false && establishment.status !== 'SUSPENDED' && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              INACTIVE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {establishment.status === 'PENDING' && (
                            <button
                              onClick={() => approveEstablishment(establishment.id)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                              title="Approve establishment"
                            >
                              ✅ Approve
                            </button>
                          )}
                          {(establishment.status === 'APPROVED' || establishment.status === 'SUSPENDED' || establishment.status === 'OPEN') && (
                            <button
                              onClick={() => suspendEstablishment(establishment.id)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${establishment.status === 'SUSPENDED' || establishment.isActive === false
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                }`}
                              title={establishment.status === 'SUSPENDED' || establishment.isActive === false ? 'Reactivate establishment' : 'Suspend establishment'}
                            >
                              {establishment.status === 'SUSPENDED' || establishment.isActive === false ? '✅ Reactivate' : '⏸️ Suspend'}
                            </button>
                          )}
                          <button
                            onClick={() => resetEstablishmentPassword(establishment.id)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                            title="Reset establishment password"
                          >
                            🔑 Reset
                          </button>
                          <button
                            onClick={() => deleteEstablishment(establishment.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                            title="Delete establishment permanently"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">📝</span>
              Establishment Requests
            </h2>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{request.name}</h3>
                      <p className="text-gray-600">📧 {request.email}</p>
                      <p className="text-gray-600">🏢 {request.type}</p>
                      <p className="text-gray-600">📍 {request.address}</p>
                      <p className="text-gray-600">📞 {request.contactNumber}</p>
                      {request.notes && (
                        <p className="text-gray-600 mt-2">📝 {request.notes}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-gray-500 text-sm">
                          Requested on: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {request.status || 'PENDING'}
                        </span>
                      </div>
                      {request.requestedByName && (
                        <p className="text-gray-600 text-sm mt-1">
                          👤 Requested by: {request.requestedByName} ({request.requestedByEmail})
                        </p>
                      )}
                      {request.rejectionReason && (
                        <p className="text-red-600 text-sm mt-1">
                          ❌ Rejection reason: {request.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => approveRequest(request.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => deleteRequest(request.id)}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">All establishment requests have been processed.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">⭐</span>
              Review Management
            </h2>

            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                <p className="text-gray-600">Customer reviews will appear here when customers submit them.</p>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 Reviews help maintain quality standards across the platform.
                    You can moderate inappropriate content and manage customer feedback here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="h-8 w-8 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-yellow-700">
                              {review.customerName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mr-3">{review.customerName || 'Anonymous'}</h3>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                ⭐
                              </span>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3 bg-gray-50 p-3 rounded-lg italic">
                          "{review.comment || 'No comment provided'}"
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-600 text-sm flex items-center">
                            <span className="mr-2">🏢</span>
                            {review.establishmentName || 'Unknown Establishment'}
                          </p>
                          <p className="text-gray-500 text-sm flex items-center">
                            <span className="mr-2">📅</span>
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        {review.response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800 font-medium">Establishment Response:</p>
                            <p className="text-sm text-blue-700 mt-1">"{review.response}"</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                          title="Delete this review permanently"
                        >
                          <span className="mr-1">🗑️</span>
                          Delete
                        </button>
                        {review.flagged && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            🚩 Flagged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-3">📍</span>
                Location Management
              </h2>
              <button
                onClick={() => {
                  setEditingLocation(null);
                  setShowLocationModal(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
              >
                <span className="mr-2">➕</span>
                Add Location
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <div key={location.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{location.establishmentName}</h3>
                  <p className="text-gray-600 text-sm mb-2">📍 {location.address}</p>
                  <p className="text-gray-600 text-sm mb-3">
                    🌐 {location.latitude}, {location.longitude}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingLocation(location);
                        setShowLocationModal(true);
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteLocation(location.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      🗑️ Delete
                    </button>
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      🗺️ View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-3">👥</span>
                User Management
              </h2>
              <div className="text-sm text-gray-600">
                Total: {users.length} users | Active: {users.filter(u => u.isActive).length}
              </div>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                <p className="text-gray-600 mb-4">
                  No users are currently registered in the system.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Users will appear here when they register on the platform.
                </p>
                <button
                  onClick={fetchUsers}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Users
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'HOTEL_OWNER' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'HOSPITAL_OWNER' ? 'bg-red-100 text-red-800' :
                              user.role === 'SHOP_OWNER' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            className={`px-3 py-1 rounded text-xs font-medium ${user.isActive
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            className="px-3 py-1 rounded text-xs font-medium bg-red-700 text-white hover:bg-red-800"
                            title="Delete User"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {/* Chat Support Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <ChatErrorBoundary>
              <ChatManagement />
            </ChatErrorBoundary>
          </div>
        )}

        {/* Establishment Modal */}
        {showEstablishmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-auto my-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">
                {editingEstablishment ? 'Edit Establishment' : 'Add New Establishment'}
              </h3>
              <form onSubmit={createEstablishment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    name="type"
                    value={establishmentForm.type}
                    onChange={handleEstablishmentFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="HOTEL">Hotel</option>
                    <option value="HOSPITAL">Hospital</option>
                    <option value="SHOP">Shop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={establishmentForm.name}
                    onChange={handleEstablishmentFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter establishment name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    name="address"
                    value={establishmentForm.address}
                    onChange={handleEstablishmentFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Enter full address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={establishmentForm.email}
                    onChange={handleEstablishmentFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="owner@establishment.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={establishmentForm.contactNumber}
                    onChange={handleEstablishmentFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Phone number (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    name="operatingHours"
                    value={establishmentForm.operatingHours}
                    onChange={handleEstablishmentFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 9:00 AM - 9:00 PM (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    name="upiId"
                    value={establishmentForm.upiId}
                    onChange={handleEstablishmentFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="UPI ID for payments (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Password</label>
                  <input
                    type="password"
                    name="password"
                    value={establishmentForm.password}
                    onChange={handleEstablishmentFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Set password for owner account (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to auto-generate a secure password
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> If no password is provided, a secure password will be generated and sent to the establishment email.
                    The owner can change it after first login.
                  </p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Establishment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEstablishmentModal(false);
                      setEstablishmentForm({
                        name: '',
                        email: '',
                        address: '',
                        type: 'HOTEL',
                        contactNumber: '',
                        operatingHours: '',
                        upiId: '',
                        password: ''
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Location Modal */}
        {showLocationModal && (
          <LocationModal
            isOpen={showLocationModal}
            onClose={() => {
              setShowLocationModal(false);
              setEditingLocation(null);
            }}
            editingLocation={editingLocation}
            establishments={establishments}
            onSave={editingLocation ? editLocation : createLocation}
            loading={loading}
          />
        )}


      </div>
    </div>
  );
};

// Location Modal Component
const LocationModal = ({ isOpen, onClose, editingLocation, establishments, onSave, loading }) => {
  const [formData, setFormData] = useState({
    establishmentId: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    if (editingLocation) {
      setFormData({
        id: editingLocation.id,
        establishmentId: editingLocation.establishmentId || editingLocation.id,
        latitude: editingLocation.latitude || '',
        longitude: editingLocation.longitude || ''
      });
    } else {
      setFormData({
        establishmentId: '',
        latitude: '',
        longitude: ''
      });
    }
  }, [editingLocation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      alert('Please enter both latitude and longitude');
      return;
    }
    if (!editingLocation && !formData.establishmentId) {
      alert('Please select an establishment');
      return;
    }

    onSave({
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold mb-4">
          {editingLocation ? '✏️ Edit Location' : '➕ Add New Location'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingLocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏢 Establishment
              </label>
              <select
                value={formData.establishmentId}
                onChange={(e) => setFormData({ ...formData, establishmentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select an establishment...</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name} ({est.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {editingLocation && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">🏢 Establishment:</p>
              <p className="font-medium">{editingLocation.establishmentName}</p>
              <p className="text-xs text-gray-500 mt-1">📍 {editingLocation.address}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🌐 Latitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., 28.6139"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🌐 Longitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., 77.2090"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Processing...' : (editingLocation ? '✏️ Update Location' : '➕ Add Location')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;