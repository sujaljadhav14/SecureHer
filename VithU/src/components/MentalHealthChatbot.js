import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import mentalHealthSupportService from '../services/mentalHealthSupportService';

const MentalHealthChatbot = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [resourcesVisible, setResourcesVisible] = useState(false);
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  
  const flatListRef = useRef(null);
  
  // Initialize chatbot when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadChatHistory();
    }
  }, [visible]);
  
  // Load chat history and initialize if empty
  const loadChatHistory = async () => {
    setLoading(true);
    try {
      const history = await mentalHealthSupportService.getChatHistory();
      
      if (history.length === 0) {
        // Initialize with greeting if history is empty
        const greeting = await mentalHealthSupportService.initializeChatbot();
        setMessages([{
          id: Date.now().toString(),
          sender: 'system',
          message: greeting,
          timestamp: new Date().toISOString()
        }]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);
  
  // Send message handler
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    setSendingMessage(true);
    
    // Add user message to UI immediately (optimistic update)
    const userMessageObj = {
      id: Date.now().toString(),
      sender: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    
    try {
      // Get response from service
      const response = await mentalHealthSupportService.sendMessage(userMessage);
      
      // Add bot response to UI
      const botMessageObj = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        message: response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessageObj]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessageObj = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        message: "I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Load mental health resources
  const loadResources = async () => {
    setResourcesLoading(true);
    try {
      const resourcesData = await mentalHealthSupportService.getMentalHealthResources();
      setResources(resourcesData);
      setResourcesVisible(true);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setResourcesLoading(false);
    }
  };
  
  // Handle resource item press
  const handleResourcePress = (resource) => {
    if (resource.contactInfo) {
      if (resource.contactInfo.includes('http')) {
        Linking.openURL(resource.contactInfo);
      } else if (resource.type === 'hotline') {
        Linking.openURL(`tel:${resource.contactInfo}`);
      }
    }
  };
  
  // Render message item
  const renderMessageItem = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'user' ? styles.userMessage : styles.systemMessage
    ]}>
      <Text style={styles.messageText}>{item.message}</Text>
      <Text style={styles.timestampText}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
  
  // Render resource item
  const renderResourceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.resourceItem}
      onPress={() => handleResourcePress(item)}
    >
      <View style={styles.resourceContent}>
        <Text style={styles.resourceName}>{item.name}</Text>
        <Text style={styles.resourceDescription}>{item.description}</Text>
        <Text style={styles.resourceContact}>{item.contactInfo}</Text>
      </View>
      {(item.contactInfo.includes('http') || item.type === 'hotline') && (
        <Ionicons 
          name={item.contactInfo.includes('http') ? "open-outline" : "call-outline"} 
          size={20} 
          color="#FFB5D8" 
        />
      )}
    </TouchableOpacity>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mental Health Support</Text>
          <TouchableOpacity style={styles.resourceButton} onPress={loadResources}>
            <Ionicons name="information-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFB5D8" />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No messages yet</Text>
                </View>
              }
            />
            
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
              style={styles.inputContainer}
            >
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
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
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </>
        )}
        
        {/* Resources Modal */}
        <Modal
          visible={resourcesVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setResourcesVisible(false)}
        >
          <View style={styles.resourcesModalContainer}>
            <View style={styles.resourcesModalContent}>
              <View style={styles.resourcesHeader}>
                <Text style={styles.resourcesTitle}>Mental Health Resources</Text>
                <TouchableOpacity 
                  style={styles.closeResourcesButton}
                  onPress={() => setResourcesVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              {resourcesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFB5D8" />
                  <Text style={styles.loadingText}>Loading resources...</Text>
                </View>
              ) : (
                <FlatList
                  data={resources}
                  renderItem={renderResourceItem}
                  keyExtractor={(item, index) => `resource-${index}`}
                  contentContainerStyle={styles.resourcesList}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No resources available</Text>
                    </View>
                  }
                />
              )}
              
              <TouchableOpacity 
                style={styles.doneButton}
                onPress={() => setResourcesVisible(false)}
              >
                <Text style={styles.doneButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  resourceButton: {
    padding: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userMessage: {
    backgroundColor: '#FFB5D8',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  systemMessage: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestampText: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FFB5D8',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#FFD8E7',
  },
  resourcesModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  resourcesModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  resourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeResourcesButton: {
    padding: 4,
  },
  resourcesList: {
    padding: 20,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  resourceContent: {
    flex: 1,
    marginRight: 8,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
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
  doneButton: {
    backgroundColor: '#FFB5D8',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default MentalHealthChatbot;