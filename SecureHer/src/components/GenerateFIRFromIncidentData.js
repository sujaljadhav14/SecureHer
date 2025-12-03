import axios from 'axios';

// Your Gemini API key - in production, store this in a secure environment variable
const GEMINI_API_KEY = 'AIzaSyDb66Y1MVBDi7RXjHo2BfNN1E-YoRIYKM8';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`;

const generateFIRFromIncidentData = async (incidentData) => {
  try {
    // Create a detailed prompt for Gemini to generate a professional FIR
    const prompt = `
      Generate a professional and formal First Information Report (FIR) based on the following incident details:
      
      Type of Incident: ${incidentData.incidentType}
      Date/Time: ${new Date(incidentData.timestamp).toLocaleString()}
      Location: ${incidentData.location ? incidentData.location.address : 'Unknown location'}
      GPS Coordinates: ${incidentData.location ? `${incidentData.location.latitude}, ${incidentData.location.longitude}` : 'Not available'}
      
      Complainant Statement:
      ${incidentData.description || 'Audio statement provided'}
      
      Evidence:
      - ${incidentData.numImages} photo(s) attached
      ${incidentData.hasAudioStatement ? '- Audio statement recording attached' : ''}
      
      Please format this as a complete FIR with the following sections:
      1. FIR Number and Date
      2. Complainant Information (use placeholder as "Complainant's Name")
      3. Nature of Incident
      4. Time and Date of Incident
      5. Location Details
      6. Detailed Description
      7. Action Requested
      8. Declaration Statement
      
      Make the report detailed, professional, and ready for submission to law enforcement. Use language that is clear, concise, and factual.
    `;

    // Make the API call to Gemini
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the report text from Gemini's response
    const generatedReport = response.data.candidates[0].content.parts[0].text;
    return generatedReport;
  } catch (error) {
    console.error('Error generating FIR with Gemini API:', error);
    throw new Error('Failed to generate the report with AI. Please try again.');
  }
};

export default {
  generateFIRFromIncidentData
};