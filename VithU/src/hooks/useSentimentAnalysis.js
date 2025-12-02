import { useState } from 'react';
import sentimentAnalysisService from '../services/sentimentAnalysisService';
import mentalHealthSupportService from '../services/mentalHealthSupportService';

/**
 * Custom hook for integrating sentiment analysis into post creation
 */
const useSentimentAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [tagConsistency, setTagConsistency] = useState(true);
  const [needsSupport, setNeedsSupport] = useState(false);

  /**
   * Analyze post content
   * @param {object} postContent - Object containing title, description, and tags
   * @returns {Promise<object>} - Sentiment analysis result
   */
  const analyzePost = async (postContent) => {
    if (!postContent || !postContent.title) return null;
    
    setAnalyzing(true);
    try {
      const result = await sentimentAnalysisService.analyzePostSentiment(postContent);
      setAnalysis(result);
      
      // Check tag consistency only if the post has tags
      if (postContent.tags && postContent.tags.length > 0) {
        const isConsistent = sentimentAnalysisService.checkTagConsistency(
          result, 
          typeof postContent.tags === 'string' ? postContent.tags.split(',') : postContent.tags
        );
        setTagConsistency(isConsistent);
      } else {
        setTagConsistency(true);
      }
      
      // Check if mental health support should be triggered
      if (result.concernLevel > 6 || result.sentiment === 'concerning') {
        setNeedsSupport(true);
      }
      
      return result;
    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      setTagConsistency(true); // Default to true in case of error
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Get suggested tags based on sentiment analysis
   * @returns {array} - Array of suggested tags
   */
  const getSuggestedTags = () => {
    if (!analysis || !analysis.suggestedTags) return [];
    return analysis.suggestedTags;
  };

  /**
   * Record a user interaction with a post
   * @param {string} postId - ID of the post
   * @param {object} postData - Post data (title, description, tags)
   * @param {string} interactionType - Type of interaction ('like' or 'comment')
   */
  const recordInteraction = async (postId, postData, interactionType) => {
    await sentimentAnalysisService.recordInteraction(postId, postData, interactionType);
    
    // Check if support should be offered after interaction
    const shouldOffer = await mentalHealthSupportService.shouldTriggerChatbot();
    setNeedsSupport(shouldOffer);
  };

  /**
   * Check if mental health support should be triggered based on sentiment
   * @returns {Promise<boolean>} - Whether support should be triggered
   */
  const shouldTriggerSupport = async () => {
    const shouldOffer = await mentalHealthSupportService.shouldTriggerChatbot();
    setNeedsSupport(shouldOffer);
    return shouldOffer;
  };

  /**
   * Get mental health resources for the user
   * @returns {Promise<Array>} - Array of mental health resources
   */
  const getMentalHealthResources = async () => {
    return await mentalHealthSupportService.getMentalHealthResources();
  };

  /**
   * Initialize the mental health chatbot
   * @returns {Promise<string>} - Initial greeting message
   */
  const initializeChatbot = async () => {
    return await mentalHealthSupportService.initializeChatbot();
  };

  /**
   * Send message to the mental health chatbot
   * @param {string} message - User message
   * @returns {Promise<string>} - Chatbot response
   */
  const sendChatbotMessage = async (message) => {
    return await mentalHealthSupportService.sendMessage(message);
  };

  /**
   * Reset the current sentiment analysis state
   */
  const resetAnalysis = () => {
    setAnalysis(null);
    setTagConsistency(true);
    setNeedsSupport(false);
  };

  return {
    analyzing,
    analysis,
    tagConsistency,
    needsSupport,
    analyzePost,
    getSuggestedTags,
    recordInteraction,
    shouldTriggerSupport,
    getMentalHealthResources,
    initializeChatbot,
    sendChatbotMessage,
    resetAnalysis
  };
};

export default useSentimentAnalysis;