"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import for chart components
const DynamicMap = dynamic(() => import("../dashboard/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500 mx-auto mb-2"></div>
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    activeAlerts: 0,
    pendingReports: 0,
    resolvedCases: 0,
    registeredUsers: 0,
    responseRate: 0,
    liveHelpers: 0,
    totalIncidents: 0
  });
  
  const [incidentSources, setIncidentSources] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [deviceStats, setDeviceStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }));
  const [heatmapData, setHeatmapData] = useState([]);
  const [error, setError] = useState(null);
  const [trendData, setTrendData] = useState({
    activeAlerts: [],
    responseRate: [],
    liveHelpers: [],
    totalIncidents: []
  });

  useEffect(() => {
    // Fetch and combine data from various sources
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch incidents data
        const incidentsResponse = await fetch('https://womensafety-1-5znp.onrender.com/admin/getAllIncidents', {
          cache: 'no-store'
        }).catch(() => {
          console.warn("Incidents API unavailable");
          return { ok: false };
        });
        
        // Fetch users data
        const usersResponse = await fetch('https://womensafety-1-5znp.onrender.com/admin/getAllUsers', {
          cache: 'no-store'
        }).catch(() => {
          console.warn("Users API unavailable");
          return { ok: false };
        });
        
        // Fetch safety zones data
        const safetyResponse = await fetch('/api/safety', {
          cache: 'no-store'
        }).catch(() => {
          console.warn("Safety data API unavailable");
          return { ok: false };
        });
        
        // Process incidents data
        let incidentsData = [];
        if (incidentsResponse.ok) {
          incidentsData = await incidentsResponse.json();
        }
        
        // Process users data
        let usersData = [];
        if (usersResponse.ok) {
          usersData = await usersResponse.json();
        }
        
        // Process safety data
        let safetyData = [];
        if (safetyResponse.ok) {
          safetyData = await safetyResponse.json();
        } else {
          // Mock data for heatmap if API fails
          safetyData = [
            { lat: "19.076", lon: "72.8777", safetyRating: "3" },
            { lat: "19.0825", lon: "72.8907", safetyRating: "6" },
            { lat: "19.0625", lon: "72.8657", safetyRating: "8" },
            { lat: "19.0525", lon: "72.8457", safetyRating: "2" },
            { lat: "19.0925", lon: "72.9007", safetyRating: "5" }
          ];
        }
        
        // Calculate main stats
        const activeIncidents = incidentsData.filter(inc => inc.status?.toLowerCase() === 'active' || inc.status?.toLowerCase() === 'open');
        const pendingIncidents = incidentsData.filter(inc => inc.status?.toLowerCase() === 'in progress' || inc.status?.toLowerCase() === 'pending');
        const resolvedIncidents = incidentsData.filter(inc => inc.status?.toLowerCase() === 'resolved' || inc.status?.toLowerCase() === 'closed');
        
        // Calculate response rate based on resolved vs total incidents
        const responseRate = incidentsData.length > 0 
          ? Math.round((resolvedIncidents.length / incidentsData.length) * 100 * 10) / 10 
          : 0;
        
        // Set overall stats
        setStats({
          activeAlerts: activeIncidents.length,
          pendingReports: pendingIncidents.length,
          resolvedCases: resolvedIncidents.length,
          registeredUsers: usersData.length,
          responseRate: responseRate,
          liveHelpers: Math.floor(usersData.length * 0.12), // Simulate ~12% of users are helpers
          totalIncidents: incidentsData.length
        });
        
        // Generate trend data (mock trends based on actual values)
        const generateTrendData = (baseValue, fluctuation = 0.15, points = 12) => {
          const result = [];
          for (let i = 0; i < points; i++) {
            const variation = baseValue * fluctuation * (Math.random() - 0.5);
            result.push(Math.max(0, Math.round(baseValue + variation)));
          }
          return result;
        };
        
        setTrendData({
          activeAlerts: generateTrendData(activeIncidents.length || 5),
          responseRate: generateTrendData(responseRate || 85, 0.05),
          liveHelpers: generateTrendData(Math.floor(usersData.length * 0.12) || 25),
          totalIncidents: generateTrendData(incidentsData.length || 10)
        });
        
        // Process heatmap data
        const heatmapPoints = safetyData.map(location => ({
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
          intensity: 10 - parseInt(location.safetyRating) // Invert safety rating for heatmap intensity
        }));
        
        setHeatmapData(heatmapPoints);
        
        // Calculate incident sources
        const incidentTypeCount = {};
        incidentsData.forEach(incident => {
          const type = incident.type || "Unknown";
          incidentTypeCount[type] = (incidentTypeCount[type] || 0) + 1;
        });
        
        // Convert to array and calculate percentages
        const totalCount = incidentsData.length;
        const incidentSourcesArray = Object.entries(incidentTypeCount)
          .map(([source, count]) => ({
            source,
            count,
            percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4); // Top 4 sources
        
        // If there's no data, provide mock data
        if (incidentSourcesArray.length === 0) {
          setIncidentSources([
            { source: "SOS Button", count: 54, percentage: 38 },
            { source: "Report Form", count: 41, percentage: 29 },
            { source: "Voice Command", count: 28, percentage: 20 },
            { source: "Guardian Alert", count: 18, percentage: 13 }
          ]);
        } else {
          setIncidentSources(incidentSourcesArray);
        }
        
        // Process the most recent 5 incidents
        const recentIncs = [...incidentsData]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(incident => ({
            id: incident._id,
            incidentId: incident.incidentId,
            userID: incident.reportedByName || "Unknown",
            type: incident.type || "Unknown",
            location: incident.location || "Unknown location",
            timestamp: incident.createdAt,
            status: incident.status?.toLowerCase() || "unknown"
          }));
        
        if (recentIncs.length > 0) {
          setRecentIncidents(recentIncs);
        } else {
          // Use mock data if no real data
          setRecentIncidents([
            { id: 1, userID: "U1298", type: "SOS", location: "Koramangala, Bangalore", timestamp: "2025-03-09T15:32:00", status: "active" },
            { id: 2, userID: "U2371", type: "Harassment", location: "HSR Layout, Bangalore", timestamp: "2025-03-09T14:15:00", status: "active" },
            { id: 3, userID: "U1587", type: "Unsafe Area", location: "Indiranagar, Bangalore", timestamp: "2025-03-09T12:07:00", status: "pending" },
            { id: 4, userID: "U1655", type: "SOS", location: "BTM Layout, Bangalore", timestamp: "2025-03-09T10:45:00", status: "resolved" }
          ]);
        }
        
        // Calculate device stats based on user data
        const calculateDeviceStats = () => {
          // In a real app, you'd get this from user agent data
          // Here we'll simulate it based on user count
          const totalUsers = usersData.length || 100;
          return [
            { type: 'mobile', icon: 'phone', count: Math.floor(totalUsers * 0.65), color: 'blue' },
            { type: 'desktop', icon: 'desktop', count: Math.floor(totalUsers * 0.2), color: 'red' },
            { type: 'tablet', icon: 'tablet', count: Math.floor(totalUsers * 0.1), color: 'green' },
            { type: 'wearable', icon: 'watch', count: Math.floor(totalUsers * 0.05), color: 'purple' }
          ];
        };
        
        setDeviceStats(calculateDeviceStats());
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
        
        // Set fallback mock data for everything
        setStats({
          activeAlerts: 24,
          pendingReports: 18,
          resolvedCases: 143,
          registeredUsers: 985,
          responseRate: 89.7,
          liveHelpers: 342,
          totalIncidents: 1430
        });
        
        setTrendData({
          activeAlerts: [18, 20, 22, 19, 23, 25, 24, 26, 22, 20, 23, 24],
          responseRate: [87, 88, 89, 88, 90, 89, 91, 90, 88, 89, 90, 89],
          liveHelpers: [320, 335, 350, 330, 345, 360, 342, 338, 355, 345, 340, 342],
          totalIncidents: [1380, 1390, 1400, 1410, 1420, 1425, 1430, 1425, 1420, 1415, 1425, 1430]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up refresh interval (every 5 minutes)
    const refreshInterval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
      case "open":
        return "bg-red-100 text-red-800";
      case "pending":
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getPercentageChange = (base, key) => {
    // Calculate a mock percentage change based on trend data
    const trend = trendData[key];
    if (!trend || trend.length < 2) return "+0.00%";
    
    const current = trend[trend.length - 1];
    const previous = trend[trend.length - 2];
    
    if (previous === 0) return "+0.00%";
    
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <div className="flex items-center space-x-2">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button className="bg-indigo-500 text-white px-4 py-2 rounded-md flex items-center">
              {dateFilter}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex text-sm text-gray-500 mt-2">
          <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span className="mx-2">›</span>
          <span>Analytics</span>
        </div>
      </header>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md">
            <p className="text-sm">
              <strong>Note:</strong> Some data couldn't be loaded ({error}). Showing estimated statistics.
            </p>
          </div>
        )}
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          {/* Active Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-700">Active Alerts</h3>
              <div className="bg-blue-500 text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline">
              <h2 className="text-3xl font-bold text-gray-800">{stats.activeAlerts}</h2>
              <span className="ml-2 text-sm font-medium text-green-600">{getPercentageChange(stats.activeAlerts, 'activeAlerts')}</span>
            </div>
            <div className="mt-4">
              <div className="h-12 w-full">
                <svg viewBox="0 0 200 40" className="w-full h-full">
                  <path 
                    d={`M0,40 ${trendData.activeAlerts.map((val, i) => {
                      const x = i * (200 / (trendData.activeAlerts.length - 1));
                      const y = 40 - (val / Math.max(...trendData.activeAlerts)) * 40;
                      return `L${x},${y}`;
                    }).join(' ')}`} 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <p className="text-sm text-gray-500 mt-2">Currently active now</p>
            </div>
          </div>

          {/* Response Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-700">Response Rate</h3>
              <div className="bg-green-500 text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline">
              <h2 className="text-3xl font-bold text-gray-800">{stats.responseRate}%</h2>
              <span className="ml-2 text-sm font-medium text-green-600">{getPercentageChange(stats.responseRate, 'responseRate')}</span>
            </div>
            <div className="mt-4">
              <div className="h-12 w-full">
                <svg viewBox="0 0 200 40" className="w-full h-full">
                  <path 
                    d={`M0,20 ${trendData.responseRate.map((val, i) => {
                      const x = i * (200 / (trendData.responseRate.length - 1));
                      const maxVal = Math.max(...trendData.responseRate);
                      const minVal = Math.min(...trendData.responseRate);
                      const range = maxVal - minVal;
                      const normalizedVal = range === 0 ? 20 : 40 - ((val - minVal) / range) * 30;
                      return `L${x},${normalizedVal}`;
                    }).join(' ')}`} 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <p className="text-sm text-gray-500 mt-2">Resolved / Total incidents</p>
            </div>
          </div>

          {/* Live Helpers */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-700">Live Helpers</h3>
              <div className="bg-purple-500 text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline">
              <h2 className="text-3xl font-bold text-gray-800">{stats.liveHelpers}</h2>
              <span className="ml-2 text-sm font-medium text-red-600">{getPercentageChange(stats.liveHelpers, 'liveHelpers')}</span>
            </div>
            <div className="mt-4">
              <div className="h-12 w-full">
                <svg viewBox="0 0 200 40" className="w-full h-full">
                  <path 
                    d={`M0,25 ${trendData.liveHelpers.map((val, i) => {
                      const x = i * (200 / (trendData.liveHelpers.length - 1));
                      const y = 40 - (val / Math.max(...trendData.liveHelpers)) * 40;
                      return `L${x},${y}`;
                    }).join(' ')}`} 
                    fill="none" 
                    stroke="#8b5cf6" 
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <p className="text-sm text-gray-500 mt-2">Active responders</p>
            </div>
          </div>

          {/* Total Incidents */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-700">Total Incidents</h3>
              <div className="bg-red-500 text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline">
              <h2 className="text-3xl font-bold text-gray-800">{stats.totalIncidents}</h2>
              <span className="ml-2 text-sm font-medium text-green-600">{getPercentageChange(stats.totalIncidents, 'totalIncidents')}</span>
            </div>
            <div className="mt-4">
              <div className="h-12 w-full">
                <svg viewBox="0 0 200 40" className="w-full h-full">
                  <path 
                    d={`M0,30 ${trendData.totalIncidents.map((val, i) => {
                      const x = i * (200 / (trendData.totalIncidents.length - 1));
                      const maxVal = Math.max(...trendData.totalIncidents);
                      const minVal = Math.min(...trendData.totalIncidents);
                      const range = maxVal - minVal;
                      const normalizedVal = range === 0 ? 20 : 40 - ((val - minVal) / range) * 30;
                      return `L${x},${normalizedVal}`;
                    }).join(' ')}`} 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <p className="text-sm text-gray-500 mt-2">All time incidents</p>
            </div>
          </div>
        </div>

        {/* Row with Incident Sources and Incident Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Incident Sources */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Incident Sources</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Mapping Out Your User Incident Reports</p>
            
            <div className="border-b border-gray-200 mb-4">
              <div className="flex space-x-8">
                <button className="pb-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">TYPES</button>
                <button className="pb-2 text-sm font-medium text-gray-500 hover:text-gray-700">LOCATIONS</button>
                <button className="pb-2 text-sm font-medium text-gray-500 hover:text-gray-700">TIME</button>
              </div>
            </div>
            
            <div className="space-y-4">
              {incidentSources.map((source, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'][index] }}>
                    <span className="text-white text-xs">{index + 1}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{source.source}</span>
                      <span className="text-sm font-medium text-gray-900">{source.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full" 
                           style={{ width: `${source.percentage}%`, backgroundColor: ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'][index] }}></div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
       
                 {/* Incident Map Component */}
                 <div className="bg-white rounded-lg shadow p-6">
                   <div className="flex justify-between items-center mb-6">
                     <h2 className="text-lg font-semibold text-gray-800">Incident Map</h2>
                     <button className="text-gray-400 hover:text-gray-600">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                       </svg>
                     </button>
                   </div>
                   
                   <div className="h-64">
                     {heatmapData.length > 0 ? (
                       <DynamicMap heatmapData={heatmapData} />
                     ) : (
                       <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                         <div className="text-center">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                           </svg>
                           <p className="text-gray-500">No heatmap data available</p>
                         </div>
                       </div>
                     )}
                   </div>
                   
                   {/* Map Legend */}
                   <div className="flex justify-center mt-4 space-x-4 text-sm text-gray-600">
                     <div className="flex items-center">
                       <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                       <span>High Risk</span>
                     </div>
                     <div className="flex items-center">
                       <div className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></div>
                       <span>Medium Risk</span>
                     </div>
                     <div className="flex items-center">
                       <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                       <span>Low Risk</span>
                     </div>
                   </div>
                 </div>
               </div>
       
               {/* Recent Incidents Table */}
               <div className="bg-white rounded-lg shadow p-6 mb-6">
                 <div className="flex justify-between items-center mb-6">
                   <h2 className="text-lg font-semibold text-gray-800">Recent Incidents</h2>
                   <Link href="/incidents" className="text-sm text-blue-600 hover:underline">View All</Link>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="min-w-full">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {recentIncidents.map((incident) => (
                         <tr key={incident.id}>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="flex items-center">
                               <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                 <span className="text-xs font-medium text-purple-800">{incident.userID.slice(0, 2)}</span>
                               </div>
                               <div className="ml-4">
                                 <div className="text-sm font-medium text-gray-900">
                                   {incident.userID}
                                 </div>
                               </div>
                             </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm text-gray-900">{incident.type}</div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm text-gray-900">{incident.location}</div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm text-gray-900">{formatDate(incident.timestamp)}</div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                               {incident.status}
                             </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                             <Link href={`/incidents/${incident.id}`} className="text-blue-600 hover:text-blue-900">View</Link>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
       
               {/* Device Overview Section */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Session Overview Chart */}
                 <div className="bg-white rounded-lg shadow p-6">
                   <div className="flex justify-between items-center mb-6">
                     <div>
                       <h2 className="text-lg font-semibold text-gray-800">Session Overview</h2>
                       <p className="text-sm text-gray-500">Session Metrics Report, Providing Detailed Insights into Your Recent Activities</p>
                     </div>
                     <button className="text-gray-400 hover:text-gray-600">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                       </svg>
                     </button>
                   </div>
                   
                   <div className="flex space-x-8 mb-4 justify-center">
                     <div className="flex items-center">
                       <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                       <span className="text-sm text-gray-600">Views</span>
                     </div>
                     <div className="flex items-center">
                       <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                       <span className="text-sm text-gray-600">Alerts</span>
                     </div>
                     <div className="flex items-center">
                       <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                       <span className="text-sm text-gray-600">Reports</span>
                     </div>
                   </div>
       
                   <div className="h-64">
                     <div className="w-full h-full flex items-end space-x-2">
                       {Array.from({ length: 12 }, (_, i) => {
                         // Generate dynamic heights based on trend data
                         const alertsHeight = trendData.activeAlerts[i] || 0;
                         const maxAlerts = Math.max(...trendData.activeAlerts);
                         const alertsPercentage = maxAlerts ? (alertsHeight / maxAlerts) * 0.5 : 0;
                         
                         const reportsHeight = trendData.totalIncidents[i] ? 
                           (trendData.totalIncidents[i] - trendData.activeAlerts[i]) : 0;
                         const maxReports = Math.max(...trendData.totalIncidents.map((v, idx) => v - trendData.activeAlerts[idx]));
                         const reportsPercentage = maxReports ? (reportsHeight / maxReports) * 0.35 : 0;
                         
                         // Views is just a dummy value based on total incidents for visualization
                         const viewsPercentage = trendData.totalIncidents[i] ? 
                           ((trendData.totalIncidents[i] * 2.5) / (Math.max(...trendData.totalIncidents) * 2.5)) * 0.3 : 0;
                         
                         return (
                           <div key={i} className="flex-1 flex flex-col items-stretch">
                             <div className="flex flex-col h-full justify-end space-y-1">
                               <div className="bg-blue-500" style={{ height: `${viewsPercentage * 200}px` }}></div>
                               <div className="bg-red-500" style={{ height: `${alertsPercentage * 200}px` }}></div>
                               <div className="bg-purple-500" style={{ height: `${reportsPercentage * 200}px` }}></div>
                             </div>
                             <div className="text-xs text-center mt-1 text-gray-500">{(i + 1)}</div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 </div>
       
                 {/* Device Overview */}
                 <div className="bg-white rounded-lg shadow p-6">
                   <div className="flex justify-between items-center mb-6">
                     <div>
                       <h2 className="text-lg font-semibold text-gray-800">Device Overview</h2>
                       <p className="text-sm text-gray-500">Device Overview Analyzing Your Safety App Activity</p>
                     </div>
                     <button className="text-gray-400 hover:text-gray-600">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                       </svg>
                     </button>
                   </div>
       
                   <div className="flex justify-center mb-6">
                     <div className="w-48 h-48">
                       <svg viewBox="0 0 100 100">
                         {/* Calculate the dash offsets based on device stats */}
                         {(() => {
                           const total = deviceStats.reduce((sum, device) => sum + device.count, 0);
                           const circumference = 2 * Math.PI * 45;
                           let offset = 0;
                           
                           return deviceStats.map((device, index) => {
                             const percentage = total > 0 ? device.count / total : 0;
                             const dash = circumference * percentage;
                             const gap = circumference - dash;
                             
                             // Calculate rotation to position the segments correctly
                             const currentOffset = offset;
                             offset += percentage * 360;
                             
                             const colors = {
                               blue: '#3b82f6',
                               red: '#ef4444',
                               green: '#22c55e',
                               purple: '#8b5cf6'
                             };
                             
                             return (
                               <circle 
                                 key={index} 
                                 cx="50" cy="50" r="45" 
                                 fill="transparent" 
                                 stroke={colors[device.color] || '#3b82f6'} 
                                 strokeWidth="10" 
                                 strokeDasharray={`${dash} ${gap}`} 
                                 transform={`rotate(${-90 + currentOffset * 360} 50 50)`} 
                               />
                             );
                           });
                         })()}
                       </svg>
                     </div>
                   </div>
       
                   <div className="grid grid-cols-2 gap-4">
                     {deviceStats.map((device, index) => (
                       <div key={index} className="flex items-center p-3 border rounded-lg">
                         <div className={`p-2 bg-${device.color}-50 rounded-lg mr-3`}>
                           <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-${device.color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             {device.icon === 'phone' && (
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                             )}
                             {device.icon === 'desktop' && (
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                             )}
                             {device.icon === 'tablet' && (
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                             )}
                             {device.icon === 'watch' && (
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                             )}
                           </svg>
                         </div>
                         <div>
                           <p className="text-sm text-gray-500">{device.type[0].toUpperCase() + device.type.slice(1)}</p>
                           <p className="text-lg font-semibold">{device.count.toLocaleString()}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
           </div>
         );
       }