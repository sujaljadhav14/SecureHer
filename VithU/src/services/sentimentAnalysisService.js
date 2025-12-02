import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const SENTIMENT_SCORES_KEY = 'user_sentiment_scores';
const INTERACTION_HISTORY_KEY = 'user_interaction_history';
const GEMINI_API_KEY = 'AIzaSyAiTqNihJFQndM6FbnOTofUnSnd8qxx2qM'; // Replace with your actual API key
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

class SentimentAnalysisService {
  // Analyze sentiment of post content
  async analyzePostSentiment(postContent) {
    try {
      const { title, description, tags } = postContent;
      
      // Format prompt for Gemini API
      const prompt = `
        Analyze the sentiment of the following social media post from a women's safety app. 
        Classify the overall sentiment as one of: 'positive', 'negative', 'neutral', 'concerning'.
        
        If the post contains any content related to:
        - Mental health issues or distress
        - Self-harm or suicidal ideation
        - Safety concerns or feeling unsafe
        - Harassment or abuse
        
        Then classify it as 'concerning' with an appropriate concern level.
        
        Post Title: ${title}
        Post Description: ${description || 'No description provided'}
        Post Tags: ${tags ? (typeof tags === 'string' ? tags : tags.join(', ')) : 'No tags provided'}
        
        Return ONLY a JSON object with the following structure:
        {
          "sentiment": "positive/negative/neutral/concerning",
          "confidenceScore": 0-1,
          "emotionalTone": ["emotion1", "emotion2"],
          "concernLevel": 0-10,
          "suggestedTags": ["tag1", "tag2", "tag3"],
          "contentTriggers": ["trigger1", "trigger2"]
        }
        
        Where:
        - emotionalTone lists the detected emotions (e.g., "happy", "anxious", "fearful")
        - concernLevel ranges from 0 (no concern) to 10 (highest concern)
        - suggestedTags are 3-5 relevant hashtags for this content
        - contentTriggers lists any specific triggers detected (e.g., "self-harm", "harassment")
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
      
      // Extract and parse the analysis from the response
      const analysisText = response.data.candidates[0].content.parts[0].text;
      const jsonMatch = analysisText.match(/{[\s\S]*}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      // Update user's sentiment profile with this analysis
      if (analysis) {
        await this.updateSentimentScore(analysis, 1.0); // Full weight for user's own posts
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing post sentiment:', error);
      // Return a default neutral sentiment if analysis fails
      return {
        sentiment: 'neutral',
        confidenceScore: 0.5,
        emotionalTone: ['neutral'],
        concernLevel: 0,
        suggestedTags: [],
        contentTriggers: []
      };
    }
  }
  
  // Check if provided tags match the sentiment analysis
  checkTagConsistency(analysis, userTags) {
    if (!analysis || !userTags || userTags.length === 0) return true;
    
    // Convert user tags to lowercase for comparison
    const normalizedUserTags = userTags.map(tag => tag.toLowerCase());
    
    // Check if any suggested tags from the analysis match user tags
    const hasCommonTags = analysis.suggestedTags.some(tag => 
      normalizedUserTags.includes(tag.toLowerCase())
    );
    
    // If sentiment is concerning but no relevant tags are used, flag inconsistency
    if ((analysis.sentiment === 'concerning' || analysis.concernLevel > 5) && !hasCommonTags) {
      return false;
    }
    
    return true;
  }
  
  // Get tag suggestions based on sentiment analysis
  getSuggestedTags(analysis) {
    if (!analysis || !analysis.suggestedTags) return [];
    return analysis.suggestedTags;
  }
  
  // Record interaction with a post (liking, commenting)
  async recordInteraction(postId, postData, interactionType) {
    try {
      // Get existing interaction history
      const historyData = await AsyncStorage.getItem(INTERACTION_HISTORY_KEY);
      const interactionHistory = historyData ? JSON.parse(historyData) : [];
      
      // Add new interaction with timestamp
      interactionHistory.push({
        postId,
        postData: {
          title: postData.title,
          description: postData.description || '',
          tags: postData.tags || []
        },
        interactionType, // 'like' or 'comment'
        timestamp: new Date().toISOString()
      });
      
      // Keep only the most recent 50 interactions
      const updatedHistory = interactionHistory.slice(-50);
      
      // Save updated history
      await AsyncStorage.setItem(INTERACTION_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      // Analyze the post content if it's a significant interaction
      if (interactionType === 'comment') {
        const analysis = await this.analyzePostSentiment({
          title: postData.title,
          description: postData.description || '',
          tags: postData.tags || []
        });
        
        // Update user sentiment score with lower weight for comment interaction
        await this.updateSentimentScore(analysis, 0.7);
      } else if (interactionType === 'like') {
        // Lighter analysis for likes
        const analysis = await this.analyzePostSentiment({
          title: postData.title,
          description: postData.description || '',
          tags: postData.tags || []
        });
        
        // Update with even lower weight for like interaction
        await this.updateSentimentScore(analysis, 0.3);
      }
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }
  
  // Update the user's sentiment score
  async updateSentimentScore(analysis, weight = 1.0) {
    try {
      if (!analysis) return false;
      
      // Get existing sentiment scores
      const scoresData = await AsyncStorage.getItem(SENTIMENT_SCORES_KEY);
      const sentimentScores = scoresData ? JSON.parse(scoresData) : {
        positive: 0,
        negative: 0,
        neutral: 0,
        concerning: 0,
        totalInteractions: 0,
        lastUpdated: null,
        recentTriggers: []
      };
      
      // Apply decay factor to existing scores (give more weight to recent interactions)
      const decayFactor = 0.95;
      sentimentScores.positive *= decayFactor;
      sentimentScores.negative *= decayFactor;
      sentimentScores.neutral *= decayFactor;
      sentimentScores.concerning *= decayFactor;
      
      // Update the appropriate sentiment category
      sentimentScores[analysis.sentiment] += weight * analysis.confidenceScore;
      sentimentScores.totalInteractions += 1;
      sentimentScores.lastUpdated = new Date().toISOString();
      
      // Track content triggers if present
      if (analysis.contentTriggers && analysis.contentTriggers.length > 0) {
        const recentTriggers = sentimentScores.recentTriggers || [];
        
        // Add new triggers with timestamp
        analysis.contentTriggers.forEach(trigger => {
          recentTriggers.push({
            trigger,
            timestamp: new Date().toISOString(),
            weight: weight * analysis.confidenceScore
          });
        });
        
        // Keep only recent triggers (last 2 weeks)
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        sentimentScores.recentTriggers = recentTriggers
          .filter(item => new Date(item.timestamp) > twoWeeksAgo)
          .slice(-20); // Keep max 20 triggers
      }
      
      // Save updated scores
      await AsyncStorage.setItem(SENTIMENT_SCORES_KEY, JSON.stringify(sentimentScores));
      
      // Check if we should trigger mental health support
      return this.checkSentimentThresholds(sentimentScores);
    } catch (error) {
      console.error('Error updating sentiment score:', error);
      return false;
    }
  }
  
  // Check if sentiment scores cross concerning thresholds
  checkSentimentThresholds(scores) {
    if (!scores) return false;
    
    // Calculate ratios
    const total = scores.positive + scores.negative + scores.neutral + scores.concerning;
    if (total === 0) return false;
    
    const concerningRatio = scores.concerning / total;
    const negativeRatio = scores.negative / total;
    
    // Check for repeated triggers in recent content
    let hasDangerousTriggers = false;
    let triggerFrequency = {};
    
    if (scores.recentTriggers && scores.recentTriggers.length > 0) {
      // Count trigger occurrences
      scores.recentTriggers.forEach(item => {
        triggerFrequency[item.trigger] = (triggerFrequency[item.trigger] || 0) + 1;
      });
      
      // Check if any dangerous triggers appear multiple times
      const dangerousTriggers = ['self-harm', 'suicide', 'abuse', 'assault', 'violence'];
      hasDangerousTriggers = dangerousTriggers.some(trigger => 
        triggerFrequency[trigger] && triggerFrequency[trigger] >= 2
      );
    }
    
    // Thresholds that might indicate a need for support
    const shouldTriggerSupport = 
      (concerningRatio > 0.3) || // More than 30% concerning content
      (negativeRatio > 0.6) || // More than 60% negative content
      (scores.concerning > 5) || // Absolute threshold for concerning content
      hasDangerousTriggers; // Repeated mentions of dangerous triggers
    
    return shouldTriggerSupport;
  }
  
  // Get the user's current sentiment profile
  async getUserSentimentProfile() {
    try {
      const scoresData = await AsyncStorage.getItem(SENTIMENT_SCORES_KEY);
      if (!scoresData) return null;
      
      const scores = JSON.parse(scoresData);
      const total = scores.positive + scores.negative + scores.neutral + scores.concerning;
      
      if (total === 0) return {
        dominantSentiment: 'neutral',
        concernLevel: 0,
        recentTriggers: []
      };
      
      // Calculate proportions
      const proportions = {
        positive: scores.positive / total,
        negative: scores.negative / total,
        neutral: scores.neutral / total,
        concerning: scores.concerning / total
      };
      
      // Determine dominant sentiment
      let dominantSentiment = 'neutral';
      let maxProportion = 0;
      
      for (const [sentiment, proportion] of Object.entries(proportions)) {
        if (proportion > maxProportion) {
          maxProportion = proportion;
          dominantSentiment = sentiment;
        }
      }
      
      // Calculate concern level (0-10)
      const concernLevel = Math.min(10, Math.round(
        (proportions.concerning * 7 + proportions.negative * 3) * 10
      ));
      
      // Analyze recent triggers
      let commonTriggers = [];
      if (scores.recentTriggers && scores.recentTriggers.length > 0) {
        // Count trigger occurrences
        let triggerFrequency = {};
        scores.recentTriggers.forEach(item => {
          triggerFrequency[item.trigger] = (triggerFrequency[item.trigger] || 0) + item.weight;
        });
        
        // Get the top triggers
        commonTriggers = Object.entries(triggerFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(item => item[0]);
      }
      
      return {
        dominantSentiment,
        concernLevel,
        proportions,
        commonTriggers,
        totalInteractions: scores.totalInteractions,
        lastUpdated: scores.lastUpdated
      };
    } catch (error) {
      console.error('Error getting user sentiment profile:', error);
      return null;
    }
  }
  
  // Get recent user interaction history
  async getRecentInteractions(limit = 5) {
    try {
      const historyData = await AsyncStorage.getItem(INTERACTION_HISTORY_KEY);
      if (!historyData) return [];
      
      const history = JSON.parse(historyData);
      // Return most recent interactions
      return history.slice(-limit);
    } catch (error) {
      console.error('Error getting recent interactions:', error);
      return [];
    }
    
  }
  
  // Reset sentiment scores (for testing or user opt-out)
  async resetSentimentScores() {
    try {
      await AsyncStorage.removeItem(SENTIMENT_SCORES_KEY);
      console.log('Sentiment scores reset successfully');
    } catch (error) {
      console.error('Error resetting sentiment scores:', error);
    }
  }
}

export default new SentimentAnalysisService();