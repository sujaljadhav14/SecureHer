import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const ReportsHistoryScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
    
    // Add listener for when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadReports();
    });

    return unsubscribe;
  }, [navigation]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsJson = await AsyncStorage.getItem('incident_reports');
      if (reportsJson) {
        setReports(JSON.parse(reportsJson));
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Could not load your report history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const viewReport = (report) => {
    navigation.navigate('ReportDetail', { report });
  };

  const shareReport = async (report) => {
    try {
      // Generate PDF filename
      const filename = `Report_${report.id}_${new Date().getTime()}.txt`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      
      // Write report content to file
      await FileSystem.writeAsStringAsync(filePath, report.reportText);
      
      // Share the file
      await Sharing.shareAsync(filePath);
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Could not share the report');
    }
  };

  const deleteReport = (reportId) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get current reports
              const currentReportsJson = await AsyncStorage.getItem('incident_reports');
              if (!currentReportsJson) return;
              
              const currentReports = JSON.parse(currentReportsJson);
              const updatedReports = currentReports.filter(report => report.id !== reportId);
              
              // Save updated list
              await AsyncStorage.setItem('incident_reports', JSON.stringify(updatedReports));
              
              // Update state
              setReports(updatedReports);
              
              Alert.alert('Success', 'Report deleted successfully');
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Could not delete the report');
            }
          }
        }
      ]
    );
  };

  const renderReportItem = ({ item }) => {
    const statusColor = item.status === 'Submitted' 
      ? '#4CAF50' 
      : item.status === 'Draft' 
        ? '#FFB5D8' 
        : '#FF9800';
    
    return (
      <TouchableOpacity 
        style={styles.reportItem}
        onPress={() => viewReport(item)}
      >
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <Text style={styles.reportDate}>{item.createdAt}</Text>
        <Text style={styles.reportSummary} numberOfLines={2}>{item.summary}</Text>
        
        <View style={styles.reportActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => viewReport(item)}>
            <Ionicons name="eye-outline" size={20} color="#666" />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => shareReport(item)}>
            <Ionicons name="share-outline" size={20} color="#666" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => deleteReport(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
            <Text style={[styles.actionText, { color: '#FF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="report" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Reports Yet</Text>
      <Text style={styles.emptyText}>
        Reports you create will appear here. Press the button below to file a new incident report.
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('IncidentReport')}
      >
        <Ionicons name="add" size={20} color="#FFF" />
        <Text style={styles.createButtonText}>Create New Report</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity 
          style={styles.newReportButton}
          onPress={() => navigation.navigate('IncidentReport')}
        >
          <Ionicons name="add" size={24} color="#FFB5D8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB5D8" />
          <Text style={styles.loadingText}>Loading your reports...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  newReportButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  reportItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reportDate: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  reportSummary: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  reportActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB5D8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ReportsHistoryScreen;