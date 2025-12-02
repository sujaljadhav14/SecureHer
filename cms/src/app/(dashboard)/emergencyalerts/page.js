"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmergencyAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    fetchEmergencyAlerts();
    
    // Poll for new alerts every 30 seconds
    const pollingInterval = setInterval(() => {
      fetchEmergencyAlerts();
    }, 30000);

    return () => clearInterval(pollingInterval);
  }, []);

  const fetchEmergencyAlerts = async () => {
    try {
      setIsLoading(true);
      const apiUrl = "https://womensafety-1-5znp.onrender.com/admin/listEmergencies";
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.emergencies) {
        const previousAlertCount = alerts.length;
        const currentAlertCount = data.data.emergencies.length;
        
        // Process the emergencies data
        const processedAlerts = data.data.emergencies.map(emergency => ({
          id: emergency._id,
          userId: emergency.user?._id || "Unknown",
          userName: emergency.user?.name || "Unknown User",
          type: "SOS", // Default type since API doesn't specify
          location: {
            address: `${emergency.location?.latitude}, ${emergency.location?.longitude}`,
            coordinates: { 
              lat: emergency.location?.latitude || 0, 
              lng: emergency.location?.longitude || 0 
            }
          },
          timestamp: emergency.createdAt,
          status: emergency.status || "active", // Default to active if not specified
          priority: determinePriority(emergency),
          batteryLevel: emergency.deviceInfo?.battery || 0,
          deviceType: emergency.deviceInfo?.deviceName || "mobile",
          contacts: emergency.recipients?.map(r => ({
            name: "Emergency Contact",
            relation: "Contact",
            phone: r.phoneNumber || "Unknown"
          })) || [],
          imageUrl: emergency.url || null
        }));
        
        setAlerts(processedAlerts);
        
        // Check if there are new alerts
        if (currentAlertCount > previousAlertCount && previousAlertCount > 0) {
          setNewAlertCount(currentAlertCount - previousAlertCount);
          if (audioEnabled) {
            playAlertSound();
          }
        }
        
        setError(null);
      } else {
        throw new Error("Invalid data structure from API");
      }
    } catch (err) {
      console.error("Error fetching emergency alerts:", err);
      setError(err.message);
      
      // If API fails, use fallback data to demonstrate UI
      if (alerts.length === 0) {
        setAlerts(getFallbackData());
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Determine priority based on emergency data
  const determinePriority = (emergency) => {
    // This would typically come from the API
    // For now, let's use some logic to determine it
    if (emergency.deviceInfo?.battery < 30) {
      return "critical";
    } else if (emergency.recipients?.some(r => r.status === "failed")) {
      return "high";
    } else {
      return "medium";
    }
  };

  // Play alert sound for new emergencies
  const playAlertSound = () => {
    if (audioEnabled) {
      try {
        const audio = new Audio('/alert-sound.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (err) {
        console.log('Audio error:', err);
      }
    }
  };

  // Format date to readable format
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date and time together
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time elapsed since alert
  const getTimeElapsed = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  // Get status color class
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800 border-red-200";
      case "responding":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get status animation
  const getStatusAnimation = (status) => {
    if (status === "active") {
      return "animate-pulse";
    }
    return "";
  };

  // Get priority level color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get alert type icon
  const getAlertTypeIcon = (type) => {
    switch (type) {
      case "SOS":
        return (
          <div className="bg-red-500 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "Panic Button":
        return (
          <div className="bg-orange-500 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "Fall Detection":
        return (
          <div className="bg-yellow-500 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-500 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  // Handle opening alert detail modal
  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
    setIsDetailModalOpen(true);
    
    // Reset new alert counter if viewing alerts
    if (newAlertCount > 0) {
      setNewAlertCount(0);
    }
  };

  // Handle alert status update
  const handleUpdateStatus = async (alertId, newStatus) => {
    setStatusUpdateLoading(true);
    
    try {
      // In a real app, you would make an API call here to update the alert status
      // For demo purposes, we'll just update the local state
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => {
          if (alert.id === alertId) {
            return {
              ...alert,
              status: newStatus,
              respondedBy: newStatus === "responding" ? "Officer Jane Doe" : alert.respondedBy,
              resolvedAt: newStatus === "resolved" ? new Date().toISOString() : alert.resolvedAt
            };
          }
          return alert;
        })
      );
      
      if (isDetailModalOpen && selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => ({
          ...prev,
          status: newStatus,
          respondedBy: newStatus === "responding" ? "Officer Jane Doe" : prev.respondedBy,
          resolvedAt: newStatus === "resolved" ? new Date().toISOString() : prev.resolvedAt
        }));
      }
    } catch (error) {
      console.error("Error updating alert status:", error);
      // Display error notification to user
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Filter alerts by status
  const activeAlerts = alerts.filter(alert => alert.status === "active");
  const respondingAlerts = alerts.filter(alert => alert.status === "responding");
  const resolvedAlerts = alerts.filter(alert => alert.status === "resolved");

  // Get fallback data for when the API fails
  const getFallbackData = () => {
    return [
      {
        id: "fallback1",
        userId: "USR001",
        userName: "Priya Sharma",
        type: "SOS",
        location: {
          address: "Near City Center, Mumbai",
          coordinates: { lat: 19.0760, lng: 72.8777 }
        },
        timestamp: new Date().toISOString(),
        status: "active",
        priority: "critical",
        batteryLevel: 42,
        deviceType: "mobile",
        contacts: [
          { name: "Emergency Contact", relation: "Family", phone: "9167787316" }
        ]
      },
      {
        id: "fallback2",
        userId: "USR002",
        userName: "Ananya Singh",
        type: "SOS",
        location: {
          address: "Andheri East, Mumbai",
          coordinates: { lat: 19.1136, lng: 72.8697 }
        },
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        status: "responding",
        priority: "high",
        batteryLevel: 67,
        deviceType: "V2307",
        contacts: [
          { name: "Emergency Contact", relation: "Friend", phone: "9876543210" }
        ],
        respondedBy: "Officer Arun Kumar"
      }
    ];
  };

  if (isLoading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">Emergency Alerts</h1>
            {newAlertCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                {newAlertCount} NEW
              </span>
            )}
          </div>
          <p className="text-gray-600">Monitor and respond to emergency alerts in real-time</p>
          {error && (
            <p className="text-sm text-amber-600 mt-1">
              Warning: {error}. {alerts.length > 0 ? "Showing cached data." : ""}
            </p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button 
            className={`px-4 py-2 rounded-md flex items-center ${audioEnabled ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                Sound On
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Sound Off
              </>
            )}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-500 text-white flex items-center hover:bg-blue-600"
            onClick={fetchEmergencyAlerts}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
          <button 
            className={`px-4 py-2 rounded-md flex items-center ${!mapView ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setMapView(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            List View
          </button>
          <button 
            className={`px-4 py-2 rounded-md flex items-center ${mapView ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setMapView(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
            </svg>
            Map View
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-800">{activeAlerts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Responding</p>
              <p className="text-2xl font-bold text-gray-800">{respondingAlerts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-800">{resolvedAlerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {mapView ? (
        // Map View
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Alert Map</h2>
          <div className="h-96 w-full bg-gray-100 rounded-lg relative">
            {/* Map component - using a placeholder for now */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div className="w-full h-full" style={{ backgroundColor: '#e5e7eb', backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%239C92AC" fill-opacity="0.1" fill-rule="evenodd"/%3E%3C/svg%3E")' }}>
                {/* Alert Markers */}
                {alerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    className={`absolute cursor-pointer ${alert.status === "active" ? "animate-pulse" : ""}`}
                    style={{ 
                      top: `${30 + (index * 15)}%`, 
                      left: `${25 + (index * 15)}%`,
                      transform: "translate(-50%, -50%)"
                    }}
                    onClick={() => handleViewAlert(alert)}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${getPriorityColor(alert.priority)} border-2 border-white shadow-lg`}>
                      {alert.status === "active" ? "!" : alert.status === "responding" ? "R" : "✓"}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white px-2 py-1 rounded shadow-md text-xs">
                      {alert.userName}
                    </div>
                  </div>
                ))}

                {/* Map Legend */}
                <div className="absolute bottom-2 left-2 bg-white bg-opacity-80 p-2 rounded-md shadow-sm text-xs">
                  <div className="flex items-center mb-1">
                    <div className="h-3 w-3 rounded-full bg-red-600 mr-1"></div>
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="h-3 w-3 rounded-full bg-orange-500 mr-1"></div>
                    <span>High</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></div>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 mr-1"></div>
                    <span>Low</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {/* Active Alerts Section */}
          {activeAlerts.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-red-50 border-b border-red-100">
                <h2 className="text-lg font-semibold text-red-800">Active Alerts</h2>
                <p className="text-sm text-red-600">Requires immediate attention</p>
              </div>
              <div className="divide-y divide-gray-200">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="p-6 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start space-x-4">
                        {getAlertTypeIcon(alert.type)}
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-gray-900">{alert.userName}</h3>
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(alert.status)} ${getStatusAnimation(alert.status)}`}>
                              {alert.status.toUpperCase()}
                            </span>
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full text-white ${getPriorityColor(alert.priority)}`}>
                              {alert.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{alert.type} Alert <span className="text-gray-400">•</span> {formatTime(alert.timestamp)} <span className="text-gray-400">•</span> {getTimeElapsed(alert.timestamp)}</p>
                          <p className="text-sm text-gray-800 mt-1">{alert.location.address}</p>
                          <p className="text-xs text-gray-500 mt-1">Device: {alert.deviceType} <span className="text-gray-400">•</span> Battery: {alert.batteryLevel}%</p>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex space-x-2">
                        <button 
                          className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                          onClick={() => handleUpdateStatus(alert.id, "responding")}
                          disabled={statusUpdateLoading}
                        >
                          {statusUpdateLoading ? "Processing..." : "Respond"}
                        </button>
                        <button 
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm rounded transition-colors"
                          onClick={() => handleViewAlert(alert)}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responding Alerts Section */}
          {respondingAlerts.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
                <h2 className="text-lg font-semibold text-yellow-800">Responding</h2>
                <p className="text-sm text-yellow-600">Response in progress</p>
              </div>
              <div className="divide-y divide-gray-200">
                {respondingAlerts.map((alert) => (
                  <div key={alert.id} className="p-6 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start space-x-4">
                        {getAlertTypeIcon(alert.type)}
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-gray-900">{alert.userName}</h3>
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                              {alert.status.toUpperCase()}
                            </span>
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full text-white ${getPriorityColor(alert.priority)}`}>
                              {alert.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{alert.type} Alert <span className="text-gray-400">•</span> {formatTime(alert.timestamp)} <span className="text-gray-400">•</span> {getTimeElapsed(alert.timestamp)}</p>
                          <p className="text-sm text-gray-800 mt-1">{alert.location.address}</p>
                          <p className="text-xs text-gray-500 mt-1">Responder: {alert.respondedBy || "Emergency Team"}</p>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex space-x-2">
                        <button 
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                          onClick={() => handleUpdateStatus(alert.id, "resolved")}
                          disabled={statusUpdateLoading}
                        >
                          {statusUpdateLoading ? "Processing..." : "Resolve"}
                        </button>
                        <button 
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm rounded transition-colors"
                          onClick={() => handleViewAlert(alert)}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Alerts Section */}
          {resolvedAlerts.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                <h2 className="text-lg font-semibold text-green-800">Resolved</h2>
                <p className="text-sm text-green-600">Completed alerts</p>
              </div>
              <div className="divide-y divide-gray-200">
                {resolvedAlerts.map((alert) => (
                  <div key={alert.id} className="p-6 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start space-x-4">
                        {getAlertTypeIcon(alert.type)}
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-gray-900">{alert.userName}</h3>
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                              {alert.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{alert.type} Alert <span className="text-gray-400">•</span> {formatTime(alert.timestamp)} <span className="text-gray-400">•</span> {getTimeElapsed(alert.timestamp)}</p>
                          <p className="text-sm text-gray-800 mt-1">{alert.location.address}</p>
                          <p className="text-xs text-gray-500 mt-1">Resolved by: {alert.respondedBy || "Emergency Team"} <span className="text-gray-400">•</span> {alert.resolvedAt && formatTime(alert.resolvedAt)}</p>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <button 
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm rounded transition-colors"
                          onClick={() => handleViewAlert(alert)}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Alerts Message */}
          {alerts.length === 0 && !isLoading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mx-auto h-16 w-16 mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No emergency alerts</h3>
              <p className="mt-2 text-sm text-gray-500">
                No active emergency alerts at this time. New alerts will appear here when received.
              </p>
              <button 
                onClick={fetchEmergencyAlerts} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}

      {/* Alert Detail Modal */}
      {isDetailModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="relative bg-white rounded-lg max-w-3xl w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Alert Details</h3>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedAlert.status)} ${getStatusAnimation(selectedAlert.status)}`}>
                  {selectedAlert.status.toUpperCase()}
                </span>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full text-white ${getPriorityColor(selectedAlert.priority)}`}>
                  {selectedAlert.priority}
                </span>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Alert ID</h4>
                    <p className="text-base font-medium">{selectedAlert.id}</p>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">User</h4>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-medium">
                        {selectedAlert.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-base font-medium">{selectedAlert.userName}</p>
                        <p className="text-sm text-gray-500">{selectedAlert.userId}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Type</h4>
                    <div className="flex items-center">
                      {getAlertTypeIcon(selectedAlert.type)}
                      <span className="ml-2 font-medium">{selectedAlert.type}</span>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Date & Time</h4>
                    <p className="text-base font-medium">{formatDateTime(selectedAlert.timestamp)}</p>
                    <p className="text-sm text-gray-500">{getTimeElapsed(selectedAlert.timestamp)}</p>
                  </div>
                </div>
                
                <div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                    <p className="text-base font-medium">{selectedAlert.location.address}</p>
                    <div className="flex space-x-2 mt-2">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedAlert.location.coordinates.lat},${selectedAlert.location.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View on Maps
                      </a>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Device</h4>
                    <p className="text-base font-medium capitalize">{selectedAlert.deviceType}</p>
                    <div className="flex items-center mt-1">
                      <div className="w-24 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${selectedAlert.batteryLevel < 20 ? 'bg-red-500' : selectedAlert.batteryLevel < 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${selectedAlert.batteryLevel}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{selectedAlert.batteryLevel}%</span>
                    </div>
                  </div>
                  {selectedAlert.respondedBy && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Responded By</h4>
                      <p className="text-base font-medium">{selectedAlert.respondedBy}</p>
                      {selectedAlert.resolvedAt && (
                        <p className="text-sm text-gray-500">Resolved at {formatTime(selectedAlert.resolvedAt)}</p>
                      )}
                    </div>
                  )}
                  {selectedAlert.imageUrl && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Street View</h4>
                      <div className="mt-2 w-full h-40 bg-gray-100 rounded overflow-hidden">
                        <img 
                          src={selectedAlert.imageUrl} 
                          alt="Location view" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedAlert.contacts && selectedAlert.contacts.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Emergency Contacts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAlert.contacts.map((contact, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.relation}</p>
                        <div className="mt-2 flex items-center">
                          <a href={`tel:${contact.phone}`} className="text-blue-600 flex items-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
              </div>
              </div>
)}

     </div> )}