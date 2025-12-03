import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const WomenEmpowermentScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('skills');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample data for skill development courses
  const skillCourses = [
    {
      id: '1',
      title: 'Digital Marketing Fundamentals',
      provider: 'Google Digital Garage',
      image: require('../../assets/icon.png'),
      duration: '40 hours',
      level: 'Beginner',
      free: true,
      category: 'digital'
    },
    {
      id: '2',
      title: 'Web Development Bootcamp',
      provider: 'Udemy',
      image: require('../../assets/icon.png'),
      duration: '60 hours',
      level: 'Intermediate',
      free: false,
      price: '₹499',
      category: 'tech'
    },
    {
      id: '3',
      title: 'Financial Literacy for Women',
      provider: 'Women World Banking',
      Image: require('../../assets/icon.png'),
      duration: '20 hours',
      level: 'Beginner',
      free: true,
      category: 'finance'
    },
    {
      id: '4',
      title: 'Entrepreneurship Essentials',
      provider: 'Harvard Business School Online',
      image: require('../../assets/icon.png'),
      duration: '25 hours',
      level: 'Intermediate',
      free: false,
      price: '₹999',
      category: 'business'
    },
    {
      id: '5',
      title: 'Graphic Design for Beginners',
      provider: 'Canva',
      image: require('../../assets/icon.png'),
      duration: '15 hours',
      level: 'Beginner',
      free: true,
      category: 'design'
    },
  ];
  
  // Sample financial modules
  const financialModules = [
    {
      id: '1',
      title: 'Budget Planner',
      icon: 'calculator-outline',
      description: 'Create and manage your monthly budget',
      color: '#4CAF50'
    },
    {
      id: '2',
      title: 'Financial Goals',
      icon: 'trophy-outline',
      description: 'Set and track your saving goals',
      color: '#FFC107'
    },
    {
      id: '3',
      title: 'Investment Guide',
      icon: 'trending-up',
      description: 'Learn investment basics with AI recommendations',
      color: '#2196F3'
    },
    {
      id: '4',
      title: 'Gold & Silver Rates',
      icon: 'diamond-outline',
      description: 'Track real-time precious metal prices',
      color: '#9C27B0'
    },
    {
      id: '5',
      title: 'Financial Articles',
      icon: 'newspaper-outline',
      description: 'Latest financial news and blog posts',
      color: '#FF5722'
    }
  ];
  
  // Sample blog posts
  const blogPosts = [
    {
      id: '1',
      title: 'Why Women Need to Take Control of Their Finances',
      author: 'Maya Sharma',
      date: '3 days ago',
      readTime: '5 min read',
      image: require('../../assets/icon.png')
    },
    {
      id: '2',
      title: 'Starting Your Own Business with Limited Resources',
      author: 'Priya Singh',
      date: '1 week ago',
      readTime: '8 min read',
      image: require('../../assets/icon.png')
    },
    {
      id: '3',
      title: 'Investment Options for Young Women Professionals',
      author: 'Lakshmi Iyer',
      date: '2 weeks ago',
      readTime: '6 min read',
      image: require('../../assets/icon.png')
    }
  ];
  
  // Gold and silver rates
  const [metalRates, setMetalRates] = useState({
    gold: { rate: '₹5,895.00', change: '+1.2%', trend: 'up' },
    silver: { rate: '₹72.50', change: '-0.5%', trend: 'down' }
  });

  useEffect(() => {
    // Simulate loading data
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    // Fetch latest metal rates (simulated)
    fetchMetalRates();
  }, []);
  
  const fetchMetalRates = () => {
    // In a real app, fetch actual rates from an API
    // For now, we're using sample data
  };
  
  const handleCoursePress = (course) => {
    // Navigate to course details screen
    navigation.navigate('CourseDetails', { course });
  };
  
  const handleFinancialModulePress = (module) => {
    switch(module.title) {
      case 'Budget Planner':
        navigation.navigate('BudgetPlanner');
        break;
      case 'Financial Goals':
        navigation.navigate('FinancialGoals');
        break;
      case 'Investment Guide':
        navigation.navigate('InvestmentGuide');
        break;
      case 'Gold & Silver Rates':
        navigation.navigate('MetalRates');
        break;
      case 'Financial Articles':
        navigation.navigate('FinancialArticles');
        break;
      default:
        break;
    }
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Women Empowerment</Text>
      <TouchableOpacity style={styles.searchButton}>
        <Ionicons name="search" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
  
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'skills' && styles.activeTab]}
        onPress={() => setActiveTab('skills')}
      >
        <Text style={[styles.tabText, activeTab === 'skills' && styles.activeTabText]}>
          Skills
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'finance' && styles.activeTab]}
        onPress={() => setActiveTab('finance')}
      >
        <Text style={[styles.tabText, activeTab === 'finance' && styles.activeTabText]}>
          Finance
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'stories' && styles.activeTab]}
        onPress={() => setActiveTab('stories')}
      >
        <Text style={[styles.tabText, activeTab === 'stories' && styles.activeTabText]}>
          Stories
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderCourseItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => handleCoursePress(item)}
    >
      <Image source={item.image} style={styles.courseImage} />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseProvider}>{item.provider}</Text>
        <View style={styles.courseMetaInfo}>
          <Text style={styles.courseMeta}>
            <Ionicons name="time-outline" size={14} color="#666" /> {item.duration}
          </Text>
          <Text style={styles.courseMeta}>
            <Ionicons name="school-outline" size={14} color="#666" /> {item.level}
          </Text>
        </View>
        <View style={styles.priceContainer}>
          {item.free ? (
            <Text style={styles.freeTag}>Free</Text>
          ) : (
            <Text style={styles.priceTag}>{item.price}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderFinancialModuleItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.moduleCard, { backgroundColor: item.color + '10' }]}
      onPress={() => handleFinancialModulePress(item)}
    >
      <View style={[styles.moduleIconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="#FFF" />
      </View>
      <Text style={styles.moduleTitle}>{item.title}</Text>
      <Text style={styles.moduleDescription}>{item.description}</Text>
      <View style={styles.moduleArrow}>
        <Ionicons name="chevron-forward" size={20} color={item.color} />
      </View>
    </TouchableOpacity>
  );
  
  const renderBlogItem = ({ item }) => (
    <TouchableOpacity style={styles.blogCard}>
      <Image source={item.image} style={styles.blogImage} />
      <View style={styles.blogContent}>
        <Text style={styles.blogTitle}>{item.title}</Text>
        <View style={styles.blogMeta}>
          <Text style={styles.blogAuthor}>{item.author}</Text>
          <Text style={styles.blogDot}>•</Text>
          <Text style={styles.blogDate}>{item.date}</Text>
          <Text style={styles.blogDot}>•</Text>
          <Text style={styles.blogReadTime}>{item.readTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderMetalRates = () => (
    <View style={styles.metalRatesContainer}>
      <Text style={styles.metalRatesTitle}>Today's Precious Metal Rates</Text>
      <View style={styles.metalCards}>
        <View style={styles.metalCard}>
          <View style={styles.metalIconContainer}>
            <MaterialCommunityIcons name="gold" size={28} color="#FFD700" />
          </View>
          <View style={styles.metalInfo}>
            <Text style={styles.metalName}>Gold (10g)</Text>
            <Text style={styles.metalRate}>{metalRates.gold.rate}</Text>
            <View style={styles.metalTrend}>
              <Ionicons 
                name={metalRates.gold.trend === 'up' ? "trending-up" : "trending-down"} 
                size={14} 
                color={metalRates.gold.trend === 'up' ? "#4CAF50" : "#F44336"} 
              />
              <Text 
                style={[
                  styles.metalChange, 
                  { color: metalRates.gold.trend === 'up' ? "#4CAF50" : "#F44336" }
                ]}
              >
                {metalRates.gold.change}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.metalCard}>
          <View style={styles.metalIconContainer}>
            <MaterialCommunityIcons name="silver" size={28} color="#C0C0C0" />
          </View>
          <View style={styles.metalInfo}>
            <Text style={styles.metalName}>Silver (1g)</Text>
            <Text style={styles.metalRate}>{metalRates.silver.rate}</Text>
            <View style={styles.metalTrend}>
              <Ionicons 
                name={metalRates.silver.trend === 'up' ? "trending-up" : "trending-down"} 
                size={14} 
                color={metalRates.silver.trend === 'up' ? "#4CAF50" : "#F44336"} 
              />
              <Text 
                style={[
                  styles.metalChange, 
                  { color: metalRates.silver.trend === 'up' ? "#4CAF50" : "#F44336" }
                ]}
              >
                {metalRates.silver.change}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
  
  const renderSkillContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <Text style={styles.sectionTitle}>Recommended Courses</Text>
      <FlatList
        data={skillCourses}
        renderItem={renderCourseItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.coursesList}
      />
    </View>
  );
  
  const renderFinanceContent = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {renderMetalRates()}
      
      <Text style={styles.sectionTitle}>Financial Tools</Text>
      <FlatList
        data={financialModules}
        renderItem={renderFinancialModuleItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.modulesList}
      />
      
      <Text style={styles.sectionTitle}>Financial Articles</Text>
      <FlatList
        data={blogPosts}
        renderItem={renderBlogItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.blogsList}
      />
    </ScrollView>
  );
  
  const renderStoriesContent = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Success Stories</Text>
      <Text style={styles.comingSoonText}>Success stories coming soon!</Text>
      
      <View style={styles.storySubmitContainer}>
        <Text style={styles.storySubmitTitle}>Share Your Success Story</Text>
        <Text style={styles.storySubmitDescription}>
          Inspire others by sharing your journey, challenges, and achievements.
        </Text>
        <TouchableOpacity style={styles.storySubmitButton}>
          <Text style={styles.storySubmitButtonText}>Submit Your Story</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB5D8" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'skills' && renderSkillContent()}
          {activeTab === 'finance' && renderFinanceContent()}
          {activeTab === 'stories' && renderStoriesContent()}
        </>
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
    paddingTop: 50,
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
  searchButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFB5D8',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#FFB5D8',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  coursesList: {
    paddingBottom: 20,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  courseImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  courseInfo: {
    flex: 1,
    padding: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courseProvider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  courseMetaInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  courseMeta: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  priceContainer: {
    alignSelf: 'flex-start',
  },
  freeTag: {
    backgroundColor: '#4CAF50',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceTag: {
    backgroundColor: '#FFB5D8',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modulesList: {
    paddingBottom: 20,
  },
  moduleCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    flex: 1,
  },
  moduleDescription: {
    fontSize: 12,
    color: '#666',
    flex: 2,
  },
  moduleArrow: {
    marginLeft: 8,
  },
  blogsList: {
    paddingRight: 16,
    paddingBottom: 20,
  },
  blogCard: {
    width: 250,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  blogImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  blogContent: {
    padding: 12,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  blogMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  blogAuthor: {
    fontSize: 12,
    color: '#666',
  },
  blogDot: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 4,
  },
  blogDate: {
    fontSize: 12,
    color: '#666',
  },
  blogReadTime: {
    fontSize: 12,
    color: '#666',
  },
  metalRatesContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  metalRatesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metalCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metalCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metalInfo: {
    flex: 1,
  },
  metalName: {
    fontSize: 14,
    color: '#666',
  },
  metalRate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  metalTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metalChange: {
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  storySubmitContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  storySubmitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  storySubmitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  storySubmitButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  storySubmitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WomenEmpowermentScreen;