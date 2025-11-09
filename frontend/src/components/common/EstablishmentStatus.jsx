import React from 'react';
import { useRealTimeStatus } from '../../hooks/useRealTimeStatus';
import { StatusUtils } from '../../utils/realTimeStatus';

const EstablishmentStatus = ({ 
  establishmentId, 
  showIcon = true, 
  showText = true, 
  showLastUpdated = false,
  className = '',
  size = 'md',
  autoRefresh = true 
}) => {
  const { status, loading, error, lastUpdated, refresh } = useRealTimeStatus(
    establishmentId, 
    { autoRefresh }
  );

  if (loading && !status) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse">
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        </div>
        {showText && (
          <span className="text-gray-500 text-sm">Loading...</span>
        )}
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-red-500 text-sm">❌</span>
        {showText && (
          <span className="text-red-500 text-sm">Error</span>
        )}
        <button 
          onClick={refresh}
          className="text-blue-500 hover:text-blue-700 text-xs underline ml-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const statusColor = StatusUtils.getStatusColor(status);
  const statusIcon = StatusUtils.getStatusIcon(status);
  const statusText = StatusUtils.getStatusText(status);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <span className={`${sizeClasses[size]}`}>
          {statusIcon}
        </span>
      )}
      
      {showText && (
        <span className={`px-2 py-1 rounded-full font-medium ${statusColor} ${sizeClasses[size]}`}>
          {statusText}
        </span>
      )}
      
      {showLastUpdated && lastUpdated && (
        <span className="text-xs text-gray-500">
          Updated {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
      
      {loading && status && (
        <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  );
};

// Status toggle component for owners
export const StatusToggle = ({ 
  currentStatus, 
  onStatusChange, 
  disabled = false,
  className = '',
  establishmentId = null 
}) => {
  const statusOptions = [
    { value: 'OPEN', label: 'Open', color: 'bg-green-500 hover:bg-green-600', icon: '🟢' },
    { value: 'CLOSED', label: 'Closed', color: 'bg-red-500 hover:bg-red-600', icon: '🔴' },
    { value: 'BUSY', label: 'Busy', color: 'bg-yellow-500 hover:bg-yellow-600', icon: '🟡' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-gray-500 hover:bg-gray-600', icon: '🔧' }
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {statusOptions.map((option) => (
        <button
          key={option.value}
          onClick={async () => {
            await onStatusChange(option.value);
            // Force refresh of status cache
            if (establishmentId) {
              setTimeout(() => {
                StatusUtils.forceRefresh(establishmentId);
              }, 1000);
            }
          }}
          disabled={disabled}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium
            transition-all duration-200 transform hover:scale-105
            ${currentStatus === option.value 
              ? `${option.color} ring-2 ring-offset-2 ring-blue-500` 
              : `${option.color} opacity-70 hover:opacity-100`
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
          {currentStatus === option.value && (
            <span className="ml-2">✓</span>
          )}
        </button>
      ))}
    </div>
  );
};

// Booking availability indicator
export const BookingAvailability = ({ establishmentId, className = '' }) => {
  const { status, loading } = useRealTimeStatus(establishmentId);
  
  const canBook = StatusUtils.canBookNow(status);
  
  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-300 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${canBook ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className={`text-sm font-medium ${canBook ? 'text-green-700' : 'text-red-700'}`}>
        {canBook ? 'Available for Booking' : 'Not Available'}
      </span>
    </div>
  );
};

export default EstablishmentStatus;