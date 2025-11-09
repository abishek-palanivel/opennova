// Application Constants
export const APP_CONFIG = {
  name: 'OpenNova',
  version: '1.0.0',
  description: 'Smart Booking & Management Platform',
  
  // Google Maps Configuration
  googleMaps: {
    apiKey: 'AIzaSyAB0k05dH8yvtYU3LsjQdOAeDdgiXBku88',
    defaultZoom: 15,
    defaultCenter: { lat: 28.6139, lng: 77.2090 } // Delhi, India
  },
  
  // UPI Payment Configuration
  payment: {
    upiId: 'merchant@paytm', // Replace with actual merchant UPI ID
    advancePercentage: 70,
    refundProcessingTime: '24 hours'
  },
  
  // Booking Configuration
  booking: {
    visitingDuration: 2, // hours
    minimumAdvanceBooking: 2, // hours
    cancellationPolicy: {
      fullRefundHours: 2,
      noRefundHours: 2
    }
  },
  
  // Establishment Types
  establishmentTypes: {
    HOTEL: {
      name: 'Hotel',
      icon: '🏨',
      description: 'Accommodation & Dining',
      color: 'from-blue-500 to-blue-600'
    },
    HOSPITAL: {
      name: 'Hospital',
      icon: '🏥',
      description: 'Healthcare Services',
      color: 'from-red-500 to-red-600'
    },
    SHOP: {
      name: 'Shop',
      icon: '🛍️',
      description: 'Clothing & Fashion',
      color: 'from-green-500 to-green-600'
    }
  },
  
  // Status Colors
  statusColors: {
    OPEN: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-red-100 text-red-800 border-red-200',
    BUSY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  
  // Contact Information
  contact: {
    email: 'abishekopennova@gmail.com',
    phone: '+91 98765 43210',
    supportHours: '24/7'
  },
  
  // Feature Flags
  features: {
    googleMapsIntegration: true,
    upiPayments: true,
    qrCodeGeneration: true,
    reviewSystem: true,
    realTimeNotifications: true
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout'
  },
  
  // User Endpoints
  user: {
    profile: '/api/user/profile',
    stats: '/api/user/stats',
    bookings: '/api/user/bookings',
    recentBookings: '/api/user/recent-bookings',
    reviews: '/api/user/reviews',
    establishmentRequests: '/api/user/establishment-requests',
    submitReview: '/api/user/reviews',
    establishmentReviews: (id) => `/api/user/establishments/${id}/reviews`
  },
  
  // Public Endpoints
  public: {
    establishments: '/api/public/establishments',
    establishmentDetails: (id) => `/api/public/establishments/${id}`,
    search: '/api/public/establishments/search'
  },
  
  // Owner Endpoints
  owner: {
    establishment: '/api/owner/establishment',
    stats: '/api/owner/stats',
    bookings: '/api/owner/bookings',
    menus: '/api/owner/menus',
    doctors: '/api/owner/doctors',
    collections: '/api/owner/collections'
  },

  // Admin Endpoints
  admin: {
    dashboard: '/api/admin/dashboard',
    users: '/api/admin/users',
    establishments: '/api/admin/establishments',
    approveEstablishment: '/api/admin/approve-establishment',
    analytics: '/api/admin/analytics'
  }
};

// Utility Functions
export const UTILS = {
  // Format currency
  formatCurrency: (amount) => `₹${amount.toLocaleString('en-IN')}`,
  
  // Format date
  formatDate: (date) => new Date(date).toLocaleDateString('en-IN'),
  
  // Format time
  formatTime: (time) => new Date(`2000-01-01T${time}`).toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }),
  
  // Get establishment icon
  getEstablishmentIcon: (type) => APP_CONFIG.establishmentTypes[type]?.icon || '🏢',
  
  // Get establishment color
  getEstablishmentColor: (type) => APP_CONFIG.establishmentTypes[type]?.color || 'from-gray-500 to-gray-600',
  
  // Get status color
  getStatusColor: (status) => APP_CONFIG.statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200',
  
  // Generate transaction ID
  generateTransactionId: () => 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
  
  // Calculate advance payment
  calculateAdvancePayment: (totalAmount) => Math.round(totalAmount * (APP_CONFIG.payment.advancePercentage / 100)),
  
  // Check if booking can be cancelled
  canCancelBooking: (booking) => {
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      return false;
    }
    
    const bookingTime = new Date(booking.bookingDate);
    const now = new Date();
    const timeDiff = bookingTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    return hoursDiff > APP_CONFIG.booking.cancellationPolicy.fullRefundHours;
  },
  
  // Get Google Maps URL
  getGoogleMapsUrl: (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
  
  // Get directions URL
  getDirectionsUrl: (address) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
  
  // Get time-based greeting
  getTimeBasedGreeting: () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! ☀️';
    if (hour < 18) return 'Good Afternoon! 🌤️';
    return 'Good Evening! 🌙';
  }
};

export default APP_CONFIG;