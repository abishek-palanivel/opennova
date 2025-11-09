// Utility functions for time formatting and operating hours

export const formatTime = (time) => {
  if (!time) return '';
  
  // If time is already in 12-hour format, return as is
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatOperatingHours = (establishment) => {
  if (!establishment.operatingHours) {
    return '24/7';
  }
  
  const hours = establishment.operatingHours.trim();
  
  // If it's already a clean format, return as is
  if (hours === '24/7' || hours.match(/^\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)$/i)) {
    return hours;
  }
  
  // Try to parse and format common patterns
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
  const match = hours.match(timePattern);
  
  if (match) {
    const startHour = match[1];
    const startMin = match[2];
    const startAmPm = match[3] || '';
    const endHour = match[4];
    const endMin = match[5];
    const endAmPm = match[6] || '';
    
    return `${startHour}:${startMin} ${startAmPm} - ${endHour}:${endMin} ${endAmPm}`.replace(/\s+/g, ' ').trim();
  }
  
  // If it contains problematic data, return a fallback
  if (hours.includes('"') || hours.includes('{') || hours.includes('monday')) {
    return 'Contact for hours';
  }
  
  return hours;
};

export const getOperatingStatus = (establishment) => {
  // For now, just return the establishment status from the backend
  // In the future, this could be enhanced to check actual operating hours
  return establishment.status || 'UNKNOWN';
};

export const getTodayOperatingHours = (establishment) => {
  // First, try to get today's specific hours from weeklySchedule
  if (establishment.weeklySchedule) {
    try {
      const schedule = typeof establishment.weeklySchedule === 'string' 
        ? JSON.parse(establishment.weeklySchedule) 
        : establishment.weeklySchedule;
      
      // Get today's day name
      const today = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayKey = dayNames[today.getDay()];
      
      const todayData = schedule[todayKey];
      
      if (todayData) {
        if (todayData.isClosed || !todayData.isOpen) {
          return 'Closed Today';
        }
        
        const openTime = formatTime(todayData.startTime || todayData.openTime);
        const closeTime = formatTime(todayData.endTime || todayData.closeTime);
        
        if (openTime && closeTime) {
          return `${openTime} - ${closeTime}`;
        }
      }
    } catch (error) {
      console.error('Error parsing weeklySchedule for today\'s hours:', error);
      // Fall through to use operatingHours
    }
  }
  
  // Fallback to general operating hours
  if (!establishment.operatingHours) {
    return '24/7';
  }
  
  const hours = establishment.operatingHours.trim();
  
  // If it's already a clean format like "9:00 AM - 9:00 PM", return as is
  if (hours.match(/^\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)$/i)) {
    return hours;
  }
  
  // If it's 24/7, return as is
  if (hours === '24/7') {
    return '24/7';
  }
  
  // Try to parse and format common patterns
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
  const match = hours.match(timePattern);
  
  if (match) {
    const startHour = match[1];
    const startMin = match[2];
    const startAmPm = match[3] || '';
    const endHour = match[4];
    const endMin = match[5];
    const endAmPm = match[6] || '';
    
    return `${startHour}:${startMin} ${startAmPm} - ${endHour}:${endMin} ${endAmPm}`.replace(/\s+/g, ' ').trim();
  }
  
  // If it contains problematic data, return a fallback
  if (hours.includes('"') || hours.includes('{') || hours.includes('monday')) {
    return 'Contact for hours';
  }
  
  // Return as is if it's a simple format
  return hours;
};

// Additional utility functions for date and time formatting
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTimeTo12Hour = (timeString) => {
  if (!timeString) return '';
  
  // If already in 12-hour format, return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
  return formatTime(timeString);
};

export const getWeeklyScheduleDisplay = (establishment) => {
  // Check if establishment has weeklySchedule data
  if (establishment.weeklySchedule) {
    try {
      const schedule = typeof establishment.weeklySchedule === 'string' 
        ? JSON.parse(establishment.weeklySchedule) 
        : establishment.weeklySchedule;
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      return days.map(day => {
        const dayKey = day.toLowerCase();
        const dayData = schedule[dayKey];
        
        if (!dayData) {
          return {
            day,
            isOpen: false,
            hours: 'Closed',
            status: 'CLOSED'
          };
        }
        
        if (dayData.isClosed || !dayData.isOpen) {
          return {
            day,
            isOpen: false,
            hours: 'Closed',
            status: 'CLOSED'
          };
        }
        
        const openTime = formatTime(dayData.startTime || dayData.openTime);
        const closeTime = formatTime(dayData.endTime || dayData.closeTime);
        const status = dayData.status || 'OPEN';
        
        return {
          day,
          isOpen: true,
          hours: `${openTime} - ${closeTime}`,
          status: status
        };
      });
    } catch (error) {
      console.error('Error parsing weekly schedule:', error);
      return null;
    }
  }
  
  // Fallback to general operating hours for all days
  if (establishment.operatingHours) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const generalHours = formatOperatingHours(establishment);
    
    return days.map(day => ({
      day,
      isOpen: generalHours !== 'Closed' && generalHours !== 'Contact for hours',
      hours: generalHours,
      status: establishment.status || 'OPEN'
    }));
  }
  
  return null;
};