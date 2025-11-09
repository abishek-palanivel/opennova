import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import WeeklyScheduleManager from './WeeklyScheduleManager';
import GoogleMap from '../common/GoogleMap';
import { getImageUrl } from '../../utils/imageUtils';
import ImageWithFallback from '../common/ImageWithFallback';

const EstablishmentSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    operatingHours: '',
    upiId: '',
    status: 'OPEN',
    latitude: '',
    longitude: ''
  });

  const [qrCodeFile, setQrCodeFile] = useState(null);



  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationData, setLocationData] = useState({
    latitude: '',
    longitude: '',
    address: ''
  });
  const [updatingLocation, setUpdatingLocation] = useState(false);

  useEffect(() => {
    fetchEstablishmentData();
  }, []);

  const fetchEstablishmentData = async () => {
    try {
      const response = await api.get('/api/owner/establishment');
      setEstablishment(response.data);
      setFormData({
        name: response.data.name || '',
        address: response.data.address || '',
        contactNumber: response.data.contactNumber || '',
        operatingHours: response.data.operatingHours || '',
        upiId: response.data.upiId || '',
        status: response.data.status || 'OPEN',
        latitude: response.data.latitude || '',
        longitude: response.data.longitude || ''
      });
      
      setLocationData({
        latitude: response.data.latitude || '',
        longitude: response.data.longitude || '',
        address: response.data.address || ''
      });
    } catch (error) {
      console.error('Failed to fetch establishment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQRCodeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setQrCodeFile(file);
    }
  };



  const handleUpdateEstablishment = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields (excluding status - we'll handle that separately)
      Object.keys(formData).forEach(key => {
        if (formData[key] && key !== 'status') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add QR code file if selected
      if (qrCodeFile) {
        formDataToSend.append('upiQrCode', qrCodeFile);
      }



      // Update establishment profile
      await api.put('/api/owner/establishment/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update status separately using dedicated endpoint for better real-time sync
      if (formData.status !== establishment?.status) {
        await api.put('/api/owner/establishment/status', { 
          status: formData.status 
        });
      }
      
      alert('Establishment updated successfully!');
      fetchEstablishmentData();

    } catch (error) {
      console.error('Failed to update establishment:', error);
      alert('Failed to update establishment. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await api.put('/api/owner/establishment/status', { 
        status: newStatus 
      });
      
      // Update local state immediately
      setFormData(prev => ({ ...prev, status: newStatus }));
      setEstablishment(prev => ({ ...prev, status: newStatus }));
      
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteEstablishment = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type "DELETE" to confirm deletion.');
      return;
    }

    setDeleting(true);

    try {
      await api.delete('/api/owner/establishment');
      alert('Establishment deleted successfully. You will be logged out.');
      
      // Logout user and redirect to home
      logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete establishment:', error);
      alert('Failed to delete establishment. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleLocationUpdate = async (e) => {
    e.preventDefault();
    setUpdatingLocation(true);

    try {
      const locationUpdateData = {
        latitude: parseFloat(locationData.latitude) || null,
        longitude: parseFloat(locationData.longitude) || null,
        address: locationData.address
      };

      await api.put('/api/owner/establishment/location', locationUpdateData);
      alert('Location updated successfully!');
      fetchEstablishmentData();
      setShowLocationModal(false);
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('Failed to update location. Please try again.');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!window.confirm('Are you sure you want to delete the location coordinates? This will remove your establishment from map-based searches.')) {
      return;
    }

    try {
      await api.delete('/api/owner/establishment/location');
      alert('Location coordinates deleted successfully!');
      fetchEstablishmentData();
      setLocationData({
        latitude: '',
        longitude: '',
        address: formData.address
      });
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('Failed to delete location. Please try again.');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enter coordinates manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Establishment Settings</h1>
        <p className="text-gray-600 mt-2">Manage your establishment details and preferences</p>
      </div>

      {/* Update Establishment Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Establishment Information</h2>
        
        <form onSubmit={handleUpdateEstablishment} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Establishment Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating Hours
              </label>
              <input
                type="text"
                name="operatingHours"
                value={formData.operatingHours}
                onChange={handleInputChange}
                placeholder="e.g., 9:00 AM - 9:00 PM"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleInputChange}
                placeholder="e.g., merchant@paytm"
                className="input-field"
              />
            </div>
          </div>

          {/* UPI QR Code Upload Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">UPI Payment QR Code</h3>
            <p className="text-blue-700 text-sm mb-4">
              Upload your UPI QR code image to make payments easier for customers. This QR code will be shown during the booking payment process.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current QR Code Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current QR Code
                </label>
                <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                  {establishment?.upiQrCodePath ? (
                    <img 
                      src={getImageUrl(establishment.upiQrCodePath)} 
                      alt="UPI QR Code" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📱</div>
                      <p className="text-sm">No QR Code uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New QR Code
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQRCodeChange}
                  className="hidden"
                  id="upi-qr-upload"
                />
                <label
                  htmlFor="upi-qr-upload"
                  className="cursor-pointer w-48 h-48 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <div className="text-center text-blue-600">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs">PNG, JPG up to 5MB</p>
                  </div>
                </label>
                
                {qrCodeFile && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      ✅ New QR code selected: {qrCodeFile.name}
                    </p>
                    <p className="text-green-600 text-xs mt-1">
                      Save the form to upload this QR code
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">📋 QR Code Guidelines</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Use a clear, high-quality image of your UPI QR code</li>
                <li>• Ensure the QR code is scannable and not blurry</li>
                <li>• Include your business name or UPI ID in the QR code</li>
                <li>• Test the QR code before uploading to ensure it works</li>
                <li>• Recommended size: 500x500 pixels or larger</li>
              </ul>
            </div>
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="space-y-3">
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="BUSY">Busy</option>
              </select>
              
              {/* Quick Status Update Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('OPEN')}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.status === 'OPEN' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  🟢 Open
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('CLOSED')}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.status === 'CLOSED' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  🔴 Closed
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('BUSY')}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.status === 'BUSY' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  🟡 Busy
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Use the buttons above for quick status updates, or use the dropdown and save the form for bulk changes.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="btn-primary"
            >
              {updating ? 'Updating...' : 'Update Establishment'}
            </button>
          </div>
        </form>
      </div>

      {/* Location Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Location Management</h2>
          <button
            onClick={() => setShowLocationModal(true)}
            className="btn-outline"
          >
            📍 Edit Location
          </button>
        </div>

        {establishment?.latitude && establishment?.longitude ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Coordinates</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Latitude:</span> {establishment.latitude}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Longitude:</span> {establishment.longitude}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
                  >
                    ✏️ Edit Coordinates
                  </button>
                  <button
                    onClick={handleDeleteLocation}
                    className="w-full text-left text-sm text-red-600 hover:text-red-800"
                  >
                    🗑️ Delete Location
                  </button>
                </div>
              </div>
            </div>

            {/* Map Display */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-4">Location Preview</h3>
              <GoogleMap 
                address={establishment.address}
                latitude={establishment.latitude}
                longitude={establishment.longitude}
                height="400px"
                className="rounded-lg overflow-hidden"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Location Set</h3>
            <p className="text-gray-600 mb-4">
              Add location coordinates to help customers find your establishment on the map.
            </p>
            <button
              onClick={() => setShowLocationModal(true)}
              className="btn-primary"
            >
              Add Location
            </button>
          </div>
        )}
      </div>

      {/* Weekly Schedule Management */}
      <WeeklyScheduleManager 
        establishment={establishment}
        onScheduleUpdate={(newSchedule) => {
          setEstablishment(prev => ({
            ...prev,
            weeklySchedule: newSchedule
          }));
        }}
      />

      {/* Danger Zone */}
      <div className="card border-red-200 bg-red-50">
        <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
        <div className="bg-white p-6 rounded-lg border border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-red-900 mb-2">Delete Establishment</h3>
              <p className="text-red-700 mb-4">
                Permanently delete your establishment and all associated data. This action cannot be undone.
              </p>
              <div className="text-sm text-red-600 space-y-1">
                <p>• All bookings will be cancelled and customers will be refunded</p>
                <p>• All reviews and ratings will be permanently removed</p>
                <p>• All menu items, doctors, or collections will be deleted</p>
                <p>• Your establishment will be removed from user searches</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete Establishment
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Delete Establishment</h3>
              <p className="text-gray-600">
                This will permanently delete your establishment and all associated data.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="input-field"
                placeholder="DELETE"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEstablishment}
                disabled={deleting || deleteConfirmation !== 'DELETE'}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Management Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Manage Location</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLocationUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={locationData.address}
                  onChange={(e) => setLocationData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="input-field"
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={locationData.latitude}
                    onChange={(e) => setLocationData(prev => ({ ...prev, latitude: e.target.value }))}
                    className="input-field"
                    placeholder="e.g., 10.9638"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={locationData.longitude}
                    onChange={(e) => setLocationData(prev => ({ ...prev, longitude: e.target.value }))}
                    className="input-field"
                    placeholder="e.g., 78.0484"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Get Current Location</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Click the button below to automatically fill in your current coordinates.
                </p>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📍 Use Current Location
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">How to find coordinates:</h4>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Open Google Maps</li>
                  <li>2. Search for your establishment</li>
                  <li>3. Right-click on the location</li>
                  <li>4. Click on the coordinates to copy them</li>
                </ol>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={updatingLocation}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingLocation}
                  className="flex-1 btn-primary"
                >
                  {updatingLocation ? 'Updating...' : 'Update Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstablishmentSettings;