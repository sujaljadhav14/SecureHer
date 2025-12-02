import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  ScrollView,
  Linking,
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useSentimentAnalysis from '../hooks/useSentimentAnalysis';

const MentalHealthChat = () => {
  const navigation = useNavigation();
  const { 
    initializeChatbot, 
    sendChatbotMessage, 
    getMentalHealthResources 
  } = useSentimentAnalysis();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [resources, setResources] = useState([]);
  const [resourcesModalVisible, setResourcesModalVisible] = useState(false);
  
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Initialize chat
  useEffect(() => {
    const setupChat = async () => {
      try {
        setInitializing(true);
        
        // Get initial message from chatbot
        const greeting = await initializeChatbot();
        
        // Add initial message
        setMessages([
          {
            id: '0',
            text: greeting,
            sender: 'assistant',
            timestamp: new Date().toISOString()
          }
        ]);
        
        // Load resources
        const mentalHealthResources = await getMentalHealthResources();
        setResources(mentalHealthResources);
        
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        }).start();
      } catch (error) {
        console.error('Error setting up chat:', error);
        
        // Add fallback message if setup fails
        setMessages([
          {
            id: '0',
            text: "Hello! I'm here to provide support and someone to talk to. How are you feeling today?",
            sender: 'assistant',
            timestamp: new Date().toISOString()
          }
        ]);
      } finally {
        setInitializing(false);
        setLoading(false);
      }
    };
    
    setupChat();
  }, []);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Use setTimeout to ensure the flatlist has updated
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputText.trim() || sendingMessage) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    
    // Add user message to state
    const newUserMessage = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    
    // Show typing indicator
    setSendingMessage(true);
    
    try {
      // Get response from chatbot
      const response = await sendChatbotMessage(userMessage);
      
      // Add assistant message to state
      const newAssistantMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, newAssistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble responding right now. Please try again in a moment.",
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleResourcePress = (resource) => {
    // Handle different resource types
    if (resource.type === 'hotline' && resource.contactInfo) {
      // Check if it's a phone number
      if (/^[0-9+\-\s()]+$/.test(resource.contactInfo)) {
        Linking.openURL(`tel:${resource.contactInfo.replace(/\s+/g, '')}`);
      } else {
        // Treat as website if not a phone number
        let url = resource.contactInfo;
        if (!url.startsWith('http')) {
          url = `https://${url}`;
        }
        Linking.openURL(url);
      }
    } else if (resource.type === 'website' || resource.type === 'app') {
      // Handle website or app links
      let url = resource.contactInfo;
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      Linking.openURL(url);
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.assistantMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };
  
  // Render resources modal
  const renderResourcesModal = () => (
    <Modal
      visible={resourcesModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setResourcesModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mental Health Resources</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setResourcesModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.resourcesContainer}>
            {resources.length > 0 ? (
              resources.map((resource, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.resourceItem}
                  onPress={() => handleResourcePress(resource)}
                >
                  <View style={styles.resourceIcon}>
                    <Ionicons 
                      name={
                        resource.type === 'hotline' ? "call-outline" : 
                        resource.type === 'website' ? "globe-outline" : 
                        resource.type === 'app' ? "phone-portrait-outline" : 
                        "information-circle-outline"
                      } 
                      size={24} 
                      color="#FFB5D8" 
                    />
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceName}>{resource.name}</Text>
                    <Text style={styles.resourceDescription}>{resource.description}</Text>
                    <Text style={styles.resourceContact}>{resource.contactInfo}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResourcesContainer}>
                <ActivityIndicator size="large" color="#FFB5D8" />
                <Text style={styles.noResourcesText}>Loading resources...</Text>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Text style={styles.disclaimerText}>
              If you're experiencing an emergency, please call 112 immediately.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB5D8" />
        <Text style={styles.loadingText}>
          {initializing ? "Initializing support chat..." : "Loading..."}
        </Text>
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
        <Text style={styles.headerTitle}>Healing Journey</Text>
        <TouchableOpacity 
          style={styles.resourcesButton}
          onPress={() => setResourcesModalVisible(true)}
        >
          <MaterialIcons name="help-outline" size={24} color="#FFB5D8" />
        </TouchableOpacity>
      </View>
      
      <Animated.View 
        style={[styles.chatContainer, { opacity: fadeAnim }]}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
        />
        
        {sendingMessage && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>VithU is typing</Text>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}
      </Animated.View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sendingMessage) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sendingMessage}
        >
          <Ionicons
            name="send"
            size={24}
            color={inputText.trim() && !sendingMessage ? "#FFB5D8" : "#CCC"}
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>
      
      {/* Resources Modal */}
      {renderResourcesModal()}
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
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resourcesButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  userMessageBubble: {
    backgroundColor: '#FFB5D8',
    borderBottomRightRadius: 4,
  },
  assistantMessageBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFF',
  },
  assistantMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.6,
  },
  typingDot2: {
    opacity: 0.8,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 12,
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  resourcesContainer: {
    padding: 16,
    maxHeight: '60%',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
    marginRight: 8,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resourceContact: {
    fontSize: 14,
    color: '#FFB5D8',
  },
  noResourcesContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noResourcesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MentalHealthChat;