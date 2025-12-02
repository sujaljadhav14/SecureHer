import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Mumbai center coordinates (fallback default)
const defaultCenter = {
  lat: 19.0760,
  lng: 72.8777
};

// Get safety color and status label based on rating
const getSafetyColor = (rating) => {
  if (rating >= 7) return '#22c55e'; // Green for safe
  if (rating >= 4) return '#f59e0b'; // Yellow for moderate
  return '#ef4444'; // Red for unsafe
};

const getStatusLabel = (rating) => {
  if (rating >= 7) return 'Safe';
  if (rating >= 4) return 'Moderate';
  return 'Unsafe';
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper to render presence indicators
const getPresenceIcon = (level) => {
  switch (level) {
    case 'high':
      return '●●●';
    case 'moderate':
      return '●●○';
    case 'low':
      return '●○○';
    default:
      return '○○○';
  }
};

const SafeZonesMap = ({ safeZonesData = [], loading = false, error = null }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [zoomLevel, setZoomLevel] = useState(11);
  const [filteredData, setFilteredData] = useState([]);
  const [safetyFilter, setSafetyFilter] = useState('all');
  const mapRef = useRef(null);

  // Process and filter data when source data or filter changes
  useEffect(() => {
    if (!safeZonesData || safeZonesData.length === 0) {
      setFilteredData([]);
      return;
    }

    // Process the data for mapping
    const processedData = safeZonesData.map(zone => ({
      id: zone._id,
      position: {
        lat: parseFloat(zone.lat),
        lng: parseFloat(zone.lon)
      },
      safetyRating: parseFloat(zone.safetyRating),
      police_presence: zone.police_presence,
      street_lights: zone.street_lights,
      people_density: zone.people_density,
      traffic: zone.traffic,
      dateTime: new Date(zone.dateTime),
      userDateTime: new Date(zone.userDateTime || zone.dateTime)
    }));

    // Apply safety filter
    let filtered = processedData;
    if (safetyFilter === 'safe') {
      filtered = processedData.filter(zone => zone.safetyRating >= 7);
    } else if (safetyFilter === 'moderate') {
      filtered = processedData.filter(zone => zone.safetyRating >= 4 && zone.safetyRating < 7);
    } else if (safetyFilter === 'unsafe') {
      filtered = processedData.filter(zone => zone.safetyRating < 4);
    }

    setFilteredData(filtered);

    // Set map center to first item if available
    if (filtered.length > 0) {
      setMapCenter(filtered[0].position);
    }
  }, [safeZonesData, safetyFilter]);

  // Handle Google Map load
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Get user location
  const handleUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter({ lat: latitude, lng: longitude });
          setZoomLevel(15);
        },
        (error) => {
          console.error("Error getting user location:", error);
          alert("Unable to get your location. Please check your browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Get stats from the data
  const getStats = () => {
    if (!safeZonesData || safeZonesData.length === 0) {
      return { safe: 0, moderate: 0, unsafe: 0, total: 0 };
    }
    
    const safe = safeZonesData.filter(zone => zone.safetyRating >= 7).length;
    const moderate = safeZonesData.filter(zone => zone.safetyRating >= 4 && zone.safetyRating < 7).length;
    const unsafe = safeZonesData.filter(zone => zone.safetyRating < 4).length;
    
    return {
      safe,
      moderate,
      unsafe,
      total: safeZonesData.length
    };
  };

  const stats = getStats();

  // Custom marker icon based on safety rating
  const getMarkerIcon = (rating) => {
    const color = getSafetyColor(rating);
    
    return {
      path: window.google?.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      scale: 10,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-red-500">Error loading map data: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg overflow-hidden">
      <div className="bg-white p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Safety Zones Map</h2>
            <p className="text-sm text-gray-600">
              {filteredData.length} safety points displayed
            </p>
          </div>
          <div className="flex space-x-2">
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2"
              value={safetyFilter}
              onChange={(e) => setSafetyFilter(e.target.value)}
            >
              <option value="all">All Zones</option>
              <option value="safe">Safe Zones Only</option>
              <option value="moderate">Moderate Zones Only</option>
              <option value="unsafe">Unsafe Zones Only</option>
            </select>
            <button
              onClick={handleUserLocation}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              My Location
            </button>
          </div>
        </div>
      </div>
      
      <div className="h-96">
        {/* Replace YOUR_GOOGLE_MAPS_API_KEY with your actual API key */}
        <LoadScript googleMapsApiKey="AIzaSyAnFzm0egXHx7P7zBsOjC3NV01Wj3ZHgyo">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={zoomLevel}
            onLoad={onMapLoad}
          >
            {filteredData.map((zone) => (
              <Marker
                key={zone.id}
                position={zone.position}
                icon={getMarkerIcon(zone.safetyRating)}
                onClick={() => setSelectedMarker(zone)}
                label={zone.safetyRating.toFixed(1)}
              />
            ))}

            {selectedMarker && (
              <InfoWindow
                position={selectedMarker.position}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-1 max-w-xs">
                  <div className="mb-2">
                    <span 
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedMarker.safetyRating >= 7 
                          ? 'bg-green-100 text-green-800' 
                          : selectedMarker.safetyRating >= 4 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {getStatusLabel(selectedMarker.safetyRating)} Area ({selectedMarker.safetyRating}/10)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <div className="font-medium">Police Presence</div>
                      <div>{getPresenceIcon(selectedMarker.police_presence)} {selectedMarker.police_presence}</div>
                    </div>
                    <div>
                      <div className="font-medium">Street Lights</div>
                      <div>{getPresenceIcon(selectedMarker.street_lights)} {selectedMarker.street_lights}</div>
                    </div>
                    <div>
                      <div className="font-medium">People Density</div>
                      <div>{getPresenceIcon(selectedMarker.people_density)} {selectedMarker.people_density}</div>
                    </div>
                    <div>
                      <div className="font-medium">Traffic</div>
                      <div>{getPresenceIcon(selectedMarker.traffic)} {selectedMarker.traffic}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <div>Reported: {formatDate(selectedMarker.userDateTime)}</div>
                    <div>Updated: {formatDate(selectedMarker.dateTime)}</div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>
      
      <div className="bg-white p-3 border-t">
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span>Safe (7-10)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span>Moderate (4-6)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span>Unsafe (1-3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeZonesMap;