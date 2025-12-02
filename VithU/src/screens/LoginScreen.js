// LoginScreen.js - Enhanced UI and API integration with translations
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslations } from '../hooks/useTranslations';
import LanguageSelector from '../components/LanguageSelector';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { t, isRTL, formatWithDirection } = useTranslations();
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const navigation = useNavigation();
  const pinRefs = Array(6).fill(0).map(() => React.createRef());
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // Run entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Check for saved mobile number
    const loadSavedMobile = async () => {
      try {
        const savedMobile = await AsyncStorage.getItem('lastMobileNumber');
        if (savedMobile) {
          setMobileNumber(savedMobile);
        }
      } catch (error) {
        console.error('Error loading saved mobile number:', error);
      }
    };

    loadSavedMobile();
  }, []);

  const handlePinChange = (value, index) => {
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 5) {
      pinRefs[index + 1].current.focus();
    } else if (!value && index > 0) {
      // Handle backspace - move to previous input
      pinRefs[index - 1].current.focus();
    }
  };

  const handleLogin = async () => {
    if (!mobileNumber) {
      Alert.alert(t('errors.fill_all_fields'), t('auth.enter_mobile'));
      return;
    }
    
    const pinString = pin.join('');
    if (pinString.length !== 6) {
      Alert.alert(t('errors.invalid_pin'), t('auth.create_pin_description'));
      return;
    }
    
    setLoading(true);
    try {
      // Format the mobile number (remove any spaces or special characters)
      const formattedMobile = mobileNumber.replace(/\D/g, '');
      
      const response = await axios.post(
       'https://womensafety-1-5znp.onrender.com/users/signin',
        {
          mobileNumber: formattedMobile,
          pin: pinString
        }
      );
      
      if (response.data && response.data.token) {
        // Store user data
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('lastMobileNumber', formattedMobile);
        
        // Navigate to home screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreen' }],
        });
      } else {
        Alert.alert(t('errors.login_failed'), t('errors.invalid_credentials'));
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || t('errors.network_error');
      Alert.alert(t('errors.login_failed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  const handleForgotPin = () => {
    Alert.alert(
      t('auth.reset_pin', 'Reset PIN'),
      t('auth.reset_pin_question', 'Do you want to reset your PIN?'),
      [
        {
          text: t('general.cancel'),
          style: 'cancel'
        },
        {
          text: t('auth.reset', 'Reset'),
          onPress: () => {
            if (mobileNumber) {
              // Navigate to PIN reset screen or initiate the PIN reset flow
              Alert.alert(
                t('auth.pin_reset', 'PIN Reset'), 
                t('auth.otp_will_be_sent', 'An OTP will be sent to your mobile number to reset your PIN.')
              );
            } else {
              Alert.alert(
                t('errors.mobile_required', 'Mobile Number Required'), 
                t('errors.enter_mobile_first', 'Please enter your mobile number first.')
              );
            }
          }
        }
      ]
    );
  };

  const toggleSecureTextEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const directionStyle = isRTL ? { flexDirection: 'row-reverse' } : {};
  const textAlignStyle = isRTL ? { textAlign: 'right' } : { textAlign: 'left' };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Language Selector */}
          <View style={styles.languageSelectorContainer}>
            <LanguageSelector />
          </View>

          {/* App Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>VithU</Text>
            <Text style={styles.logoSubtitle}>{t('home.your_safety_companion', 'Your safety companion')}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.title, textAlignStyle]}>{t('auth.welcome')}</Text>
            <Text style={[styles.subtitle, textAlignStyle]}>
              {t('auth.welcome_subtitle')}
            </Text>

            {/* Mobile Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, textAlignStyle]}>{t('auth.mobile_number')}</Text>
              <View style={[styles.inputWrapper, directionStyle]}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, textAlignStyle]}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  placeholder={t('auth.enter_mobile')}
                  placeholderTextColor="#999"
                  maxLength={10}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
            </View>

            {/* PIN Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, textAlignStyle]}>{t('auth.pin')}</Text>
              <View style={styles.pinContainer}>
                {pin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={pinRefs[index]}
                    style={styles.pinInput}
                    maxLength={1}
                    keyboardType="number-pad"
                    secureTextEntry={secureTextEntry}
                    value={digit}
                    onChangeText={(value) => handlePinChange(value, index)}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={styles.secureTextButton}
                onPress={toggleSecureTextEntry}
              >
                <Ionicons 
                  name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.forgotPinLink, isRTL && { alignSelf: 'flex-start' }]} onPress={handleForgotPin}>
              <Text style={styles.forgotPinText}>{t('auth.forgot_pin')}</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={[{ flexDirection: 'row', alignItems: 'center' }, directionStyle]}>
                  <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
                  <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity style={[styles.googleButton, directionStyle]}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>{t('auth.google_login')}</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={[styles.signupContainer, directionStyle]}>
              <Text style={styles.signupText}>
                {t('auth.no_account')}{' '}
              </Text>
              <TouchableOpacity onPress={handleSignup}>
                <Text style={styles.signupLink}>{t('auth.signup')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  languageSelectorContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    right: 20,
    zIndex: 100,
    paddingTop:30
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 70,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFB5D8',
  },
  logoSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
    marginLeft: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pinInput: {
    width: width / 8,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    color: '#333',
  },
  secureTextButton: {
    position: 'absolute',
    right: 10,
    top: 45,
    padding: 5,
  },
  forgotPinLink: {
    alignSelf: 'flex-end',
    marginBottom: 30,
    marginTop: 10,
  },
  forgotPinText: {
    color: '#FFB5D8',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FFB5D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
    marginLeft: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#000',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signupText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    color: '#FFB5D8',
    fontWeight: '600',
    fontSize: 16,
  },
});