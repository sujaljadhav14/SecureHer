import axios from 'axios';

// Gemini API key
const GEMINI_API_KEY = 'AIzaSyDb66Y1MVBDi7RXjHo2BfNN1E-YoRIYKM8';
// Use the model you specified in the curl example
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Generates a professional FIR report based on incident data using Gemini API
 */
const generateFIRFromIncidentData = async (incidentData) => {
  try {
    console.log('Preparing to call Gemini API...');
    
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

    console.log('Sending request to Gemini API...');
    
    // Make the API call to Gemini with proper format
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
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('Gemini API response received');
    
    // Check if we have a valid response with candidates
    if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
      console.error('Invalid Gemini API response structure:', response.data);
      throw new Error('Received invalid response from AI service');
    }
    
    // Extract the report text from Gemini's response
    const generatedReport = response.data.candidates[0].content.parts[0].text;
    
    console.log('Successfully generated FIR with Gemini API');
    return generatedReport;
  } catch (error) {
    // Detailed error logging
    console.error('Error generating FIR with Gemini API:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Gemini API error response:', error.response.data);
      console.error('Gemini API error status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Gemini API no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Gemini API request setup error:', error.message);
    }
    
    throw new Error('Failed to generate the report with AI. Please try again.');
  }
};

/**
 * Alternative implementation using a different model version (fallback)
 */
const generateFIRWithAlternativeModel = async (incidentData) => {
  try {
    // Use a different model as fallback
    const alternativeApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`;
    
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
    `;

    // Make the API call to the alternative Gemini model
    const response = await axios.post(
      alternativeApiUrl,
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
        },
        timeout: 30000
      }
    );
    
    // Extract the report text from Gemini's response
    const generatedReport = response.data.candidates[0].content.parts[0].text;
    return generatedReport;
  } catch (error) {
    console.error('Error using alternative Gemini model:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * Function to generate a local report without using the API (ultimate fallback)
 */
const generateLocalReport = (incidentData) => {
  const currentDate = new Date();
  const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
  const firNumber = `FIR${Math.floor(100000 + Math.random() * 900000)}`;
  
  const locationText = incidentData.location 
    ? `${incidentData.location.address} (${incidentData.location.latitude.toFixed(6)}, ${incidentData.location.longitude.toFixed(6)})`
    : 'Location not available';
  
  // Create a more detailed description based on the incident type
  let actionRequest = '';
  switch (incidentData.incidentType.toLowerCase()) {
    case 'harassment':
      actionRequest = 'I request the appropriate authorities to investigate this harassment incident, identify the perpetrator(s), and take necessary legal action under applicable harassment statutes, including the Protection of Women from Harassment Act.';
      break;
    case 'stalking':
      actionRequest = 'I request immediate investigation of this stalking incident and enforcement of appropriate restraining/protection orders. The persistent nature of this behavior poses a significant safety risk and warrants urgent attention under anti-stalking laws.';
      break;
    case 'assault':
      actionRequest = 'I request immediate investigation of this assault incident, identification and apprehension of the perpetrator(s), and prosecution to the fullest extent under applicable laws including sections related to physical assault and battery.';
      break;
    case 'theft':
      actionRequest = 'I request thorough investigation of this theft incident, recovery of stolen property if possible, and identification and prosecution of those responsible under the relevant sections of the criminal code related to theft and larceny.';
      break;
    case 'domestic violence':
      actionRequest = 'I request urgent intervention in this domestic violence incident, enforcement of protection orders if applicable, and prosecution of the perpetrator(s) under domestic violence laws. I also request information on victim support services and safe housing options.';
      break;
    case 'public misconduct':
      actionRequest = 'I request investigation of this public misconduct incident and appropriate legal action against those responsible for violating public conduct regulations and potentially creating an unsafe environment.';
      break;
    case 'threat':
      actionRequest = 'I request immediate assessment of the threat level in this incident, appropriate protection measures, and legal action against those making threats under applicable criminal laws regarding intimidation and threatening behavior.';
      break;
    default:
      actionRequest = 'I request the appropriate authorities to investigate this matter and take necessary legal action against the perpetrator(s) involved in this incident.';
  }
  
  return `
FIRST INFORMATION REPORT (FIR)
==============================
FIR Number: ${firNumber}
Date Filed: ${formattedDate}

COMPLAINANT INFORMATION:
-----------------------
Name: [Complainant's Name]
Contact: [Registered Mobile Number]
ID Type: [ID Type]
ID Number: [ID Number]

NATURE OF INCIDENT:
-----------------
Type: ${incidentData.incidentType.toUpperCase()}
Severity: To be determined by investigating officer
Case Category: Women's Safety Incident

INCIDENT DETAILS:
---------------
Date: ${new Date(incidentData.timestamp).toLocaleDateString()}
Time: ${new Date(incidentData.timestamp).toLocaleTimeString()}
Location: ${locationText}

DETAILED DESCRIPTION:
------------------
${incidentData.description || 'Audio statement provided (transcription pending)'}

EVIDENCE ATTACHED:
----------------
- ${incidentData.numImages} photograph(s)${incidentData.numImages > 0 ? ' (digital files available upon request)' : ''}
${incidentData.hasAudioStatement ? '- Audio statement recording (digital file available upon request)' : ''}
${incidentData.hasAudioStatement ? '- Transcript of audio statement pending' : ''}

WITNESSES:
--------
[To be provided if available]

ACTION REQUESTED:
--------------
${actionRequest}

DECLARATION:
----------
I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. I understand that filing a false report is a punishable offense.

________________________
Signature of Complainant

Date: ${new Date().toLocaleDateString()}

FOR OFFICIAL USE ONLY:
-------------------
Received by: [Officer Name]
Rank: [Officer Rank]
Badge Number: [Badge Number]
Police Station: [Station Name]
Date & Time Received: [Receipt Date and Time]

[This FIR was generated through the Women's Safety App and requires official submission to law enforcement]
`.trim();
};

// Export all the functions
export default {
  generateFIRFromIncidentData,
  generateFIRWithAlternativeModel,
  generateLocalReport
};