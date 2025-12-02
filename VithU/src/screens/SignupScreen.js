// SignupScreen.js - Main signup component with API integration
import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

export function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !mobileNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    // Simple mobile validation - adjust according to your needs
    if (mobileNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return false;
    }
    
    return true;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(
        'https://womensafety-1-5znp.onrender.com/users/initiateSignup',
        {
          email,
          password,
          mobileNumber,
        }
      );
      
      if (response.data.message === 'User already exists') {
        Alert.alert('Error', 'User already exists. Please login instead.');
      } else if (response.data.message.includes('OTP sent')) {
        // Store user data for future use in the signup flow
        global.userData = { email, password, mobileNumber };
        
        // Navigate to OTP verification screen
        navigation.navigate('PhoneVerification', { email });
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to initiate signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Sign up</Text>
          <Text style={styles.subtitle}>Create your own account.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter your email"
          />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            placeholder="Enter your mobile number"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm your password"
          />

          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextHighlight}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Updated PhoneVerificationScreen with API integration
export function PhoneVerificationScreen({ route }) {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const inputRefs = Array(6).fill(0).map(() => React.createRef());

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const verifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the full 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        'https://womensafety-1-5znp.onrender.com/users/verifyOtp',
        {
          email,
          otp: otpString
        }
      );
      
      if (response.data.message.includes('OTP verified')) {
        navigation.navigate('CreatePin', { email });
      } else {
        Alert.alert('Error', 'Invalid or expired OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.verificationTitle}>Phone Verification</Text>
      <Text style={styles.verificationSubtitle}>
        Enter 6 digit verification code sent to your email and phone number
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={inputRefs[index]}
            style={styles.otpInput}
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
          />
        ))}
      </View>

      <TouchableOpacity 
        style={styles.verifyButton}
        onPress={verifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.verifyButtonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton}>
        <Text style={styles.resendButtonText}>Resend Code</Text>
      </TouchableOpacity>
    </View>
  );
}

// Updated CreatePinScreen with API integration
export function CreatePinScreen({ route }) {
  const { email } = route.params;
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const pinRefs = Array(6).fill(0).map(() => React.createRef());
  const confirmPinRefs = Array(6).fill(0).map(() => React.createRef());

  const handlePinChange = (value, index, isPinConfirm = false) => {
    const refs = isPinConfirm ? confirmPinRefs : pinRefs;
    const currentPin = isPinConfirm ? [...confirmPin] : [...pin];
    
    currentPin[index] = value;
    isPinConfirm ? setConfirmPin(currentPin) : setPin(currentPin);

    if (value && index < 5) {
      refs[index + 1].current.focus();
    }
  };

  const handleCreatePin = async () => {
    const pinString = pin.join('');
    const confirmPinString = confirmPin.join('');
    
    if (pinString.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit PIN');
      return;
    }
    
    if (pinString !== confirmPinString) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        'https://womensafety-1-5znp.onrender.com/users/set-pin',
        {
          email,
          pin: pinString
        }
      );
      
      if (response.data.message.includes('PIN set successfully')) {
        navigation.navigate('UserInfo', { email });
      } else {
        Alert.alert('Error', 'Failed to set PIN');
      }
    } catch (error) {
      console.error('PIN creation error:', error);
      Alert.alert('Error', 'Failed to set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
    
      <Text style={styles.title}>Create new PIN</Text>
      <Text style={styles.description}>
        Please create a 6-digit PIN that will be used to access your account
      </Text>

      <Text style={styles.label}>Enter PIN</Text>
      <View style={styles.pinContainer}>
        {pin.map((digit, index) => (
          <TextInput
            key={`pin-${index}`}
            ref={pinRefs[index]}
            style={styles.pinInput}
            maxLength={1}
            keyboardType="number-pad"
            secureTextEntry
            value={digit}
            onChangeText={(value) => handlePinChange(value, index)}
          />
        ))}
      </View>

      <Text style={styles.label}>Confirm PIN</Text>
      <View style={styles.pinContainer}>
        {confirmPin.map((digit, index) => (
          <TextInput
            key={`confirm-pin-${index}`}
            ref={confirmPinRefs[index]}
            style={styles.pinInput}
            maxLength={1}
            keyboardType="number-pad"
            secureTextEntry
            value={digit}
            onChangeText={(value) => handlePinChange(value, index, true)}
          />
        ))}
      </View>

      <TouchableOpacity 
        style={styles.createPinButton}
        onPress={handleCreatePin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>Create PIN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Updated UserInfoScreen with API integration
export function UserInfoScreen({ route }) {
  const { email } = route.params;
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const validateForm = () => {
    if (!name || !day || !month || !year) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    
    // Validate day
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      Alert.alert('Error', 'Please enter a valid day (1-31)');
      return false;
    }
    
    // Validate month
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      Alert.alert('Error', 'Please enter a valid month (1-12)');
      return false;
    }
    
    // Validate year
    const yearNum = parseInt(year, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      Alert.alert('Error', `Please enter a valid year (1900-${currentYear})`);
      return false;
    }
    
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;
    
    // Format date as yyyy-mm-dd
    const formattedDay = day.padStart(2, '0');
    const formattedMonth = month.padStart(2, '0');
    const dob = `${year}-${formattedMonth}-${formattedDay}`;
    
    setLoading(true);
    try {
      const response = await axios.post(
        'https://womensafety-1-5znp.onrender.com/users/complete-signup',
        {
          email,
          name,
          dob
        }
      );
      
      if (response.data.token) {
        // Store the token for authenticated requests
        global.authToken = response.data.token;
        
        // Navigate to home screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreen' }],
        });
      } else {
        Alert.alert('Error', 'Failed to complete signup');
      }
    } catch (error) {
      console.error('Complete signup error:', error);
      Alert.alert('Error', 'Failed to complete signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
    
      <Text style={styles.title}>Tell us about yourself</Text>

      <Text style={styles.label}>Enter your name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />

      <Text style={styles.label}>Date of Birth</Text>
      <View style={styles.dateContainer}>
        <TextInput
          style={[styles.dateInput, { flex: 1 }]}
          placeholder="DD"
          maxLength={2}
          keyboardType="number-pad"
          value={day}
          onChangeText={setDay}
        />
        <TextInput
          style={[styles.dateInput, { flex: 1, marginHorizontal: 10 }]}
          placeholder="MM"
          maxLength={2}
          keyboardType="number-pad"
          value={month}
          onChangeText={setMonth}
        />
        <TextInput
          style={[styles.dateInput, { flex: 1.5 }]}
          placeholder="YYYY"
          maxLength={4}
          keyboardType="number-pad"
          value={year}
          onChangeText={setYear}
        />
      </View>

      <TouchableOpacity 
        style={styles.continueButton}
        onPress={handleContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  loginLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginTextHighlight: {
    color: '#FFB5D8',
    fontWeight: '600',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  pinInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#FFB5D8',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
  },
  createPinButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 'auto',
  },
  backButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFB5D8',
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  verificationSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#FFB5D8',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
  },
  verifyButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 10,
  },
  resendButtonText: {
    color: '#FFB5D8',
    fontSize: 16,
    textAlign: 'center',
  },
});