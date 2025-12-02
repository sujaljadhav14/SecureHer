import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const GenAIChatScreen = () => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      text: 'Hello! I am your legal assistant. Describe an incident, and I will provide relevant Indian legal information, including applicable IPC sections and potential consequences.',
      sender: 'bot' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const flatListRef = useRef(null);

  // Gemini API configuration
  const GEMINI_API_KEY = 'AIzaSyAGpWWKzH7OOhKKYfw1Pe_9vbDvALf208Q';

  const parseSections = (text) => {
    // Split the text into sections based on headings
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { title: 'Overview', content: [] };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line is a heading (determined by patterns like "Section X:" or uppercase lines)
      if (
        (line.match(/^[A-Z\s]+:/) || 
         line.match(/^[0-9]+\.\s+[A-Z]/) ||
         line.match(/^[A-Z\s]{5,}$/) ||
         line.startsWith("SECTION") ||
         line.startsWith("IPC") ||
         line.startsWith("PENALTIES") ||
         line.startsWith("LEGAL RECOURSE") ||
         line.startsWith("CONSEQUENCES") ||
         (i > 0 && line && !lines[i-1])) && 
        line.length < 100
      ) {
        // If we've been building a section, save it
        if (currentSection.content.length > 0) {
          sections.push({
            id: sections.length.toString(),
            title: currentSection.title,
            content: currentSection.content.join('\n')
          });
        }
        
        // Start a new section
        currentSection = {
          title: line,
          content: []
        };
      } else {
        // Add line to current section
        if (line || currentSection.content.length > 0) {
          currentSection.content.push(line);
        }
      }
    }
    
    // Add the last section
    if (currentSection.content.length > 0) {
      sections.push({
        id: sections.length.toString(),
        title: currentSection.title,
        content: currentSection.content.join('\n')
      });
    }
    
    return sections.length > 1 ? sections : [{ id: '0', title: 'Legal Analysis', content: text }];
  };

  const callGeminiAPI = async (userQuery) => {
    try {
      setIsLoading(true);
      
      // Constructing the prompt for legal analysis
      const prompt = `As a legal expert on Indian law, analyze the following incident and provide information on:
      1. Applicable Indian Penal Code (IPC) sections
      2. Potential legal charges and their explanations
      3. Maximum penalties under these sections
      4. Legal recourse for victims
      5. Consequences if a false case is filed
      
      Incident: ${userQuery}
      
      Format your response with clear section headings for each topic. Be concise but thorough.`;
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        }
      );
      
      if (response.data && 
          response.data.candidates && 
          response.data.candidates[0] && 
          response.data.candidates[0].content && 
          response.data.candidates[0].content.parts) {
        const responseText = response.data.candidates[0].content.parts[0].text;
        return parseSections(responseText);
      } else {
        throw new Error('Unexpected response structure from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      if (error.response) {
        console.error('API response status:', error.response.status);
      }
      return [{ 
        id: '0', 
        title: 'Error', 
        content: "I'm having trouble analyzing this incident. Please try again with more details or contact a legal professional for advice."
      }];
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;

    // Reset expanded sections for new response
    setExpandedSections({});

    // Add user message
    const userMessage = {
      id: String(Date.now()),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    // Add temporary thinking message
    const thinkingMessage = {
      id: String(Date.now() + 1),
      text: "Analyzing the legal implications...",
      sender: 'bot',
      isThinking: true,
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage, thinkingMessage]);
    const currentInputText = inputText;
    setInputText('');

    // Get response from Gemini API
    const sections = await callGeminiAPI(currentInputText);

    // Replace thinking message with actual response
    setMessages(prevMessages => {
      const updatedMessages = prevMessages.filter(msg => !msg.isThinking);
      return [...updatedMessages, {
        id: String(Date.now() + 2),
        sections: sections,
        sender: 'bot',
        timestamp: new Date()
      }];
    });

    // Auto-expand the first section
    if (sections.length > 0) {
      setExpandedSections({ [sections[0].id]: true });
    }
  };

  const renderSectionedMessage = (sections, messageId) => {
    return (
      <View style={styles.sectionedContainer}>
        {sections.map((section, index) => (
          <View key={`${messageId}-${section.id}`} style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection(`${messageId}-${section.id}`)}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <AntDesign 
                name={expandedSections[`${messageId}-${section.id}`] ? "up" : "down"} 
                size={16} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {expandedSections[`${messageId}-${section.id}`] && (
              <Text style={styles.sectionContent}>
                {section.content}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer,
      item.isThinking && styles.thinkingContainer
    ]}>
      {item.isThinking ? (
        <View style={styles.thinkingContent}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.thinkingText}>{item.text}</Text>
        </View>
      ) : item.sections ? (
        // Render sectioned response
        renderSectionedMessage(item.sections, item.id)
      ) : (
        // Render regular text message
        <Text style={[
          styles.messageText,
          item.sender === 'user' ? styles.userMessageText : styles.botMessageText
        ]}>
          {item.text}
        </Text>
      )}
      
      {item.sender === 'bot' && !item.isThinking && (
        <View style={styles.messageFooter}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleCopyText(item.text || getSectionedText(item.sections))}
          >
            <Ionicons name="copy-outline" size={16} color="#666" />
            <Text style={styles.actionButtonText}>Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShareText(item.text || getSectionedText(item.sections))}
          >
            <Ionicons name="share-outline" size={16} color="#666" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getSectionedText = (sections) => {
    if (!sections) return '';
    return sections.map(section => `${section.title}\n\n${section.content}`).join('\n\n');
  };

  const handleCopyText = (text) => {
    // In a real implementation, you would use Clipboard API
    Alert.alert('Copied', 'Legal information copied to clipboard');
  };

  const handleShareText = (text) => {
    // In a real implementation, you would use Share API
    Alert.alert('Share', 'This would open the share dialog');
  };

  const handleConsultLawyer = () => {
    Alert.alert(
      'Consult a Lawyer',
      'Would you like to find legal assistance?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Find Lawyers',
          onPress: () => {
            // This could link to a lawyer directory or service
            Linking.openURL('https://www.legalservicesindia.com/');
          }
        }
      ]
    );
  };

  const handleDisclaimerPress = () => {
    Alert.alert(
      'Legal Disclaimer',
      'The information provided is for general informational purposes only and should not be considered as legal advice. Please consult with a qualified legal professional for advice specific to your situation.',
      [{ text: 'Understood' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal Assistant</Text>
        <TouchableOpacity 
          style={styles.consultButton}
          onPress={handleConsultLawyer}
        >
          <MaterialIcons name="gavel" size={24} color="#FFB5D8" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <TouchableOpacity 
        style={styles.disclaimerContainer}
        onPress={handleDisclaimerPress}
      >
        <Text style={styles.disclaimerText}>
          Disclaimer: This is not professional legal advice
        </Text>
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Describe a legal situation..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={24} color="#FFF" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingTop: 40
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  consultButton: {
    padding: 8,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFB5D8',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
  },
  thinkingContainer: {
    backgroundColor: '#F1F3F4',
  },
  thinkingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thinkingText: {
    marginLeft: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFF',
  },
  botMessageText: {
    color: '#333',
  },
  sectionedContainer: {
    width: '100%',
  },
  section: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  sectionContent: {
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  disclaimerContainer: {
    padding: 8,
    backgroundColor: 'rgba(255, 181, 216, 0.1)',
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#F9F9F9',
  },
  sendButton: {
    backgroundColor: '#FFB5D8',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
});

export default GenAIChatScreen;