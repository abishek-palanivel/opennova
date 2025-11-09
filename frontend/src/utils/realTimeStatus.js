import api from './api';

// Cache for establishment statuses
const statusCache = new Map();
const statusListeners = new Map();

// Real-time status management
export const RealTimeStatus = {
  // Get establishment status with caching
  async getEstablishmentStatus(establishmentId) {
    try {
      const response = await api.get(`/api/public/establishments/${establishmentId}/status`);
      const status = response.data.status;
      
      // Update cache
      statusCache.set(establishmentId, {
        status,
        timestamp: new Date(),
        establishmentId
      });
      
      // Notify listeners
      this.notifyListeners(establishmentId, status);
      
      return status;
    } catch (error) {
      console.error('Failed to get establishment status:', error);
      // Return cached status if available
      const cached = statusCache.get(establishmentId);
      return cached ? cached.status : 'UNKNOWN';
    }
  },

  // Subscribe to status changes
  subscribe(establishmentId, callback) {
    if (!statusListeners.has(establishmentId)) {
      statusListeners.set(establishmentId, new Set());
    }
    statusListeners.get(establishmentId).add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = statusListeners.get(establishmentId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          statusListeners.delete(establishmentId);
        }
      }
    };
  },

  // Notify all listeners of status change
  notifyListeners(establishmentId, status) {
    const listeners = statusListeners.get(establishmentId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(status, establishmentId);
        } catch (error) {
          console.error('Error in status listener:', error);
        }
      });
    }
  },

  // Get cached status
  getCachedStatus(establishmentId) {
    const cached = statusCache.get(establishmentId);
    return cached ? cached.status : null;
  },

  // Update owner establishment status
  async updateOwnerEstablishmentStatus(status) {
    try {
      console.log('Updating establishment status to:', status);
      const response = await api.put('/api/owner/establishment/status', { status });
      
      console.log('Status update response:', response.data);
      
      if (response.data.establishmentId) {
        // Update cache immediately
        statusCache.set(response.data.establishmentId, {
          status: response.data.status,
          timestamp: new Date(),
          establishmentId: response.data.establishmentId
        });
        
        // Notify listeners
        this.notifyListeners(response.data.establishmentId, response.data.status);
        
        // Also clear cache for public endpoints to force refresh
        this.clearCache();
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to update establishment status:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Start polling for status updates (for critical establishments)
  startPolling(establishmentId, intervalMs = 30000) {
    const pollInterval = setInterval(async () => {
      try {
        await this.getEstablishmentStatus(establishmentId);
      } catch (error) {
        console.error('Polling error for establishment', establishmentId, error);
      }
    }, intervalMs);

    // Return stop function
    return () => clearInterval(pollInterval);
  },

  // Clear cache for establishment
  clearCache(establishmentId) {
    if (establishmentId) {
      statusCache.delete(establishmentId);
    } else {
      statusCache.clear();
    }
  },

  // Get all cached statuses
  getAllCachedStatuses() {
    const statuses = {};
    statusCache.forEach((value, key) => {
      statuses[key] = value.status;
    });
    return statuses;
  },

  // Check if status is fresh (less than 1 minute old)
  isStatusFresh(establishmentId) {
    const cached = statusCache.get(establishmentId);
    if (!cached) return false;
    
    const now = new Date();
    const age = now - cached.timestamp;
    return age < 60000; // 1 minute
  },

  // Batch get multiple establishment statuses
  async getMultipleStatuses(establishmentIds) {
    const promises = establishmentIds.map(id => this.getEstablishmentStatus(id));
    try {
      const statuses = await Promise.allSettled(promises);
      const result = {};
      
      establishmentIds.forEach((id, index) => {
        const status = statuses[index];
        result[id] = status.status === 'fulfilled' ? status.value : 'UNKNOWN';
      });
      
      return result;
    } catch (error) {
      console.error('Failed to get multiple statuses:', error);
      return {};
    }
  }
};

// Status display utilities
export const StatusUtils = {
  getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'text-green-600 bg-green-100';
      case 'CLOSED':
        return 'text-red-600 bg-red-100';
      case 'BUSY':
        return 'text-yellow-600 bg-yellow-100';
      case 'MAINTENANCE':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  getStatusIcon(status) {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return '🟢';
      case 'CLOSED':
        return '🔴';
      case 'BUSY':
        return '🟡';
      case 'MAINTENANCE':
        return '🔧';
      default:
        return '❓';
    }
  },

  getStatusText(status) {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'Open';
      case 'CLOSED':
        return 'Closed';
      case 'BUSY':
        return 'Busy';
      case 'MAINTENANCE':
        return 'Under Maintenance';
      default:
        return 'Unknown';
    }
  },

  canBookNow(status) {
    return status?.toUpperCase() === 'OPEN';
  },

  forceRefresh(establishmentId) {
    // Clear cache and force refresh
    RealTimeStatus.clearCache(establishmentId);
    return RealTimeStatus.getEstablishmentStatus(establishmentId);
  }
};

export default RealTimeStatus;