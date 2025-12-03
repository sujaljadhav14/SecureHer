import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
  FlatList
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CourseDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState('not_enrolled'); // 'not_enrolled', 'enrolled', 'completed'
  const [progress, setProgress] = useState(0);
  const [expandedSection, setExpandedSection] = useState('overview');
  
  // Sample course modules data
  const courseModules = [
    {
      id: '1',
      title: 'Introduction to the Course',
      duration: '45 min',
      lessons: [
        { id: '1.1', title: 'Welcome and Course Overview', duration: '10 min', completed: true },
        { id: '1.2', title: 'Key Concepts and Terminology', duration: '15 min', completed: true },
        { id: '1.3', title: 'Setting Up Your Environment', duration: '20 min', completed: false }
      ]
    },
    {
      id: '2',
      title: 'Core Principles',
      duration: '1h 30min',
      lessons: [
        { id: '2.1', title: 'Understanding the Fundamentals', duration: '25 min', completed: false },
        { id: '2.2', title: 'Practical Applications', duration: '35 min', completed: false },
        { id: '2.3', title: 'Case Studies and Examples', duration: '30 min', completed: false }
      ]
    },
    {
      id: '3',
      title: 'Advanced Techniques',
      duration: '2h 15min',
      lessons: [
        { id: '3.1', title: 'Building Complex Solutions', duration: '45 min', completed: false },
        { id: '3.2', title: 'Optimization Strategies', duration: '40 min', completed: false },
        { id: '3.3', title: 'Troubleshooting Common Issues', duration: '30 min', completed: false },
        { id: '3.4', title: 'Industry Best Practices', duration: '20 min', completed: false }
      ]
    },
    {
      id: '4',
      title: 'Practical Projects',
      duration: '3h',
      lessons: [
        { id: '4.1', title: 'Project Setup and Planning', duration: '30 min', completed: false },
        { id: '4.2', title: 'Building Your First Project', duration: '1h', completed: false },
        { id: '4.3', title: 'Advanced Project Implementation', duration: '1h 30min', completed: false }
      ]
    },
    {
      id: '5',
      title: 'Course Conclusion',
      duration: '1h',
      lessons: [
        { id: '5.1', title: 'Review and Key Takeaways', duration: '25 min', completed: false },
        { id: '5.2', title: 'Next Steps and Resources', duration: '20 min', completed: false },
        { id: '5.3', title: 'Final Assessment', duration: '15 min', completed: false }
      ]
    }
  ];
  
  // Sample course details additional information
  const additionalDetails = {
    description: "This comprehensive course is designed to provide you with a solid foundation in the subject matter, equipping you with practical skills that can be immediately applied. Starting with fundamental concepts and gradually advancing to complex applications, the curriculum is structured to ensure steady progress and deep understanding.",
    whatYouWillLearn: [
      "Master essential concepts and industry-standard techniques",
      "Develop practical skills through hands-on projects and exercises",
      "Understand best practices and common pitfalls to avoid",
      "Apply your knowledge to real-world scenarios and challenges",
      "Build a portfolio of work to showcase your new skills"
    ],
    requirements: [
      "Basic understanding of related concepts is helpful but not required",
      "Access to a computer with internet connection",
      "Willingness to practice regularly and complete assignments",
      "No specialized software or equipment needed to begin"
    ],
    instructor: {
      name: "Dr. Priya Sharma",
      bio: "Dr. Sharma has over 15 years of experience in the field and has taught over 50,000 students worldwide. She combines academic expertise with practical industry experience to create engaging and effective learning experiences.",
      credentials: "Ph.D. in Computer Science, Microsoft Certified Professional, 3x Author"
    },
    reviews: [
      {
        id: '1',
        user: "Anita J.",
        rating: 5,
        comment: "This course exceeded my expectations. The content is well-structured and the instructor explains complex concepts in an easy-to-understand manner.",
        date: "February 15, 2025"
      },
      {
        id: '2',
        user: "Meera P.",
        rating: 4,
        comment: "Very practical course with lots of exercises. I feel much more confident in my skills now.",
        date: "January 30, 2025"
      },
      {
        id: '3',
        user: "Sunita R.",
        rating: 5,
        comment: "The best course I've taken on this subject. Dr. Sharma is an excellent teacher who clearly cares about student success.",
        date: "March 2, 2025"
      }
    ]
  };

  useEffect(() => {
    loadCourseDetails();
  }, []);
  
  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      
      // In a real app, you would fetch course details from an API
      // For now, we'll use the passed course data and add our sample additional details
      if (course) {
        setCourseDetails({
          ...course,
          ...additionalDetails,
          modules: courseModules
        });
        
        // Check if user is enrolled
        const enrolledCourses = await AsyncStorage.getItem('enrolled_courses');
        if (enrolledCourses) {
          const parsedCourses = JSON.parse(enrolledCourses);
          if (parsedCourses.some(c => c.id === course.id)) {
            setEnrollmentStatus('enrolled');
            
            // Load progress
            const courseProgress = await AsyncStorage.getItem(`course_progress_${course.id}`);
            if (courseProgress) {
              const parsedProgress = JSON.parse(courseProgress);
              setProgress(parsedProgress.progress);
              
              if (parsedProgress.progress === 100) {
                setEnrollmentStatus('completed');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading course details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEnroll = async () => {
    try {
      // If it's a paid course, show payment screen (not implemented in this demo)
      if (!courseDetails.free) {
        Alert.alert(
          'Payment Required',
          `This course costs ${courseDetails.price}. Would you like to proceed to payment?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Proceed',
              onPress: () => {
                // In a real app, navigate to payment screen
                // For demo, we'll just enroll the user
                completeEnrollment();
              }
            }
          ]
        );
      } else {
        completeEnrollment();
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      Alert.alert('Error', 'Failed to enroll in course. Please try again.');
    }
  };
  
  const completeEnrollment = async () => {
    try {
      // Save enrollment status
      const enrolledCourses = await AsyncStorage.getItem('enrolled_courses');
      let parsedCourses = enrolledCourses ? JSON.parse(enrolledCourses) : [];
      
      // Check if already enrolled
      if (!parsedCourses.some(c => c.id === courseDetails.id)) {
        parsedCourses.push({
          id: courseDetails.id,
          title: courseDetails.title,
          enrolledDate: new Date().toISOString()
        });
        
        await AsyncStorage.setItem('enrolled_courses', JSON.stringify(parsedCourses));
        
        // Initialize progress
        await AsyncStorage.setItem(`course_progress_${courseDetails.id}`, JSON.stringify({
          progress: 0,
          lastAccessed: new Date().toISOString()
        }));
      }
      
      setEnrollmentStatus('enrolled');
      setProgress(0);
      
      Alert.alert('Success', 'You have successfully enrolled in this course!');
    } catch (error) {
      console.error('Error completing enrollment:', error);
      Alert.alert('Error', 'Failed to enroll in course. Please try again.');
    }
  };
  
  const handleContinueLearning = () => {
    // In a real app, navigate to the course content/player screen
    Alert.alert('Continue Learning', 'This would navigate to the course player/content screen in a full implementation.');
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this course: ${courseDetails.title}. It's a great way to learn new skills!`,
        // In a real app, include a link to the course
        // url: 'https://yourdomain.com/courses/123'
      });
    } catch (error) {
      console.error('Error sharing course:', error);
    }
  };
  
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons 
          key={i}
          name={i <= rating ? "star" : "star-outline"} 
          size={16} 
          color={i <= rating ? "#FFD700" : "#CCC"} 
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };
  
  const renderModuleItem = ({ item }) => {
    const completedLessons = item.lessons.filter(lesson => lesson.completed).length;
    const totalLessons = item.lessons.length;
    const moduleProgress = (completedLessons / totalLessons) * 100;
    
    return (
      <View style={styles.moduleItem}>
        <View style={styles.moduleHeader}>
          <View>
            <Text style={styles.moduleTitle}>{item.title}</Text>
            <Text style={styles.moduleMeta}>
              {item.duration} • {item.lessons.length} lessons
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </View>
        
        <View style={styles.moduleProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${moduleProgress}%`, backgroundColor: '#FFB5D8' }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(moduleProgress)}% complete</Text>
        </View>
        
        <View style={styles.lessonsList}>
          {item.lessons.map(lesson => (
            <View key={lesson.id} style={styles.lessonItem}>
              <View style={styles.lessonInfo}>
                <Ionicons 
                  name={lesson.completed ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={lesson.completed ? "#4CAF50" : "#CCC"} 
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
              </View>
              <Text style={styles.lessonDuration}>{lesson.duration}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.user}</Text>
        <Text style={styles.reviewDate}>{item.date}</Text>
      </View>
      {renderStars(item.rating)}
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB5D8" />
        <Text style={styles.loadingText}>Loading course details...</Text>
      </SafeAreaView>
    );
  }

  if (!courseDetails) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>Course not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerShareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Image source={courseDetails.image} style={styles.courseImage} />
        
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>{courseDetails.title}</Text>
          
          <View style={styles.courseMetaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{courseDetails.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{courseDetails.level}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.metaText}>2,540 students</Text>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            {courseDetails.free ? (
              <Text style={styles.freeTag}>Free</Text>
            ) : (
              <Text style={styles.priceTag}>{courseDetails.price}</Text>
            )}
          </View>
          
          <Text style={styles.providerInfo}>Created by {courseDetails.provider}</Text>
          
          {enrollmentStatus !== 'not_enrolled' && (
            <View style={styles.progressContainer}>
              <View style={styles.overallProgress}>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentage}>{progress}% complete</Text>
              </View>
              
              {enrollmentStatus === 'completed' ? (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              ) : null}
            </View>
          )}
          
          {/* Action Button */}
          {enrollmentStatus === 'not_enrolled' ? (
            <TouchableOpacity 
              style={styles.enrollButton}
              onPress={handleEnroll}
            >
              <Text style={styles.enrollButtonText}>Enroll Now</Text>
            </TouchableOpacity>
          ) : enrollmentStatus === 'enrolled' ? (
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinueLearning}
            >
              <Text style={styles.continueButtonText}>Continue Learning</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.reviewButton}
              onPress={() => Alert.alert('Success', 'Thank you for completing this course! You can now access all materials for review.')}
            >
              <Text style={styles.reviewButtonText}>Review Materials</Text>
            </TouchableOpacity>
          )}
          
          {/* Course Sections/Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                expandedSection === 'overview' && styles.activeTab
              ]}
              onPress={() => toggleSection('overview')}
            >
              <Text style={[
                styles.tabText,
                expandedSection === 'overview' && styles.activeTabText
              ]}>Overview</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                expandedSection === 'curriculum' && styles.activeTab
              ]}
              onPress={() => toggleSection('curriculum')}
            >
              <Text style={[
                styles.tabText,
                expandedSection === 'curriculum' && styles.activeTabText
              ]}>Curriculum</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                expandedSection === 'instructor' && styles.activeTab
              ]}
              onPress={() => toggleSection('instructor')}
            >
              <Text style={[
                styles.tabText,
                expandedSection === 'instructor' && styles.activeTabText
              ]}>Instructor</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                expandedSection === 'reviews' && styles.activeTab
              ]}
              onPress={() => toggleSection('reviews')}
            >
              <Text style={[
                styles.tabText,
                expandedSection === 'reviews' && styles.activeTabText
              ]}>Reviews</Text>
            </TouchableOpacity>
          </View>
          
          {/* Section Content */}
          {expandedSection === 'overview' && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>
                {courseDetails.description}
              </Text>
              
              <Text style={styles.sectionTitle}>What You Will Learn</Text>
              <View style={styles.learnList}>
                {courseDetails.whatYouWillLearn.map((item, index) => (
                  <View key={index} style={styles.learnItem}>
                    <Ionicons name="checkmark" size={16} color="#4CAF50" style={styles.learnItemIcon} />
                    <Text style={styles.learnItemText}>{item}</Text>
                  </View>
                ))}
              </View>
              
              <Text style={styles.sectionTitle}>Requirements</Text>
              <View style={styles.requirementsList}>
                {courseDetails.requirements.map((item, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <Ionicons name="ellipse" size={8} color="#666" style={styles.requirementItemIcon} />
                    <Text style={styles.requirementItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {expandedSection === 'curriculum' && (
            <View style={styles.sectionContent}>
              <View style={styles.curriculumHeader}>
                <Text style={styles.sectionTitle}>Course Content</Text>
                <Text style={styles.curriculumMeta}>
                  {courseModules.length} modules • {courseModules.reduce((total, module) => total + module.lessons.length, 0)} lessons • 
                  {courseModules.reduce((total, module) => {
                    // Parse duration strings like "1h 30min" into minutes
                    const durationStr = module.duration;
                    let minutes = 0;
                    
                    if (durationStr.includes('h')) {
                      const hours = parseInt(durationStr.split('h')[0].trim());
                      minutes += hours * 60;
                    }
                    
                    if (durationStr.includes('min')) {
                      const mins = parseInt(durationStr.split('min')[0].split(' ').pop().trim());
                      minutes += mins;
                    }
                    
                    return total + minutes;
                  }, 0) / 60} hours total
                </Text>
              </View>
              
              <FlatList
                data={courseModules}
                renderItem={renderModuleItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          )}
          
          {expandedSection === 'instructor' && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>About the Instructor</Text>
              <View style={styles.instructorProfile}>
                <View style={styles.instructorAvatar}>
                  <Text style={styles.avatarText}>{courseDetails.instructor.name.charAt(0)}</Text>
                </View>
                <View style={styles.instructorInfo}>
                  <Text style={styles.instructorName}>{courseDetails.instructor.name}</Text>
                  <Text style={styles.instructorCredentials}>{courseDetails.instructor.credentials}</Text>
                </View>
              </View>
              
              <Text style={styles.instructorBio}>
                {courseDetails.instructor.bio}
              </Text>
            </View>
          )}
          
          {expandedSection === 'reviews' && (
            <View style={styles.sectionContent}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Student Reviews</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.averageRating}>4.7</Text>
                  {renderStars(4.7)}
                  <Text style={styles.totalReviews}>({courseDetails.reviews.length})</Text>
                </View>
              </View>
              
              <FlatList
                data={courseDetails.reviews}
                renderItem={renderReviewItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
              
              <TouchableOpacity style={styles.seeAllReviewsButton}>
                <Text style={styles.seeAllReviewsText}>See All Reviews</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFB5D8" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      
      {enrollmentStatus === 'enrolled' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.bottomButton}
            onPress={handleContinueLearning}
          >
            <Text style={styles.bottomButtonText}>Resume Learning</Text>
          </TouchableOpacity>
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF',
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      color: '#666',
      marginTop: 16,
      marginBottom: 24,
      textAlign: 'center',
    },
    backButton: {
      backgroundColor: '#FFB5D8',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
    },
    backButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 40,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 10,
      paddingHorizontal: 16,
    },
    headerBackButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerShareButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    courseImage: {
      width: '100%',
      height: 250,
      resizeMode: 'cover',
    },
    courseInfo: {
      padding: 16,
    },
    courseTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    courseMetaInfo: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    metaText: {
      fontSize: 14,
      color: '#666',
      marginLeft: 4,
    },
    priceContainer: {
      marginBottom: 12,
    },
    freeTag: {
      backgroundColor: '#4CAF50',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      color: '#FFF',
      fontWeight: '600',
    },
    priceTag: {
      backgroundColor: '#FFB5D8',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      color: '#FFF',
      fontWeight: '600',
    },
    providerInfo: {
      fontSize: 14,
      color: '#666',
      marginBottom: 16,
    },
    progressContainer: {
      marginBottom: 16,
    },
    overallProgress: {
      marginBottom: 8,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: '#F0F0F0',
      borderRadius: 4,
      marginBottom: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#4CAF50',
      borderRadius: 4,
    },
    progressPercentage: {
      fontSize: 12,
      color: '#666',
      textAlign: 'right',
    },
    completedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#4CAF50',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    completedText: {
      color: '#FFF',
      fontWeight: '600',
      marginLeft: 4,
    },
    enrollButton: {
      backgroundColor: '#FFB5D8',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 24,
    },
    enrollButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    },
    continueButton: {
      backgroundColor: '#4CAF50',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 24,
    },
    continueButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    },
    reviewButton: {
      backgroundColor: '#2196F3',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 24,
    },
    reviewButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
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
    sectionContent: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    descriptionText: {
      fontSize: 14,
      color: '#333',
      lineHeight: 22,
      marginBottom: 16,
    },
    learnList: {
      marginBottom: 16,
    },
    learnItem: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'flex-start',
    },
    learnItemIcon: {
      marginTop: 2,
      marginRight: 8,
    },
    learnItemText: {
      flex: 1,
      fontSize: 14,
      color: '#333',
      lineHeight: 20,
    },
    requirementsList: {
      marginBottom: 16,
    },
    requirementItem: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'flex-start',
    },
    requirementItemIcon: {
      marginTop: 6,
      marginRight: 8,
    },
    requirementItemText: {
      flex: 1,
      fontSize: 14,
      color: '#333',
      lineHeight: 20,
    },
    curriculumHeader: {
      marginBottom: 16,
    },
    curriculumMeta: {
      fontSize: 14,
      color: '#666',
    },
    moduleItem: {
      backgroundColor: '#F8F8F8',
      borderRadius: 8,
      marginBottom: 16,
      padding: 16,
    },
    moduleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    moduleTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    moduleMeta: {
      fontSize: 14,
      color: '#666',
    },
    moduleProgress: {
      marginBottom: 16,
    },
    progressBar: {
      height: 8,
      backgroundColor: '#E0E0E0',
      borderRadius: 4,
      marginBottom: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      color: '#666',
      textAlign: 'right',
    },
    lessonsList: {
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
      paddingTop: 12,
    },
    lessonItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    lessonInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    lessonTitle: {
      fontSize: 14,
      color: '#333',
      flex: 1,
    },
    lessonDuration: {
      fontSize: 12,
      color: '#666',
    },
    instructorProfile: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    instructorAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FFB5D8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFF',
    },
    instructorInfo: {
      flex: 1,
    },
    instructorName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    instructorCredentials: {
      fontSize: 14,
      color: '#666',
    },
    instructorBio: {
      fontSize: 14,
      color: '#333',
      lineHeight: 22,
    },
    reviewsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    averageRating: {
      fontSize: 18,
      fontWeight: 'bold',
      marginRight: 8,
    },
    totalReviews: {
      fontSize: 14,
      color: '#666',
      marginLeft: 4,
    },
    reviewItem: {
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
      paddingVertical: 12,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    reviewerName: {
      fontSize: 16,
      fontWeight: '600',
    },
    reviewDate: {
      fontSize: 12,
      color: '#666',
    },
    reviewComment: {
      fontSize: 14,
      color: '#333',
      lineHeight: 20,
      marginTop: 8,
    },
    seeAllReviewsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    seeAllReviewsText: {
      fontSize: 14,
      color: '#FFB5D8',
      fontWeight: '600',
      marginRight: 4,
    },
    bottomBar: {
      backgroundColor: '#FFF',
      borderTopWidth: 1,
      borderTopColor: '#EEE',
      padding: 16,
    },
    bottomButton: {
      backgroundColor: '#4CAF50',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    bottomButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    }
  });

export default CourseDetailsScreen;