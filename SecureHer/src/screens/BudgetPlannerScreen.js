import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const categories = [
  { id: '1', name: 'Housing', icon: 'home', color: '#4CAF50' },
  { id: '2', name: 'Food', icon: 'restaurant', color: '#FF9800' },
  { id: '3', name: 'Transportation', icon: 'car', color: '#2196F3' },
  { id: '4', name: 'Health', icon: 'medical', color: '#F44336' },
  { id: '5', name: 'Education', icon: 'school', color: '#9C27B0' },
  { id: '6', name: 'Entertainment', icon: 'film', color: '#E91E63' },
  { id: '7', name: 'Shopping', icon: 'cart', color: '#00BCD4' },
  { id: '8', name: 'Utilities', icon: 'flash', color: '#FF5722' },
  { id: '9', name: 'Savings', icon: 'save', color: '#3F51B5' },
  { id: '10', name: 'Other', icon: 'apps', color: '#607D8B' },
];

const BudgetPlannerScreen = () => {
  const navigation = useNavigation();
  const [income, setIncome] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    calculateRemainingBudget();
  }, [income, expenses]);
  
  const loadData = async () => {
    try {
      const savedIncome = await AsyncStorage.getItem('budgetIncome');
      const savedBudgets = await AsyncStorage.getItem('budgets');
      const savedExpenses = await AsyncStorage.getItem('expenses');
      
      if (savedIncome) setIncome(savedIncome);
      if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    } catch (error) {
      console.error('Error loading budget data:', error);
    }
  };
  
  const saveData = async () => {
    try {
      await AsyncStorage.setItem('budgetIncome', income.toString());
      await AsyncStorage.setItem('budgets', JSON.stringify(budgets));
      await AsyncStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving budget data:', error);
    }
  };
  
  const calculateRemainingBudget = () => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalIncome = parseFloat(income) || 0;
    setRemainingBudget(totalIncome - totalExpenses);
  };
  
  const calculateCategorySpent = (categoryId) => {
    return expenses
      .filter(expense => expense.categoryId === categoryId)
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };
  
  const calculateCategoryBudget = (categoryId) => {
    const budget = budgets.find(b => b.categoryId === categoryId);
    return budget ? parseFloat(budget.amount) : 0;
  };
  
  const handleAddBudget = () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    
    if (!budgetAmount || isNaN(parseFloat(budgetAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    // Check if budget for this category already exists
    const existingBudgetIndex = budgets.findIndex(b => b.categoryId === selectedCategory.id);
    
    if (existingBudgetIndex >= 0) {
      // Update existing budget
      const updatedBudgets = [...budgets];
      updatedBudgets[existingBudgetIndex] = {
        ...updatedBudgets[existingBudgetIndex],
        amount: budgetAmount
      };
      setBudgets(updatedBudgets);
    } else {
      // Add new budget
      const newBudget = {
        id: Date.now().toString(),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryColor: selectedCategory.color,
        categoryIcon: selectedCategory.icon,
        amount: budgetAmount
      };
      
      setBudgets([...budgets, newBudget]);
    }
    
    // Reset and close modal
    setBudgetAmount('');
    setSelectedCategory(null);
    setShowModal(false);
    
    // Save to AsyncStorage
    setTimeout(() => saveData(), 100);
  };
  
  const handleAddExpense = () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    
    if (!expenseName.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    
    if (!expenseAmount || isNaN(parseFloat(expenseAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    const newExpense = {
      id: Date.now().toString(),
      name: expenseName,
      amount: expenseAmount,
      date: expenseDate,
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      categoryColor: selectedCategory.color,
      categoryIcon: selectedCategory.icon
    };
    
    setExpenses([...expenses, newExpense]);
    
    // Reset and close modal
    setExpenseName('');
    setExpenseAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setSelectedCategory(null);
    setShowModal(false);
    
    // Save to AsyncStorage
    setTimeout(() => saveData(), 100);
  };
  
  const handleDeleteBudget = (budgetId) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedBudgets = budgets.filter(b => b.id !== budgetId);
            setBudgets(updatedBudgets);
            
            // Save to AsyncStorage
            setTimeout(() => saveData(), 100);
          }
        }
      ]
    );
  };
  
  const handleDeleteExpense = (expenseId) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedExpenses = expenses.filter(e => e.id !== expenseId);
            setExpenses(updatedExpenses);
            
            // Save to AsyncStorage
            setTimeout(() => saveData(), 100);
          }
        }
      ]
    );
  };
  
  const openAddBudgetModal = () => {
    setModalType('budget');
    setShowModal(true);
  };
  
  const openAddExpenseModal = () => {
    setModalType('expense');
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setBudgetAmount('');
    setExpenseName('');
    setExpenseAmount('');
  };
  
  const openCategoryModal = () => {
    setShowCategoryModal(true);
  };
  
  const selectCategory = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };
  
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => selectCategory(item)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={20} color="#FFF" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  const renderBudgetItem = ({ item }) => {
    const spent = calculateCategorySpent(item.categoryId);
    const budget = parseFloat(item.amount);
    const percentage = (spent / budget) * 100;
    
    return (
      <View style={styles.budgetItem}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetCategory}>
            <View style={[styles.categoryIcon, { backgroundColor: item.categoryColor }]}>
              <Ionicons name={item.categoryIcon} size={20} color="#FFF" />
            </View>
            <Text style={styles.budgetCategoryName}>{item.categoryName}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteBudget(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.budgetProgress}>
          <View 
            style={[
              styles.budgetProgressBar, 
              { 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: percentage > 100 ? '#F44336' : item.categoryColor
              }
            ]} 
          />
        </View>
        
        <View style={styles.budgetDetails}>
          <Text style={styles.budgetSpent}>
            ₹{spent.toFixed(2)} / ₹{budget.toFixed(2)}
          </Text>
          <Text 
            style={[
              styles.budgetPercentage,
              { color: percentage > 100 ? '#F44336' : percentage > 80 ? '#FF9800' : '#4CAF50' }
            ]}
          >
            {percentage.toFixed(0)}%
          </Text>
        </View>
      </View>
    );
  };
  
  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: item.categoryColor }]}>
          <Ionicons name={item.categoryIcon} size={20} color="#FFF" />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseName}>{item.name}</Text>
          <Text style={styles.expenseCategory}>{item.categoryName}</Text>
        </View>
      </View>
      
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>₹{parseFloat(item.amount).toFixed(2)}</Text>
        <Text style={styles.expenseDate}>{item.date}</Text>
        <TouchableOpacity onPress={() => handleDeleteExpense(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderBudgetModal = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Add Budget</Text>
      
      <Text style={styles.modalLabel}>Category</Text>
      <TouchableOpacity 
        style={styles.categorySelector}
        onPress={openCategoryModal}
      >
        {selectedCategory ? (
          <View style={styles.selectedCategory}>
            <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
              <Ionicons name={selectedCategory.icon} size={20} color="#FFF" />
            </View>
            <Text style={styles.selectedCategoryName}>{selectedCategory.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select a category</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      
      <Text style={styles.modalLabel}>Budget Amount</Text>
      <View style={styles.amountInput}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.textInput}
          placeholder="0.00"
          keyboardType="numeric"
          value={budgetAmount}
          onChangeText={setBudgetAmount}
        />
      </View>
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]}
          onPress={closeModal}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modalButton, styles.addButton]}
          onPress={handleAddBudget}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderExpenseModal = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Add Expense</Text>
      
      <Text style={styles.modalLabel}>Category</Text>
      <TouchableOpacity 
        style={styles.categorySelector}
        onPress={openCategoryModal}
      >
        {selectedCategory ? (
          <View style={styles.selectedCategory}>
            <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
              <Ionicons name={selectedCategory.icon} size={20} color="#FFF" />
            </View>
            <Text style={styles.selectedCategoryName}>{selectedCategory.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select a category</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      
      <Text style={styles.modalLabel}>Description</Text>
      <TextInput
        style={[styles.textInput, styles.descriptionInput]}
        placeholder="What did you spend on?"
        value={expenseName}
        onChangeText={setExpenseName}
      />
      
      <Text style={styles.modalLabel}>Amount</Text>
      <View style={styles.amountInput}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.textInput}
          placeholder="0.00"
          keyboardType="numeric"
          value={expenseAmount}
          onChangeText={setExpenseAmount}
        />
      </View>
      
      <Text style={styles.modalLabel}>Date</Text>
      <TextInput
        style={styles.textInput}
        placeholder="YYYY-MM-DD"
        value={expenseDate}
        onChangeText={setExpenseDate}
      />
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]}
          onPress={closeModal}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modalButton, styles.addButton]}
          onPress={handleAddExpense}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerTitle}>Budget Planner</Text>
        <TouchableOpacity onPress={openAddBudgetModal}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.incomeSection}>
            <Text style={styles.sectionTitle}>Monthly Income</Text>
            <View style={styles.incomeInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.incomeInput}
                placeholder="Enter your monthly income"
                keyboardType="numeric"
                value={income}
                onChangeText={(value) => {
                  setIncome(value);
                  setTimeout(() => saveData(), 100);
                }}
              />
            </View>
          </View>

          <View style={styles.balanceSection}>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceTitle}>Remaining Budget</Text>
              <Text 
                style={[
                  styles.balanceAmount, 
                  { color: remainingBudget >= 0 ? '#4CAF50' : '#F44336' }
                ]}
              >
                ₹{remainingBudget.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.budgetsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category Budgets</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={openAddBudgetModal}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.addButtonText}>Add Budget</Text>
              </TouchableOpacity>
            </View>
            
            {budgets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="wallet-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No budgets set up yet</Text>
                <Text style={styles.emptySubtext}>
                  Add a budget to start tracking your expenses by category
                </Text>
              </View>
            ) : (
              <FlatList
                data={budgets}
                renderItem={renderBudgetItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            )}
          </View>

          <View style={styles.expensesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={openAddExpenseModal}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.addButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
            
            {expenses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No expenses yet</Text>
                <Text style={styles.emptySubtext}>
                  Start tracking your expenses to manage your budget effectively
                </Text>
              </View>
            ) : (
              <FlatList
                data={expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)}
                renderItem={renderExpenseItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ListFooterComponent={
                  expenses.length > 5 ? (
                    <TouchableOpacity style={styles.viewAllButton}>
                      <Text style={styles.viewAllText}>View All Expenses</Text>
                    </TouchableOpacity>
                  ) : null
                }
              />
            )}
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.fab}
          onPress={openAddExpenseModal}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Modals */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
              {modalType === 'budget' ? renderBudgetModal() : renderExpenseModal()}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <FlatList
                  data={categories}
                  renderItem={renderCategoryItem}
                  keyExtractor={item => item.id}
                  numColumns={2}
                  contentContainerStyle={styles.categoriesList}
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    scrollView: {
      flex: 1,
    },
    incomeSection: {
      padding: 16,
      backgroundColor: '#F8F8F8',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    incomeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderRadius: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    currencySymbol: {
      fontSize: 18,
      color: '#666',
      marginRight: 8,
    },
    incomeInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 18,
    },
    balanceSection: {
      padding: 16,
      backgroundColor: '#FFF',
    },
    balanceContainer: {
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#F8F8F8',
      borderRadius: 12,
    },
    balanceTitle: {
      fontSize: 16,
      color: '#666',
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    budgetsSection: {
      padding: 16,
      backgroundColor: '#FFF',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFB5D8',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
    addButtonText: {
      color: '#FFF',
      fontWeight: '600',
      marginLeft: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      padding: 24,
      backgroundColor: '#F8F8F8',
      borderRadius: 12,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#666',
      marginTop: 12,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
    },
    budgetItem: {
      backgroundColor: '#F8F8F8',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    budgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    budgetCategory: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    budgetCategoryName: {
      fontSize: 16,
      fontWeight: '600',
    },
    budgetProgress: {
      height: 8,
      backgroundColor: '#E0E0E0',
      borderRadius: 4,
      marginBottom: 8,
      overflow: 'hidden',
    },
    budgetProgressBar: {
      height: '100%',
      borderRadius: 4,
    },
    budgetDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    budgetSpent: {
      fontSize: 14,
      color: '#666',
    },
    budgetPercentage: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    expensesSection: {
      padding: 16,
      backgroundColor: '#FFF',
      paddingBottom: 80, // For the FAB
    },
    expenseItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    expenseLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    expenseInfo: {
      marginLeft: 12,
      flex: 1,
    },
    expenseName: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    expenseCategory: {
      fontSize: 14,
      color: '#666',
    },
    expenseRight: {
      alignItems: 'flex-end',
    },
    expenseAmount: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    expenseDate: {
      fontSize: 12,
      color: '#999',
      marginBottom: 4,
    },
    viewAllButton: {
      padding: 16,
      alignItems: 'center',
    },
    viewAllText: {
      color: '#FFB5D8',
      fontWeight: '600',
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
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalContent: {
      padding: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    modalLabel: {
      fontSize: 16,
      color: '#666',
      marginBottom: 8,
    },
    categorySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      marginBottom: 16,
    },
    selectedCategory: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedCategoryName: {
      fontSize: 16,
    },
    placeholderText: {
      fontSize: 16,
      color: '#999',
    },
    textInput: {
      padding: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      fontSize: 16,
      marginBottom: 16,
    },
    descriptionInput: {
      height: 80,
      textAlignVertical: 'top',
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
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    modalButton: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: '#F5F5F5',
      marginRight: 8,
    },
    cancelButtonText: {
      color: '#666',
      fontWeight: '600',
    },
    addButton: {
      backgroundColor: '#FFB5D8',
      marginLeft: 8,
    },
    categoriesList: {
      paddingBottom: 20,
    },
    categoryItem: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      margin: 8,
      backgroundColor: '#F8F8F8',
      borderRadius: 12,
    },
    categoryName: {
      marginTop: 8,
      fontSize: 14,
      textAlign: 'center',
    }
  });

  export default BudgetPlannerScreen;