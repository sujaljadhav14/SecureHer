import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Share } from 'react-native';
import useSentimentAnalysis from '../hooks/useSentimentAnalysis';

const CommunityScreen = () => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  
  // Sentiment Analysis Hook
  const { 
    analyzePost, 
    analyzing, 
    analysis, 
    tagConsistency, 
    getSuggestedTags,
    recordInteraction,
    needsSupport,
    shouldTriggerSupport 
  } = useSentimentAnalysis();
  
  // States
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [postTags, setPostTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Sentiment analysis specific states
  const [analyzingPost, setAnalyzingPost] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  // Common locations in India
  const commonLocations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
    'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad'
  ];

  // Common tags
  const commonTags = [
    'travel', 'adventure', 'photography', 'safety', 'experience',
    'help', 'tips', 'question', 'recommendation', 'warning'
  ];

  useEffect(() => {
    fetchPosts();
    loadLikedPosts();
    
    // Check if support should be triggered on component mount
    const checkSupportNeeded = async () => {
      const needsHelp = await shouldTriggerSupport();
      if (needsHelp) {
        setSupportModalVisible(true);
      }
    };
    
    checkSupportNeeded();
  }, []);

  const loadLikedPosts = async () => {
    try {
      const likedPostsData = await AsyncStorage.getItem('likedPosts');
      if (likedPostsData) {
        setLikedPosts(JSON.parse(likedPostsData));
      }
    } catch (error) {
      console.error('Error loading liked posts:', error);
    }
  };

  const saveLikedPosts = async (updatedLikedPosts) => {
    try {
      await AsyncStorage.setItem('likedPosts', JSON.stringify(updatedLikedPosts));
    } catch (error) {
      console.error('Error saving liked posts:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to view posts');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(
        'https://womensafety-1-5znp.onrender.com/women/getPosts',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.data) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleLocationChange = (text) => {
    setPostLocation(text);
    
    if (text.length > 1) {
      const filtered = commonLocations.filter(
        location => location.toLowerCase().includes(text.toLowerCase())
      );
      setLocationSuggestions(filtered);
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const selectLocation = (location) => {
    setPostLocation(location);
    setShowLocationSuggestions(false);
    Keyboard.dismiss();
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !postTags.includes(tagInput.trim().toLowerCase())) {
      if (postTags.length < 5) {
        setPostTags([...postTags, tagInput.trim().toLowerCase()]);
        setTagInput('');
      } else {
        Alert.alert('Limit reached', 'You can add up to 5 tags per post');
      }
    }
  };

  const removeTag = (index) => {
    setPostTags(postTags.filter((_, i) => i !== index));
  };

  // Updated createPost function with sentiment analysis
  const createPost = async () => {
    if (!postTitle.trim()) {
      Alert.alert('Missing information', 'Please enter a title for your post');
      return;
    }

    if (!postLocation.trim()) {
      Alert.alert('Missing information', 'Please enter your location');
      return;
    }
    
    // First analyze the post content for sentiment
    setAnalyzingPost(true);
    
    try {
      const postContent = {
        title: postTitle,
        description: postDescription || '',
        tags: postTags
      };
      
      const sentimentResult = await analyzePost(postContent);
      
      // Check if tags are consistent with content sentiment
      if (sentimentResult && !tagConsistency && postTags.length > 0) {
        // If not consistent, show tag suggestions
        const suggestions = getSuggestedTags();
        setSuggestedTags(suggestions);
        setShowTagSuggestions(true);
        setAnalyzingPost(false);
        return;
      }
      
      // Check if content is concerning and support should be offered
      if (sentimentResult && (sentimentResult.concernLevel > 7 || sentimentResult.sentiment === 'concerning')) {
        setSupportModalVisible(true);
        // Continue with post creation even if content is concerning
      }
      
      // Proceed with post creation
      await submitPostToServer();
      
    } catch (error) {
      console.error('Error analyzing post:', error);
      // Continue with post creation even if analysis fails
      await submitPostToServer();
    }
  };

  // Extracted server submission logic
  const submitPostToServer = async () => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to create a post');
        navigation.navigate('Login');
        return;
      }

      // Create form data for the image upload
      const formData = new FormData();
      formData.append('title', postTitle);
      formData.append('description', postDescription || '');
      formData.append('location', postLocation);
      
      // Add tags - send them as individual items instead of an array
      if (postTags.length > 0) {
        // Send tags as a comma-separated string
        formData.append('tags', postTags.join(','));
      }

      // Add image if selected
      if (selectedImage) {
        const filename = selectedImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        
        formData.append('image', {
          uri: selectedImage,
          name: filename,
          type
        });
      }

      // Send the post request
      const response = await axios.post(
        'https://womensafety-1-5znp.onrender.com/women/addPost',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        Alert.alert('Success', 'Your post has been created successfully');
        // Reset form and close modal
        setPostTitle('');
        setPostDescription('');
        setPostLocation('');
        setSelectedImage(null);
        setPostTags([]);
        setModalVisible(false);
        // Refresh posts
        fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again later.');
    } finally {
      setUploading(false);
      setAnalyzingPost(false);
    }
  };

  // Modified handleLike to record interaction
  const handleLike = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to like posts');
        navigation.navigate('Login');
        return;
      }
      
      // Find the post data in state
      const post = posts.find(p => p._id === postId);
      if (!post) return;
      
      // Optimistic UI update
      const isCurrentlyLiked = likedPosts.includes(postId);
      let updatedLikedPosts;
      
      if (isCurrentlyLiked) {
        updatedLikedPosts = likedPosts.filter(id => id !== postId);
      } else {
        updatedLikedPosts = [...likedPosts, postId];
      }
      
      setLikedPosts(updatedLikedPosts);
      saveLikedPosts(updatedLikedPosts);
      
      // Update post count in UI
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1
            };
          }
          return p;
        })
      );
      
      // Record the interaction for sentiment analysis
      if (!isCurrentlyLiked) { // Only record if it's a new like
        recordInteraction(postId, {
          title: post.title,
          description: post.description || '',
          tags: post.tags || []
        }, 'like');
      }
      
      // Call API to update like status
      await axios.post(
        'https://womensafety-1-5znp.onrender.com/women/like',
        { communityId: postId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error('Error liking post:', error);
      
      // Revert optimistic update on error
      const isCurrentlyLiked = likedPosts.includes(postId);
      
      Alert.alert('Error', 'Failed to update like status. Please try again.');
      
      // Revert UI changes
      setLikedPosts(prevLikedPosts => 
        isCurrentlyLiked 
          ? [...prevLikedPosts, postId] 
          : prevLikedPosts.filter(id => id !== postId)
      );
      
      // Revert post count in UI
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              likes: isCurrentlyLiked ? post.likes + 1 : post.likes - 1
            };
          }
          return post;
        })
      );
    }
  };

  // Modified handleComment to record interaction
  const handleComment = async (postId) => {
    // Find the post data in state
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    
    setSelectedPostId(postId);
    setCommentText('');
    await fetchComments(postId);
    setCommentModalVisible(true);
  };

  const fetchComments = async (postId) => {
    try {
      setLoadingComments(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to view comments');
        return;
      }
      
      // In a real app, you would have an API endpoint to fetch comments for a specific post
      // For now, we'll just use the comments from the post object
      const post = posts.find(p => p._id === postId);
      if (post && post.comments) {
        setComments({
          ...comments,
          [postId]: post.comments
        });
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Empty comment', 'Please enter a comment');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to comment');
        setCommentModalVisible(false);
        return;
      }
      
      const response = await axios.post(
        'https://womensafety-1-5znp.onrender.com/women/comment',
        { 
          communityId: selectedPostId,
          text: commentText 
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.comment) {
        // Update comments in state
        const updatedComments = {
          ...comments,
          [selectedPostId]: [...(comments[selectedPostId] || []), response.data.comment]
        };
        
        setComments(updatedComments);
        setCommentText('');
        
        // Update posts to include the new comment
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === selectedPostId) {
              return {
                ...post,
                comments: [...(post.comments || []), response.data.comment]
              };
            }
            return post;
          })
        );
        
        // Record comment interaction for sentiment analysis
        const post = posts.find(p => p._id === selectedPostId);
        if (post) {
          recordInteraction(selectedPostId, {
            title: post.title,
            description: post.description || '',
            tags: post.tags || []
          }, 'comment');
        }
        
        Alert.alert('Success', 'Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };
  
  const truncateText = (text, limit = 100) => {
    return text && text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  const handleShare = async (post) => {
    try {
      const result = await Share.share({
        title: post.title,
        message: `Check out this post from VithU:\n\n${post.title}\n\n${post.description || ''}\n\nLocation: ${post.location || 'Not specified'}`,
        url: post.image, // Optional: sharing image URL
      });
  
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type
          console.log('Shared with:', result.activityType);
        } else {
          // Shared
          console.log('Post shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share the post');
      console.error('Share error:', error);
    }
  };

  const getUserAvatarColor = (userId) => {
    const colors = ['#FFB5D8', '#4285F4', '#34A853', '#FBBC05', '#EA4335'];
    const colorIndex = Math.abs(parseInt(userId || '0', 16) % colors.length);
    return colors[colorIndex];
  };
  
  // Handle tag suggestions acceptance
  const handleAcceptSuggestedTags = () => {
    // Replace the current tags with the suggested ones
    setPostTags(suggestedTags);
    setShowTagSuggestions(false);
    // Submit the post with the new tags
    submitPostToServer();
  };
  
  // Handle navigating to support chat
  const handleNavigateToSupportChat = () => {
    setSupportModalVisible(false);
    navigation.navigate('MentatlHealthAIChat');
  };

  const renderItem = ({ item }) => {
    const date = new Date(item.createdAt);
    const formattedDate = `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const isLiked = likedPosts.includes(item._id);
    
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={[
              styles.userAvatar, 
              { backgroundColor: getUserAvatarColor(item.userId) }
            ]}>
              <Text style={styles.userAvatarText}>
                {item.userId ? item.userId.toString().charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>
                {item.userName || `User ${item.userId ? item.userId.toString().substr(-4) : 'Unknown'}`}
              </Text>
              <Text style={styles.postTime}>{formattedDate}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.postDescription}>{truncateText(item.description)}</Text>
          )}
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          )}
          
          {/* Properly handle tags with flexible format support */}
          {item.tags && (
            <View style={styles.tagsContainer}>
              {(typeof item.tags === 'string' 
                ? item.tags.split(',') 
                : Array.isArray(item.tags) 
                  ? item.tags 
                  : []
              ).map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag.trim()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {item.image && (
          <Image 
            source={{ uri: item.image }} 
            style={styles.postImage} 
            loadingIndicatorSource={require('../../assets/icon.png')}
          />
        )}
        
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item._id)}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={22} 
              color={isLiked ? "#FF4444" : "#666"} 
            />
            <Text style={[
              styles.actionText,
              isLiked && { color: "#FF4444" }
            ]}>
              {item.likes || 0} {item.likes === 1 ? 'Like' : 'Likes'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleComment(item._id)}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#666" />
            <Text style={styles.actionText}>
              {item.comments && item.comments.length ? item.comments.length : 0} {item.comments && item.comments.length === 1 ? 'Comment' : 'Comments'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="share-social-outline" size={22} color="#666" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={[
        styles.commentAvatar, 
        { backgroundColor: getUserAvatarColor(item.userId) }
      ]}>
        <Text style={styles.commentAvatarText}>
          {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.commentUsername}>
          {item.userName || `User ${item.userId ? item.userId.toString().substr(-4) : 'Unknown'}`}
        </Text>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('MyPosts')}
          >
            <Ionicons name="person-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB5D8" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item._id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubText}>
                Be the first to share something with the community
              </Text>
              <TouchableOpacity 
                style={styles.createFirstPostButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.createFirstPostText}>Create Post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Post FAB (only shows when not in modal) */}
      {!modalVisible && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Create Post Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  if (postTitle || postDescription || selectedImage || postTags.length > 0) {
                    Alert.alert(
                      'Discard Post',
                      'Are you sure you want to discard this post?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Discard', 
                          style: 'destructive',
                          onPress: () => {
                            setModalVisible(false);
                            setPostTitle('');
                            setPostDescription('');
                            setPostLocation('');
                            setSelectedImage(null);
                            setPostTags([]);
                          }
                        }
                      ]
                    );
                  } else {
                    setModalVisible(false);
                  }
                }}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity 
                style={[
                  styles.postButton,
                  (!postTitle || !postLocation || uploading || analyzingPost) && styles.postButtonDisabled
                ]}
                onPress={createPost}
                disabled={!postTitle || !postLocation || uploading || analyzingPost}
              >
                {uploading || analyzingPost ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.titleInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#999"
                value={postTitle}
                onChangeText={setPostTitle}
                maxLength={100}
              />
              
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add a description (optional)"
                placeholderTextColor="#999"
                value={postDescription}
                onChangeText={setPostDescription}
                multiline
                maxLength={500}
              />

              <View style={styles.locationInputContainer}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.locationIcon} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Add your location"
                  placeholderTextColor="#999"
                  value={postLocation}
                  onChangeText={handleLocationChange}
                />
              </View>

              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <View style={styles.suggestionContainer}>
                  {locationSuggestions.map((location, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectLocation(location)}
                    >
                      <Ionicons name="location" size={16} color="#FFB5D8" />
                      <Text style={styles.suggestionText}>{location}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.tagsInputContainer}>
                <View style={styles.tagsHeader}>
                  <Ionicons name="pricetag-outline" size={20} color="#666" />
                  <Text style={styles.tagsHeaderText}>Add Tags</Text>
                </View>
                
                <View style={styles.tagInputRow}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Add a tag (e.g., travel, safety)"
                    placeholderTextColor="#999"
                    value={tagInput}
                    onChangeText={setTagInput}
                    maxLength={20}
                  />
                  <TouchableOpacity 
                    style={[
                      styles.addTagButton,
                      !tagInput.trim() && styles.addTagButtonDisabled
                    ]}
                    onPress={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    <Ionicons name="add" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
                
                {postTags.length > 0 && (
                  <View style={styles.selectedTagsContainer}>
                    {postTags.map((tag, index) => (
                      <View key={index} style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>#{tag}</Text>
                        <TouchableOpacity
                          style={styles.removeTagButton}
                          onPress={() => removeTag(index)}
                        >
                          <Ionicons name="close-circle" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.suggestionTagsContainer}>
                  <Text style={styles.suggestionTagsTitle}>Suggested tags:</Text>
                  <View style={styles.suggestionTagsList}>
                    {commonTags.filter(tag => !postTags.includes(tag)).slice(0, 5).map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionTag}
                        onPress={() => {
                          if (postTags.length < 5) {
                            setPostTags([...postTags, tag]);
                          } else {
                            Alert.alert('Limit reached', 'You can add up to 5 tags per post');
                          }
                        }}
                      >
                        <Text style={styles.suggestionTagText}>#{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <View style={styles.imagePickerContent}>
                  <Ionicons name="image-outline" size={24} color="#666" />
                  <Text style={styles.imagePickerText}>
                    {selectedImage ? 'Change Image' : 'Add Image'}
                  </Text>
                </View>
              </TouchableOpacity>

              {selectedImage && (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close-circle" size={28} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={commentModalVisible}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setCommentModalVisible(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Comments</Text>
              <View style={{ width: 40 }} />
            </View>

            {loadingComments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFB5D8" />
              </View>
            ) : (
              <FlatList
                data={comments[selectedPostId] || []}
                renderItem={renderCommentItem}
                keyExtractor={(item, index) => `comment-${index}`}
                contentContainerStyle={styles.commentsList}
                ListEmptyComponent={
                  <View style={styles.emptyCommentsContainer}>
                    <Ionicons name="chatbubble-outline" size={40} color="#CCC" />
                    <Text style={styles.emptyCommentsText}>No comments yet</Text>
                    <Text style={styles.emptyCommentsSubText}>Be the first to add a comment</Text>
                  </View>
                }
              />
            )}

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  !commentText.trim() && styles.sendButtonDisabled
                ]}
                onPress={submitComment}
                disabled={!commentText.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={24} 
                  color={commentText.trim() ? "#FFB5D8" : "#CCC"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Tag Suggestions Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTagSuggestions}
        onRequestClose={() => setShowTagSuggestions(false)}
      >
        <View style={styles.tagSuggestionsModalContainer}>
          <View style={styles.tagSuggestionsModalContent}>
            <View style={styles.tagSuggestionsHeader}>
              <Text style={styles.tagSuggestionsTitle}>Suggested Tags</Text>
              <TouchableOpacity
                style={styles.tagSuggestionsCloseButton}
                onPress={() => setShowTagSuggestions(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.tagSuggestionsDescription}>
              We noticed the content of your post might benefit from more descriptive tags. Consider using these suggested tags:
            </Text>
            
            <View style={styles.suggestedTagsList}>
              {suggestedTags.map((tag, index) => (
                <View key={index} style={styles.suggestedTagItem}>
                  <Text style={styles.suggestedTagText}>#{tag}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.tagSuggestionsActions}>
              <TouchableOpacity
                style={styles.declineTagsButton}
                onPress={() => {
                  setShowTagSuggestions(false);
                  submitPostToServer();
                }}
              >
                <Text style={styles.declineTagsButtonText}>Use My Tags</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.acceptTagsButton}
                onPress={handleAcceptSuggestedTags}
              >
                <Text style={styles.acceptTagsButtonText}>Use Suggested Tags</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mental Health Support Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={supportModalVisible}
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.supportModalContainer}>
          <View style={styles.supportModalContent}>
            <View style={styles.supportModalHeader}>
              <Ionicons name="heart" size={32} color="#FFB5D8" />
              <Text style={styles.supportModalTitle}>We're Here For You</Text>
            </View>
            
            <Text style={styles.supportModalDescription}>
              Would you like to talk with our supportive AI assistant about anything that's on your mind? It's completely private and confidential.
            </Text>
            
            <View style={styles.supportModalActions}>
              <TouchableOpacity
                style={styles.declineSupportButton}
                onPress={() => setSupportModalVisible(false)}
              >
                <Text style={styles.declineSupportButtonText}>No, thanks</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.acceptSupportButton}
                onPress={handleNavigateToSupportChat}
              >
                <Text style={styles.acceptSupportButtonText}>Talk to Support</Text>
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginLeft: 16,
    padding: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPostButton: {
    backgroundColor: '#FFB5D8',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  postsList: {
    padding: 12,
    paddingBottom: 80, // Extra padding for FAB
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  createFirstPostButton: {
    backgroundColor: '#FFB5D8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstPostText: {
    color: '#FFF',
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userAvatar: {
    width: 48, // Slightly larger
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 6,
  },
  postDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  postImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFB5D8',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFF',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postButton: {
    backgroundColor: '#FFB5D8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
  },
  postButtonDisabled: {
    backgroundColor: '#FFB5D8',
    opacity: 0.5,
  },
  postButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  titleInput: {
    fontSize: 18,
    color: '#000',
    marginBottom: 16,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  suggestionContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    marginTop: -10,
    marginBottom: 16,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 16,
  },
  tagsInputContainer: {
    marginBottom: 16,
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagsHeaderText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: '#FFB5D8',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: '#FFD9E9',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE9F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagText: {
    color: '#FF4D94',
    marginRight: 4,
  },
  removeTagButton: {
    padding: 2,
  },
  suggestionTagsContainer: {
    marginTop: 8,
  },
  suggestionTagsTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  suggestionTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionTagText: {
    color: '#666',
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 12,
    borderBottomLeftRadius: 4,
  },
  commentUsername: {
    fontWeight: '500',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentsList: {
    padding: 16,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptyCommentsSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    padding: 6,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // Tag Suggestions Modal Styles
  tagSuggestionsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tagSuggestionsModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  tagSuggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagSuggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tagSuggestionsCloseButton: {
    padding: 4,
  },
  tagSuggestionsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  suggestedTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  suggestedTagItem: {
    backgroundColor: '#FFE9F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestedTagText: {
    color: '#FF4D94',
  },
  tagSuggestionsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineTagsButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 25,
    alignItems: 'center',
    marginRight: 8,
  },
  declineTagsButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  acceptTagsButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptTagsButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  // Support Modal Styles
  supportModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  supportModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  supportModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  supportModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  supportModalDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  supportModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  declineSupportButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 25,
    alignItems: 'center',
    marginRight: 8,
  },
  declineSupportButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  acceptSupportButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptSupportButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default CommunityScreen;