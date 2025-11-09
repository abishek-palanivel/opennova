import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [serverNotifications, setServerNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Listen for custom notification events
    const handleNotification = (event) => {
      const notification = {
        id: Date.now(),
        ...event.detail
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    };

    window.addEventListener('showNotification', handleNotification);
    
    return () => {
      window.removeEventListener('showNotification', handleNotification);
    };
  }, []);

  // Fetch server notifications
  useEffect(() => {
    if (user) {
      fetchServerNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchServerNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchServerNotifications = async () => {
    try {
      // Only fetch if user is authenticated and has a token
      const token = localStorage.getItem('token');
      if (!token || !user) {
        return;
      }

      let endpoint = '/api/notifications/user';
      if (user?.role === 'OWNER') {
        endpoint = '/api/notifications/owner';
      } else if (user?.role === 'ADMIN') {
        endpoint = '/api/notifications/admin';
      }

      const response = await api.get(endpoint);
      if (response.data) {
        // Show only unread notifications as toast
        const unreadNotifications = response.data.filter(n => !n.read);
        const newNotifications = unreadNotifications.filter(serverNotif => 
          !serverNotifications.some(existing => 
            existing.timestamp === serverNotif.timestamp && 
            existing.message === serverNotif.message
          )
        );

        if (newNotifications.length > 0) {
          newNotifications.forEach(notif => {
            showNotification(getNotificationTypeFromServer(notif.type), notif.message, notif.title);
          });
        }

        setServerNotifications(response.data);
      }
    } catch (error) {
      // Only log error if it's not a network/auth issue
      if (error.response?.status !== 401 && error.response?.status !== 403 && !error.isNetworkError) {
        console.error('Failed to fetch notifications:', error);
      }
    }
  };

  const getNotificationTypeFromServer = (serverType) => {
    switch (serverType) {
      case 'BOOKING_UPDATE': return 'info';
      case 'BOOKING_DELETED': return 'warning';
      case 'ESTABLISHMENT_APPROVED': return 'success';
      case 'ESTABLISHMENT_REJECTED': return 'error';
      case 'MENU_UPDATE': return 'info';
      case 'SYSTEM_ALERT': return 'warning';
      default: return 'info';
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'from-green-500 to-emerald-600 border-green-200';
      case 'error': return 'from-red-500 to-red-600 border-red-200';
      case 'warning': return 'from-yellow-500 to-orange-600 border-yellow-200';
      case 'info': return 'from-blue-500 to-indigo-600 border-blue-200';
      default: return 'from-slate-500 to-slate-600 border-slate-200';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-gradient-to-r ${getNotificationColor(notification.type)} text-white rounded-2xl shadow-2xl border-2 p-4 max-w-sm transform transition-all duration-300 animate-slide-in-right`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <span className="text-2xl flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </span>
              <div className="flex-1">
                {notification.title && (
                  <h4 className="font-bold text-sm mb-1">{notification.title}</h4>
                )}
                <p className="text-sm opacity-90">{notification.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/70 hover:text-white text-lg ml-2 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
        ))}
      </div>

      {/* Notification Bell (for persistent notifications) */}
      {serverNotifications.length > 0 && (
        <div className="fixed top-4 left-4 z-40">
          <div className="relative">
            <button className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors">
              🔔
              {serverNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {serverNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Utility function to show notifications
export const showNotification = (type, message, title = null) => {
  const event = new CustomEvent('showNotification', {
    detail: { type, message, title }
  });
  window.dispatchEvent(event);
};

export default NotificationSystem;