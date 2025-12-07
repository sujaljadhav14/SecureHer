# SecureHer - Women's Safety Mobile Application
![1](https://github.com/user-attachments/assets/2c5baea5-d739-4149-8105-52aadbe61e91)

![2](https://github.com/user-attachments/assets/ce87d00d-ef68-4505-8f88-47de702caee2)

![3](https://github.com/user-attachments/assets/312af847-c542-464f-a92d-fe8e22a57982)



## Overview

SecureHer is a comprehensive women's safety mobile application designed to provide peace of mind and practical safety tools. The app combines real-time location tracking, emergency alerts, community support, and resources for personal development and empowerment.

## Features


![4](https://github.com/user-attachments/assets/be0d083e-fe7f-43d8-90e1-28e43ce45226)

![5](https://github.com/user-attachments/assets/07623c1d-efb7-48d2-9327-4dea35152fd8)

![6](https://github.com/user-attachments/assets/2829e8ce-b62f-43d7-840a-98256154951a)



### Safety Features
- **SOS Emergency Alert**: Quickly send distress signals with your location to emergency contacts
- **Journey Tracker**: Share your travel routes with trusted contacts and get safety-optimized paths
- **Fake Call**: Simulate incoming calls to help in uncomfortable situations
- **Close Contacts Management**: Add and manage trusted contacts for emergency situations
- **Location Sharing**: Easily share your real-time location with selected contacts
- **Police & Hospital Finder**: Quickly locate and navigate to nearby police stations and hospitals

### Incident Reporting & Support
- **Incident Reports**: File detailed incident reports with photo and audio evidence
- **Report Management**: Track, manage and share your incident reports
- **Legal Assistant**: Get AI-powered information about legal rights and procedures
- **Mental Health Support**: Access an AI chatbot for emotional support and mental well-being

### Community & Empowerment
- **Community Forum**: Connect with others, share experiences, and get safety tips
- **Women Empowerment Resources**: Access courses and resources for skill development
- **Financial Planning Tools**: Budget planner and investment guides tailored for women
- **Educational Resources**: Courses and learning paths for personal and professional growth

## Technical Architecture

### Front-end
- React Native (Expo)
- React Navigation for screen management
- AsyncStorage for local data persistence
- Location and Maps integration
- Expo modules for camera, audio, and contacts

### Back-end
- Node.js REST API
- MongoDB for data storage
- JWT for authentication
- Google Maps API integration
- Gemini AI for the legal assistant and mental health support

### Key Screens
- **Home**: Dashboard with quick access to core features
- **SOS**: Emergency alert system with contact notifications
- **Journey Tracker**: Real-time journey monitoring with safety analysis
- **Community**: Social platform for sharing experiences and safety tips
- **Incident Reports**: System for detailed documentation of incidents
- **Empowerment**: Educational resources and financial planning tools

## Getting Started

### Prerequisites
- Node.js (v14 or newer)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/SecureHer-app.git
cd SecureHer-app
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
expo start
```

4. Run on device or simulator
- Press `a` for Android
- Press `i` for iOS

### Environment Setup

Create a `.env` file in the project root with:
```
API_BASE_URL=https://womensafety-1-5znp.onrender.com
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## API Integration

The app integrates with several APIs:
- Google Maps Platform (Places, Directions, Geocoding)
- Custom safety route analysis API
- Sentiment analysis for mental health support
- Location-based safety data

## Future Enhancements

- Real-time video sharing during emergencies
- Integration with local police reporting systems
- Advanced voice commands for hands-free operation
- Expanded multilingual support
- Offline mode for core safety features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Special thanks to all contributors and partners
- Inspired by women's safety initiatives worldwide
- Built with guidance from safety experts and women's rights advocates
