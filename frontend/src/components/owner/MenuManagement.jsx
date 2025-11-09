import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { getImageUrl } from '../../utils/imageUtils';
import ImageWithFallback from '../common/ImageWithFallback';

const MenuManagement = () => {
  const { user } = useAuth();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    availabilityTime: '',
    preparationTime: 15,
    isVegetarian: false,
    isAvailable: true,
    isSpecial: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      console.log('🔄 Fetching menus...');
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await api.get(`/api/owner/menus?_t=${timestamp}`);
      console.log('✅ Menu response:', response.data);
      
      // Log menu data for debugging if needed
      if (Array.isArray(response.data)) {
        console.log(`📝 Loaded ${response.data.length} menu items`);
        response.data.forEach((menu, index) => {
          console.log(`  ${index + 1}. ${menu.name} - ₹${menu.price} (ID: ${menu.id})`);
        });
      }
      
      setMenus(response.data);
    } catch (error) {
      console.error('❌ Error fetching menus:', error);
      setMenus([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF, etc.)');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      console.log('📷 Image selected:', {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
        type: file.type
      });
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadingImage(true);
    
    try {
      console.log('🚀 Submitting menu form...');
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('preparationTime', formData.preparationTime.toString());
      formDataToSend.append('isVegetarian', formData.isVegetarian.toString());
      formDataToSend.append('isSpecial', formData.isSpecial.toString());
      formDataToSend.append('isAvailable', formData.isAvailable.toString());
      
      if (formData.availabilityTime) {
        formDataToSend.append('availabilityTime', formData.availabilityTime);
      }

      // Add image file if selected
      if (imageFile) {
        console.log('📷 Adding image to form data:', imageFile.name);
        formDataToSend.append('image', imageFile);
      }

      // Log form data for debugging
      console.log('📝 Form data being sent:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }

      let response;
      if (editingMenu) {
        console.log('✏️ Updating menu item:', editingMenu.id);
        response = await api.put(`/api/owner/menus/${editingMenu.id}/with-image`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        console.log('➕ Creating new menu item');
        response = await api.post('/api/owner/menus/with-image', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      console.log('✅ Menu save response:', response.data);
      
      await fetchMenus(); // Refresh the menu list
      resetForm();
      alert(editingMenu ? '✅ Menu item updated successfully!' : '✅ Menu item added successfully!');
    } catch (error) {
      console.error('❌ Error saving menu:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`❌ Failed to save menu item: ${errorMessage}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (menu) => {
    console.log('✏️ Editing menu:', menu);
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      description: menu.description || '',
      price: menu.price.toString(),
      category: menu.category || '',
      availabilityTime: menu.availabilityTime || '',
      preparationTime: menu.preparationTime || 15,
      isVegetarian: menu.isVegetarian || false,
      isAvailable: menu.isAvailable !== false,
      isSpecial: menu.isSpecial || false
    });
    
    // Set image preview if menu has an image
    if (menu.imagePath) {
      const imageUrl = getImageUrl(menu.imagePath);
      console.log('🖼️ Setting image preview:', imageUrl);
      setImagePreview(imageUrl);
    } else {
      console.log('📷 No image found for menu item');
      setImagePreview(null);
    }
    
    setImageFile(null); // Clear any selected file
    setShowAddForm(true);
  };

  const handleDelete = async (menuId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.delete(`/api/owner/menus/${menuId}`);
        fetchMenus();
        alert('Menu item deleted successfully!');
      } catch (error) {
        console.error('Error deleting menu:', error);
        alert('Failed to delete menu item. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      availabilityTime: '',
      preparationTime: 15,
      isVegetarian: false,
      isAvailable: true,
      isSpecial: false
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingMenu(null);
    setShowAddForm(false);
  };



  const toggleAvailability = async (menuId, currentStatus) => {
    try {
      await api.patch(`/api/owner/menus/${menuId}/availability`, {
        isAvailable: !currentStatus
      });
      fetchMenus();
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingMenu ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Appetizer">Appetizer</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Special">Special</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="preparationTime"
                    value={formData.preparationTime}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability Time
                </label>
                <input
                  type="text"
                  name="availabilityTime"
                  value={formData.availabilityTime}
                  onChange={handleInputChange}
                  placeholder="e.g., 9:00 AM - 11:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isVegetarian"
                    checked={formData.isVegetarian}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Vegetarian
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Available
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isSpecial"
                    checked={formData.isSpecial}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Special Item
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading...' : (editingMenu ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No menu items found.</p>
            <p className="text-gray-400">Add your first menu item to get started!</p>
          </div>
        ) : (
          menus.map((menu) => (
            <div key={menu.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <ImageWithFallback
                src={getImageUrl(menu.imagePath)}
                alt={menu.name}
                className="w-full h-48 object-cover"
                type="menu"
              />
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{menu.name}</h3>
                  <div className="flex space-x-1">
                    {menu.isVegetarian && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Veg
                      </span>
                    )}
                    {menu.isSpecial && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Special
                      </span>
                    )}
                  </div>
                </div>

                {menu.description && (
                  <p className="text-gray-600 text-sm mb-2">{menu.description}</p>
                )}

                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-bold text-green-600">₹{menu.price}</span>
                  <span className="text-sm text-gray-500">
                    {menu.preparationTime} mins
                  </span>
                </div>

                {menu.category && (
                  <p className="text-sm text-gray-500 mb-2">Category: {menu.category}</p>
                )}

                {menu.availabilityTime && (
                  <p className="text-sm text-gray-500 mb-3">
                    Available: {menu.availabilityTime}
                  </p>
                )}

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggleAvailability(menu.id, menu.isAvailable)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      menu.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {menu.isAvailable ? 'Available' : 'Unavailable'}
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(menu)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(menu.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MenuManagement;