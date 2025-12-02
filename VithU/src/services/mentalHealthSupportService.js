import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import sentimentAnalysisService from './sentimentAnalysisService';

// API configuration
const GEMINI_API_KEY = 'AIzaSyAiTqNihJFQndM6FbnOTofUnSnd8qxx2qM'; // Replace with your actual API key
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Storage keys
const CHATBOT_HISTORY_KEY = 'mental_health_chat_history';
const RESOURCES_CACHE_KEY = 'mental_health_resources_cache';

class MentalHealthSupportService {
  // Initialize the chatbot with a context-aware greeting
  async initializeChatbot() {
    try {
      // Get user sentiment profile
      const profile = await sentimentAnalysisService.getUserSentimentProfile();
      if (!profile) return this.getDefaultGreeting();
      
      // Get recent interaction history
      const recentInteractions = await sentimentAnalysisService.getRecentInteractions(5);
      
      // Format context for the API
      const recentPostsContext = recentInteractions.map(interaction => 
        `- ${interaction.postData.title}: ${interaction.postData.description || '[No description]'}`
      ).join('\n');
      
      // Prepare common triggers context if available
      const triggersContext = profile.commonTriggers && profile.commonTriggers.length > 0 
        ? `Common triggers detected: ${profile.commonTriggers.join(', ')}` 
        : 'No specific triggers detected';
      
      const prompt = `
        You are a supportive, empathetic AI assistant in the VithU women's safety app. 
        You need to create a warm, supportive greeting message for a user who may be 
        experiencing emotional distress based on their recent activity in the app.
        
        User's sentiment profile:
        - Dominant sentiment: ${profile.dominantSentiment}
        - Concern level (0-10): ${profile.concernLevel}
        - ${triggersContext}
        
        Recent posts and interactions:
        ${recentPostsContext || 'No recent interactions available'}
        
        Please generate a short, empathetic greeting that acknowledges their feelings 
        without being overly alarming or clinical. The tone should be warm, supportive, 
        and encouraging. Do not specifically mention their sentiment analysis results.
        
        The greeting should be 2-3 sentences maximum.
      `;
      
      // Make API request to Gemini
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract the greeting from the response
      const greeting = response.data.candidates[0].content.parts[0].text.trim();
      
      // Initialize chat history with this greeting
      await this.saveMessage('system', greeting);
      
      return greeting;
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      return this.getDefaultGreeting();
    }
  }
  
  // Get default greeting if API call fails
  getDefaultGreeting() {
    const greetings = [
      "Hi there! How are you feeling today? I'm here to chat if you need someone to talk to.",
      "Hello! I'm your supportive companion in the app. How can I help you today?",
      "Welcome to the chat support! I'm here to listen and help however I can."
    ];
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.saveMessage('system', greeting);
    return greeting;
  }
  
  // Send user message and get response
  async sendMessage(userMessage) {
    try {
      // Save user message to history
      await this.saveMessage('user', userMessage);
      
      // Get chat history
      const chatHistory = await this.getChatHistory();
      // Format recent messages (last 6) for context
      const recentMessages = chatHistory.slice(-6).map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.message}`
      ).join('\n');
      
      // Get user sentiment profile
      const profile = await sentimentAnalysisService.getUserSentimentProfile();
      
      // Get recent interactions for context
      const recentInteractions = await sentimentAnalysisService.getRecentInteractions(3);
      const interactionsContext = recentInteractions.map(interaction => 
        `- ${interaction.interactionType === 'like' ? 'Liked' : 'Commented on'} post: "${interaction.postData.title}"`
      ).join('\n');
      
      // Format prompt for the API
      const prompt = `
        You are a supportive, empathetic AI assistant in the VithU women's safety app.
        Your role is to provide emotional support, practical coping strategies, and connect 
        users with appropriate resources when needed.
        
        User's sentiment profile:
        - Dominant sentiment: ${profile ? profile.dominantSentiment : 'unknown'}
        - Concern level (0-10): ${profile ? profile.concernLevel : 'unknown'}
        ${profile && profile.commonTriggers && profile.commonTriggers.length > 0 
          ? `- Common triggers: ${profile.commonTriggers.join(', ')}` 
          : ''}
        
        Recent user app activity:
        ${interactionsContext || 'No recent activity data available'}
        
        Recent conversation:
        ${recentMessages}
        
        Guidelines:
        - Be empathetic, warm, and supportive
        - Offer practical coping strategies when appropriate
        - For severe distress, suggest professional help
        - Be conversational and friendly, not clinical or robotic
        - Responses should be concise (3-4 sentences max)
        - If the user mentions immediate danger, advise them to call emergency services
        - Address the content of their message directly
        - Be culturally aware of Indian context
        
        User's latest message: ${userMessage}
        
        Respond to the user in a helpful, supportive way:
      `;
      
      // Make API request to Gemini
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract the response from the API
      const botResponse = response.data.candidates[0].content.parts[0].text.trim();
      
      // Save bot response to history
      await this.saveMessage('system', botResponse);
      
      return botResponse;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      const fallbackResponse = "I'm having trouble connecting right now. Please try again in a moment, or reach out to someone you trust if you need immediate support.";
      await this.saveMessage('system', fallbackResponse);
      return fallbackResponse;
    }
  }
  
  // Save message to chat history
  async saveMessage(sender, message) {
    try {
      const historyData = await AsyncStorage.getItem(CHATBOT_HISTORY_KEY);
      const chatHistory = historyData ? JSON.parse(historyData) : [];
      
      chatHistory.push({
        id: Date.now().toString(),
        sender,
        message,
        timestamp: new Date().toISOString()
      });
      
      // Keep only the most recent 50 messages
      const updatedHistory = chatHistory.slice(-50);
      
      await AsyncStorage.setItem(CHATBOT_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving message to chat history:', error);
    }
  }
  
  // Get chat history
  async getChatHistory() {
    try {
      const historyData = await AsyncStorage.getItem(CHATBOT_HISTORY_KEY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }
  
  // Clear chat history
  async clearChatHistory() {
    try {
      await AsyncStorage.removeItem(CHATBOT_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }
  
  // Get mental health resources based on user's sentiment profile
  async getMentalHealthResources() {
    try {
      // Check if we have cached resources
      const cachedData = await AsyncStorage.getItem(RESOURCES_CACHE_KEY);
      const cachedResources = cachedData ? JSON.parse(cachedData) : null;
      
      // Use cached resources if available and less than 7 days old
      if (cachedResources && cachedResources.timestamp) {
        const cacheAge = Date.now() - new Date(cachedResources.timestamp).getTime();
        const cacheDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        if (cacheAge < cacheDuration) {
          return cachedResources.resources;
        }
      }
      
      // Get user sentiment profile
      const profile = await sentimentAnalysisService.getUserSentimentProfile();
      
      // Format prompt for the API
      const promptContext = profile && profile.commonTriggers && profile.commonTriggers.length > 0
        ? `Pay special attention to resources related to: ${profile.commonTriggers.join(', ')}`
        : 'Provide general mental health and safety resources';
      
      const prompt = `
        Generate a list of mental health and safety resources for a woman in India with the following sentiment profile:
        - Dominant sentiment: ${profile ? profile.dominantSentiment : 'neutral'}
        - Concern level (0-10): ${profile ? profile.concernLevel : '3'}
        - ${promptContext}
        
        Return ONLY a JSON array of 5 resources with the following structure:
        [
          {
            "name": "Resource Name",
            "description": "Brief description",
            "contactInfo": "Phone number or website",
            "type": "hotline/app/website/organization"
          }
        ]
        
        Include resources specific to India. Focus on women's mental health and safety resources.
        Include both national resources and digital resources that anyone in India can access.
        Ensure all contact information is accurate for resources in India.
      `;
      
      // Make API request to Gemini
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract and parse the resources from the response
      const resourcesText = response.data.candidates[0].content.parts[0].text;
      const jsonMatch = resourcesText.match(/\[\s*\{.*\}\s*\]/s);
      
      let resources = [];
      if (jsonMatch) {
        resources = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback resources if parsing fails
        resources = [
          {
            name: "NIMHANS Helpline",
            description: "National mental health support helpline",
            contactInfo: "080-26995299",
            type: "hotline"
          },
          {
            name: "Aasra",
            description: "24/7 Helpline for people in emotional distress",
            contactInfo: "91-9820466726",
            type: "hotline"
          },
          {
            name: "Women Helpline India",
            description: "National helpline for women in distress",
            contactInfo: "1091",
            type: "hotline"
          },
          {
            name: "Sneha Foundation",
            description: "Suicide prevention and mental health support",
            contactInfo: "91-44-24640050",
            type: "organization"
          },
          {
            name: "Your Dost",
            description: "Online counseling and emotional wellness platform",
            contactInfo: "www.yourdost.com",
            type: "website"
          }
        ];
      }
      
      // Cache the resources
      await AsyncStorage.setItem(RESOURCES_CACHE_KEY, JSON.stringify({
        resources,
        timestamp: new Date().toISOString()
      }));
      
      return resources;
    } catch (error) {
      console.error('Error getting mental health resources:', error);
      
      // Return fallback resources
      return [
        {
          name: "NIMHANS Helpline",
          description: "National mental health support helpline",
          contactInfo: "080-26995299",
          type: "hotline"
        },
        {
          name: "Aasra",
          description: "24/7 Helpline for people in emotional distress",
          contactInfo: "91-9820466726",
          type: "hotline"
        },
        {
          name: "Women Helpline India",
          description: "National helpline for women in distress",
          contactInfo: "1091",
          type: "hotline"
        }
      ];
    }
  }
  
  // Check if the chatbot should be triggered based on user's sentiment
  async shouldTriggerChatbot() {
    try {
      const profile = await sentimentAnalysisService.getUserSentimentProfile();
      if (!profile) return false;
      
      // Trigger conditions
      return profile.concernLevel >= 7 || profile.dominantSentiment === 'concerning';
    } catch (error) {
      console.error('Error checking if chatbot should be triggered:', error);
      return false;
    }
  }
}

export default new MentalHealthSupportService();