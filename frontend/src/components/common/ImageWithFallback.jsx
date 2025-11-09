import { useState, useEffect } from 'react';
import { getFallbackImageUrl } from '../../utils/imageUtils';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className, 
  type = 'default',
  fallbackSrc,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setCurrentSrc(src);
  }, [src]);

  const handleError = (e) => {
    console.log('Image failed to load:', e.target.src);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log('Image loaded successfully:', currentSrc);
    setIsLoading(false);
  };

  const getFinalSrc = () => {
    if (hasError) {
      const fallback = fallbackSrc || getFallbackImageUrl(type);
      console.log('Using fallback image:', fallback);
      return fallback;
    }
    return currentSrc || getFallbackImageUrl(type);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && !hasError && (
        <div className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded flex items-center justify-center`}>
          <div className="text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          </div>
        </div>
      )}
      <img
        src={getFinalSrc()}
        alt={alt || 'Image'}
        className={`${className} ${isLoading && !hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
};

export default ImageWithFallback;