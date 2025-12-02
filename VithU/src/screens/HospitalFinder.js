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
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getDistance } from 'geolib';
import { useNavigation } from '@react-navigation/native';

const HospitalFinder = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);

        await fetchNearbyHospitals(currentLocation);
      } catch (error) {
        setErrorMsg('Error getting location');
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchNearbyHospitals = async (currentLocation) => {
    try {
      const { latitude, longitude } = currentLocation.coords;
      const radius = 5000; // 5km radius
      const GOOGLE_PLACES_API_KEY = 'AIzaSyAnFzm0egXHx7P7zBsOjC3NV01Wj3ZHgyo'; // Replace with actual API key

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=hospital&keyword=emergency&key=${GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();
      
      if (data.status === 'OK') {
        const nearbyHospitals = data.results.map(hospital => ({
          id: hospital.place_id,
          name: hospital.name,
          latitude: hospital.geometry.location.lat,
          longitude: hospital.geometry.location.lng,
          address: hospital.vicinity,
          rating: hospital.rating,
          isOpen: hospital.opening_hours?.open_now,
          distance: getDistance(
            { latitude, longitude },
            { 
              latitude: hospital.geometry.location.lat, 
              longitude: hospital.geometry.location.lng 
            }
          )
        }));

        // Sort by distance
        nearbyHospitals.sort((a, b) => a.distance - b.distance);
        setHospitals(nearbyHospitals);
      } else {
        throw new Error('Failed to fetch hospitals');
      }
    } catch (error) {
      setErrorMsg('Error fetching hospitals');
      console.error(error);
    }
  };

  const navigateToHospital = (hospital) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:'
    });
    const url = Platform.select({
      ios: `${scheme}?q=${hospital.name}&ll=${hospital.latitude},${hospital.longitude}`,
      android: `${scheme}${hospital.latitude},${hospital.longitude}?q=${hospital.name}`
    });

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  const callEmergency = () => {
    const emergencyNumber = Platform.select({
      ios: '102',
      android: '102'
    });
    
    Linking.openURL(`tel:${emergencyNumber}`).catch(() => {
      Alert.alert('Error', 'Could not open phone application');
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFB5D8" />
        <Text style={styles.loadingText}>Finding nearby hospitals...</Text>
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
        <Text style={styles.headerTitle}>Nearby Hospitals</Text>
        <TouchableOpacity 
          style={styles.emergencyCallButton}
          onPress={callEmergency}
        >
          <FontAwesome5 name="phone" size={20} color="#FFB5D8" />
        </TouchableOpacity>
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

          {/* Hospital Markers */}
          {hospitals.map((hospital) => (
            <Marker
              key={hospital.id}
              coordinate={{
                latitude: hospital.latitude,
                longitude: hospital.longitude,
              }}
              title={hospital.name}
              description={hospital.address}
              onPress={() => setSelectedHospital(hospital)}
            >
              <View style={styles.markerContainer}>
                <FontAwesome5 
                  name="hospital" 
                  size={24} 
                  color="#FF4444"
                  style={styles.hospitalIcon}
                />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Selected Hospital Details */}
      {selectedHospital && (
        <View style={styles.hospitalDetails}>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalName}>{selectedHospital.name}</Text>
            <Text style={styles.hospitalAddress}>{selectedHospital.address}</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.hospitalDistance}>
                {(selectedHospital.distance / 1000).toFixed(1)} km away
              </Text>
              {selectedHospital.isOpen !== undefined && (
                <Text style={[
                  styles.statusText,
                  { color: selectedHospital.isOpen ? '#4CAF50' : '#FF4444' }
                ]}>
                  {selectedHospital.isOpen ? '• Open' : '• Closed'}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={callEmergency}
            >
              <FontAwesome5 name="phone" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.navigateButton]}
              onPress={() => navigateToHospital(selectedHospital)}
            >
              <Text style={styles.navigateButtonText}>Navigate</Text>
              <Ionicons name="navigate" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingTop:45,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyCallButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  hospitalIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  hospitalDetails: {
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
  },
  hospitalInfo: {
    marginBottom: 16,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hospitalAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalDistance: {
    fontSize: 14,
    color: '#FFB5D8',
    fontWeight: '500',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  callButton: {
    backgroundColor: '#FF4444',
    width: 44,
    height: 44,
    marginRight: 12,
  },
  navigateButton: {
    backgroundColor: '#FFB5D8',
    flex: 1,
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

export default HospitalFinder;