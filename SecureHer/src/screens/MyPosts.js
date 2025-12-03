import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const MyPostsScreen = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      // Reset states
      setLoading(true);
      setError(null);

      // Get user token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch user posts
      const response = await axios.get(
        'https://womensafety-1-5znp.onrender.com/women/getMyPosts',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update posts state
      setPosts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching my posts:', err);
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const renderPostItem = ({ item }) => {
    // Truncate long descriptions
    const truncateText = (text, limit = 100) => {
      return text.length > limit ? text.substring(0, limit) + '...' : text;
    };

    return (
      <View style={styles.postCard}>
        {item.image && (
          <Image 
            source={{ uri: item.image }} 
            style={styles.postImage} 
          />
        )}
        
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          
          {item.description && (
            <Text style={styles.postDescription}>
              {truncateText(item.description)}
            </Text>
          )}
          
          <View style={styles.postMeta}>
            <Text style={styles.postDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {item.location && (
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={12} color="#666" />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFB5D8" />
          <Text style={styles.loadingText}>Loading your posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="warning" size={50} color="#FF4444" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchMyPosts}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render empty state
  if (posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="document-text-outline" size={50} color="#CCC" />
          <Text style={styles.emptyText}>No posts yet</Text>
          <Text style={styles.emptySubText}>
            Start sharing your experiences and create your first post!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Posts</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.postsList}
        showsVerticalScrollIndicator={false}
      />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#FFB5D8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
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
  },
  postsList: {
    padding: 16,
  },
  postCard: {
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
  postImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  postContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postDate: {
    fontSize: 14,
    color: '#999',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default MyPostsScreen;