import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Constants for conversion
const TROY_OUNCE_TO_GRAM = 31.1035; // 1 Troy Ounce = 31.1035 grams

// API endpoint
const API_ENDPOINT = 'https://api.metalpriceapi.com/v1/latest?api_key=d2de6e689045d09f356da0a452538e5d&base=INR&currencies=XAG,XAU,XPT';

// Sample historical data for the charts - you would replace this with real data
const generateHistoricalData = (current, metal) => {
  const volatility = metal === 'gold' ? 0.03 : metal === 'silver' ? 0.04 : 0.025;
  let price = current;
  
  return Array(6).fill().map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (30 - i * 5));
    const randomChange = (Math.random() - 0.5) * volatility * price;
    price = (i === 5) ? current : (price - randomChange);
    return { 
      date: date.toISOString().split('T')[0], 
      price: price 
    };
  });
};

const MetalRatesScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('1M'); // 1D, 1W, 1M, 3M, 1Y
  
  // State for metal rates
  const [goldRate, setGoldRate] = useState({ 
    price: 0, 
    pricePerGram: 0, 
    pricePer10Gram: 0, 
    pricePerKg: 0, 
    change: 0, 
    percentage: 0 
  });
  
  const [silverRate, setSilverRate] = useState({ 
    price: 0, 
    pricePerGram: 0, 
    pricePer10Gram: 0, 
    pricePerKg: 0, 
    change: 0, 
    percentage: 0 
  });
  
  const [platinumRate, setPlatinumRate] = useState({ 
    price: 0, 
    pricePerGram: 0, 
    pricePer10Gram: 0, 
    pricePerKg: 0, 
    change: 0, 
    percentage: 0 
  });
  
  // State for historical data
  const [goldHistory, setGoldHistory] = useState([]);
  const [silverHistory, setSilverHistory] = useState([]);
  const [platinumHistory, setPlatinumHistory] = useState([]);
  
  // State for last update timestamp
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    fetchRates();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const fetchRates = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(API_ENDPOINT);
      const data = await response.json();
      
      if (data.success) {
        // Extract rates
        const { rates, timestamp } = data;
        
        // Convert troy ounce rates to various gram measurements
        // For gold (XAU)
        const goldTroyOunce = 1 / rates.XAU; // Price in INR per troy ounce
        const goldPerGram = goldTroyOunce / TROY_OUNCE_TO_GRAM;
        const goldPer10Gram = goldPerGram * 10;
        const goldPerKg = goldPerGram * 1000;
        
        // For silver (XAG)
        const silverTroyOunce = 1 / rates.XAG; // Price in INR per troy ounce
        const silverPerGram = silverTroyOunce / TROY_OUNCE_TO_GRAM;
        const silverPer10Gram = silverPerGram * 10;
        const silverPerKg = silverPerGram * 1000;
        
        // For platinum (XPT)
        const platinumTroyOunce = 1 / rates.XPT; // Price in INR per troy ounce
        const platinumPerGram = platinumTroyOunce / TROY_OUNCE_TO_GRAM;
        const platinumPer10Gram = platinumPerGram * 10;
        const platinumPerKg = platinumPerGram * 1000;
        
        // Set state with new values (using placeholder change values for now)
        // In a real app, you would compare with previous values to calculate change
        setGoldRate({
          price: goldTroyOunce,
          pricePerGram: goldPerGram,
          pricePer10Gram: goldPer10Gram, 
          pricePerKg: goldPerKg,
          change: 65.00, // placeholder
          percentage: 1.12  // placeholder
        });
        
        setSilverRate({
          price: silverTroyOunce,
          pricePerGram: silverPerGram,
          pricePer10Gram: silverPer10Gram,
          pricePerKg: silverPerKg,
          change: -0.30, // placeholder
          percentage: -0.41 // placeholder
        });
        
        setPlatinumRate({
          price: platinumTroyOunce,
          pricePerGram: platinumPerGram,
          pricePer10Gram: platinumPer10Gram,
          pricePerKg: platinumPerKg,
          change: 2.75, // placeholder
          percentage: 0.87 // placeholder
        });
        
        // Generate historical data based on current prices
        setGoldHistory(generateHistoricalData(goldPer10Gram, 'gold'));
        setSilverHistory(generateHistoricalData(silverPerGram, 'silver'));
        setPlatinumHistory(generateHistoricalData(platinumPerGram, 'platinum'));
        
        // Set last updated timestamp
        setLastUpdated(new Date(timestamp * 1000));
      } else {
        console.error('API returned an error:', data);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchRates();
  };
  
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    // In a real app, you would fetch new historical data based on the timeframe
  };
  
  const formatPrice = (price) => {
    return `₹${price.toFixed(2)}`;
  };
  
  const formatChange = (change, percentage) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percentage.toFixed(2)}%)`;
  };
  
  const renderTimeframes = () => {
    const timeframes = ['1D', '1W', '1M', '3M', '1Y'];
    
    return (
      <View style={styles.timeframesContainer}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[
              styles.timeframeButton,
              timeframe === tf && styles.timeframeButtonActive
            ]}
            onPress={() => handleTimeframeChange(tf)}
          >
            <Text style={[
              styles.timeframeText,
              timeframe === tf && styles.timeframeTextActive
            ]}>
              {tf}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const renderMiniChart = (data, color) => {
    if (!data || data.length === 0) return null;
    
    const maxPrice = Math.max(...data.map(item => item.price));
    const minPrice = Math.min(...data.map(item => item.price));
    const range = maxPrice - minPrice;
    
    return (
      <View style={styles.miniChartContainer}>
        <View style={styles.miniChart}>
          {data.map((item, index) => {
            const height = range > 0 
              ? ((item.price - minPrice) / range) * 50 + 10 
              : 30;
            
            return (
              <View 
                key={index} 
                style={[
                  styles.miniChartBar,
                  { 
                    height, 
                    backgroundColor: color
                  }
                ]} 
              />
            );
          })}
        </View>
      </View>
    );
  };
  
  const renderGoldCard = () => {
    const isPositive = goldRate.change >= 0;
    
    return (
      <View style={styles.metalCard}>
        <View style={styles.metalHeader}>
          <View style={styles.metalInfo}>
            <View style={styles.metalIconContainer}>
              <MaterialCommunityIcons name="gold" size={28} color="#FFD700" />
            </View>
            <View>
              <Text style={styles.metalName}>Gold (10g)</Text>
              <Text style={styles.metalPrice}>{formatPrice(goldRate.pricePer10Gram)}</Text>
            </View>
          </View>
          <View style={styles.changeContainer}>
            <Ionicons 
              name={isPositive ? "trending-up" : "trending-down"} 
              size={20} 
              color={isPositive ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[
              styles.changeText,
              { color: isPositive ? "#4CAF50" : "#F44336" }
            ]}>
              {formatChange(goldRate.change, goldRate.percentage)}
            </Text>
          </View>
        </View>
        
        {renderMiniChart(goldHistory, '#FFD700')}
        
        <View style={styles.metalFooter}>
          <View style={styles.metalStat}>
            <Text style={styles.metalStatLabel}>1 Gram</Text>
            <Text style={styles.metalStatValue}>{formatPrice(goldRate.pricePerGram)}</Text>
          </View>
          <View style={styles.metalStat}>
            <Text style={styles.metalStatLabel}>10 Gram</Text>
            <Text style={styles.metalStatValue}>{formatPrice(goldRate.pricePer10Gram)}</Text>
          </View>
          <View style={styles.metalStat}>
            <Text style={styles.metalStatLabel}>1 Kg</Text>
            <Text style={styles.metalStatValue}>{formatPrice(goldRate.pricePerKg)}</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderSilverCard = () => {
    const isPositive = silverRate.change >= 0;
    
    return (
      <View style={styles.metalCard}>
        <View style={styles.metalHeader}>
          <View style={styles.metalInfo}>
            <View style={styles.metalIconContainer}>
              <MaterialCommunityIcons name="silver" size={28} color="#C0C0C0" />
            </View>
            <View>
              <Text style={styles.metalName}>Silver (1g)</Text>
              <Text style={styles.metalPrice}>{formatPrice(silverRate.pricePerGram)}</Text>
            </View>
          </View>
          <View style={styles.changeContainer}>
            <Ionicons 
              name={isPositive ? "trending-up" : "trending-down"} 
              size={20} 
              color={isPositive ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[
              styles.changeText,
              { color: isPositive ? "#4CAF50" : "#F44336" }
            ]}>
              {formatChange(silverRate.change, silverRate.percentage)}
            </Text>
          </View>
        </View>
        
        {renderMiniChart(silverHistory, '#C0C0C0')}
        
        <View style={styles.metalFooter}>
          <View style={styles.metalStat}>
            <Text style={styles.metalStatLabel}>1 Gram</Text>
            <Text style={styles.metalStatValue}>{formatPrice(silverRate.pricePerGram)}</Text>
          </View>
          <View style={styles.metalStat}>
            <Text style={styles.metalStatLabel}>10 Gram</Text>
            <Text style={styles.metalStatValue}>{formatPrice(silverRate.pricePer10Gram)}</Text>
          </View>
          <View style={styles.metalStat}>
            <Text style={styles.metalStatLabel}>1 Kg</Text>
            <Text style={styles.metalStatValue}>{formatPrice(silverRate.pricePerKg)}</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderPlatinumCard = () => {
    const isPositive = platinumRate.change >= 0;
    
    return (
      <View style={styles.metalCard}>
        <View style={styles.metalHeader}>
          <View style={styles.metalInfo}>
            <View style={styles.metalIconContainer}>
              <MaterialCommunityIcons name="medal" size={28} color="#E5E4E2" />
            </View>
            <View>
              <Text style={styles.metalName}>Platinum (1g)</Text>
              <Text style={styles.metalPrice}>{formatPrice(platinumRate.pricePerGram)}</Text>
            </View>
          </View>
          <View style={styles.changeContainer}>
            <Ionicons 
              name={isPositive ? "trending-up" : "trending-down"} 
              size={20} 
              color={isPositive ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[
              styles.changeText,
              { color: isPositive ? "#4CAF50" : "#F44336" }
            ]}>
              {formatChange(platinumRate.change, platinumRate.percentage)}
            </Text>
          </View>
        </View>
        
        {renderMiniChart(platinumHistory, '#E5E4E2')}
        
        <View style={styles.metalFooter}>
          <View style={styles.metalStat}>
            <Text style={styles.metalStatLabel}>1 Gram</Text>
            <Text style={styles.metalStatValue}>{formatPrice(platinumRate.pricePerGram)}</Text>
          </View>
          <View style={styles.metalStat}>
            <Text style={styles.metalStatLabel}>10 Gram</Text>
            <Text style={styles.metalStatValue}>{formatPrice(platinumRate.pricePer10Gram)}</Text>
          </View>
          <View style={styles.metalStat}>
            <Text style={styles.metalStatLabel}>1 Kg</Text>
            <Text style={styles.metalStatValue}>{formatPrice(platinumRate.pricePerKg)}</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderComparison = () => {
    return (
      <View style={styles.comparisonCard}>
        <Text style={styles.comparisonTitle}>Metal Price Comparison (1 Year)</Text>
        <Text style={styles.comparisonSubtitle}>Performance Comparison</Text>
        
        <View style={styles.comparisonChart}>
          <View style={styles.comparisonChartLine}>
            <View style={[styles.comparisonChartLineGold, { width: '65%' }]} />
          </View>
          <View style={styles.comparisonChartLine}>
            <View style={[styles.comparisonChartLineSilver, { width: '48%' }]} />
          </View>
          <View style={styles.comparisonChartLine}>
            <View style={[styles.comparisonChartLinePlatinum, { width: '52%' }]} />
          </View>
        </View>
        
        <View style={styles.comparisonLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.legendText}>Gold: +15.3%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#C0C0C0' }]} />
            <Text style={styles.legendText}>Silver: +10.8%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#E5E4E2' }]} />
            <Text style={styles.legendText}>Platinum: +12.1%</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderMarketInsights = () => {
    return (
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>Market Insights</Text>
        
        <View style={styles.insightItem}>
          <Ionicons name="trending-up" size={20} color="#4CAF50" />
          <Text style={styles.insightText}>
            Gold prices have risen due to increasing global economic uncertainty
          </Text>
        </View>
        
        <View style={styles.insightItem}>
          <Ionicons name="trending-down" size={20} color="#F44336" />
          <Text style={styles.insightText}>
            Silver prices are influenced by industrial demand and economic conditions
          </Text>
        </View>
        
        <View style={styles.insightItem}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.insightText}>
            Platinum demand is growing in automotive and jewelry sectors
          </Text>
        </View>
        
        <TouchableOpacity style={styles.moreInsightsButton}>
          <Text style={styles.moreInsightsText}>View More Insights</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFB5D8" />
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerTitle}>Live Metal Rates</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FFB5D8"]}
          />
        }
      >
        <Animated.View style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.lastUpdatedContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Loading...'}
            </Text>
          </View>
          
          <Text style={styles.sectionTitle}>Live Rates</Text>
          {renderTimeframes()}
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFB5D8" />
              <Text style={styles.loadingText}>Fetching latest rates...</Text>
            </View>
          ) : (
            <>
              {renderGoldCard()}
              {renderSilverCard()}
              {renderPlatinumCard()}
              {renderComparison()}
              {renderMarketInsights()}
              
              <View style={styles.disclaimerContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.disclaimerText}>
                  Rates are provided for informational purposes only. Actual purchase and selling prices may vary.
                </Text>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timeframesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#FFB5D8',
  },
  timeframeText: {
    fontSize: 14,
    color: '#666',
  },
  timeframeTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  metalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metalName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  metalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  changeText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  miniChartContainer: {
    height: 70,
    marginBottom: 16,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  miniChartBar: {
    width: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    marginHorizontal: 4,
  },
  metalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metalStat: {
    alignItems: 'center',
  },
  metalStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metalStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  comparisonChart: {
    marginBottom: 16,
  },
  comparisonChartLine: {
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  comparisonChartLineGold: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 12,
  },
  comparisonChartLineSilver: {
    height: '100%',
    backgroundColor: '#C0C0C0',
    borderRadius: 12,
  },
  comparisonChartLinePlatinum: {
    height: '100%',
    backgroundColor: '#E5E4E2',
    borderRadius: 12,
  },
  comparisonLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  insightsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  insightText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  moreInsightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  moreInsightsText: {
    color: '#FFB5D8',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});

export default MetalRatesScreen;