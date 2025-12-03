import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getDistance } from 'geolib';
import { useNavigation } from '@react-navigation/native';

const PoliceStationFinder = () => {
    const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [policeStations, setPoliceStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Request location permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        // Get current location
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);

        // Fetch nearby police stations using Google Places API
        await fetchNearbyPoliceStations(currentLocation);
      } catch (error) {
        setErrorMsg('Error getting location');
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchNearbyPoliceStations = async (currentLocation) => {
    try {
      const { latitude, longitude } = currentLocation.coords;
      const radius = 5000; // 5km radius
      const GOOGLE_PLACES_API_KEY = 'AIzaSyAnFzm0egXHx7P7zBsOjC3NV01Wj3ZHgyo'; // Replace with actual API key

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=police&key=${GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();
      
      if (data.status === 'OK') {
        const stations = data.results.map(station => ({
          id: station.place_id,
          name: station.name,
          latitude: station.geometry.location.lat,
          longitude: station.geometry.location.lng,
          address: station.vicinity,
          rating: station.rating,
          distance: getDistance(
            { latitude, longitude },
            { 
              latitude: station.geometry.location.lat, 
              longitude: station.geometry.location.lng 
            }
          )
        }));

        // Sort by distance
        stations.sort((a, b) => a.distance - b.distance);
        setPoliceStations(stations);
      } else {
        throw new Error('Failed to fetch police stations');
      }
    } catch (error) {
      setErrorMsg('Error fetching police stations');
      console.error(error);
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const navigateToStation = (station) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:'
    });
    const url = Platform.select({
      ios: `${scheme}?q=${station.name}&ll=${station.latitude},${station.longitude}`,
      android: `${scheme}${station.latitude},${station.longitude}?q=${station.name}`
    });

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFB5D8" />
        <Text style={styles.loadingText}>Finding nearby police stations...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Police Stations</Text>
      </View>

      {/* Map */}
      {location && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {/* Current Location Marker */}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            pinColor="#FFB5D8"
          />

          {/* Police Station Markers */}
          {policeStations.map((station) => (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              title={station.name}
              description={station.address}
              onPress={() => handleStationSelect(station)}
            >
              <Ionicons name="shield" size={30} color="#0066cc" />
            </Marker>
          ))}
        </MapView>
      )}

      {/* Selected Station Details */}
      {selectedStation && (
        <View style={styles.stationDetails}>
          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>{selectedStation.name}</Text>
            <Text style={styles.stationAddress}>{selectedStation.address}</Text>
            <Text style={styles.stationDistance}>
              {(selectedStation.distance / 1000).toFixed(1)} km away
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => navigateToStation(selectedStation)}
          >
            <Text style={styles.navigateButtonText}>Navigate</Text>
            <Ionicons name="navigate" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingTop:65,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  map: {
    flex: 1,
  },
  stationDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationInfo: {
    flex: 1,
    marginRight: 16,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stationDistance: {
    fontSize: 14,
    color: '#FFB5D8',
    fontWeight: '500',
  },
  navigateButton: {
    backgroundColor: '#FFB5D8',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 25,
  },
  navigateButtonText: {
    color: '#FFF',
    marginRight: 8,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
});

export default PoliceStationFinder;