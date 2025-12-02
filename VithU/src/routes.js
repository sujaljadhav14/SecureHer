// routes.js
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import { SignupScreen, PhoneVerificationScreen, CreatePinScreen, UserInfoScreen } from './screens/SignupScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import PoliceStationFinder from './screens/PoliceStationFinder';
import HospitalFinder from './screens/HospitalFinder';
import CloseContactsScreen from './screens/CloseContactsScreen';
import JourneyTracker from './screens/JourneyTracker';
import ProfileScreen from './screens/ProfileScreen';
import CommunityScreen from './screens/CommunityScreen';
import MyPostsScreen from './screens/MyPosts';
import GenAIChatScreen from './screens/GenAIChatScreen';
import WomenEmpowermentScreen from './screens/WomenEmpowermentScreen';
import BudgetPlannerScreen from './screens/BudgetPlannerScreen';
import FinancialGoalsScreen from './screens/FinancialGoalsScreen';
import InvestmentGuideScreen from './screens/InvestmentGuideScreen';
import MetalRatesScreen from './screens/MetalRatesScreen';
import FinancialArticlesScreen from './screens/FinancialArticlesScreen';
import CourseDetailsScreen from './screens/CourseDetailsScreen';
import LearningPathScreen from './screens/LearningPathScreen';
import SkillDevelopmentScreen from './screens/SkillDevelopmentScreen';
import FakeCallScreen from './screens/FakeCallScreen';
import MentalHealthChat from './screens/MentalHealthScreen';
import SOSScreen from './screens/SOSScreen';
import IncidentReportScreen from './screens/IncidentReportScreen';
import ReportsHistoryScreen from './screens/ReportsHistoryScreen';
import ReportDetailScreen from './screens/ReportDetailScreen'

const Stack = createStackNavigator();

export const Routes = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <Stack.Screen name="CreatePin" component={CreatePinScreen} />
      <Stack.Screen name="UserInfo" component={UserInfoScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="PoliceStationFinder" component={PoliceStationFinder} />
      <Stack.Screen name="HospitalFinder" component={HospitalFinder} />
      <Stack.Screen name="CloseContacts" component={CloseContactsScreen} />
      <Stack.Screen name="JourneyTracker" component={JourneyTracker} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="GenAIChat" component={GenAIChatScreen} />
      <Stack.Screen name="WomenEmpowerment" component={WomenEmpowermentScreen} />
      <Stack.Screen name="BudgetPlanner" component={BudgetPlannerScreen} />
      <Stack.Screen name="FinancialGoals" component={FinancialGoalsScreen} />
      <Stack.Screen name="InvestmentGuide" component={InvestmentGuideScreen} />
      <Stack.Screen name="FakeCall" component={FakeCallScreen} />
      <Stack.Screen name="MetalRates" component={MetalRatesScreen} />
      <Stack.Screen name="FinancialArticles" component={FinancialArticlesScreen} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
      <Stack.Screen name="SkillDevelopment" component={SkillDevelopmentScreen} />
      <Stack.Screen name="LearningPath" component={LearningPathScreen} />
      <Stack.Screen name="MentatlHealthAIChat"  component={MentalHealthChat} />
      <Stack.Screen name="SOS"  component={SOSScreen} />
      <Stack.Screen name="IncidentReport" component={IncidentReportScreen} />
      <Stack.Screen name="ReportHistory" component={ReportsHistoryScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />


      
      
    </Stack.Navigator>
  );
};