import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Sample investment options (will be used as fallback)
const INVESTMENT_OPTIONS = [
  {
    id: "1",
    name: "Fixed Deposits",
    type: "Low Risk",
    returnRange: "5-7%",
    minInvestment: "₹1,000",
    description:
      "A fixed deposit offers guaranteed returns and is one of the safest investment options. It's ideal for short to medium-term goals.",
    bestFor: ["Beginners", "Emergency funds", "Short-term goals"],
    icon: "cash",
    color: "#4CAF50",
  },
  {
    id: "2",
    name: "Public Provident Fund (PPF)",
    type: "Low Risk",
    returnRange: "7-8%",
    minInvestment: "₹500/year",
    description:
      "PPF is a government-backed long-term savings scheme with tax benefits. It has a lock-in period of 15 years.",
    bestFor: ["Tax saving", "Retirement planning", "Long-term goals"],
    icon: "shield-checkmark",
    color: "#2196F3",
  },
  {
    id: "3",
    name: "Mutual Funds (SIP)",
    type: "Medium Risk",
    returnRange: "8-15%",
    minInvestment: "₹500/month",
    description:
      "Systematic Investment Plans allow you to invest small amounts regularly in mutual funds. They're managed by professionals.",
    bestFor: ["Wealth creation", "Medium to long-term goals", "Beginners to equity"],
    icon: "trending-up",
    color: "#FF9800",
  },
  {
    id: "4",
    name: "Stock Market",
    type: "High Risk",
    returnRange: "10-20%",
    minInvestment: "Varies",
    description:
      "Direct equity investments can offer high returns but come with significant risk. Requires research and market knowledge.",
    bestFor: ["Experienced investors", "Long-term growth", "Diversification"],
    icon: "stats-chart",
    color: "#F44336",
  },
  {
    id: "5",
    name: "Gold",
    type: "Medium Risk",
    returnRange: "8-12%",
    minInvestment: "₹1,000",
    description:
      "Investing in gold can be done through physical gold, gold ETFs, or gold mutual funds. It's traditionally considered a hedge against inflation.",
    bestFor: ["Portfolio diversification", "Hedge against inflation", "Long-term holding"],
    icon: "diamond",
    color: "#FFC107",
  },
  {
    id: "6",
    name: "Real Estate",
    type: "Medium to High Risk",
    returnRange: "8-15%",
    minInvestment: "High",
    description:
      "Property investments can provide rental income and capital appreciation but require significant upfront investment.",
    bestFor: ["Long-term investment", "Income generation", "Capital appreciation"],
    icon: "home",
    color: "#795548",
  },
  {
    id: "7",
    name: "National Pension System (NPS)",
    type: "Low to Medium Risk",
    returnRange: "8-10%",
    minInvestment: "₹500/month",
    description:
      "A government-sponsored retirement scheme that invests in equity, corporate bonds, and government securities.",
    bestFor: ["Retirement planning", "Tax benefits", "Long-term saving"],
    icon: "calendar",
    color: "#9C27B0",
  },
  {
    id: "8",
    name: "Corporate Bonds",
    type: "Medium Risk",
    returnRange: "7-10%",
    minInvestment: "₹10,000",
    description:
      "Lending money to corporations in exchange for regular interest payments and return of principal on maturity.",
    bestFor: ["Regular income", "Higher returns than FDs", "Medium-term goals"],
    icon: "business",
    color: "#607D8B",
  },
];

const InvestmentGuideScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState({
    age: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    existingInvestments: '',
    riskTolerance: 'medium',
    investmentGoals: [],
    investmentHorizon: 'medium'
  });
  const [profileComplete, setProfileComplete] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showOptionDetail, setShowOptionDetail] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const GEMINI_API_KEY = 'AIzaSyDb66Y1MVBDi7RXjHo2BfNN1E-YoRIYKM8'; // Use your API key from the i18n file
  
  const riskToleranceOptions = [
    { value: 'low', label: 'Low', description: 'I prefer safety over high returns' },
    { value: 'medium', label: 'Medium', description: 'I can accept moderate fluctuations for better returns' },
    { value: 'high', label: 'High', description: 'I can tolerate significant market fluctuations for maximizing returns' }
  ];
  
  const investmentHorizonOptions = [
    { value: 'short', label: 'Short Term', period: '< 3 years' },
    { value: 'medium', label: 'Medium Term', period: '3-7 years' },
    { value: 'long', label: 'Long Term', period: '> 7 years' }
  ];
  
  const investmentGoalOptions = [
    { value: 'emergency', label: 'Emergency Fund', icon: 'medkit' },
    { value: 'home', label: 'Home Purchase', icon: 'home' },
    { value: 'education', label: 'Education', icon: 'school' },
    { value: 'retirement', label: 'Retirement', icon: 'umbrella' },
    { value: 'wealth', label: 'Wealth Creation', icon: 'cash' },
    { value: 'business', label: 'Business Startup', icon: 'briefcase' }
  ];
  
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('investmentProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setUserProfile(parsedProfile);
        
        // Check if profile is complete
        const isComplete = 
          parsedProfile.age && 
          parsedProfile.monthlyIncome && 
          parsedProfile.riskTolerance && 
          parsedProfile.investmentHorizon &&
          parsedProfile.investmentGoals && 
          parsedProfile.investmentGoals.length > 0;
        
        setProfileComplete(isComplete);
        
        if (isComplete) {
          setShowRecommendations(true);
          generateRecommendations(parsedProfile);
        }
      }
    } catch (error) {
      console.error('Error loading investment profile:', error);
    }
  };
  
  const saveUserProfile = async () => {
    try {
      await AsyncStorage.setItem('investmentProfile', JSON.stringify(userProfile));
    } catch (error) {
      console.error('Error saving investment profile:', error);
    }
  };
  
  const handleUpdateProfile = (field, value) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };
  
  const toggleInvestmentGoal = (goalValue) => {
    setUserProfile(prev => {
      const currentGoals = [...prev.investmentGoals];
      const index = currentGoals.indexOf(goalValue);
      
      if (index >= 0) {
        // Remove goal
        currentGoals.splice(index, 1);
      } else {
        // Add goal
        currentGoals.push(goalValue);
      }
      
      return { ...prev, investmentGoals: currentGoals };
    });
  };
  
  const handleSubmitProfile = async () => {
    // Validate inputs
    if (!userProfile.age || !userProfile.monthlyIncome) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    if (userProfile.investmentGoals.length === 0) {
      Alert.alert('Missing Goals', 'Please select at least one investment goal.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Save profile
      await saveUserProfile();
      setProfileComplete(true);
      
      // Generate recommendations
      await generateRecommendations(userProfile);
    } catch (error) {
      console.error('Error submitting profile:', error);
      Alert.alert('Error', 'Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendations = async (profile) => {
    try {
      // Formatting the user profile for the API request
      const promptData = {
        age: profile.age,
        monthlyIncome: profile.monthlyIncome,
        monthlyExpenses: profile.monthlyExpenses || "Not specified",
        existingInvestments: profile.existingInvestments || "Not specified",
        riskTolerance: riskToleranceOptions.find(o => o.value === profile.riskTolerance)?.label || profile.riskTolerance,
        investmentGoals: profile.investmentGoals.map(goal => 
          investmentGoalOptions.find(o => o.value === goal)?.label || goal
        ),
        investmentHorizon: investmentHorizonOptions.find(o => o.value === profile.investmentHorizon)?.label || profile.investmentHorizon
      };

      // Creating the prompt for Gemini
      const prompt = `
        You are a financial advisor providing investment recommendations. Based on the following user profile, suggest a personalized investment portfolio allocation with explanations:
        
        User Profile:
        - Age: ${promptData.age} years
        - Monthly Income: ₹${promptData.monthlyIncome}
        - Monthly Expenses: ₹${promptData.monthlyExpenses}
        - Existing Investments: ₹${promptData.existingInvestments}
        - Risk Tolerance: ${promptData.riskTolerance}
        - Investment Goals: ${promptData.investmentGoals.join(", ")}
        - Investment Horizon: ${promptData.investmentHorizon}
        
        Provide recommendations in JSON format with the following structure:
        {
          "recommendations": [
            {
              "id": "1",
              "name": "Fixed Deposits",
              "type": "Low Risk",
              "returnRange": "5-7%",
              "minInvestment": "₹1,000",
              "description": "Detailed description of this investment option",
              "bestFor": ["Emergency funds", "Short-term goals"],
              "icon": "cash",
              "color": "#4CAF50",
              "allocation": 30
            },
            ...more recommendations
          ]
        }
        
        The total allocation percentages should add up to 100%. Only provide the JSON object without any other text.
        
        Use these icon options (choose the most appropriate): cash, shield-checkmark, trending-up, stats-chart, diamond, home, calendar, business.
        
        Include 3-5 recommendations based on the user's profile.
      `;

      // Make API call to Gemini
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Process the response
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*)\n```/) || 
                       aiResponse.match(/{[\s\S]*}/);
                       
      let aiRecommendations;
      
      if (jsonMatch) {
        // If we found JSON in code block or directly
        aiRecommendations = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // If no JSON formatting, try to parse the whole text
        aiRecommendations = JSON.parse(aiResponse);
      }
      
      return aiRecommendations.recommendations;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      throw error;
    }
  };
  
  const generateRecommendations = async (profile) => {
    setLoading(true);
    setAiError(null);
    
    try {
      let recommendedOptions = [];
      
      // Try AI recommendations first if enabled
      if (aiEnabled) {
        try {
          recommendedOptions = await generateAIRecommendations(profile);
        } catch (error) {
          console.error('AI recommendation failed, falling back to local logic:', error);
          setAiError('AI recommendations failed. Using local fallback logic instead.');
          recommendedOptions = generateLocalRecommendations(profile);
        }
      } else {
        // Use local logic if AI is disabled
        recommendedOptions = generateLocalRecommendations(profile);
      }
      
      setRecommendations(recommendedOptions);
      setShowRecommendations(true);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Alert.alert('Error', 'Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Local fallback logic for generating recommendations
  const generateLocalRecommendations = (profile) => {
    // Convert inputs to numbers
    const age = parseInt(profile.age);
    
    // Simple recommendation logic
    let recommendedOptionIds = [];
    
    // Age-based recommendations
    if (age < 30) {
      // Young investors can take more risk
      if (profile.riskTolerance === 'high') {
        recommendedOptionIds.push('4', '3', '5'); // Stocks, Mutual Funds, Gold
      } else if (profile.riskTolerance === 'medium') {
        recommendedOptionIds.push('3', '5', '7'); // Mutual Funds, Gold, NPS
      } else {
        recommendedOptionIds.push('1', '2', '7'); // FD, PPF, NPS
      }
    } else if (age < 45) {
      // Mid-age investors need balanced portfolio
      if (profile.riskTolerance === 'high') {
        recommendedOptionIds.push('4', '3', '6'); // Stocks, Mutual Funds, Real Estate
      } else if (profile.riskTolerance === 'medium') {
        recommendedOptionIds.push('3', '5', '8'); // Mutual Funds, Gold, Corporate Bonds
      } else {
        recommendedOptionIds.push('2', '7', '1'); // PPF, NPS, FD
      }
    } else {
      // Older investors should focus on stability
      if (profile.riskTolerance === 'high') {
        recommendedOptionIds.push('3', '5', '8'); // Mutual Funds, Gold, Corporate Bonds
      } else if (profile.riskTolerance === 'medium') {
        recommendedOptionIds.push('2', '7', '8'); // PPF, NPS, Corporate Bonds
      } else {
        recommendedOptionIds.push('1', '2', '7'); // FD, PPF, NPS
      }
    }
    
    // Goal-based adjustments
    if (profile.investmentGoals.includes('emergency')) {
      if (!recommendedOptionIds.includes('1')) recommendedOptionIds.unshift('1'); // FD for emergency
    }
    
    if (profile.investmentGoals.includes('retirement')) {
      if (!recommendedOptionIds.includes('7')) recommendedOptionIds.push('7'); // NPS for retirement
    }
    
    // Get full details for recommended options
    const detailedRecommendations = recommendedOptionIds
      .map(id => INVESTMENT_OPTIONS.find(option => option.id === id))
      .filter(Boolean); // Remove any undefined items
    
    // Add allocation percentages
    let totalAllocation = 100;
    const allocatedOptions = detailedRecommendations.map((option, index) => {
      let allocation = 0;
      
      if (index === 0) {
        // First recommendation gets the highest allocation
        allocation = profile.riskTolerance === 'high' ? 50 : 
                      profile.riskTolerance === 'medium' ? 40 : 30;
      } else if (index === 1) {
        // Second recommendation
        allocation = profile.riskTolerance === 'high' ? 30 : 
                      profile.riskTolerance === 'medium' ? 35 : 30;
      } else {
        // Remaining allocation divided among other options
        allocation = Math.floor(totalAllocation / (detailedRecommendations.length - 2));
      }
      
      totalAllocation -= allocation;
      
      return {
        ...option,
        allocation: allocation
      };
    });
    
    // Adjust last item to account for any rounding errors
    if (allocatedOptions.length > 0) {
      allocatedOptions[allocatedOptions.length - 1].allocation += totalAllocation;
    }
    
    return allocatedOptions;
  };
  
  const handleViewDetails = (option) => {
    setSelectedOption(option);
    setShowOptionDetail(true);
  };

  const handleEditProfile = () => {
    setShowRecommendations(false);
  };
  
  const handleResetProfile = () => {
    Alert.alert(
      'Reset Profile',
      'Are you sure you want to reset your investment profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('investmentProfile');
              setUserProfile({
                age: '',
                monthlyIncome: '',
                monthlyExpenses: '',
                existingInvestments: '',
                riskTolerance: 'medium',
                investmentGoals: [],
                investmentHorizon: 'medium'
              });
              setProfileComplete(false);
              setShowRecommendations(false);
              setRecommendations([]);
              setAiError(null);
            } catch (error) {
              console.error('Error resetting profile:', error);
              Alert.alert('Error', 'Failed to reset profile. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const toggleAI = () => {
    Alert.alert(
      aiEnabled ? 'Disable AI Recommendations?' : 'Enable AI Recommendations?',
      aiEnabled 
        ? 'This will use simpler logic instead of Gemini AI for investment recommendations.' 
        : 'This will use Gemini AI to provide more personalized investment recommendations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: aiEnabled ? 'Disable AI' : 'Enable AI', 
          onPress: () => {
            setAiEnabled(!aiEnabled);
            if (profileComplete) {
              generateRecommendations(userProfile);
            }
          }
        }
      ]
    );
  };
  
  const renderProfileForm = () => (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.formTitle}>Create Your Investment Profile</Text>
      <Text style={styles.formSubtitle}>
        We'll use this information to provide personalized investment recommendations.
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Your Age</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your age"
          keyboardType="numeric"
          value={userProfile.age}
          onChangeText={(value) => handleUpdateProfile('age', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Monthly Income (₹)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your monthly income"
          keyboardType="numeric"
          value={userProfile.monthlyIncome}
          onChangeText={(value) => handleUpdateProfile('monthlyIncome', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Monthly Expenses (₹) (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your monthly expenses"
          keyboardType="numeric"
          value={userProfile.monthlyExpenses}
          onChangeText={(value) => handleUpdateProfile('monthlyExpenses', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Existing Investments (₹) (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter total value of existing investments"
          keyboardType="numeric"
          value={userProfile.existingInvestments}
          onChangeText={(value) => handleUpdateProfile('existingInvestments', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Risk Tolerance</Text>
        <View style={styles.optionsContainer}>
          {riskToleranceOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                userProfile.riskTolerance === option.value && styles.optionButtonSelected
              ]}
              onPress={() => handleUpdateProfile('riskTolerance', option.value)}
            >
              <Text style={[
                styles.optionButtonText,
                userProfile.riskTolerance === option.value && styles.optionButtonTextSelected
              ]}>
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Investment Horizon</Text>
        <View style={styles.optionsContainer}>
          {investmentHorizonOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                userProfile.investmentHorizon === option.value && styles.optionButtonSelected
              ]}
              onPress={() => handleUpdateProfile('investmentHorizon', option.value)}
            >
              <Text style={[
                styles.optionButtonText,
                userProfile.investmentHorizon === option.value && styles.optionButtonTextSelected
              ]}>
                {option.label} ({option.period})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Investment Goals (Select all that apply)</Text>
        <View style={styles.goalsContainer}>
          {investmentGoalOptions.map((goal) => (
            <TouchableOpacity
              key={goal.value}
              style={[
                styles.goalButton,
                userProfile.investmentGoals.includes(goal.value) && styles.goalButtonSelected
              ]}
              onPress={() => toggleInvestmentGoal(goal.value)}
            >
              <Ionicons 
                name={goal.icon} 
                size={24} 
                color={userProfile.investmentGoals.includes(goal.value) ? '#FFF' : '#666'} 
              />
              <Text style={[
                styles.goalButtonText,
                userProfile.investmentGoals.includes(goal.value) && styles.goalButtonTextSelected
              ]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.aiToggleContainer}>
        <Text style={styles.aiToggleText}>Use AI for personalized recommendations</Text>
        <TouchableOpacity
          style={[styles.aiToggleButton, aiEnabled ? styles.aiToggleEnabled : styles.aiToggleDisabled]}
          onPress={toggleAI}
        >
          <Text style={styles.aiToggleButtonText}>
            {aiEnabled ? 'AI Enabled' : 'AI Disabled'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmitProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Get Investment Recommendations</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
  
  const renderRecommendations = () => (
    <ScrollView style={styles.recommendationsContainer}>
      {aiError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>{aiError}</Text>
        </View>
      )}
      
      <View style={styles.profileSummary}>
        <Text style={styles.profileTitle}>Your Investment Profile</Text>
        <View style={styles.profileDetails}>
          <View style={styles.profileDetail}>
            <Text style={styles.profileLabel}>Age</Text>
            <Text style={styles.profileValue}>{userProfile.age} years</Text>
          </View>
          <View style={styles.profileDetail}>
            <Text style={styles.profileLabel}>Risk Tolerance</Text>
            <Text style={styles.profileValue}>{
              riskToleranceOptions.find(o => o.value === userProfile.riskTolerance)?.label
            }</Text>
          </View>
          <View style={styles.profileDetail}>
            <Text style={styles.profileLabel}>Investment Horizon</Text>
            <Text style={styles.profileValue}>{
              investmentHorizonOptions.find(o => o.value === userProfile.investmentHorizon)?.label
            }</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.recommendationsTitle}>Recommended Portfolio</Text>
      <Text style={styles.recommendationsSubtitle}>
        Based on your profile, here's a suggested investment allocation:
      </Text>
      
      <View style={styles.allocationContainer}>
        {recommendations.map((option) => (
          <View key={option.id} style={styles.allocationItem}>
            <View style={styles.allocationBar}>
              <View 
                style={[
                  styles.allocationFill, 
                  { 
                    width: `${option.allocation}%`,
                    backgroundColor: option.color 
                  }
                ]} 
              />
              <Text style={styles.allocationPercent}>{option.allocation}%</Text>
            </View>
            <Text style={styles.allocationName}>{option.name}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.aiStatusContainer}>
        <Text style={styles.aiStatusLabel}>Recommendation Source:</Text>
        <View style={[
          styles.aiStatusBadge,
          aiEnabled ? styles.aiStatusBadgeEnabled : styles.aiStatusBadgeDisabled
        ]}>
          <Text style={styles.aiStatusText}>
            {aiEnabled ? 'Gemini AI' : 'Basic Logic'}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleAI}>
          <Text style={styles.aiToggleLink}>
            {aiEnabled ? 'Switch to Basic Logic' : 'Switch to AI'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.recommendationsTitle}>Investment Options</Text>
      
      {recommendations.map((option) => (
        <TouchableOpacity 
          key={option.id}
          style={styles.recommendationCard}
          onPress={() => handleViewDetails(option)}
        >
          <View style={styles.recommendationHeader}>
            <View style={[styles.recommendationIcon, { backgroundColor: option.color }]}>
              <Ionicons name={option.icon} size={24} color="#FFF" />
            </View>
            <View style={styles.recommendationTitleContainer}>
              <Text style={styles.recommendationTitle}>{option.name}</Text>
              <Text style={styles.recommendationType}>{option.type}</Text>
            </View>
            <View style={styles.allocationBadge}>
              <Text style={styles.allocationBadgeText}>{option.allocation}%</Text>
            </View>
          </View>
          
          <View style={styles.recommendationDetails}>
            <View style={styles.recommendationDetail}>
              <Text style={styles.detailLabel}>Expected Returns</Text>
              <Text style={styles.detailValue}>{option.returnRange}</Text>
            </View>
            <View style={styles.recommendationDetail}>
              <Text style={styles.detailLabel}>Min. Investment</Text>
              <Text style={styles.detailValue}>{option.minInvestment}</Text>
            </View>
          </View>
          
          <Text style={styles.recommendationDescription} numberOfLines={2}>
            {option.description}
          </Text>
          
          <View style={styles.bestForContainer}>
            {option.bestFor.map((tag, index) => (
              <View key={index} style={styles.bestForTag}>
                <Text style={styles.bestForTagText}>{tag}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFB5D8" />
          </View>
        </TouchableOpacity>
      ))}
      
      <View style={styles.disclaimerContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.disclaimerText}>
          These recommendations are for educational purposes only. Always consult with a financial advisor before making investment decisions.
        </Text>
      </View>
    </ScrollView>
  );
  
  const renderOptionDetail = () => {
    if (!selectedOption) return null;
    
    return (
      <ScrollView style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <View style={[styles.detailHeaderIcon, { backgroundColor: selectedOption.color }]}>
            <Ionicons name={selectedOption.icon} size={32} color="#FFF" />
          </View>
          <View style={styles.detailHeaderInfo}>
            <Text style={styles.detailHeaderTitle}>{selectedOption.name}</Text>
            <Text style={styles.detailHeaderType}>{selectedOption.type}</Text>
          </View>
        </View>
        
        <View style={styles.detailCards}>
          <View style={styles.detailCard}>
            <Text style={styles.detailCardLabel}>Expected Returns</Text>
            <Text style={styles.detailCardValue}>{selectedOption.returnRange}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailCardLabel}>Min. Investment</Text>
            <Text style={styles.detailCardValue}>{selectedOption.minInvestment}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailCardLabel}>Recommended Allocation</Text>
            <Text style={styles.detailCardValue}>{selectedOption.allocation}%</Text>
          </View>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Description</Text>
          <Text style={styles.detailSectionText}>{selectedOption.description}</Text>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Best For</Text>
          <View style={styles.bestForDetailContainer}>
            {selectedOption.bestFor.map((tag, index) => (
              <View key={index} style={styles.bestForDetailTag}>
                <Text style={styles.bestForDetailTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>How to Invest</Text>
          <Text style={styles.detailSectionText}>
            You can invest in {selectedOption.name} through various banks, financial institutions, or investment platforms. Research different providers to find the best rates and terms for your needs.
          </Text>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Tax Implications</Text>
          <Text style={styles.detailSectionText}>
            Tax treatment varies based on the investment type and holding period. Consult a tax advisor for specific advice related to your situation.
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.closeDetailButton}
          onPress={() => setShowOptionDetail(false)}
        >
          <Text style={styles.closeDetailButtonText}>Back to Recommendations</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investment Guide</Text>
        <View style={styles.headerRight} />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFB5D8" />
          <Text style={styles.loadingText}>
            {aiEnabled ? "AI is analyzing your profile..." : "Analyzing your profile..."}
          </Text>
        </View>
      )}

      {!profileComplete && !showRecommendations && renderProfileForm()}
      {profileComplete && showRecommendations && !showOptionDetail && renderRecommendations()}
      {showOptionDetail && renderOptionDetail()}

      {/* Reset button (only show when profile is complete) */}
      {profileComplete && !showOptionDetail && (
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetProfile}
        >
          <Text style={styles.resetButtonText}>Reset Profile</Text>
        </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'column',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  optionButtonSelected: {
    borderColor: '#FFB5D8',
    backgroundColor: 'rgba(255, 181, 216, 0.1)',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionButtonTextSelected: {
    color: '#FFB5D8',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    minWidth: '45%',
  },
  goalButtonSelected: {
    borderColor: '#FFB5D8',
    backgroundColor: '#FFB5D8',
  },
  goalButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  goalButtonTextSelected: {
    color: '#FFF',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aiToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  aiToggleText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  aiToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  aiToggleEnabled: {
    backgroundColor: '#8FD14F',
  },
  aiToggleDisabled: {
    backgroundColor: '#999',
  },
  aiToggleButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationsContainer: {
    padding: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFEFEF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  profileSummary: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  profileDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileDetail: {
    alignItems: 'center',
  },
  profileLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  editProfileButton: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFB5D8',
    borderRadius: 8,
  },
  editProfileButtonText: {
    color: '#FFB5D8',
    fontWeight: '600',
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  recommendationsSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  aiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  aiStatusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  aiStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  aiStatusBadgeEnabled: {
    backgroundColor: '#8FD14F',
  },
  aiStatusBadgeDisabled: {
    backgroundColor: '#999',
  },
  aiStatusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  aiToggleLink: {
    color: '#FFB5D8',
    fontSize: 14,
    fontWeight: '500',
  },
  allocationContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  allocationItem: {
    marginBottom: 12,
  },
  allocationBar: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  allocationFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  allocationPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
    zIndex: 1,
  },
  allocationName: {
    fontSize: 14,
    color: '#666',
  },
  recommendationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationTitleContainer: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recommendationType: {
    fontSize: 14,
    color: '#666',
  },
  allocationBadge: {
    backgroundColor: '#FFB5D8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  allocationBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  recommendationDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recommendationDetail: {
    marginRight: 24,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  bestForContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  bestForTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  bestForTagText: {
    fontSize: 12,
    color: '#666',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewDetailsText: {
    color: '#FFB5D8',
    fontWeight: '600',
    marginRight: 4,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  resetButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  detailContainer: {
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailHeaderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailHeaderType: {
    fontSize: 16,
    color: '#666',
  },
  detailCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  detailCardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailSectionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  bestForDetailContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bestForDetailTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  bestForDetailTagText: {
    fontSize: 14,
    color: '#333',
  },
  closeDetailButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  closeDetailButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default InvestmentGuideScreen;