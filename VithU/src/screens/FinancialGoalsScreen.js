import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

// API URL
const API_BASE_URL = 'https://womensafety-1-5znp.onrender.com/users';

const GOAL_TYPES = [
  { id: 'finance', name: 'Emergency Fund', icon: 'medkit', color: '#F44336', description: 'For unexpected expenses' },
  { id: 'education', name: 'Education', icon: 'school', color: '#9C27B0', description: 'For education or skill development' },
  { id: 'business', name: 'Business', icon: 'briefcase', color: '#FF9800', description: 'For starting/expanding business' },
  { id: 'home', name: 'Home', icon: 'home', color: '#4CAF50', description: 'For home purchase or renovation' },
  { id: 'retirement', name: 'Retirement', icon: 'umbrella', color: '#3F51B5', description: 'For retirement savings' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: '#00BCD4', description: 'For travel expenses' },
  { id: 'wedding', name: 'Wedding', icon: 'heart', color: '#E91E63', description: 'For wedding expenses' },
  { id: 'custom', name: 'Custom Goal', icon: 'star', color: '#607D8B', description: 'Create your own goal' }
];

const FinancialGoalsScreen = () => {
  const navigation = useNavigation();
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [selectedGoalType, setSelectedGoalType] = useState(null);
  const [currentSaved, setCurrentSaved] = useState('');
  const [showGoalTypeModal, setShowGoalTypeModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get user token and user ID from secure storage
        const userToken = await AsyncStorage.getItem('userToken');
        const userInfo = await AsyncStorage.getItem('userData');
        
        if (userToken && userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          setToken(userToken);
          setUserId(parsedUserInfo.userId || parsedUserInfo._id);
          fetchGoals(userToken, parsedUserInfo.userId || parsedUserInfo._id);
        } else {
          setLoading(false);
          setError('User authentication not found. Please log in again.');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setLoading(false);
        setError('Failed to initialize: ' + error.message);
      }
    };
    
    initialize();
  }, []);
  
  const fetchGoals = async (authToken, uid) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Attempting to fetch goals with token: ${authToken ? 'Valid token' : 'No token'}`);
      
      // Make sure we're using the correct endpoint for the API
      const response = await axios.get(`${API_BASE_URL}/getGoals`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response for getGoals:', JSON.stringify(response.data, null, 2));
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} goals from the API`);
        
        // Map API response to our app's format
        const formattedGoals = response.data.map(goal => {
          // Find a goal type based on category or default to 'custom'
          const goalType = GOAL_TYPES.find(type => 
            type.id === (goal.category || 'custom').toLowerCase()
          ) || GOAL_TYPES.find(type => type.id === 'custom');
          
          console.log(`Processing goal: ${goal.goalName}, category: ${goal.category}, type: ${goalType?.id}`);
          
          return {
            id: goal._id,
            name: goal.goalName,
            type: goalType.id,
            typeName: goalType.name,
            icon: goalType.icon,
            color: goalType.color,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount || goal.initialSaving || 0,
            remainingAmount: goal.remainingAmount || (goal.targetAmount - (goal.currentAmount || goal.initialSaving || 0)),
            targetDate: goal.targetDate.split('T')[0], // Format date to YYYY-MM-DD
            createdAt: goal.createdAt,
            apiData: goal // Keep original API data for reference
          };
        });
        
        console.log(`Formatted ${formattedGoals.length} goals for display`);
        setGoals(formattedGoals);
      } else {
        console.log('No goals data returned or invalid format:', response.data);
        setGoals([]);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', error.response.data);
      }
      
      setError('Failed to fetch goals: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Update the handleCreateGoal function to ensure proper refresh after goal creation
  const handleCreateGoal = async () => {
    if (!selectedGoalType) {
      Alert.alert('Error', 'Please select a goal type');
      return;
    }
    
    if (!goalName.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }
    
    if (!goalAmount || isNaN(parseFloat(goalAmount)) || parseFloat(goalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }
    
    if (!goalTargetDate) {
      Alert.alert('Error', 'Please enter a target date');
      return;
    }
    
    const savedAmount = parseFloat(currentSaved) || 0;
    const targetAmount = parseFloat(goalAmount);
    
    if (savedAmount > targetAmount) {
      Alert.alert('Error', 'Saved amount cannot be greater than the target amount');
      return;
    }
    
    // Validate and format the date properly
    let formattedDate;
    try {
      const targetDateObj = new Date(goalTargetDate);
      if (isNaN(targetDateObj.getTime())) {
        Alert.alert('Error', 'Please enter a valid date in YYYY-MM-DD format');
        return;
      }
      
      // Format date as YYYY-MM-DD with leading zeros
      const year = targetDateObj.getFullYear();
      const month = String(targetDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(targetDateObj.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
      
      const currentDate = new Date();
      if (targetDateObj < currentDate) {
        Alert.alert('Error', 'Target date must be in the future');
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid date format. Please use YYYY-MM-DD');
      return;
    }
    
    try {
      setLoading(true);
      
      const goalData = {
        category: selectedGoalType.id,
        goalName: goalName,
        targetAmount: parseFloat(targetAmount),
        initialSaving: parseFloat(savedAmount),
        targetDate: formattedDate
      };
      
      console.log("Creating goal with data:", goalData);
      
      const response = await axios.post(`${API_BASE_URL}/createGoal`, goalData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Create goal response:", response.data);
      
      if (response.data) {
        // Reset form and close modal
        resetForm();
        setShowModal(false);
        
        // Add the newly created goal to our local state to avoid waiting for refresh
        const newGoal = response.data;
        
        // Find the goal type for display formatting
        const goalType = GOAL_TYPES.find(type => 
          type.id === newGoal.category.toLowerCase()
        ) || GOAL_TYPES.find(type => type.id === 'custom');
        
        const formattedNewGoal = {
          id: newGoal._id,
          name: newGoal.goalName,
          type: goalType.id,
          typeName: goalType.name,
          icon: goalType.icon,
          color: goalType.color,
          targetAmount: newGoal.targetAmount,
          currentAmount: newGoal.currentAmount || newGoal.initialSaving || 0,
          remainingAmount: newGoal.remainingAmount || (newGoal.targetAmount - (newGoal.currentAmount || newGoal.initialSaving || 0)),
          targetDate: newGoal.targetDate.split('T')[0],
          createdAt: newGoal.createdAt,
          apiData: newGoal
        };
        
        // Update our local state immediately
        setGoals(currentGoals => [...currentGoals, formattedNewGoal]);
        
        // Then also refresh from the server to ensure we're in sync
        setTimeout(() => {
          fetchGoals(token, userId);
        }, 500);
        
        Alert.alert('Success', 'Goal created successfully!');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', error.response.data);
      }
      Alert.alert('Error', 'Failed to create goal: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  
  
  const resetForm = () => {
    setGoalName('');
    setGoalAmount('');
    setGoalTargetDate('');
    setSelectedGoalType(null);
    setCurrentSaved('');
  };
  
  const handleAddDeposit = async () => {
    if (!selectedGoal) return;
    
    if (!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    const amount = parseFloat(depositAmount);
    
    // Check if deposit would exceed target amount
    if (selectedGoal.currentAmount + amount > selectedGoal.targetAmount) {
      Alert.alert('Error', 'Deposit would exceed your target amount');
      return;
    }
    
    try {
      setLoading(true);
      
      const depositData = {
        goalId: selectedGoal.id,
        depositAmount: amount
      };
      
      console.log("Adding deposit with data:", depositData);
      
      const response = await axios.post(`${API_BASE_URL}/depositToGoal`, depositData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Deposit response:", response.data);
      
      if (response.data) {
        // Reset and close modal
        setDepositAmount('');
        setShowDepositModal(false);
        setSelectedGoal(null);
        
        // Refresh goals list
        fetchGoals(token, userId);
        
        Alert.alert('Success', 'Deposit added successfully!');
      }
    } catch (error) {
      console.error('Error adding deposit:', error);
      Alert.alert('Error', 'Failed to add deposit: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDepositModal = (goal) => {
    setSelectedGoal(goal);
    setShowDepositModal(true);
  };
  
  const handleDeleteGoal = (goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // If the API supports goal deletion, uncomment this code
              // const response = await axios.delete(`${API_BASE_URL}/deleteGoal/${goalId}`, {
              //   headers: {
              //     'Authorization': `Bearer ${token}`
              //   }
              // });
              
              // For now, just remove it from the local state
              const updatedGoals = goals.filter(goal => goal.id !== goalId);
              setGoals(updatedGoals);
              
              Alert.alert('Success', 'Goal deleted successfully!');
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal: ' + (error.response?.data?.message || error.message));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchGoals(token, userId);
  };
  
  // Other utility functions...
  const calculateProgress = (current, target) => {
    return (current / target) * 100;
  };
  
  const formatCurrency = (amount) => {
    return '₹' + parseFloat(amount).toFixed(2);
  };
  
  const getDaysRemaining = (targetDate) => {
    const target = new Date(targetDate);
    const current = new Date();
    const timeDiff = target.getTime() - current.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getMonthlyTarget = (goal) => {
    const targetDate = new Date(goal.targetDate);
    const current = new Date();
    const monthsRemaining = (targetDate.getFullYear() - current.getFullYear()) * 12 + 
                           (targetDate.getMonth() - current.getMonth());
    
    const amountRemaining = goal.targetAmount - goal.currentAmount;
    
    if (monthsRemaining <= 0) return amountRemaining;
    return amountRemaining / monthsRemaining;
  };

  // Rest of the component stays the same...
  
  // ... (renderGoalTypeItem, renderGoalItem, renderEmptyGoals, renderError functions)
  
  // ... (return JSX and component rendering)

  const renderGoalTypeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.goalTypeItem}
      onPress={() => {
        setSelectedGoalType(item);
        setShowGoalTypeModal(false);
      }}
    >
      <View style={[styles.goalTypeIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="#FFF" />
      </View>
      <View style={styles.goalTypeInfo}>
        <Text style={styles.goalTypeName}>{item.name}</Text>
        <Text style={styles.goalTypeDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderGoalItem = ({ item }) => {
    const progress = calculateProgress(item.currentAmount, item.targetAmount);
    const daysRemaining = getDaysRemaining(item.targetDate);
    const monthlyTarget = getMonthlyTarget(item);
    
    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <View style={[styles.goalIcon, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={24} color="#FFF" />
            </View>
            <View>
              <Text style={styles.goalName}>{item.name}</Text>
              <Text style={styles.goalType}>{item.typeName}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteGoal(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.goalProgress}>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${progress}%`,
                  backgroundColor: item.color
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}% Complete</Text>
        </View>
        
        <View style={styles.goalDetails}>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Target</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.targetAmount)}</Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Saved</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.currentAmount)}</Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Remaining</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.targetAmount - item.currentAmount)}</Text>
          </View>
        </View>
        
        <View style={styles.goalFooter}>
          <View style={styles.targetDate}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.targetDateText}>
              {formatDate(item.targetDate)} ({daysRemaining} days)
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addDepositButton}
            onPress={() => handleOpenDepositModal(item)}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addDepositButtonText}>Add Deposit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.monthlyTargetContainer}>
          <Text style={styles.monthlyTargetLabel}>Monthly Target:</Text>
          <Text style={styles.monthlyTargetValue}>{formatCurrency(monthlyTarget)}</Text>
        </View>
      </View>
    );
  };
  
  const renderEmptyGoals = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../../assets/icon.png')} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>No Financial Goals Yet</Text>
      <Text style={styles.emptyDescription}>
        Set your financial goals to help achieve your dreams. Start by creating your first goal.
      </Text>
      <TouchableOpacity 
        style={styles.createGoalButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.createGoalButtonText}>Create Your First Goal</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorDescription}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => fetchGoals(token, userId)}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Goals</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={28} color="#FFB5D8" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB5D8" />
          <Text style={styles.loadingText}>Loading your goals...</Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <>
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <Text style={styles.sectionTitle}>Progress Summary</Text>
              <TouchableOpacity onPress={handleRefresh}>
                <Ionicons name="refresh" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Goals</Text>
                <Text style={styles.summaryValue}>{goals.length}</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Saved</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(goals.reduce((sum, goal) => sum + goal.currentAmount, 0))}
                </Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Target Total</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(goals.reduce((sum, goal) => sum + goal.targetAmount, 0))}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            
            {refreshing && (
              <View style={styles.refreshIndicator}>
                <ActivityIndicator size="small" color="#FFB5D8" />
              </View>
            )}
            
            {goals.length === 0 ? (
              renderEmptyGoals()
            ) : (
              <FlatList
                data={goals}
                renderItem={renderGoalItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.goalsList}
                showsVerticalScrollIndicator={false}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </>
      )}

      {/* Create Goal Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Goal</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalLabel}>Goal Type</Text>
              <TouchableOpacity 
                style={styles.typeSelector}
                onPress={() => setShowGoalTypeModal(true)}
              >
                {selectedGoalType ? (
                  <View style={styles.selectedType}>
                    <View style={[styles.goalTypeIcon, { backgroundColor: selectedGoalType.color }]}>
                      <Ionicons name={selectedGoalType.icon} size={24} color="#FFF" />
                    </View>
                    <Text style={styles.selectedTypeName}>{selectedGoalType.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select a goal type</Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              
              <Text style={styles.modalLabel}>Goal Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter goal name"
                value={goalName}
                onChangeText={setGoalName}
              />
              
              <Text style={styles.modalLabel}>Target Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInputField}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={goalAmount}
                  onChangeText={setGoalAmount}
                />
              </View>
              
              <Text style={styles.modalLabel}>Initial Saved Amount (Optional)</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInputField}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={currentSaved}
                  onChangeText={setCurrentSaved}
                />
              </View>
              
              <Text style={styles.modalLabel}>Target Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                value={goalTargetDate}
                onChangeText={setGoalTargetDate}
              />
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateGoal}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.createButtonText}>Create Goal</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Goal Type Modal */}
      <Modal
        visible={showGoalTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoalTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Goal Type</Text>
                <TouchableOpacity onPress={() => setShowGoalTypeModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={GOAL_TYPES}
                renderItem={renderGoalTypeItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.goalTypesList}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Deposit Modal */}
      <Modal
        visible={showDepositModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Deposit</Text>
                <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              {selectedGoal && (
                <View style={styles.selectedGoalInfo}>
                  <View style={[styles.goalIcon, { backgroundColor: selectedGoal.color }]}>
                    <Ionicons name={selectedGoal.icon} size={24} color="#FFF" />
                  </View>
                  <View style={styles.selectedGoalDetails}>
                    <Text style={styles.selectedGoalName}>{selectedGoal.name}</Text>
                    <Text style={styles.selectedGoalProgress}>
                      {formatCurrency(selectedGoal.currentAmount)} of {formatCurrency(selectedGoal.targetAmount)}
                    </Text>
                  </View>
                </View>
              )}
              
              <Text style={styles.modalLabel}>Deposit Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInputField}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  autoFocus={true}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.depositButton}
                onPress={handleAddDeposit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.depositButtonText}>Add Deposit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#666',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
    },
    errorDescription: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: '#FFB5D8',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
    },
    retryButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    },
    summarySection: {
      padding: 16,
      backgroundColor: '#FFF',
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    summaryCards: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    summaryCard: {
      flex: 1,
      backgroundColor: '#F8F8F8',
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    goalsSection: {
      flex: 1,
      padding: 16,
      backgroundColor: '#FFF',
    },
    goalsList: {
      paddingBottom: 80, // For the FAB
    },
    refreshIndicator: {
      paddingVertical: 8,
      alignItems: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      marginTop: 20,
    },
    emptyImage: {
      width: 150,
      height: 150,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginBottom: 24,
    },
    createGoalButton: {
      backgroundColor: '#FFB5D8',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
    },
    createGoalButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    },
    goalCard: {
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
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    goalTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    goalIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    goalName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    goalType: {
      fontSize: 14,
      color: '#666',
    },
    goalProgress: {
      marginBottom: 16,
    },
    progressBarContainer: {
      height: 10,
      backgroundColor: '#F5F5F5',
      borderRadius: 5,
      marginBottom: 8,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 5,
    },
    progressText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'right',
    },
    goalDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    detailColumn: {
      flex: 1,
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    goalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    targetDate: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    targetDateText: {
      fontSize: 14,
      color: '#666',
      marginLeft: 8,
    },
    addDepositButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFB5D8',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
    addDepositButtonText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    monthlyTargetContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      padding: 12,
      borderRadius: 8,
    },
    monthlyTargetLabel: {
      fontSize: 14,
      color: '#666',
      marginRight: 8,
    },
    monthlyTargetValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#FFB5D8',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
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
      maxHeight: '80%',
    },
    modalContent: {
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    modalLabel: {
      fontSize: 16,
      color: '#666',
      marginBottom: 8,
    },
    textInput: {
      padding: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      fontSize: 16,
      marginBottom: 16,
    },
    typeSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      marginBottom: 16,
    },
    selectedType: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedTypeName: {
      fontSize: 16,
      marginLeft: 12,
    },
    placeholderText: {
      fontSize: 16,
      color: '#999',
    },
    amountInput: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    currencySymbol: {
      fontSize: 18,
      color: '#666',
      marginRight: 8,
    },
    amountInputField: {
      flex: 1,
      padding: 12,
      fontSize: 16,
    },
    createButton: {
      backgroundColor: '#FFB5D8',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    createButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    },
    goalTypesList: {
      paddingBottom: 20,
    },
    goalTypeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    goalTypeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    goalTypeInfo: {
      flex: 1,
    },
    goalTypeName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    goalTypeDescription: {
      fontSize: 14,
      color: '#666',
    },
    selectedGoalInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8F8F8',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    selectedGoalDetails: {
      flex: 1,
      marginLeft: 12,
    },
    selectedGoalName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    selectedGoalProgress: {
      fontSize: 14,
      color: '#666',
    },
    depositButton: {
      backgroundColor: '#FFB5D8',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    depositButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    }
  });
export default FinancialGoalsScreen;