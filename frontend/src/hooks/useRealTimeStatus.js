import { useState, useEffect, useCallback } from 'react';
import { RealTimeStatus } from '../utils/realTimeStatus';

// Hook for managing real-time establishment status
export const useRealTimeStatus = (establishmentId, options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enablePolling = false
  } = options;

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch status function
  const fetchStatus = useCallback(async () => {
    if (!establishmentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const newStatus = await RealTimeStatus.getEstablishmentStatus(establishmentId);
      setStatus(newStatus);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch establishment status:', err);
      setError(err.message || 'Failed to fetch status');
      
      // Try to get cached status as fallback
      const cachedStatus = RealTimeStatus.getCachedStatus(establishmentId);
      if (cachedStatus) {
        setStatus(cachedStatus);
      }
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Subscribe to status changes
  useEffect(() => {
    if (!establishmentId) return;

    // Subscribe to real-time updates
    const unsubscribe = RealTimeStatus.subscribe(establishmentId, (newStatus) => {
      setStatus(newStatus);
      setLastUpdated(new Date());
    });

    return unsubscribe;
  }, [establishmentId]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (!establishmentId) return;

    // Initial fetch
    fetchStatus();

    // Set up auto-refresh if enabled
    let intervalId;
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(fetchStatus, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [establishmentId, autoRefresh, refreshInterval, fetchStatus]);

  // Set up polling if enabled
  useEffect(() => {
    if (!establishmentId || !enablePolling) return;

    const stopPolling = RealTimeStatus.startPolling(establishmentId, refreshInterval);
    return stopPolling;
  }, [establishmentId, enablePolling, refreshInterval]);

  return {
    status,
    loading,
    error,
    lastUpdated,
    refresh,
    isStale: lastUpdated && (new Date() - lastUpdated) > refreshInterval
  };
};

// Hook for owner to manage their establishment status
export const useOwnerEstablishmentStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = useCallback(async (newStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await RealTimeStatus.updateOwnerEstablishmentStatus(newStatus);
      setStatus(response.status);
      
      return response;
    } catch (err) {
      console.error('Failed to update establishment status:', err);
      setError(err.message || 'Failed to update status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    status,
    loading,
    error,
    updateStatus
  };
};

// Hook for managing multiple establishment statuses
export const useMultipleEstablishmentStatuses = (establishmentIds = []) => {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatuses = useCallback(async () => {
    if (establishmentIds.length === 0) {
      setStatuses({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Limit the number of concurrent requests to prevent overwhelming the server
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < establishmentIds.length; i += batchSize) {
        batches.push(establishmentIds.slice(i, i + batchSize));
      }

      const newStatuses = {};
      for (const batch of batches) {
        try {
          const batchStatuses = await RealTimeStatus.getMultipleStatuses(batch);
          Object.assign(newStatuses, batchStatuses);
        } catch (batchError) {
          console.warn('Failed to fetch batch statuses:', batchError);
          // Continue with other batches
        }
      }
      
      setStatuses(newStatuses);
    } catch (err) {
      console.error('Failed to fetch multiple statuses:', err);
      setError(err.message || 'Failed to fetch statuses');
    } finally {
      setLoading(false);
    }
  }, [establishmentIds.join(',')]); // Use join to create stable dependency

  // Subscribe to status changes for all establishments (but limit subscriptions)
  useEffect(() => {
    if (establishmentIds.length > 20) {
      // Don't subscribe to too many establishments to prevent performance issues
      return;
    }

    const unsubscribes = establishmentIds.map(id => 
      RealTimeStatus.subscribe(id, (newStatus, establishmentId) => {
        setStatuses(prev => ({
          ...prev,
          [establishmentId]: newStatus
        }));
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [establishmentIds.join(',')]);

  // Initial fetch with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStatuses();
    }, 100); // Small delay to debounce rapid changes

    return () => clearTimeout(timeoutId);
  }, [fetchStatuses]);

  return {
    statuses,
    loading,
    error,
    refresh: fetchStatuses
  };
};

export default useRealTimeStatus;