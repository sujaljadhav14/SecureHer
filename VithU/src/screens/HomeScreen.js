import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  Animated,
  Easing,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import axios from 'axios';
import IncidentReportScreen from '../screens/IncidentReportScreen';


const API_BASE_URL = 'https://womensafety-1-5znp.onrender.com';

const HomeScreen = () => {
  const navigation = useNavigation();
  const avatar = require('../../assets/icon.png');
  const [activeTab, setActiveTab] = useState('home');
  const [closeContacts, setCloseContacts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Animation values for each tab
  const scaleAnims = {
    home: useRef(new Animated.Value(1)).current,
    navigate: useRef(new Animated.Value(1)).current,
    people: useRef(new Animated.Value(1)).current,
    profile: useRef(new Animated.Value(1)).current
  };

  useEffect(() => {
    loadCloseContacts();
    fetchUserProfile();
  }, []);
  
  const handleFakeCall = () => {
    // Navigate to the fake call screen
    navigation.navigate('FakeCall');
  };

  const handleReportIncident = () => {
    navigation.navigate('IncidentReport');
  };
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No auth token found, using default profile');
        return;
      }
     
      
      const response = await axios.get(`${API_BASE_URL}/users/getUserProfile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUserProfile(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenAIChat = () => {
    navigation.navigate('GenAIChat');
  };

  const loadCloseContacts = async () => {
    try {
      const contacts = await AsyncStorage.getItem('close_contacts');
      if (contacts) {
        setCloseContacts(JSON.parse(contacts));
      }
    } catch (error) {
      console.error('Error loading close contacts:', error);
    }
  };
  
  const handleShareLocation = async () => {
    try {
      // Check location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }
  
      // Get close contacts
      const contacts = await AsyncStorage.getItem('close_contacts');
      const closeContacts = contacts ? JSON.parse(contacts) : [];
  
      if (closeContacts.length === 0) {
        Alert.alert('No close contacts', 'Please add close contacts first');
        return;
      }
  
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
  
      // Create location message
      const { latitude, longitude } = location.coords;
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const message = `My current location: ${googleMapsUrl}`;
  
      // Options for sharing
      Alert.alert(
        'Share Location',
        'How would you like to share your location?',
        [
          {
            text: 'Create New Group',
            onPress: async () => {
              // Open WhatsApp to create new group
              try {
                // This opens WhatsApp's group creation screen
                await Linking.openURL('whatsapp://group');
                
                // After a short delay, show instructions to user
                setTimeout(() => {
                  Alert.alert(
                    'Create Group',
                    'Please create a group with your close contacts. Once created, the location will be shared automatically.',
                    [
                      {
                        text: 'Share Location to Group',
                        onPress: async () => {
                          // Share location to the newly created group
                          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
                          await Linking.openURL(whatsappUrl);
                        }
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      }
                    ]
                  );
                }, 1000);
              } catch (error) {
                console.error('Error creating group:', error);
                Alert.alert('Error', 'Could not open WhatsApp');
              }
            }
          },
          {
            text: 'Send Individually',
            onPress: async () => {
              // Send to each contact individually
              for (const contact of closeContacts) {
                let phoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
                
                // Add country code if not present
                if (phoneNumber.length === 10) {
                  phoneNumber = `91${phoneNumber}`; // Adding India's country code
                }
                
                try {
                  const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
                  await Linking.openURL(whatsappUrl);
                  await new Promise(resolve => setTimeout(resolve, 500)); // Add small delay between attempts
                } catch (whatsappError) {
                  console.log('WhatsApp sharing failed:', whatsappError);
                }
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
  
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'An unexpected error occurred while sharing location');
    }
  };

  const handlePoliceStationPress = () => {
    navigation.navigate('PoliceStationFinder');
  };

  // SOS button animation
  const sosScale = useRef(new Animated.Value(1)).current;
  const sosRotate = useRef(new Animated.Value(0)).current;

  const handleTabPress = (tabName) => {
    // Reset all animations
    Object.keys(scaleAnims).forEach(key => {
      Animated.spring(scaleAnims[key], {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });

    // Animate the pressed tab
    Animated.sequence([
      Animated.spring(scaleAnims[tabName], {
        toValue: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[tabName], {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();

    setActiveTab(tabName);
    
    // Handle navigation for tabs
    if (tabName === 'profile' && navigation) {
      navigation.navigate('Profile');
    } else if (tabName === 'people' && navigation) {
      navigation.navigate('Community');
    }
  };

  const handleSOSPress = () => {
    navigation.navigate('SOS');
    Animated.sequence([
      Animated.timing(sosScale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sosScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();

    // Rotation animation
    Animated.timing(sosRotate, {
      toValue: 1,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      sosRotate.setValue(0);
    });
  };

  const spin = sosRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Add Community Card
  const renderCommunityCard = () => (
    <TouchableOpacity 
      style={styles.journeyCard}
      onPress={() => navigation.navigate('Community')}
    >
      <View style={styles.journeyContent}>
        <Ionicons name="people" size={24} color="#FFB5D8" />
        <View style={styles.journeyText}>
          <Text style={styles.journeyTitle}>Community</Text>
          <Text style={styles.journeySubtitle}>
            Connect with others, share experiences and stay updated with safety tips.
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );
  const handleWomenEmpowermentPress = () => {
    navigation.navigate('WomenEmpowerment');
  };
  // Get user's first name or default to "there"
  const getUserFirstName = () => {
    if (userProfile && userProfile.name) {
      // Extract first name if full name is provided
      return userProfile.name.split(' ')[0];
    }
    return "there";
  };

  // Get profile image or generate avatar based on user's name
  const getUserAvatar = () => {
    if (userProfile && userProfile.profileImage) {
      return { uri: userProfile.profileImage };
    }
    return avatar;
  };

  // Generate a background color for text avatar based on user's name
  const getAvatarBackgroundColor = () => {
    if (!userProfile || !userProfile.name) return "#FFB5D8";
    
    const colors = ['#FFB5D8', '#4285F4', '#34A853', '#FBBC05', '#EA4335'];
    const nameHash = userProfile.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[nameHash % colors.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFB5D8" style={styles.avatarLoader} />
          ) : (
            userProfile && userProfile.profileImage ? (
              <Image source={getUserAvatar()} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.textAvatar, { backgroundColor: getAvatarBackgroundColor() }]}>
                <Text style={styles.textAvatarContent}>
                  {userProfile && userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )
          )}
          <View>
            <Text style={styles.greeting}>Hey {getUserFirstName()} 👋</Text>
            <Text style={styles.username}>
              {userProfile && userProfile.name ? userProfile.name : "User"}
            </Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="mic-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Actions Grid */}
        <View style={styles.actionRow}>
  <TouchableOpacity 
    style={styles.actionCard}
    onPress={handleFakeCall}
  >
    <MaterialIcons name="phone" size={24} color="#FFB5D8" />
    <Text style={styles.actionText}>Fake call</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.actionCard}
    onPress={handleShareLocation}
  >
    <Ionicons name="location" size={24} color="#FFB5D8" />
    <Text style={styles.actionText}>Share live{'\n'}location</Text>
  </TouchableOpacity>
</View>

        {/* Add Close People Card */}
        <View style={styles.peopleCard}>
          <View>
            <Text style={styles.cardTitle}>Add Close people</Text>
            <Text style={styles.cardSubtitle}>Add close people and friends for sos</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('CloseContacts')}
          >
            <Text style={styles.addButtonText}>Add friends</Text>
            <Ionicons name="people" size={16} color="white" />
          </TouchableOpacity>
        </View>
   
        {/* Journey Card */}
        <TouchableOpacity 
          style={styles.journeyCard}
          onPress={() => navigation.navigate('JourneyTracker')}
        >
          <View style={styles.journeyContent}>
            <FontAwesome5 name="walking" size={24} color="#FFB5D8" />
            <View style={styles.journeyText}>
              <Text style={styles.journeyTitle}>Start a journey</Text>
              <Text style={styles.journeySubtitle}>
                Enter your destination, and the app will track your route in real-time.
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
          {/* Incident Report Card */}
<TouchableOpacity 
  style={styles.journeyCard}
  onPress={handleReportIncident}
>
  <View style={styles.journeyContent}>
    <Ionicons name="document-text-outline" size={24} color="#FFB5D8" />
    <View style={styles.journeyText}>
      <Text style={styles.journeyTitle}>Report Incident</Text>
      <Text style={styles.journeySubtitle}>
        File a detailed report about any safety incidents you've experienced.
      </Text>
    </View>
  </View>
  <Feather name="chevron-right" size={24} color="#666" />
</TouchableOpacity>


        {/* Community Card - NEW */}
        {renderCommunityCard()}
        const renderWomenEmpowermentCard = () (
     <TouchableOpacity 
       style={[styles.journeyCard, styles.empowermentCard]}
       onPress={handleWomenEmpowermentPress}
     >
       <View style={styles.journeyContent}>
         <MaterialIcons name="emoji-people" size={24} color="#FFB5D8" />
         <View style={styles.journeyText}>
           <Text style={styles.journeyTitle}>Empowerment</Text>
           <Text style={styles.journeySubtitle}>
             Access skill development courses, financial tools, and resources for personal growth.
           </Text>
         </View>
       </View>
       <Feather name="chevron-right" size={24} color="#666" />
     </TouchableOpacity>
   );
        {/* Emergency Buttons */}
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={handlePoliceStationPress}
        >
          <Ionicons name="shield-outline" size={24} color="#FFB5D8" />
          <Text style={styles.emergencyText}>Police station near me</Text>
          <Feather name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={() => navigation.navigate('HospitalFinder')}
        >
          <Ionicons name="medical-outline" size={24} color="#FFB5D8" />
          <Text style={styles.emergencyText}>Hospital Near</Text>
          <Feather name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

        {/* Add some padding at the bottom for the navigation bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Animated.View style={{ transform: [{ scale: scaleAnims.home }] }}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleTabPress('home')}
          >
            <Ionicons 
              name={activeTab === 'home' ? "home" : "home-outline"} 
              size={24} 
              color={activeTab === 'home' ? "#FFB5D8" : "#666"} 
            />
            <Text style={[
              styles.navText, 
              { color: activeTab === 'home' ? "#FFB5D8" : "#666" }
            ]}>Home</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: scaleAnims.navigate }] }}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleTabPress('navigate')}
          >
            <Ionicons 
              name={activeTab === 'navigate' ? "navigate" : "navigate-outline"} 
              size={24} 
              color={activeTab === 'navigate' ? "#FFB5D8" : "#666"} 
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{
          transform: [
            { scale: sosScale },
            { rotate: spin }
          ]
        }}>
          <TouchableOpacity 
            style={styles.sosButton}
            onPress={handleSOSPress}
            activeOpacity={0.7}
          >
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: scaleAnims.people }] }}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleTabPress('people')}
          >
            <Ionicons 
              name={activeTab === 'people' ? "people" : "people-outline"} 
              size={24} 
              color={activeTab === 'people' ? "#FFB5D8" : "#666"} 
            />
            <Text style={[
              styles.navText, 
              { color: activeTab === 'people' ? "#FFB5D8" : "#666" }
            ]}>Community</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: scaleAnims.profile }] }}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleTabPress('profile')}
          >
            <Ionicons 
              name={activeTab === 'profile' ? "person" : "person-outline"} 
              size={24} 
              color={activeTab === 'profile' ? "#FFB5D8" : "#666"} 
            />
            <Text style={[
              styles.navText, 
              { color: activeTab === 'profile' ? "#FFB5D8" : "#666" }
            ]}>Profile</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <TouchableOpacity 
          style={styles.genAIChatButton}
          onPress={handleGenAIChat}
        >
          <MaterialCommunityIcons name="gavel" size={24} color="#FFB5D8" />
        </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 68,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textAvatarContent: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarLoader: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    padding: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#000',
    fontSize: 14,
  },
  peopleCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#FFB5D8',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#FFF',
    marginRight: 4,
    fontSize: 14,
  },
  addButtonIcon: {
    marginLeft: 4,
  },
  journeyCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  journeyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  journeyText: {
    marginLeft: 12,
    flex: 1,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  journeySubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emergencyButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  bottomPadding: {
    height: 80, // Adjust based on your navigation bar height
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
  },
  sosButton: {
    backgroundColor: '#FFB5D8',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sosText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  genAIChatButton: {
    backgroundColor: '#FFFF', // Google Blue color
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
});

export default HomeScreen;