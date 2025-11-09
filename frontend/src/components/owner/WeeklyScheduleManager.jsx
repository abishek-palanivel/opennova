import { useState, useEffect } from 'react';
import api from '../../utils/api';

const WeeklyScheduleManager = ({ establishment, onScheduleUpdate }) => {
  const [schedule, setSchedule] = useState({
    monday: { openTime: '09:00', closeTime: '21:00', status: 'OPEN', isClosed: false },
    tuesday: { openTime: '09:00', closeTime: '21:00', status: 'OPEN', isClosed: false },
    wednesday: { openTime: '09:00', closeTime: '21:00', status: 'OPEN', isClosed: false },
    thursday: { openTime: '09:00', closeTime: '21:00', status: 'OPEN', isClosed: false },
    friday: { openTime: '09:00', closeTime: '21:00', status: 'OPEN', isClosed: false },
    saturday: { openTime: '09:00', closeTime: '21:00', status: 'OPEN', isClosed: false },
    sunday: { openTime: '09:00', closeTime: '21:00', status: 'OPEN', isClosed: false }
  });
  
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    if (establishment?.weeklySchedule) {
      try {
        const existingSchedule = typeof establishment.weeklySchedule === 'string' 
          ? JSON.parse(establishment.weeklySchedule) 
          : establishment.weeklySchedule;
        setSchedule(prev => ({ ...prev, ...existingSchedule }));
      } catch (error) {
        console.error('Error parsing existing schedule:', error);
      }
    }
  }, [establishment]);

  const handleTimeChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleStatusChange = (day, status) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        status: status,
        isClosed: status === 'CLOSED'
      }
    }));
  };

  const handleClosedToggle = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isClosed: !prev[day].isClosed,
        status: !prev[day].isClosed ? 'CLOSED' : 'OPEN'
      }
    }));
  };

  const applyToAllDays = (sourceDay) => {
    const sourceSchedule = schedule[sourceDay];
    const newSchedule = {};
    
    days.forEach(({ key }) => {
      newSchedule[key] = { ...sourceSchedule };
    });
    
    setSchedule(newSchedule);
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const scheduleData = {
        weeklySchedule: JSON.stringify(schedule)
      };
      
      await api.put('/api/owner/establishment/schedule', scheduleData);
      
      if (onScheduleUpdate) {
        onScheduleUpdate(schedule);
      }
      
      alert('Weekly schedule updated successfully!');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatTime12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Weekly Schedule</h3>
          <p className="text-gray-600 text-sm mt-1">
            Set your operating hours and status for each day of the week
          </p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          {showAdvanced ? 'Simple View' : 'Advanced Settings'}
        </button>
      </div>

      <div className="space-y-4">
        {days.map(({ key, label }) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <h4 className="font-semibold text-gray-900 w-20">{label}</h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={schedule[key]?.isClosed || false}
                    onChange={() => handleClosedToggle(key)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Closed</span>
                </label>
              </div>
              
              {showAdvanced && (
                <button
                  onClick={() => applyToAllDays(key)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Apply to All Days
                </button>
              )}
            </div>

            {!schedule[key]?.isClosed && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open Time
                  </label>
                  <input
                    type="time"
                    value={schedule[key]?.openTime || '09:00'}
                    onChange={(e) => handleTimeChange(key, 'openTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime12Hour(schedule[key]?.openTime || '09:00')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Close Time
                  </label>
                  <input
                    type="time"
                    value={schedule[key]?.closeTime || '21:00'}
                    onChange={(e) => handleTimeChange(key, 'closeTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime12Hour(schedule[key]?.closeTime || '21:00')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={schedule[key]?.status || 'OPEN'}
                    onChange={(e) => handleStatusChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="OPEN">🟢 Open</option>
                    <option value="BUSY">🟡 Busy</option>
                    <option value="CLOSED">🔴 Closed</option>
                  </select>
                </div>
              </div>
            )}

            {schedule[key].isClosed && (
              <div className="text-center py-4 bg-gray-50 rounded-md">
                <span className="text-gray-500 font-medium">🔒 Closed all day</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>💡 Tip: Use "Apply to All Days" to quickly set the same schedule for all days</p>
          </div>
          <button
            onClick={saveSchedule}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Schedule Preview</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {days.map(({ key, label }) => (
            <div key={key} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 text-sm">{label}</span>
                <div className="flex items-center space-x-2">
                  {schedule[key].isClosed ? (
                    <span className="text-red-500 text-sm font-medium">Closed</span>
                  ) : (
                    <>
                      <span className="text-gray-600 text-xs">
                        {formatTime12Hour(schedule[key].openTime)} - {formatTime12Hour(schedule[key].closeTime)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        schedule[key].status === 'OPEN' ? 'bg-green-100 text-green-700' :
                        schedule[key].status === 'BUSY' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {schedule[key].status === 'OPEN' ? 'Open' :
                         schedule[key].status === 'BUSY' ? 'Busy' : 'Closed'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleManager;