import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Sample courses data
const COURSES = [
  {
    id: '1',
    title: 'Digital Marketing Fundamentals',
    provider: 'Google Digital Garage',
    image: require('../../assets/icon.png'),
    duration: '40 hours',
    level: 'Beginner',
    free: true,
    category: 'digital',
    rating: 4.8,
    reviewCount: 1243,
    popular: true,
    trending: false,
    description: 'Learn the fundamentals of digital marketing and how to use various digital channels to reach your audience effectively.'
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
    category: 'tech',
    rating: 4.9,
    reviewCount: 2156,
    popular: true,
    trending: true,
    description: 'A comprehensive bootcamp covering HTML, CSS, JavaScript, and building responsive websites from scratch.'
  },
  {
    id: '3',
    title: 'Financial Literacy for Women',
    provider: 'Womens World Banking',
    image: require('../../assets/icon.png'),
    duration: '20 hours',
    level: 'Beginner',
    free: true,
    category: 'finance',
    rating: 4.7,
    reviewCount: 987,
    popular: true,
    trending: false,
    description: 'Develop essential financial skills including budgeting, saving, investing, and planning for long-term financial security.'
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
    category: 'business',
    rating: 4.9,
    reviewCount: 1532,
    popular: true,
    trending: true,
    description: 'Learn the fundamentals of entrepreneurship, from idea generation to business planning, marketing, and scaling your venture.'
  },
  {
    id: '5',
    title: 'Graphic Design for Beginners',
    provider: 'Canva',
    image: require('../../assets/icon.png'),
    duration: '15 hours',
    level: 'Beginner',
    free: true,
    category: 'design',
    rating: 4.6,
    reviewCount: 1105,
    popular: false,
    trending: true,
    description: 'Master the basics of graphic design using easy-to-use tools and learn principles that will help you create professional designs.'
  },
  {
    id: '6',
    title: 'Mobile App Development with React Native',
    provider: 'Codecademy',
    image: require('../../assets/icon.png'),
    duration: '45 hours',
    level: 'Advanced',
    free: false,
    price: '₹1299',
    category: 'tech',
    rating: 4.7,
    reviewCount: 876,
    popular: false,
    trending: true,
    description: 'Build cross-platform mobile applications using React Native that work on both iOS and Android devices.'
  },
  {
    id: '7',
    title: 'Content Writing Masterclass',
    provider: 'Skillshare',
    image: require('../../assets/icon.png'),
    duration: '12 hours',
    level: 'Beginner',
    free: false,
    price: '₹399',
    category: 'writing',
    rating: 4.5,
    reviewCount: 742,
    popular: false,
    trending: true,
    description: 'Learn how to write compelling content for blogs, social media, and websites that engages your audience.'
  },
  {
    id: '8',
    title: 'Data Analytics Fundamentals',
    provider: 'IBM',
    image: require('../../assets/icon.png'),
    duration: '30 hours',
    level: 'Intermediate',
    free: false,
    price: '₹799',
    category: 'tech',
    rating: 4.8,
    reviewCount: 1089,
    popular: true,
    trending: false,
    description: 'Master the basics of data analysis, including data collection, cleaning, visualization, and drawing insights.'
  }
];

// Categories data
const CATEGORIES = [
  { id: 'all', name: 'All Courses', icon: 'apps' },
  { id: 'tech', name: 'Technology', icon: 'code' },
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'design', name: 'Design', icon: 'color-palette' },
  { id: 'finance', name: 'Finance', icon: 'cash' },
  { id: 'writing', name: 'Writing', icon: 'create' },
  { id: 'digital', name: 'Digital Marketing', icon: 'megaphone' }
];

const SkillDevelopmentScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'enrolled', 'saved'
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    filterCourses();
  }, [selectedCategory, searchQuery, activeTab, courses, enrolledCourses]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // In a real app, fetch courses from API
      // For this demo, we'll use our sample data
      setCourses(COURSES);
      
      // Load enrolled courses
      const storedEnrolledCourses = await AsyncStorage.getItem('enrolled_courses');
      if (storedEnrolledCourses) {
        setEnrolledCourses(JSON.parse(storedEnrolledCourses));
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterCourses = () => {
    let filtered = [...courses];
    
    // Filter by tab
    if (activeTab === 'enrolled') {
      const enrolledIds = enrolledCourses.map(course => course.id);
      filtered = filtered.filter(course => enrolledIds.includes(course.id));
    } else if (activeTab === 'saved') {
      // In a real app, you would have a saved courses feature
      // For this demo, we'll just show a subset
      filtered = filtered.filter(course => course.popular);
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(query) ||
        course.provider.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredCourses(filtered);
  };
  
  const handleCoursePress = (course) => {
    navigation.navigate('CourseDetails', { course });
  };
  
  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => handleCategoryPress(item.id)}
    >
      <View style={[
        styles.categoryIcon,
        selectedCategory === item.id && styles.selectedCategoryIcon
      ]}>
        <Ionicons 
          name={item.icon} 
          size={20} 
          color={selectedCategory === item.id ? '#FFF' : '#666'} 
        />
      </View>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  const renderCourseItem = ({ item }) => {
    const isEnrolled = enrolledCourses.some(course => course.id === item.id);
    
    return (
      <TouchableOpacity
        style={styles.courseCard}
        onPress={() => handleCoursePress(item)}
      >
        <Image source={item.image} style={styles.courseImage} />
        
        {item.trending && (
          <View style={styles.trendingBadge}>
            <Ionicons name="trending-up" size={14} color="#FFF" />
            <Text style={styles.trendingText}>Trending</Text>
          </View>
        )}
        
        <View style={styles.courseContent}>
          <View style={styles.courseHeader}>
            <View style={styles.courseBadges}>
              {item.free ? (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>Free</Text>
                </View>
              ) : (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>{item.price}</Text>
                </View>
              )}
              
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{item.level}</Text>
              </View>
            </View>
            
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Text style={styles.reviewCount}>({item.reviewCount})</Text>
            </View>
          </View>
          
          <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.courseProvider}>{item.provider}</Text>
          
          <View style={styles.courseFooter}>
            <View style={styles.courseMeta}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.courseMetaText}>{item.duration}</Text>
            </View>
            
            {isEnrolled && (
              <View style={styles.enrolledBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                <Text style={styles.enrolledText}>Enrolled</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderFeaturedCourseItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.featuredCourseCard}
        onPress={() => handleCoursePress(item)}
      >
        <Image source={item.image} style={styles.featuredCourseImage} />
        <View style={styles.featuredCourseContent}>
          <Text style={styles.featuredCourseTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.featuredCourseProvider} numberOfLines={1}>{item.provider}</Text>
          
          <View style={styles.featuredCourseRating}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.featuredCourseRatingText}>{item.rating}</Text>
          </View>
          
          {item.free ? (
            <View style={styles.featuredCourseFree}>
              <Text style={styles.featuredCourseFreeText}>Free</Text>
            </View>
          ) : (
            <Text style={styles.featuredCoursePrice}>{item.price}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="school-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>No courses found</Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'enrolled'
          ? "You haven't enrolled in any courses yet"
          : activeTab === 'saved'
          ? "You haven't saved any courses yet"
          : "No courses match your search criteria"}
      </Text>
      
      {activeTab !== 'all' && (
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => setActiveTab('all')}
        >
          <Text style={styles.browseButtonText}>Browse Courses</Text>
        </TouchableOpacity>
      )}
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
        <Text style={styles.headerTitle}>Skills Development</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Courses
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
          onPress={() => setActiveTab('enrolled')}
        >
          <Text style={[styles.tabText, activeTab === 'enrolled' && styles.activeTabText]}>
            My Learning
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
            Saved
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB5D8" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'all' && (
            <>
              {/* Featured Courses Section */}
              <View style={styles.featuredSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Courses</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  horizontal
                  data={courses.filter(course => course.popular)}
                  renderItem={renderFeaturedCourseItem}
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredList}
                />
              </View>
              
              {/* Categories Section */}
              <View style={styles.categoriesSection}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <FlatList
                  horizontal
                  data={CATEGORIES}
                  renderItem={renderCategoryItem}
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesList}
                />
              </View>
            </>
          )}
          
          {/* Courses List */}
          <View style={styles.coursesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeTab === 'enrolled' 
                  ? 'My Courses' 
                  : activeTab === 'saved' 
                  ? 'Saved Courses' 
                  : selectedCategory === 'all'
                  ? 'All Courses'
                  : CATEGORIES.find(cat => cat.id === selectedCategory)?.name}
              </Text>
              <Text style={styles.courseCount}>
                {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
              </Text>
            </View>
            
            {filteredCourses.length > 0 ? (
              <View style={styles.coursesList}>
                {filteredCourses.map(course => (
                  <View key={course.id} style={styles.courseItemContainer}>
                    {renderCourseItem({ item: course })}
                  </View>
                ))}
              </View>
            ) : (
              renderEmptyState()
            )}
          </View>
          
          {/* Learning Paths Recommendation */}
          {activeTab === 'all' && (
            <View style={styles.learningPathSection}>
              <View style={styles.learningPathCard}>
                <View style={styles.learningPathContent}>
                  <Text style={styles.learningPathTitle}>
                    Discover Learning Paths
                  </Text>
                  <Text style={styles.learningPathDescription}>
                    Follow curated paths to develop skills for in-demand careers
                  </Text>
                  <TouchableOpacity 
                    style={styles.learningPathButton}
                    onPress={() => navigation.navigate('LearningPath')}
                  >
                    <Text style={styles.learningPathButtonText}>Explore Paths</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <Image 
                  source={require('../../assets/icon.png')}
                  style={styles.learningPathImage}
                />
              </View>
            </View>
          )}
        </ScrollView>
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
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: 12,
      margin: 16,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
    },
    clearButton: {
      padding: 4,
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: '#FFB5D8',
    },
    tabText: {
      fontSize: 14,
      color: '#666',
    },
    activeTabText: {
      color: '#FFB5D8',
      fontWeight: '600',
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
    scrollView: {
      flex: 1,
    },
    featuredSection: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    seeAllText: {
      color: '#FFB5D8',
      fontWeight: '600',
    },
    featuredList: {
      paddingLeft: 16,
      paddingRight: 8,
    },
    featuredCourseCard: {
      width: 160,
      backgroundColor: '#FFF',
      borderRadius: 12,
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    featuredCourseImage: {
      width: '100%',
      height: 100,
      resizeMode: 'cover',
    },
    featuredCourseContent: {
      padding: 12,
    },
    featuredCourseTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    featuredCourseProvider: {
      fontSize: 12,
      color: '#666',
      marginBottom: 8,
    },
    featuredCourseRating: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featuredCourseRatingText: {
      fontSize: 12,
      color: '#666',
      marginLeft: 4,
    },
    featuredCourseFree: {
      backgroundColor: '#4CAF50',
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    featuredCourseFreeText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '600',
    },
    featuredCoursePrice: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFB5D8',
    },
    categoriesSection: {
      marginBottom: 24,
    },
    categoriesList: {
      paddingHorizontal: 16,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      marginRight: 12,
    },
    selectedCategoryItem: {
      backgroundColor: '#FFB5D8',
    },
    categoryIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    selectedCategoryIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    categoryText: {
      fontSize: 14,
      color: '#666',
    },
    selectedCategoryText: {
      color: '#FFF',
      fontWeight: '600',
    },
    coursesSection: {
      marginBottom: 24,
    },
    courseCount: {
      fontSize: 14,
      color: '#666',
    },
    coursesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 8,
    },
    courseItemContainer: {
      width: '50%',
      padding: 8,
    },
    courseCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      height: 240,
    },
    courseImage: {
      width: '100%',
      height: 100,
      resizeMode: 'cover',
    },
    trendingBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF9800',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    trendingText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
    },
    courseContent: {
      padding: 12,
      flex: 1,
      justifyContent: 'space-between',
    },
    courseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    courseBadges: {
      flexDirection: 'row',
    },
    freeBadge: {
      backgroundColor: '#4CAF50',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginRight: 4,
    },
    freeBadgeText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '600',
    },
    priceBadge: {
      backgroundColor: '#FFB5D8',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginRight: 4,
    },
    priceBadgeText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '600',
    },
    levelBadge: {
      backgroundColor: '#F0F0F0',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    levelBadgeText: {
      color: '#666',
      fontSize: 10,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 12,
      fontWeight: 'bold',
      marginLeft: 2,
    },
    reviewCount: {
      fontSize: 10,
      color: '#666',
      marginLeft: 2,
    },
    courseTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
      flex: 1,
    },
    courseProvider: {
      fontSize: 12,
      color: '#666',
      marginBottom: 8,
    },
    courseFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    courseMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    courseMetaText: {
      fontSize: 12,
      color: '#666',
      marginLeft: 4,
    },
    enrolledBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#4CAF50',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    enrolledText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 2,
    },
    learningPathSection: {
      padding: 16,
      marginBottom: 40,
    },
    learningPathCard: {
      backgroundColor: '#F0F7FF',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    learningPathContent: {
      flex: 1,
      justifyContent: 'center',
    },
    learningPathTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#1A237E',
    },
    learningPathDescription: {
      fontSize: 14,
      color: '#333',
      marginBottom: 16,
      lineHeight: 20,
    },
    learningPathButton: {
      backgroundColor: '#3F51B5',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    learningPathButtonText: {
      color: '#FFF',
      fontWeight: '600',
      marginRight: 4,
    },
    learningPathImage: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
      marginLeft: 10,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      marginVertical: 30,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#666',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
      marginBottom: 20,
    },
    browseButton: {
      backgroundColor: '#FFB5D8',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 25,
    },
    browseButtonText: {
      color: '#FFF',
      fontWeight: '600',
    }
  });
  export default SkillDevelopmentScreen;