import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  Alert,
  Keyboard,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Share,
  Vibration
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAnFzm0egXHx7P7zBsOjC3NV01Wj3ZHgyo';
const LOCATION_TRACKING_INTERVAL = 10000; // 10 seconds
const SAFETY_API_URL = 'https://saferoute-70up.onrender.com/api/safety/analyze-routes';

const { width, height } = Dimensions.get('window');

const JourneyTracker = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  
  // Basic state
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [destinationText, setDestinationText] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // Route & navigation state
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [travelMode, setTravelMode] = useState('walking');
  const [route, setRoute] = useState(null);
  const [intermediatePlaces, setIntermediatePlaces] = useState([]);
  
  // UI state
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [showPlacesList, setShowPlacesList] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Journey metrics
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [distance, setDistance] = useState(null);
  const [journeyStartTime, setJourneyStartTime] = useState(null);
  
  // Safety information
  const [safetyData, setSafetyData] = useState(null);
  const [routeSafetyScores, setRouteSafetyScores] = useState({});
  const [loadingSafety, setLoadingSafety] = useState(false);
  const [isNightTime, setIsNightTime] = useState(checkTimeOfDay());
  const [showSafetyInfoModal, setShowSafetyInfoModal] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  
  // Contacts
  const [sharedContacts, setSharedContacts] = useState([]);
  const [showContactsModal, setShowContactsModal] = useState(false);

  // Check if it's night time
  function checkTimeOfDay() {
    const hour = new Date().getHours();
    return hour < 6 || hour > 18; // Returns true if it's night time (between 6 PM and 6 AM)
  }

  // Format current time to the required time slot format
  const getTimeSlot = () => {
    const hour = new Date().getHours();
    
    if (hour >= 0 && hour < 3) return '12-3_am';
    if (hour >= 3 && hour < 6) return '3-6_am';
    if (hour >= 6 && hour < 9) return '6-9_am';
    if (hour >= 9 && hour < 12) return '9-12_pm';
    if (hour >= 12 && hour < 15) return '12-3_pm';
    if (hour >= 15 && hour < 18) return '3-6_pm';
    if (hour >= 18 && hour < 21) return '6-9_pm';
    return '9-12_am';
  };

  useEffect(() => {
    setupLocationTracking();
    setIsNightTime(checkTimeOfDay());
    loadSharedContacts();
    
    return () => {
      if (locationSubscription.current) {
        stopLocationTracking();
      }
    };
  }, []);

  const loadSharedContacts = async () => {
    try {
      const contacts = await AsyncStorage.getItem('close_contacts');
      if (contacts) {
        setSharedContacts(JSON.parse(contacts));
      } else {
        setSharedContacts([]);
      }
    } catch (error) {
      console.error('Error loading close contacts:', error);
      setSharedContacts([]);
    }
  };

  const setupLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for journey tracking');
        return;
      }

      await Location.requestBackgroundPermissionsAsync();
      getCurrentLocation();
    } catch (error) {
      console.error('Error setting up location tracking:', error);
      Alert.alert('Error', 'Could not initialize location services');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const { latitude, longitude } = location.coords;

      // Get address for current location
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Geocoding API error: ${data.status}`);
      }
      
      const currentLocation = {
        latitude,
        longitude,
        description: data.results[0]?.formatted_address || 'Current Location'
      };

      setOrigin(currentLocation);
      setCurrentLocation(currentLocation);
      
      // Center map on current location
      if (mapRef.current) {
        mapRef.current.animateCamera({
          center: { latitude, longitude },
          zoom: 16,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setLoading(false);
    }
  };

  const handleStartJourney = () => {
    if (!destination) {
      Alert.alert('Missing Destination', 'Please select a destination first');
      return;
    }
    
    if (!origin) {
      Alert.alert('Missing Origin', 'Could not determine your current location');
      return;
    }
    
    startLocationTracking();
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_TRACKING_INTERVAL,
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setCurrentLocation({ latitude, longitude });
          
          if (destination) {
            updateJourneyStatus({ latitude, longitude });
          }
          
          // Update map camera to follow user
          if (mapRef.current) {
            mapRef.current.animateCamera({
              center: { latitude, longitude },
              zoom: 16,
            });
          }
        }
      );
      
      setIsTracking(true);
      setJourneyStartTime(new Date());
      
      // Notify contacts that journey has started
      notifyContacts('Journey started', false);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Could not start journey tracking');
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      setIsTracking(false);
      
      // Notify contacts that journey has ended
      notifyContacts('Journey completed successfully', false);
      
      // Show journey summary
      showJourneySummary();
    }
  };

  const updateJourneyStatus = (currentLoc) => {
    if (!destination) return;

    // Calculate remaining distance and time
    const remainingDistance = calculateDistance(currentLoc, destination);
    setDistance(remainingDistance);
    
    // Update estimated arrival time
    const timeInMinutes = Math.round((remainingDistance / getSpeedByMode(travelMode)) * 60);
    setEstimatedTime(timeInMinutes);

    // Check if arrived at destination
    if (remainingDistance < 0.05) { // 50 meters
      stopLocationTracking();
      Alert.alert('Arrived', 'You have reached your destination!');
    }

    // Share location with contacts periodically
    shareLocationWithContacts(currentLoc);
  };

  const calculateDistance = (point1, point2) => {
    if (!point1 || !point2) return 0;
    
    const lat1 = point1.latitude;
    const lon1 = point1.longitude;
    const lat2 = point2.latitude;
    const lon2 = point2.longitude;
    
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const getSpeedByMode = (mode) => {
    const speeds = {
      walking: 5,     // km/h
      bicycling: 15,  // km/h
      driving: 40     // km/h
    };
    return speeds[mode] || 5; // Default to walking speed
  };

  const searchPlaces = async (text) => {
    if (text.length < 3) {
      setSearchResults([]);
      return;
    }
  
    try {
      setLoading(true);
      
      // Fetch place predictions
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`
      );
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${data.status}`);
      }
      
      if (!data.predictions || data.predictions.length === 0) {
        setSearchResults([]);
        setShowSearchModal(false);
        return;
      }
      
      // Process each prediction to get complete location details
      const results = await Promise.all(
        data.predictions.map(async (prediction) => {
          try {
            const detailsResponse = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`
            );
            
            if (!detailsResponse.ok) {
              throw new Error(`Details API responded with status: ${detailsResponse.status}`);
            }
            
            const detailsData = await detailsResponse.json();
            
            if (detailsData.status !== 'OK' || !detailsData.result?.geometry?.location) {
              return null;
            }
            
            return {
              id: prediction.place_id,
              description: prediction.description,
              location: {
                latitude: detailsData.result.geometry.location.lat,
                longitude: detailsData.result.geometry.location.lng,
              }
            };
          } catch (error) {
            console.error('Error fetching place details:', error);
            return null;
          }
        })
      );
      
      // Filter out null results
      const validResults = results.filter(result => result !== null);
      
      setSearchResults(validResults);
      if (validResults.length > 0) {
        setShowSearchModal(true);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      Alert.alert('Error', 'Failed to search places. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = async (item) => {
    try {
      if (!item || !item.location || 
          typeof item.location.latitude !== 'number' || 
          typeof item.location.longitude !== 'number') {
        Alert.alert('Error', 'Invalid location data. Please select another destination.');
        return;
      }
      
      // Set destination
      setDestination({
        latitude: item.location.latitude,
        longitude: item.location.longitude
      });
      
      setDestinationText(item.description || 'Selected destination');
      setShowSearchModal(false);
      setSearchResults([]);
      Keyboard.dismiss();
      
      // Ensure we have origin coordinates
      if (!origin) {
        await getCurrentLocation();
      }
      
      // Fetch routes after a short delay to ensure state is updated
      setTimeout(() => {
        if (origin) {
          fetchRoutes(origin, {
            latitude: item.location.latitude,
            longitude: item.location.longitude
          });
        }
      }, 300);
    } catch (error) {
      console.error('Error selecting location:', error);
      Alert.alert('Error', 'Failed to set destination. Please try again.');
    }
  };

  const fetchRoutes = async (originLoc, destinationLoc) => {
    if (!originLoc || !destinationLoc) {
      console.error('Missing origin or destination for route fetch');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${originLoc.latitude},${originLoc.longitude}&destination=${destinationLoc.latitude},${destinationLoc.longitude}&mode=${travelMode}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Directions API responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'OK') {
        throw new Error(`Directions API error: ${result.status}`);
      }
      
      if (result.routes && result.routes.length) {
        // Process all routes
        const processedRoutes = result.routes.map((route, index) => {
          const leg = route.legs[0];
          const steps = leg.steps;
          
          // Decode the polyline for the route
          const path = decodePolyline(route.overview_polyline.points);
          
          // Extract intermediate places along the route
          const places = samplePointsAlongPath(path, 200); // Every 200 meters
          
          return {
            index,
            distance: leg.distance.text,
            duration: leg.duration.text,
            distanceValue: leg.distance.value, // in meters
            durationValue: leg.duration.value, // in seconds
            summary: route.summary,
            path,
            places,
            steps
          };
        });
        
        setRoutes(processedRoutes);
        
        // Initially select the first route
        setSelectedRouteIndex(0);
        setRoute(processedRoutes[0].path);
        setIntermediatePlaces(processedRoutes[0].places);
        setDistance(processedRoutes[0].distance);
        setEstimatedTime(processedRoutes[0].duration);
        
        // Submit routes for safety analysis
        analyzeSafetyForRoutes(processedRoutes);
        
        // Fit map to route
        fitMapToRoute(processedRoutes[0].path);
      } else {
        Alert.alert('No Routes Found', 'Could not find any routes to your destination.');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Could not fetch routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSafetyForRoutes = async (routes) => {
    if (!routes || routes.length === 0) return;
    
    try {
      setLoadingSafety(true);
      setSafetyData(null); // Clear previous data

      // Prepare data for safety API
      const safetyRequestData = {
        routes: routes.map(route => 
          route.places.map(place => ({
            Name: place.name || "Waypoint",
            Type: place.isStart ? "Starting Point" : place.isEnd ? "Destination" : "Intermediate",
            latitude: place.position.latitude.toString(),
            longitude: place.position.longitude.toString()
          }))
        )
      };

      // Call safety analysis API
      try {
        const safetyResponse = await axios.post(SAFETY_API_URL, safetyRequestData);
        
        if (safetyResponse.data) {
          setSafetyData(safetyResponse.data);
          
          // Extract safety scores for each route
          const safetyScores = {};
          
          // If there's a recommendedRoute property with routeIndex
          if (safetyResponse.data.recommendedRoute) {
            const recommendedRouteIndex = safetyResponse.data.recommendedRoute.routeIndex;
            
            // Set the recommended route as selected if it's available
            if (recommendedRouteIndex >= 0 && recommendedRouteIndex < routes.length) {
              selectRouteByIndex(recommendedRouteIndex);
              
              // Show safety notice
              setShowSafetyNotice(true);
              // Auto-hide after 5 seconds
              setTimeout(() => setShowSafetyNotice(false), 5000);
            }
            
            // Create safety scores object
            routes.forEach((route, index) => {
              if (index === recommendedRouteIndex) {
                safetyScores[index] = safetyResponse.data.recommendedRoute.overallSafety || 5;
              } else if (safetyResponse.data.alternativeRoutes && safetyResponse.data.alternativeRoutes.length > 0) {
                const altRoute = safetyResponse.data.alternativeRoutes.find(r => r.routeIndex === index);
                if (altRoute) {
                  safetyScores[index] = altRoute.overallSafety || 5;
                } else {
                  safetyScores[index] = 5; // Default score
                }
              }
            });
          } else if (safetyResponse.data.routes) {
            // Alternative format where each route has its own safety data
            routes.forEach((route, index) => {
              if (safetyResponse.data.routes[index]) {
                safetyScores[index] = safetyResponse.data.routes[index].overallSafety || 5;
              } else {
                safetyScores[index] = 5; // Default score
              }
            });
          }
          
          setRouteSafetyScores(safetyScores);
        }
      } catch (error) {
        console.error('Safety API error:', error);
        
        // Set default safety scores if API fails
        const defaultScores = {};
        routes.forEach((route, index) => {
          defaultScores[index] = 5; // Default moderate score
        });
        setRouteSafetyScores(defaultScores);
      }
    } catch (error) {
      console.error('Error analyzing safety for routes:', error);
      // Don't show error to user, just continue with routes without safety data
    } finally {
      setLoadingSafety(false);
    }
  };

  const decodePolyline = (encoded) => {
    if (!encoded) return [];
    
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let shift = 0, result = 0;

      do {
        let b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result & 0x20);

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        let b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result & 0x20);

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return poly;
  };

  const samplePointsAlongPath = (path, distanceMeters) => {
    if (!path || path.length < 2) return [];
    
    const places = [];
    
    // Always add the start and end points
    places.push({
      name: 'Starting Point',
      position: path[0],
      isStart: true,
      isEnd: false,
      isWaypoint: true
    });
    
    // Sample points every distanceMeters
    let accumulatedDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const point1 = path[i];
      const point2 = path[i + 1];
      
      // Calculate segment distance
      const segmentDistance = calculateDistance(point1, point2) * 1000; // Convert to meters
      accumulatedDistance += segmentDistance;
      
      // If we've passed the sampling threshold, add a point
      if (accumulatedDistance >= distanceMeters) {
        places.push({
          name: `Waypoint ${places.length}`,
          position: point2,
          isStart: false,
          isEnd: false,
          isWaypoint: false
        });
        
        // Reset accumulated distance
        accumulatedDistance = 0;
      }
    }
    
    // Add the end point
    places.push({
      name: 'Destination',
      position: path[path.length - 1],
      isStart: false,
      isEnd: true,
      isWaypoint: true
    });
    
    return places;
  };

  const fitMapToRoute = (routePath) => {
    if (!mapRef.current || !routePath || routePath.length < 2) return;
    
    try {
      const bounds = routePath.reduce(
        (acc, coord) => {
          return {
            minLat: Math.min(acc.minLat, coord.latitude),
            maxLat: Math.max(acc.maxLat, coord.latitude),
            minLng: Math.min(acc.minLng, coord.longitude),
            maxLng: Math.max(acc.maxLng, coord.longitude)
          };
        },
        {
          minLat: routePath[0].latitude,
          maxLat: routePath[0].latitude,
          minLng: routePath[0].longitude,
          maxLng: routePath[0].longitude
        }
      );
      
      mapRef.current.fitToCoordinates(
        [
          { latitude: bounds.minLat, longitude: bounds.minLng },
          { latitude: bounds.maxLat, longitude: bounds.maxLng }
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true
        }
      );
    } catch (error) {
      console.error('Error fitting map to route:', error);
    }
  };

  const shareLocationWithContacts = async (location) => {
    if (sharedContacts.length === 0 || !isTracking) return;
    
    try {
      const message = createLocationShareMessage(location);
      
      // In a real app, you would send this to your backend
      console.log('Sharing location with contacts:', message);
      
      // Could implement actual sharing logic here
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  };

  const createLocationShareMessage = (location) => {
    const formattedTime = new Date().toLocaleTimeString();
    
    let message = `📍 Location update at ${formattedTime}\n`;
    message += `🚶‍♀️ ${destinationText ? 'Heading to: ' + destinationText : 'Journey in progress'}\n`;
    
    if (estimatedTime) {
      message += `⏱️ ETA: ${typeof estimatedTime === 'number' ? estimatedTime + ' min' : estimatedTime}\n`;
    }
    
    if (distance) {
      message += `📏 Distance remaining: ${typeof distance === 'number' ? distance.toFixed(2) + ' km' : distance}\n`;
    }
    
    // Include safety information if available
    if (safetyData && routeSafetyScores[selectedRouteIndex]) {
      const safetyScore = routeSafetyScores[selectedRouteIndex];
      message += `🛡️ Route safety score: ${safetyScore.toFixed(1)}/10\n`;
    }
    
    message += `🔗 https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    
    return message;
  };

  const notifyContacts = (message, isEmergency = false) => {
    if (sharedContacts.length === 0) return;
    
    try {
      // In a real app, this would send notifications to contacts
      console.log(`${isEmergency ? 'EMERGENCY' : 'Notification'}: ${message}`);
      
      // For demo, show what would be sent
      if (isEmergency) {
        Alert.alert('Emergency Alert Sent', `Your emergency contacts have been notified with your current location and status.`);
      }
    } catch (error) {
      console.error('Error notifying contacts:', error);
    }
  };

  const handleSOS = () => {
    Alert.alert(
      'SOS Alert',
      'Do you want to send an emergency SOS alert to your contacts?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send SOS',
          onPress: sendSOSAlert,
          style: 'destructive',
        },
      ]
    );
  };

  const sendSOSAlert = async () => {
    try {
      const message = createSOSMessage();
      notifyContacts(message, true);
      
      // Vibrate device in SOS pattern
      const PATTERN = [0, 200, 100, 200, 100, 200, 300, 200, 100, 200, 100, 200];
      Vibration.vibrate(PATTERN);
      
      // Share SOS location through the share dialog
      await Share.share({
        message: message,
        title: 'EMERGENCY SOS ALERT'
      });
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      Alert.alert('Error', 'Could not send SOS alert');
    }
  };

  const createSOSMessage = () => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString();
    const formattedDate = now.toLocaleDateString();
    
    let message = `🆘 EMERGENCY SOS ALERT 🆘\n\n`;
    message += `Time: ${formattedTime} ${formattedDate}\n`;
    message += `Location: ${currentLocation ? `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}` : 'Unknown'}\n\n`;
    
    if (destinationText) {
      message += `Current journey: Heading to ${destinationText}\n`;
    }
    
    message += `\nPlease contact emergency services immediately.`;
    
    return message;
  };

  const showJourneySummary = () => {
    // Calculate journey stats
    const endTime = new Date();
    const journeyDuration = journeyStartTime ? Math.floor((endTime - journeyStartTime) / 60000) : 0; // in minutes
    
    let summaryMessage = `Your journey has ended safely.\n\nDestination: ${destinationText}\nJourney Duration: ${journeyDuration} minutes\nDistance Traveled: ${distance ? (typeof distance === 'number' ? distance.toFixed(2) + ' km' : distance) : 'Unknown'}`;
    
    // Add safety information if available
    if (safetyData && routeSafetyScores[selectedRouteIndex]) {
      const safetyScore = routeSafetyScores[selectedRouteIndex];
      summaryMessage += `\nRoute Safety Score: ${safetyScore.toFixed(1)}/10`;
    }
    
    Alert.alert(
      'Journey Summary',
      summaryMessage,
      [
        { text: 'OK' }
      ]
    );
  };

  const selectRouteByIndex = (index) => {
    if (index >= 0 && index < routes.length) {
      setSelectedRouteIndex(index);
      setRoute(routes[index].path);
      setIntermediatePlaces(routes[index].places);
      setDistance(routes[index].distance);
      setEstimatedTime(routes[index].duration);
      fitMapToRoute(routes[index].path);
      setShowRouteOptions(false);
    }
  };

  const exportRouteCoordinates = async () => {
    if (!route || route.length === 0) {
      Alert.alert('No Route', 'There is no route to export');
      return;
    }
    
    try {
      // Create CSV content
      let csvContent = "Latitude,Longitude\n";
      route.forEach(point => {
        csvContent += `${point.latitude},${point.longitude}\n`;
      });
      
      // Share the data
      await Share.share({
        title: 'Route Coordinates',
        message: csvContent
      });
    } catch (error) {
      console.error('Error exporting coordinates:', error);
      Alert.alert('Error', 'Could not export route coordinates');
    }
  };

  // Get safety category color
  const getSafetyCategoryColor = (score) => {
    if (!score && score !== 0) return '#CCC'; // Gray for unknown
    
    if (score >= 7.5) return '#4CAF50'; // Green for high safety
    if (score >= 5) return '#FFA000'; // Amber for medium safety
    return '#FF4444'; // Red for low safety
  };

  // Render header with title and back button
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>
      <View>
        <Text style={styles.headerTitle}>Track Journey</Text>
        <Text style={styles.headerSubtitle}>
          Track your journey using the safest route
        </Text>
      </View>
    </View>
  );

  // Render location input fields
  const renderLocationInputs = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputRow}>
        <Ionicons name="location" size={20} color="#4285F4" />
        <TextInput
          style={styles.input}
          placeholder="Current location"
          value={origin?.description || ''}
          editable={false}
        />
        <TouchableOpacity onPress={getCurrentLocation}>
          <Ionicons name="locate" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.separator} />
      
      <View style={styles.inputRow}>
        <Ionicons name="flag" size={20} color="#FF4444" />
        <TextInput
          style={styles.input}
          placeholder="Enter destination"
          value={destinationText}
          onChangeText={(text) => {
            setDestinationText(text);
            searchPlaces(text);
          }}
        />
      </View>
    </View>
  );

  // Render travel mode selector
  const renderTravelModes = () => (
    <View style={styles.travelModeContainer}>
      <TouchableOpacity 
        style={[styles.modeButton, travelMode === 'driving' && styles.modeButtonActive]}
        onPress={() => setTravelMode('driving')}
      >
        <MaterialIcons 
          name="directions-car" 
          size={20} 
          color={travelMode === 'driving' ? '#FFF' : '#666'} 
        />
        <Text style={[styles.modeText, travelMode === 'driving' && styles.modeTextActive]}>
          Driving
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.modeButton, travelMode === 'walking' && styles.modeButtonActive]}
        onPress={() => setTravelMode('walking')}
      >
        <MaterialIcons 
          name="directions-walk" 
          size={20} 
          color={travelMode === 'walking' ? '#FFF' : '#666'} 
        />
        <Text style={[styles.modeText, travelMode === 'walking' && styles.modeTextActive]}>
          Walking
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.modeButton, travelMode === 'bicycling' && styles.modeButtonActive]}
        onPress={() => setTravelMode('bicycling')}
      >
        <MaterialIcons 
          name="directions-bike" 
          size={20} 
          color={travelMode === 'bicycling' ? '#FFF' : '#666'} 
        />
        <Text style={[styles.modeText, travelMode === 'bicycling' && styles.modeTextActive]}>
          Cycling
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render route options (when multiple routes are available)
  const renderRouteOptions = () => {
    if (routes.length <= 1) return null;
    
    return (
      <TouchableOpacity 
        style={styles.routeOptionsButton}
        onPress={() => setShowRouteOptions(true)}
      >
        <Text style={styles.routeOptionsText}>
          {routes.length} Routes Available
        </Text>
        <Ionicons name="chevron-down" size={18} color="#4285F4" />
      </TouchableOpacity>
    );
  };

  // Render safety information card
  const renderSafetyInfo = () => {
    if (!destination) {
      return (
        <View style={styles.noDestinationContainer}>
          <Ionicons name="location" size={24} color="#FFB5D8" />
          <Text style={styles.noDestinationText}>Please select a destination</Text>
        </View>
      );
    }
    
    if (loadingSafety) {
      return (
        <View style={styles.safetyInfoContainer}>
          <ActivityIndicator size="small" color="#FFB5D8" />
          <Text style={styles.safetyLoadingText}>Analyzing route safety...</Text>
        </View>
      );
    }
    
    if (!safetyData || !routeSafetyScores[selectedRouteIndex]) {
      return (
        <View style={styles.safetyInfoContainer}>
          <Ionicons name="shield-outline" size={24} color="#999" />
          <View style={styles.safetyTextContainer}>
            <Text style={styles.safetyRatingText}>Safety Information Unavailable</Text>
            <Text style={styles.safetyInfoText}>
              {isNightTime ? '🌙 Night time - Exercise caution' : '☀️ Day time journey'}
            </Text>
          </View>
        </View>
      );
    }
    
    const safetyScore = routeSafetyScores[selectedRouteIndex];
    const safetyColor = getSafetyCategoryColor(safetyScore);
    
    // Determine text based on safety score
    let safetyText = "Unknown Safety";
    if (safetyScore >= 7.5) safetyText = "High Safety Area";
    else if (safetyScore >= 5) safetyText = "Moderate Safety Area";
    else if (safetyScore > 0) safetyText = "Exercise Caution";
    
    return (
      <TouchableOpacity 
        style={styles.safetyInfoContainer}
        onPress={() => setShowSafetyInfoModal(true)}
      >
        <View style={[styles.safetyScoreCircle, { backgroundColor: safetyColor }]}>
          <Text style={styles.safetyScoreText}>
            {safetyScore.toFixed(1)}
          </Text>
        </View>
        <View style={styles.safetyTextContainer}>
          <Text style={styles.safetyRatingText}>{safetyText}</Text>
          <Text style={styles.safetyInfoText}>
            {isNightTime ? '🌙 Night time - Extra caution recommended' : '☀️ Day time journey'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  // Render safety notification that appears when safer route is automatically selected
  const renderSafetyNotice = () => {
    if (!showSafetyNotice) return null;
    
    return (
      <View style={styles.safetyNoticeContainer}>
        <View style={styles.safetyNoticeContent}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <Text style={styles.safetyNoticeText}>
            Safest route automatically selected for your journey
          </Text>
          <TouchableOpacity onPress={() => setShowSafetyNotice(false)}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render detailed safety information modal
  const renderSafetyInfoModal = () => (
    <Modal
      visible={showSafetyInfoModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSafetyInfoModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Route Safety Analysis</Text>
            <TouchableOpacity onPress={() => setShowSafetyInfoModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.safetyModalContent}>
            {safetyData && routeSafetyScores[selectedRouteIndex] && (
              <>
                <View style={styles.safetyScoreSection}>
                  <Text style={styles.safetyScoreLarge}>
                    {routeSafetyScores[selectedRouteIndex]?.toFixed(1) || "N/A"}
                  </Text>
                  <Text style={styles.safetyScoreLabel}>Safety Score</Text>
                  <View style={styles.safetyScoreBar}>
                    <View 
                      style={[
                        styles.safetyScoreFill, 
                        { 
                          width: `${Math.min(100, (routeSafetyScores[selectedRouteIndex] || 0) * 10)}%`,
                          backgroundColor: getSafetyCategoryColor(routeSafetyScores[selectedRouteIndex])
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                <View style={styles.safetyExplanationSection}>
                  <Text style={styles.sectionHeading}>Safety Information</Text>
                  <Text style={styles.safetyExplanationText}>
                    {(safetyData.recommendedRoute?.safetyAnalysisExplanation?.summary) || 
                      "This safety analysis is based on multiple factors including street lighting, police presence, population density, and historical incident data."}
                  </Text>
                </View>
                
                <View style={styles.safetyFactorsSection}>
                  <Text style={styles.sectionHeading}>Key Safety Factors</Text>
                  
                  <View style={styles.safetyFactorItem}>
                    <Ionicons name={isNightTime ? "moon" : "sunny"} size={18} color={isNightTime ? "#5C6BC0" : "#FFA000"} style={styles.factorIcon} />
                    <Text style={styles.factorText}>
                      {isNightTime 
                        ? "Night time journey - reduced visibility, fewer people on streets"
                        : "Day time journey - good visibility, more people on streets"}
                    </Text>
                  </View>
                  
                  {safetyData.recommendedRoute?.safetyAnalysisExplanation?.keyFactors ? (
                    safetyData.recommendedRoute.safetyAnalysisExplanation.keyFactors.map((factor, index) => (
                      <View key={index} style={styles.safetyFactorItem}>
                        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={styles.factorIcon} />
                        <Text style={styles.factorText}>{factor}</Text>
                      </View>
                    ))
                  ) : (
                    <>
                      <View style={styles.safetyFactorItem}>
                        <Ionicons name="flashlight" size={18} color="#FFA000" style={styles.factorIcon} />
                        <Text style={styles.factorText}>Street lighting quality affects visibility and safety</Text>
                      </View>
                      <View style={styles.safetyFactorItem}>
                        <Ionicons name="people" size={18} color="#4CAF50" style={styles.factorIcon} />
                        <Text style={styles.factorText}>Higher population density generally increases safety</Text>
                      </View>
                      <View style={styles.safetyFactorItem}>
                        <Ionicons name="business" size={18} color="#4CAF50" style={styles.factorIcon} />
                        <Text style={styles.factorText}>Commercial areas with active businesses are typically safer</Text>
                      </View>
                    </>
                  )}
                </View>
                
                <View style={styles.safetyRecommendationsSection}>
                  <Text style={styles.sectionHeading}>Safety Recommendations</Text>
                  
                  <View style={styles.safetyFactorItem}>
                    <Ionicons name="alert-circle" size={18} color="#FFA000" style={styles.factorIcon} />
                    <Text style={styles.factorText}>Stay aware of your surroundings at all times</Text>
                  </View>
                  
                  <View style={styles.safetyFactorItem}>
                    <Ionicons name="share-social" size={18} color="#4285F4" style={styles.factorIcon} />
                    <Text style={styles.factorText}>Share your journey status with trusted contacts</Text>
                  </View>
                  
                  {isNightTime && (
                    <View style={styles.safetyFactorItem}>
                      <Ionicons name="flashlight" size={18} color="#FFA000" style={styles.factorIcon} />
                      <Text style={styles.factorText}>Use your phone's flashlight in poorly lit areas</Text>
                    </View>
                  )}
                  
                  <View style={styles.safetyFactorItem}>
                    <Ionicons name="call" size={18} color="#4CAF50" style={styles.factorIcon} />
                    <Text style={styles.factorText}>Keep your phone accessible for emergencies</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render route options modal
  const renderRouteOptionsModal = () => (
    <Modal
      visible={showRouteOptions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowRouteOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Available Routes</Text>
            <TouchableOpacity onPress={() => setShowRouteOptions(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            {routes.map((route, index) => {
              const isSafest = safetyData && 
                              safetyData.recommendedRoute && 
                              safetyData.recommendedRoute.routeIndex === index;
              
              const safetyScore = routeSafetyScores[index];
              const safetyColor = getSafetyCategoryColor(safetyScore);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.routeItem,
                    selectedRouteIndex === index && styles.selectedRouteItem
                  ]}
                  onPress={() => selectRouteByIndex(index)}
                >
                  <View style={styles.routeItemContent}>
                    <Text style={styles.routeName}>
                      Route {index + 1}
                      {isSafest && " (Safest)"}
                    </Text>
                    <Text style={styles.routeSummary}>{route.summary || "Via main roads"}</Text>
                    <View style={styles.routeMetrics}>
                      <Text style={styles.routeMetric}>
                        <Ionicons name="time-outline" size={14} color="#666" /> {route.duration}
                      </Text>
                      <Text style={styles.routeMetric}>
                        <Ionicons name="navigate" size={14} color="#666" /> {route.distance}
                      </Text>
                      {safetyScore !== undefined && (
                        <Text style={[styles.routeMetric, { color: safetyColor }]}>
                          <Ionicons name="shield-checkmark" size={14} color={safetyColor} /> {safetyScore.toFixed(1)}
                        </Text>
                      )}
                    </View>
                  </View>
                  {selectedRouteIndex === index && (
                    <Ionicons name="checkmark-circle" size={24} color="#4285F4" />
                  )}
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={exportRouteCoordinates}
            >
              <Text style={styles.exportButtonText}>Export Route Data</Text>
              <Ionicons name="download" size={20} color="#FFF" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render search results modal
  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSearchModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Destination</Text>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFB5D8" />
              <Text style={styles.loadingText}>Searching locations...</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyResultsContainer}>
              <Ionicons name="search" size={50} color="#CCC" />
              <Text style={styles.emptyResultsText}>No locations found</Text>
              <Text style={styles.emptyResultsSubText}>Try a different search term</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => selectLocation(item)}
                >
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.searchResultText}>{item.description}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  // Main render function
  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <View style={styles.mapContainer}>
        {origin ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: origin.latitude,
              longitude: origin.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            followsUserLocation
          >
            {destination && (
              <Marker 
                coordinate={destination}
                title="Destination"
                pinColor="red"
              />
            )}
            
            {route && (
              <Polyline
                coordinates={route}
                strokeWidth={4}
                strokeColor="#4285F4"
              />
            )}
            
            {intermediatePlaces.map((place, index) => {
              if (place.isStart || place.isEnd) return null; // Skip start/end points as they're the same as origin/destination
              
              return (
                <Marker
                  key={`place-${index}`}
                  coordinate={place.position}
                  title={place.name}
                  pinColor="#FFA000"
                />
              );
            })}
          </MapView>
        ) : (
          <View style={styles.loadingMapContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingMapText}>Loading map...</Text>
          </View>
        )}
        
        {renderSafetyNotice()}
      </View>
      
      <View style={styles.controlsContainer}>
        {renderLocationInputs()}
        {renderTravelModes()}
        {renderRouteOptions()}
        {renderSafetyInfo()}
        
        <View style={styles.buttonContainer}>
          {!isTracking ? (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartJourney}
            >
              <Text style={styles.startButtonText}>Start Journey</Text>
              <Ionicons name="play" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.stopButton}
              onPress={stopLocationTracking}
            >
              <Text style={styles.stopButtonText}>End Journey</Text>
              <Ionicons name="stop" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.sosButton}
            onPress={handleSOS}
          >
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Render modals */}
      {renderSafetyInfoModal()}
      {renderRouteOptionsModal()}
      {renderSearchModal()}
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFB5D8',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
    maxWidth: '90%',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  noDestinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noDestinationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingMapText: {
    marginTop: 10,
    color: '#666',
  },
  controlsContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 8,
  },
  travelModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  modeButtonActive: {
    backgroundColor: '#4285F4',
  },
  modeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  modeTextActive: {
    color: '#FFF',
  },
  routeOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 8,
  },
  routeOptionsText: {
    color: '#4285F4',
    fontWeight: '600',
    marginRight: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 1,
    marginRight: 16,
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 1,
    marginRight: 16,
  },
  stopButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  sosButton: {
    backgroundColor: '#FF4444',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sosButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  safetyInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  safetyScoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  safetyScoreText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  safetyTextContainer: {
    flex: 1,
  },
  safetyRatingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  safetyInfoText: {
    fontSize: 12,
    color: '#666',
  },
  safetyLoadingText: {
    marginLeft: 10,
    color: '#666',
  },
  safetyNoticeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  safetyNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyNoticeText: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  safetyModalContent: {
    padding: 16,
  },
  safetyScoreSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  safetyScoreLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  safetyScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  safetyScoreBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#EEE',
    borderRadius: 5,
    overflow: 'hidden',
  },
  safetyScoreFill: {
    height: '100%',
    borderRadius: 5,
  },
  safetyExplanationSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  safetyExplanationText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  safetyFactorsSection: {
    marginBottom: 20,
  },
  safetyFactorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  factorIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  factorText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  segmentAnalysisSection: {
    marginBottom: 20,
  },
  segmentItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  segmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  segmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  segmentBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cautionNotesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  cautionNotesText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  recommendationsContainer: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 4,
  },
  recommendationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  recommendationItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  selectedRouteItem: {
    backgroundColor: '#F0F8FF',
  },
  routeItemContent: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  routeMetrics: {
    flexDirection: 'row',
  },
  routeMetric: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  exportButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginRight: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchResultText: {
    marginLeft: 12,
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyResultsSubText: {
    fontSize: 14,
    color: '#666',
  }
});

export default JourneyTracker;
// Styles would be defined here, but I'm not including them for brevity