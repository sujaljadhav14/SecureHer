import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Sample learning paths
const LEARNING_PATHS = [
  {
    id: '1',
    title: 'Digital Marketing Specialist',
    image: require('../../assets/icon.png'),
    description: 'Master the skills needed to excel in the digital marketing industry, from SEO to social media marketing and analytics.',
    duration: '3-4 months',
    level: 'Beginner to Intermediate',
    courseCount: 5,
    coursesCompleted: 0,
    estimatedSalary: '₹4-8 LPA',
    skills: ['SEO', 'Social Media', 'Content Marketing', 'Analytics', 'Email Marketing'],
    career: 'Marketing',
    courses: [
      {
        id: '1',
        title: 'Digital Marketing Fundamentals',
        duration: '40 hours',
        locked: false,
        completed: false
      },
      {
        id: '2',
        title: 'Social Media Marketing',
        duration: '25 hours',
        locked: true,
        completed: false
      },
      {
        id: '3',
        title: 'Search Engine Optimization',
        duration: '30 hours',
        locked: true,
        completed: false
      },
      {
        id: '4',
        title: 'Content Marketing',
        duration: '20 hours',
        locked: true,
        completed: false
      },
      {
        id: '5',
        title: 'Digital Marketing Analytics',
        duration: '35 hours',
        locked: true,
        completed: false
      }
    ]
  },
  {
    id: '2',
    title: 'Web Developer',
    image: require('../../assets/icon.png'),
    description: 'Learn to build responsive and dynamic websites using modern web technologies like HTML, CSS, JavaScript, and frameworks.',
    duration: '5-6 months',
    level: 'Beginner to Advanced',
    courseCount: 6,
    coursesCompleted: 0,
    estimatedSalary: '₹5-15 LPA',
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Responsive Design'],
    career: 'Technology',
    courses: [
      {
        id: '1',
        title: 'HTML & CSS Fundamentals',
        duration: '30 hours',
        locked: false,
        completed: false
      },
      {
        id: '2',
        title: 'JavaScript Essentials',
        duration: '40 hours',
        locked: true,
        completed: false
      },
      {
        id: '3',
        title: 'Responsive Web Design',
        duration: '25 hours',
        locked: true,
        completed: false
      },
      {
        id: '4',
        title: 'Frontend Development with React',
        duration: '45 hours',
        locked: true,
        completed: false
      },
      {
        id: '5',
        title: 'Backend Development with Node.js',
        duration: '40 hours',
        locked: true,
        completed: false
      },
      {
        id: '6',
        title: 'Full Stack Web Projects',
        duration: '50 hours',
        locked: true,
        completed: false
      }
    ]
  },
  {
    id: '3',
    title: 'Data Analyst',
    image: require('../../assets/icon.png'),
    description: 'Develop the analytical skills to transform raw data into insights and visualizations that drive business decisions.',
    duration: '4-5 months',
    level: 'Intermediate',
    courseCount: 5,
    coursesCompleted: 0,
    estimatedSalary: '₹6-12 LPA',
    skills: ['Excel', 'SQL', 'Python', 'Data Visualization', 'Statistics'],
    career: 'Technology',
    courses: [
      {
        id: '1',
        title: 'Introduction to Data Analysis',
        duration: '25 hours',
        locked: false,
        completed: false
      },
      {
        id: '2',
        title: 'Excel for Data Analysis',
        duration: '20 hours',
        locked: true,
        completed: false
      },
      {
        id: '3',
        title: 'SQL for Data Analysis',
        duration: '30 hours',
        locked: true,
        completed: false
      },
      {
        id: '4',
        title: 'Python for Data Analysis',
        duration: '40 hours',
        locked: true,
        completed: false
      },
      {
        id: '5',
        title: 'Data Visualization and Reporting',
        duration: '35 hours',
        locked: true,
        completed: false
      }
    ]
  },
  {
    id: '4',
    title: 'Graphic Designer',
    image: require('../../assets/icon.png'),
    description: 'Build a strong foundation in graphic design principles and tools to create compelling visual content for various mediums.',
    duration: '3-4 months',
    level: 'Beginner to Intermediate',
    courseCount: 4,
    coursesCompleted: 0,
    estimatedSalary: '₹3-8 LPA',
    skills: ['Design Principles', 'Typography', 'Color Theory', 'Adobe Creative Suite', 'Branding'],
    career: 'Creative',
    courses: [
      {
        id: '1',
        title: 'Fundamentals of Graphic Design',
        duration: '30 hours',
        locked: false,
        completed: false
      },
      {
        id: '2',
        title: 'Typography and Color Theory',
        duration: '25 hours',
        locked: true,
        completed: false
      },
      {
        id: '3',
        title: 'Adobe Photoshop Essentials',
        duration: '35 hours',
        locked: true,
        completed: false
      },
      {
        id: '4',
        title: 'Branding and Logo Design',
        duration: '30 hours',
        locked: true,
        completed: false
      }
    ]
  },
  {
    id: '5',
    title: 'Financial Literacy Specialist',
    image: require('../../assets/icon.png'),
    description: 'Gain comprehensive knowledge of personal finance, investments, and financial planning to help others achieve financial independence.',
    duration: '2-3 months',
    level: 'Beginner to Intermediate',
    courseCount: 4,
    coursesCompleted: 0,
    estimatedSalary: '₹4-10 LPA',
    skills: ['Personal Finance', 'Investment Planning', 'Tax Planning', 'Retirement Planning', 'Financial Advising'],
    career: 'Finance',
    courses: [
      {
        id: '1',
        title: 'Fundamentals of Personal Finance',
        duration: '20 hours',
        locked: false,
        completed: false
      },
      {
        id: '2',
        title: 'Investment Planning',
        duration: '25 hours',
        locked: true,
        completed: false
      },
      {
        id: '3',
        title: 'Tax Planning Strategies',
        duration: '15 hours',
        locked: true,
        completed: false
      },
      {
        id: '4',
        title: 'Retirement and Estate Planning',
        duration: '20 hours',
        locked: true,
        completed: false
      }
    ]
  }
];

// Career categories
const CAREERS = [
  { id: 'all', name: 'All Paths' },
  { id: 'Technology', name: 'Technology' },
  { id: 'Marketing', name: 'Marketing' },
  { id: 'Finance', name: 'Finance' },
  { id: 'Creative', name: 'Creative' }
];

const LearningPathScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [learningPaths, setLearningPaths] = useState([]);
  const [filteredPaths, setFilteredPaths] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState('all');
  const [enrolledPaths, setEnrolledPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    filterPaths();
  }, [selectedCareer, learningPaths]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // In a real app, fetch data from API
      // For this demo, we'll use our sample data
      setLearningPaths(LEARNING_PATHS);
      
      // Load enrolled paths
      const storedEnrolledPaths = await AsyncStorage.getItem('enrolled_paths');
      if (storedEnrolledPaths) {
        setEnrolledPaths(JSON.parse(storedEnrolledPaths));
      }
    } catch (error) {
      console.error('Error loading learning paths:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterPaths = () => {
    if (selectedCareer === 'all') {
      setFilteredPaths(learningPaths);
    } else {
      setFilteredPaths(learningPaths.filter(path => path.career === selectedCareer));
    }
  };
  
  const handleCareerSelect = (career) => {
    setSelectedCareer(career);
  };
  
  const handlePathSelect = (path) => {
    setSelectedPath(path);
  };
  
  const handleEnrollPath = async (pathId) => {
    try {
      // Check if already enrolled
      if (enrolledPaths.includes(pathId)) return;
      
      // Update enrolled paths
      const updatedEnrolledPaths = [...enrolledPaths, pathId];
      setEnrolledPaths(updatedEnrolledPaths);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('enrolled_paths', JSON.stringify(updatedEnrolledPaths));
      
      // Show success message
      alert('You have successfully enrolled in this learning path!');
    } catch (error) {
      console.error('Error enrolling in path:', error);
    }
  };
  
  const handleStartLearning = (course) => {
    // In a real app, navigate to the course
    alert(`Starting course: ${course.title}`);
  };
  
  const renderCareerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.careerItem,
        selectedCareer === item.id && styles.selectedCareerItem
      ]}
      onPress={() => handleCareerSelect(item.id)}
    >
      <Text style={[
        styles.careerText,
        selectedCareer === item.id && styles.selectedCareerText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  const renderPathItem = ({ item }) => {
    const isEnrolled = enrolledPaths.includes(item.id);
    const progress = (item.coursesCompleted / item.courseCount) * 100;
    
    return (
      <TouchableOpacity
        style={styles.pathCard}
        onPress={() => handlePathSelect(item)}
      >
        <Image source={item.image} style={styles.pathImage} />
        <View style={styles.pathContent}>
          <Text style={styles.pathTitle}>{item.title}</Text>
          <Text style={styles.pathDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.pathMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.level}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="book-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.courseCount} courses</Text>
            </View>
          </View>
          
          <View style={styles.pathFooter}>
            {isEnrolled ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}% complete</Text>
              </View>
            ) : (
              <Text style={styles.salaryText}>Est. Salary: {item.estimatedSalary}</Text>
            )}
            
            <TouchableOpacity 
              style={[
                styles.actionButton,
                isEnrolled ? styles.continueButton : styles.enrollButton
              ]}
              onPress={() => isEnrolled ? handlePathSelect(item) : handleEnrollPath(item.id)}
            >
              <Text style={styles.actionButtonText}>
                {isEnrolled ? 'Continue' : 'Enroll'}
              </Text>
              <Ionicons 
                name={isEnrolled ? "arrow-forward" : "add-circle-outline"} 
                size={16} 
                color="#FFF" 
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderPathDetail = () => {
    if (!selectedPath) return null;
    
    const isEnrolled = enrolledPaths.includes(selectedPath.id);
    
    return (
      <View style={styles.pathDetailContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Path Header */}
          <Image source={selectedPath.image} style={styles.pathDetailImage} />
          
          <View style={styles.pathDetailContent}>
            <Text style={styles.pathDetailTitle}>{selectedPath.title}</Text>
            <Text style={styles.pathDetailDescription}>{selectedPath.description}</Text>
            
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <View>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{selectedPath.duration}</Text>
                  </View>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="school-outline" size={20} color="#666" />
                  <View>
                    <Text style={styles.detailLabel}>Level</Text>
                    <Text style={styles.detailValue}>{selectedPath.level}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="book-outline" size={20} color="#666" />
                  <View>
                    <Text style={styles.detailLabel}>Courses</Text>
                    <Text style={styles.detailValue}>{selectedPath.courseCount}</Text>
                  </View>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={20} color="#666" />
                  <View>
                    <Text style={styles.detailLabel}>Est. Salary</Text>
                    <Text style={styles.detailValue}>{selectedPath.estimatedSalary}</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Skills Section */}
            <View style={styles.skillsSection}>
              <Text style={styles.sectionTitle}>Skills You'll Learn</Text>
              <View style={styles.skillsList}>
                {selectedPath.skills.map((skill, index) => (
                  <View key={index} style={styles.skillItem}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            {/* Courses Section */}
            <View style={styles.coursesSection}>
              <Text style={styles.sectionTitle}>Course Curriculum</Text>
              {selectedPath.courses.map((course, index) => (
                <View key={course.id} style={styles.courseItem}>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseNumber}>
                      <Text style={styles.courseNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <Text style={styles.courseDuration}>{course.duration}</Text>
                    </View>
                    {course.completed ? (
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    ) : course.locked && !isEnrolled ? (
                      <Ionicons name="lock-closed" size={24} color="#999" />
                    ) : (
                      <TouchableOpacity 
                        style={styles.startButton}
                        onPress={() => handleStartLearning(course)}
                        disabled={course.locked && !isEnrolled}
                      >
                        <Text style={styles.startButtonText}>Start</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {index < selectedPath.courses.length - 1 && (
                    <View style={styles.courseConnector} />
                  )}
                </View>
              ))}
            </View>
            
            {/* Career Opportunities */}
            <View style={styles.careerSection}>
              <Text style={styles.sectionTitle}>Career Opportunities</Text>
              <Text style={styles.careerDescription}>
                After completing this path, you'll be qualified for roles such as:
              </Text>
              <View style={styles.careerRoles}>
                {selectedPath.career === 'Technology' && (
                  <>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="laptop" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Frontend Developer</Text>
                    </View>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="code" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Full Stack Developer</Text>
                    </View>
                    <View style={styles.careerRole}>
                      <FontAwesome5 name="database" size={16} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Data Analyst</Text>
                    </View>
                  </>
                )}
                
                {selectedPath.career === 'Marketing' && (
                  <>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="social-distance" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Social Media Manager</Text>
                    </View>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="search" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>SEO Specialist</Text>
                    </View>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="analytics" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Digital Marketing Analyst</Text>
                    </View>
                  </>
                )}
                
                {selectedPath.career === 'Finance' && (
                  <>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="account-balance" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Financial Advisor</Text>
                    </View>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="attach-money" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Investment Consultant</Text>
                    </View>
                    <View style={styles.careerRole}>
                      <FontAwesome5 name="chart-line" size={16} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Financial Educator</Text>
                    </View>
                  </>
                )}
                
                {selectedPath.career === 'Creative' && (
                  <>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="brush" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Graphic Designer</Text>
                    </View>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="palette" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>Brand Identity Designer</Text>
                    </View>
                    <View style={styles.careerRole}>
                      <MaterialIcons name="web" size={20} color="#FFB5D8" />
                      <Text style={styles.careerRoleText}>UI/UX Designer</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            
            {/* Action Buttons */}
            {isEnrolled ? (
              <TouchableOpacity 
                style={styles.fullWidthButton}
                onPress={() => handleStartLearning(selectedPath.courses[0])}
              >
                <Text style={styles.fullWidthButtonText}>Continue Learning</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.fullWidthButton}
                onPress={() => handleEnrollPath(selectedPath.id)}
              >
                <Text style={styles.fullWidthButtonText}>Enroll Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        
        {/* Close Button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setSelectedPath(null)}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB5D8" />
        <Text style={styles.loadingText}>Loading learning paths...</Text>
      </View>
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
        <Text style={styles.headerTitle}>Learning Paths</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      {selectedPath ? (
        renderPathDetail()
      ) : (
        <>
          {/* Career Filter */}
          <View style={styles.careerFilter}>
            <FlatList
              data={CAREERS}
              renderItem={renderCareerItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.careerList}
            />
          </View>
          
          {/* Learning Paths */}
          <FlatList
            data={filteredPaths}
            renderItem={renderPathItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pathList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={50} color="#DDD" />
                <Text style={styles.emptyText}>No learning paths found</Text>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => setSelectedCareer('all')}
                >
                  <Text style={styles.resetButtonText}>Show All Paths</Text>
                </TouchableOpacity>
              </View>
            }
          />
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#666',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      backgroundColor: '#FFF',
      paddingTop: Platform.OS === 'ios' ? 50 : 40,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    placeholderRight: {
      width: 40,
    },
    careerFilter: {
      marginVertical: 12,
    },
    careerList: {
      paddingHorizontal: 16,
    },
    careerItem: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 10,
      backgroundColor: '#F5F5F5',
    },
    selectedCareerItem: {
      backgroundColor: '#FFB5D8',
    },
    careerText: {
      fontSize: 14,
      color: '#666',
    },
    selectedCareerText: {
      color: '#FFF',
      fontWeight: '500',
    },
    pathList: {
      padding: 16,
      paddingBottom: 80,
    },
    pathCard: {
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#FFF',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    pathImage: {
      width: '100%',
      height: 150,
      resizeMode: 'cover',
    },
    pathContent: {
      padding: 16,
    },
    pathTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    pathDescription: {
      fontSize: 14,
      color: '#666',
      lineHeight: 20,
      marginBottom: 12,
    },
    pathMeta: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    metaText: {
      fontSize: 12,
      color: '#666',
      marginLeft: 4,
    },
    pathFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressContainer: {
      flex: 1,
      marginRight: 12,
    },
    progressBar: {
      height: 8,
      backgroundColor: '#F0F0F0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#4CAF50',
    },
    progressText: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
    salaryText: {
      fontSize: 14,
      color: '#666',
      flex: 1,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
    },
    enrollButton: {
      backgroundColor: '#FFB5D8',
    },
    continueButton: {
      backgroundColor: '#4CAF50',
    },
    actionButtonText: {
      color: '#FFF',
      fontWeight: '500',
      fontSize: 14,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
    },
    emptyText: {
      marginTop: 10,
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
    },
    resetButton: {
      marginTop: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: '#FFB5D8',
      borderRadius: 20,
    },
    resetButtonText: {
      color: '#FFF',
      fontWeight: '500',
    },
    // Path Detail Styles
    pathDetailContainer: {
      flex: 1,
      backgroundColor: '#FFF',
    },
    closeButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 30,
      right: 16,
      zIndex: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    pathDetailImage: {
      width: '100%',
      height: 200,
      resizeMode: 'cover',
    },
    pathDetailContent: {
      padding: 16,
    },
    pathDetailTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    pathDetailDescription: {
      fontSize: 16,
      color: '#333',
      lineHeight: 24,
      marginBottom: 20,
    },
    detailSection: {
      backgroundColor: '#F9F9F9',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      color: '#666',
      marginLeft: 8,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginLeft: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },
    skillsSection: {
      marginBottom: 20,
    },
    skillsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillItem: {
      backgroundColor: '#F0F0F0',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    skillText: {
      fontSize: 14,
      color: '#333',
    },
    coursesSection: {
      marginBottom: 24,
    },
    courseItem: {
      marginBottom: 16,
    },
    courseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    courseNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#FFB5D8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    courseNumberText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFF',
    },
    courseInfo: {
      flex: 1,
    },
    courseTitle: {
      fontSize: 16,
      fontWeight: '500',
    },
    courseDuration: {
      fontSize: 12,
      color: '#666',
    },
    startButton: {
      backgroundColor: '#FFB5D8',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    startButtonText: {
      color: '#FFF',
      fontWeight: '500',
      fontSize: 14,
    },
    courseConnector: {
      width: 2,
      height: 20,
      backgroundColor: '#E0E0E0',
      marginLeft: 14,
    },
    careerSection: {
      marginBottom: 24,
    },
    careerDescription: {
      fontSize: 14,
      color: '#666',
      marginBottom: 16,
    },
    careerRoles: {
      backgroundColor: '#F9F9F9',
      borderRadius: 12,
      padding: 16,
    },
    careerRole: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    careerRoleText: {
      fontSize: 16,
      color: '#333',
      marginLeft: 12,
    },
    fullWidthButton: {
      backgroundColor: '#FFB5D8',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 30,
    },
    fullWidthButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 8,
    }
  });

export default LearningPathScreen