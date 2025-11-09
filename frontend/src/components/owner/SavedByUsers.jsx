import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SavedByUsers = () => {
  const [savedByUsers, setSavedByUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSavedByUsers();
      fetchStats();
    }
  }, [user]);

  const fetchSavedByUsers = async () => {
    try {
      const response = await api.get('/api/owner/saved-by-users');
      setSavedByUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users who saved establishment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/owner/saved-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch saved stats:', error);
    }
  };

  const getEstablishmentIcon = (type) => {
    const icons = {
      'HOTEL': '🏨',
      'HOSPITAL': '🏥',
      'SHOP': '🛍️'
    };
    return icons[type] || '🏢';
  };

  const getEstablishmentColor = (type) => {
    const colors = {
      'HOTEL': 'from-blue-500 to-blue-600',
      'HOSPITAL': 'from-red-500 to-red-600',
      'SHOP': 'from-green-500 to-green-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Data</h3>
          <p className="text-slate-600">Fetching users who saved your establishment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent flex items-center mb-4">
          <span className="mr-4 text-4xl">❤️</span>
          Saved by Users
        </h1>
        <p className="text-xl text-slate-600 font-medium">
          See who has saved your establishment as their favorite
        </p>
      </div>

      {/* Stats Card */}
      {stats.establishmentName && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${getEstablishmentColor(stats.establishmentType)} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                {getEstablishmentIcon(stats.establishmentType)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{stats.establishmentName}</h2>
                <p className="text-gray-600">{stats.establishmentType}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{stats.totalSavedBy}</div>
              <div className="text-sm text-gray-600">Users Saved</div>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Users Who Saved Your Establishment</h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {savedByUsers.length} Total
          </span>
        </div>

        {savedByUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saves yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Your establishment hasn't been saved by any users yet. Keep providing great service and customers will start saving your establishment as their favorite!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedByUsers.map((userData, index) => (
              <div 
                key={userData.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-lg font-bold text-white">
                      {userData.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{userData.name}</h4>
                    <p className="text-sm text-gray-600">{userData.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Saved on {new Date(userData.savedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(userData.savedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights */}
      {savedByUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-green-600">{savedByUsers.length}</div>
            <div className="text-sm text-gray-600">Total Saves</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-blue-600">
              {savedByUsers.length > 0 
                ? Math.round(savedByUsers.length / Math.max(1, Math.ceil((Date.now() - new Date(Math.min(...savedByUsers.map(u => new Date(u.savedAt))))) / (1000 * 60 * 60 * 24))))
                : 0
              }
            </div>
            <div className="text-sm text-gray-600">Saves per Day</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-purple-600">
              {savedByUsers.length > 0 ? 'High' : 'Low'}
            </div>
            <div className="text-sm text-gray-600">Popularity</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedByUsers;