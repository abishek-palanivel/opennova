/**
 * Utility functions for handling image URLs
 */

const API_BASE_URL = 'http://localhost:8080';

/**
 * Get the correct image URL for uploaded files
 * @param {string} imagePath - The image path from the backend
 * @returns {string} - The complete image URL or fallback
 */
export const getImageUrl = (imagePath) => {
  // Handle null, undefined, or empty string
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    console.log('No image path provided, using fallback');
    return getFallbackImageUrl();
  }
  
  // If it's already a complete URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Handle empty path after cleaning
  if (!cleanPath) {
    console.log('Empty path after cleaning, using fallback');
    return getFallbackImageUrl();
  }
  
  // Split path into directory and filename for the API endpoint
  const pathParts = cleanPath.split('/');
  
  if (pathParts.length >= 2) {
    const directory = pathParts[0];
    const filename = pathParts.slice(1).join('/');
    const imageUrl = `${API_BASE_URL}/api/images/${directory}/${filename}`;
    console.log('Generated image URL:', imageUrl, 'from path:', imagePath);
    return imageUrl;
  }
  
  // Fallback to direct uploads path if path format is unexpected
  const fallbackUrl = `${API_BASE_URL}/api/images/default/${cleanPath}`;
  console.log('Using fallback URL:', fallbackUrl, 'from path:', imagePath);
  return fallbackUrl;
};

/**
 * Get a fallback image URL for when the main image fails to load
 * @param {string} type - The type of establishment/item
 * @returns {string} - A fallback image URL
 */
export const getFallbackImageUrl = (type) => {
  // Create attractive gradient placeholders based on type
  const getTypeConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'hotel':
        return { 
          icon: '🏨', 
          gradient: 'from-blue-400 to-blue-600',
          text: 'Hotel Item',
          bgColor: '#3B82F6'
        };
      case 'hospital':
        return { 
          icon: '🏥', 
          gradient: 'from-red-400 to-red-600',
          text: 'Medical Service',
          bgColor: '#EF4444'
        };
      case 'shop':
        return { 
          icon: '🛍️', 
          gradient: 'from-green-400 to-green-600',
          text: 'Shop Product',
          bgColor: '#10B981'
        };
      case 'menu':
        return { 
          icon: '🍽️', 
          gradient: 'from-orange-400 to-orange-600',
          text: 'Menu Item',
          bgColor: '#F97316'
        };
      default:
        return { 
          icon: '📷', 
          gradient: 'from-gray-400 to-gray-600',
          text: 'Image',
          bgColor: '#6B7280'
        };
    }
  };

  const config = getTypeConfig(type);
  
  const placeholderSvg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${config.bgColor};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${config.bgColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="300" height="200" fill="url(#grad)"/>
      <circle cx="150" cy="80" r="25" fill="rgba(255,255,255,0.2)"/>
      <text x="150" y="88" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="24">
        📷
      </text>
      <text x="150" y="130" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
        ${config.text}
      </text>
      <text x="150" y="150" text-anchor="middle" dy=".3em" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="12">
        Image not available
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml,${encodeURIComponent(placeholderSvg)}`;
};

export default {
  getImageUrl,
  getFallbackImageUrl
};