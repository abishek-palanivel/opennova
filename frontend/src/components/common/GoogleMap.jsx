import { useState } from 'react';
import { APP_CONFIG } from '../../config/constants';

const GoogleMap = ({ address, latitude, longitude, className = "", height = "300px" }) => {
    const [showFallback, setShowFallback] = useState(false);
    const { googleMaps } = APP_CONFIG;

    // Use coordinates if available, otherwise use address
    const mapSrc = latitude && longitude 
        ? `https://www.google.com/maps/embed/v1/view?key=${googleMaps.apiKey}&center=${latitude},${longitude}&zoom=${googleMaps.defaultZoom}`
        : `https://www.google.com/maps/embed/v1/place?key=${googleMaps.apiKey}&q=${encodeURIComponent(address)}&zoom=${googleMaps.defaultZoom}`;

    const searchQuery = latitude && longitude 
        ? `${latitude},${longitude}`
        : address;

    const openInGoogleMaps = () => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`, '_blank');
    };

    const getDirections = () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(searchQuery)}`, '_blank');
    };

    // Show fallback immediately due to API restrictions
    const MapDisplay = () => {
        // Always show fallback for now due to API key restrictions
        if (true || showFallback) {
            return (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-200" style={{ height }}>
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-6xl mb-4">🗺️</div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Location</h3>
                        <p className="text-lg font-semibold text-blue-700 mb-4">📍 {address}</p>
                        {latitude && longitude && (
                            <p className="text-sm text-gray-600 mb-2">
                                Coordinates: {latitude}, {longitude}
                            </p>
                        )}
                        <p className="text-slate-600 text-sm mb-4 text-center max-w-md">
                            Interactive map temporarily unavailable. Click the buttons below to view location on Google Maps.
                        </p>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                                🔧 Map integration requires API configuration
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <iframe
                src={mapSrc}
                width="100%"
                height={height}
                style={{ border: 0, borderRadius: '1rem' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="shadow-lg"
                title={`Map showing ${address}`}
                onError={() => setShowFallback(true)}
            ></iframe>
        );
    };

    return (
        <div className={`google-map-container ${className}`}>
            <div className="bg-slate-100 rounded-2xl p-8 text-center">
                <MapDisplay />
                <div className="mt-4 space-x-4">
                    <button
                        onClick={openInGoogleMaps}
                        className="btn-primary"
                    >
                        📍 Open in Google Maps
                    </button>
                    <button
                        onClick={getDirections}
                        className="btn-outline"
                    >
                        🧭 Get Directions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleMap;