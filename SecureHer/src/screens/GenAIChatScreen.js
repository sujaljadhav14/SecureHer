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
  const GEMINI_API_KEY = 'AIzaSyBCvrEBUXIm6hSg61SRMpvDQhcbpAOjXjM';

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
      
      // Provide smart fallback responses based on query keywords
      return getFallbackResponse(userQuery);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Detect common legal scenarios and provide relevant responses
    if (lowerQuery.match(/theft|steal|stole|stolen|robbery|rob/)) {
      return [
        { id: '0', title: 'APPLICABLE IPC SECTIONS', content: 'IPC Section 378: Theft\nIPC Section 379: Punishment for theft (up to 3 years imprisonment and/or fine)\nIPC Section 380: Theft in dwelling house (up to 7 years imprisonment and fine)' },
        { id: '1', title: 'LEGAL RECOURSE', content: '1. File FIR at nearest police station\n2. Provide evidence (CCTV, witnesses)\n3. Claim insurance if applicable\n4. Seek legal counsel for prosecution' },
        { id: '2', title: 'NOTE', content: 'This is a fallback response. For detailed legal advice, please consult a lawyer or try again later when API is available.' }
      ];
    }
    
    if (lowerQuery.match(/assault|attack|hit|beat|violence|hurt/)) {
      return [
        { id: '0', title: 'APPLICABLE IPC SECTIONS', content: 'IPC Section 323: Voluntarily causing hurt (up to 1 year imprisonment)\nIPC Section 325: Voluntarily causing grievous hurt (up to 7 years imprisonment)\nIPC Section 351: Assault (up to 3 months imprisonment)' },
        { id: '1', title: 'LEGAL RECOURSE', content: '1. Seek immediate medical attention\n2. File FIR with medical reports\n3. Preserve evidence (photos, witnesses)\n4. Consider protection orders if domestic violence' },
        { id: '2', title: 'NOTE', content: 'This is a fallback response. For detailed legal advice, please consult a lawyer or try again later when API is available.' }
      ];
    }
    
    if (lowerQuery.match(/harassment|harass|stalk|eve.teas/)) {
      return [
        { id: '0', title: 'APPLICABLE IPC SECTIONS', content: 'IPC Section 354A: Sexual harassment (up to 3 years imprisonment and fine)\nIPC Section 354D: Stalking (up to 5 years imprisonment for repeat offenders)\nIPC Section 509: Words, gestures to insult modesty of women (up to 3 years)' },
        { id: '1', title: 'LEGAL RECOURSE', content: '1. Document all incidents with dates/times\n2. File written complaint at police station\n3. Seek protection order\n4. Contact local women\'s helpline (1091)' },
        { id: '2', title: 'NOTE', content: 'This is a fallback response. For detailed legal advice, please consult a lawyer or try again later when API is available.' }
      ];
    }
    
    // Default fallback
    return [
      { 
        id: '0', 
        title: 'Service Temporarily Unavailable', 
        content: 'I\'m currently unable to process your legal query due to API limitations.\n\nPlease try:\n1. Describing your situation more specifically\n2. Trying again in 24 hours\n3. Consulting local police or legal aid services\n4. Calling National Women Helpline: 1091'
      },
      {
        id: '1',
        title: 'Emergency Resources',
        content: 'Women Helpline: 1091\nPolice: 100\nAmbulance: 102\nLegal Services Authority: www.nalsa.gov.in'
      }
    ];
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