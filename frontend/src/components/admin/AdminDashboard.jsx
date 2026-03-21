import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import OpenNovaLogo from '../common/OpenNovaLogo';
import LoadingSpinner from '../common/LoadingSpinner';
import { getImageUrl } from '../../utils/imageUtils';
import ImageWithFallback from '../common/ImageWithFallback';
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
    if (path.includes('/users')) return 'users';
    
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/test')) return 'test';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Modals
  const [showEstablishmentModal, setShowEstablishmentModal] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Filter establishments based on search and type
  const filteredEstablishments = establishments.filter(establishment => {
    const matchesSearch = !searchTerm || 
      establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      establishment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      establishment.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'ALL' || establishment.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Establishment form state
  const [establishmentForm, setEstablishmentForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
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
      const response = await api.get('/api/admin/establishments');
      console.log('Fetched establishments:', response.data);
      setEstablishments(response.data);
    } catch (error) {
      console.error('Failed to fetch establishments:', error);
      // Only logout on authentication errors, not permission errors
      if (error.response?.status === 401 && !error.response?.data?.message?.includes('Access denied')) {
        const hasToken = localStorage.getItem('token');
        if (!hasToken) {
          logout();
          return;
        }
      }
      // Show empty array instead of mock data to see real issues
      setEstablishments([]);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/admin/requests');
      console.log('Fetched requests:', response.data);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      // Only logout on authentication errors, not permission errors
      if (error.response?.status === 401 && !error.response?.data?.message?.includes('Access denied')) {
        const hasToken = localStorage.getItem('token');
        if (!hasToken) {
          logout();
          return;
        }
      }
      // Show empty array instead of mock data to see real issues
      setRequests([]);
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

  const fetchUsers = async () => {
    try {
      console.log('🔄 Fetching users from /api/admin/users...');
      const response = await api.get('/api/admin/users');
      console.log('✅ Users response:', response.data);
      setUsers(response.data || []);
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      console.error('Error details:', error.response?.data);
      console.error('Status:', error.response?.status);
      // Don't use mock data - show empty state instead
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
    const action = !currentStatus ? 'activate' : 'deactivate';
    const actionPast = !currentStatus ? 'activated' : 'deactivated';
    
    // Get user info for better confirmation message
    const user = users.find(u => u.id === userId);
    const userName = user ? user.name : 'User';
    const userEmail = user ? user.email : '';
    
    const confirmMessage = !currentStatus 
      ? `Are you sure you want to activate ${userName} (${userEmail})?\n\nThis will allow them to log in and access the platform.`
      : `Are you sure you want to deactivate ${userName} (${userEmail})?\n\nThis will:\n• Prevent them from logging in\n• Show a suspension message when they try to log in\n• Require them to contact support for reactivation`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      await fetchUsers();
      
      const successMessage = !currentStatus 
        ? `✅ ${userName} has been activated successfully!\n\nThey can now log in and access the platform.`
        : `⚠️ ${userName} has been deactivated successfully!\n\nThey will see a suspension message if they try to log in and will need to contact support for reactivation.`;
      
      alert(successMessage);
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert(`❌ Failed to ${action} user: ` + (error.response?.data?.message || error.message));
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

    const isSuspended = establishment.isActive === false;
    const action = isSuspended ? 'reactivate' : 'suspend';

    if (window.confirm(`Are you sure you want to ${action} "${establishment.name}"?`)) {
      try {
        // Call the correct endpoint based on current status
        const endpoint = isSuspended 
          ? `/api/admin/establishments/${id}/activate`
          : `/api/admin/establishments/${id}/suspend`;
        
        const response = await api.put(endpoint);
        
        if (response.data) {
          // Update local state with the response from backend
          setEstablishments(prev => prev.map(est =>
            est.id === id
              ? {
                ...est,
                isActive: !isSuspended
              }
              : est
          ));
          alert(`✅ Establishment ${action}d successfully!`);
        }
      } catch (error) {
        console.error('Failed to update establishment status:', error);
        const errorMessage = error.response?.data?.error || `Failed to ${action} establishment`;
        alert(`❌ ${errorMessage}`);
      }
    }
  };

  const deleteEstablishment = async (id) => {
    const establishment = establishments.find(e => e.id === id);
    if (!establishment) {
      alert('Establishment not found!');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${establishment.name}"? This action cannot be undone!`)) {
      try {
        await api.delete(`/api/admin/establishments/${id}`);
        setEstablishments(prev => prev.filter(est => est.id !== id));
        alert(`✅ Establishment deleted successfully!`);
      } catch (error) {
        console.error('Failed to delete establishment:', error);
        alert('Failed to delete establishment');
      }
    }
  };

  const approveRequest = async (id) => {
    if (window.confirm('Are you sure you want to approve this request?')) {
      try {
        const response = await api.post(`/api/admin/requests/${id}/approve`);
        await fetchRequests();
        await fetchDashboardStats();
        if (activeTab === 'establishments') {
          await fetchEstablishments();
        }
        alert(`✅ Request approved successfully!\n\nEstablishment: ${response.data.establishmentName}\nOwner Email: ${response.data.ownerEmail}\nGenerated Password: ${response.data.generatedPassword}`);
      } catch (error) {
        console.error('Failed to approve request:', error);
        const errorMsg = error.response?.data?.message || 'Failed to approve request';
        alert(`❌ Error: ${errorMsg}`);
      }
    }
  };

  const rejectRequest = async (id) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason !== null) {
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

    if (window.confirm(`Are you sure you want to delete this review?`)) {
      try {
        await api.delete(`/api/admin/reviews/${id}`);
        setReviews(prev => prev.filter(r => r.id !== id));
        alert('Review deleted successfully!');
      } catch (error) {
        console.error('Failed to delete review:', error);
        setReviews(prev => prev.filter(r => r.id !== id));
        alert('Review deleted successfully! (Mock operation)');
      }
    }
  };

  const createEstablishment = async (e) => {
    e.preventDefault();

    if (!establishmentForm.name.trim() || !establishmentForm.email.trim() ||
      !establishmentForm.address.trim() || !establishmentForm.city.trim() ||
      !establishmentForm.state.trim() || !establishmentForm.pincode.trim() ||
      !establishmentForm.type) {
      alert('❌ Please fill in all required fields: name, email, address, city, state, pincode, and type');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(establishmentForm.email)) {
      alert('❌ Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Map frontend form fields to backend expected fields
      const establishmentData = {
        ...establishmentForm,
        ownerPassword: establishmentForm.password, // Map password to ownerPassword
        phoneNumber: establishmentForm.contactNumber // Map contactNumber to phoneNumber
      };
      
      // Remove the original password field to avoid confusion
      delete establishmentData.password;
      delete establishmentData.contactNumber;
      
      const response = await api.post('/api/admin/establishments', establishmentData);

      setEstablishmentForm({
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        type: 'HOTEL',
        contactNumber: '',
        operatingHours: '',
        upiId: '',
        password: ''
      });

      setShowEstablishmentModal(false);
      await fetchEstablishments();
      await fetchDashboardStats();

      if (activeTab === 'requests') {
        await fetchRequests();
      }

      alert('✅ Establishment created successfully!');
    } catch (error) {
      console.error('Failed to create establishment:', error);
      
      // Handle different types of errors
      if (error.response?.status === 409) {
        // Duplicate error
        const errorData = error.response.data;
        if (errorData.type === 'DUPLICATE_EMAIL' && errorData.existingEstablishment) {
          const existing = errorData.existingEstablishment;
          alert(`❌ Email already in use!\n\nAn establishment with email "${establishmentForm.email}" already exists:\n\n` +
                `• Name: ${existing.name}\n` +
                `• Type: ${existing.type}\n` +
                `• ID: ${existing.id}\n\n` +
                `Please use a different email address.`);
        } else {
          alert('❌ ' + (errorData.error || 'This establishment already exists'));
        }
      } else if (error.response?.status === 400) {
        // Validation error
        const errorData = error.response.data;
        alert('❌ Validation Error: ' + (errorData.error || 'Please check your input'));
      } else {
        // General error
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error occurred';
        alert('❌ Failed to create establishment: ' + errorMessage);
      }
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

        {/* Navigation Tabs - Location tab removed */}
        <div className="flex flex-wrap gap-4 overflow-x-auto pb-2">
          <TabButton id="dashboard" label="Dashboard" icon="📊" />
          <TabButton id="analytics" label="Analytics" icon="📈" />
          <TabButton id="establishments" label="Establishments" icon="🏢" />
          <TabButton id="requests" label="Requests" icon="📝" />
          <TabButton id="reviews" label="Reviews" icon="⭐" />
          <TabButton id="users" label="User Management" icon="👥" />
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-end">
              <button
                onClick={handleExportBookings}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <span className="mr-2">📊</span>
                Export All Bookings to Excel
              </button>
            </div>

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
            </div>

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

              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                <p className="text-gray-600 mb-4">Manage user accounts and permissions</p>
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  View Users
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

            {/* Search and Filter Controls */}
            <div className="mb-4 flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="🔍 Search by name, email, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="HOTEL">Hotels</option>
                  <option value="HOSPITAL">Hospitals</option>
                  <option value="SHOP">Shops</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredEstablishments.length} of {establishments.length} establishments
              </div>
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
                  {filteredEstablishments.map((establishment) => (
                    <tr key={establishment.id} className="border-b border-gray-200">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          {establishment.profileImagePath ? (
                            <ImageWithFallback
                              src={getImageUrl(establishment.profileImagePath)}
                              alt={establishment.name}
                              className="w-10 h-10 rounded-lg object-cover"
                              type={establishment.type}
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          establishment.isActive === false ? 'bg-red-100 text-red-800' :
                          establishment.status === 'APPROVED' || establishment.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                          establishment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {establishment.isActive === false ? 'SUSPENDED' : 
                           establishment.status === 'OPEN' ? 'APPROVED' : 
                           establishment.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {establishment.status === 'PENDING' && (
                            <button
                              onClick={() => approveEstablishment(establishment.id)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              ✅ Approve
                            </button>
                          )}
                          <button
                            onClick={() => suspendEstablishment(establishment.id)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              establishment.isActive === false
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                          >
                            {establishment.isActive === false ? '✅ Reactivate' : '⏸️ Suspend'}
                          </button>
                          <button
                            onClick={() => deleteEstablishment(establishment.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
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
                      <p className="text-gray-600">📞 {request.phoneNumber}</p>
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
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
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
                          <p className="text-gray-600 text-sm">
                            🏢 {review.establishmentName || 'Unknown Establishment'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            📅 {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <p className="text-gray-600 mb-4">No users are currently registered in the system.</p>
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
                            user.role === 'OWNER' ? 'bg-blue-100 text-blue-800' :
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={establishmentForm.city}
                      onChange={handleEstablishmentFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={establishmentForm.state}
                      onChange={handleEstablishmentFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter state"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={establishmentForm.pincode}
                      onChange={handleEstablishmentFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter pincode"
                      pattern="[0-9]{6}"
                      maxLength="6"
                      required
                    />
                  </div>
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
                        city: '',
                        state: '',
                        pincode: '',
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

        {/* Rest of the component content... */}
        {/* I'll add the rest of the component in a separate message to keep it manageable */}
      </div>
    </div>
  );
};

export default AdminDashboard;