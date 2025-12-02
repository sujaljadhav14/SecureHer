"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamic import for Leaflet (must be loaded client-side)
const DynamicMap = dynamic(() => import("./DashboardMap"), {
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

export default function Dashboard() {
  // State variables
  const [stats, setStats] = useState({
    activeAlerts: 0,
    pendingReports: 0,
    resolvedCases: 0,
    registeredUsers: 0
  });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch incidents
        const incidentsResponse = await fetch('https://womensafety-1-5znp.onrender.com/admin/getAllIncidents', {
          cache: 'no-store'
        });
        
        if (!incidentsResponse.ok) {
          throw new Error(`Incidents API error: ${incidentsResponse.status}`);
        }
        
        const incidentsData = await incidentsResponse.json();
        
        // Fetch users
        const usersResponse = await fetch('https://womensafety-1-5znp.onrender.com/admin/getAllUsers', {
          cache: 'no-store'
        });
        
        if (!usersResponse.ok) {
          throw new Error(`Users API error: ${usersResponse.status}`);
        }
        
        const usersData = await usersResponse.json();
        
        // Fetch safety zones/locations for heatmap
        const safetyResponse = await fetch('/api/safety', {
          cache: 'no-store'
        }).catch(() => {
          console.warn("Safety data API unavailable, using mock data");
          return { ok: false };
        });
        
        let safetyData = [];
        if (safetyResponse.ok) {
          safetyData = await safetyResponse.json();
        } else {
          // Mock data for heatmap if API fails
          safetyData = [
            { lat: "19.076", lon: "72.8777", safetyRating: "3" },
            { lat: "19.0825", lon: "72.8907", safetyRating: "6" },
            { lat: "19.0625", lon: "72.8657", safetyRating: "8" }
          ];
        }
        
        // Process incidents data for stats and recent incidents
        const activeIncidents = incidentsData.filter(inc => inc.status?.toLowerCase() === 'active');
        const pendingIncidents = incidentsData.filter(inc => inc.status?.toLowerCase() === 'in progress' || inc.status?.toLowerCase() === 'pending');
        const resolvedIncidents = incidentsData.filter(inc => inc.status?.toLowerCase() === 'resolved');
        
        // Set the stats
        setStats({
          activeAlerts: activeIncidents.length,
          pendingReports: pendingIncidents.length,
          resolvedCases: resolvedIncidents.length,
          registeredUsers: usersData.length || 0
        });
        
        // Process the most recent 5 incidents
        const recent = [...incidentsData]
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
        
        setRecentIncidents(recent);
        
        // Process heatmap data
        const heatmapPoints = safetyData.map(location => ({
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
          intensity: 10 - parseInt(location.safetyRating) // Invert safety rating for heatmap intensity
        }));
        
        setHeatmapData(heatmapPoints);
        
        // Generate recent activity feed based on data
        const activities = [];
        
        // Add recent user registrations
        const recentUsers = [...usersData]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
          
        recentUsers.forEach(user => {
          activities.push({
            type: 'user_registered',
            user: user.name || 'New User',
            timestamp: user.createdAt,
            id: user._id
          });
        });
        
        // Add recent incident status changes
        const recentResolved = [...resolvedIncidents]
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 2);
          
        recentResolved.forEach(incident => {
          activities.push({
            type: 'incident_resolved',
            incidentId: incident.incidentId,
            timestamp: incident.updatedAt,
            id: incident._id
          });
        });
        
        // Add recent SOS alerts
        const recentSOS = [...incidentsData]
          .filter(inc => inc.type?.toLowerCase() === 'sos')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 2);
          
        recentSOS.forEach(incident => {
          activities.push({
            type: 'sos_alert',
            user: incident.reportedByName || 'User',
            timestamp: incident.createdAt,
            id: incident._id
          });
        });
        
        // Sort all activities by timestamp
        const sortedActivities = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setRecentActivities(sortedActivities);
        
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
        
        // Set fallback mock data
        setStats({
          activeAlerts: 5,
          pendingReports: 3,
          resolvedCases: 24,
          registeredUsers: 127
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
        return "bg-red-100 text-red-800";
      case "pending":
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  const getTimeElapsed = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registered':
        return (
          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'incident_resolved':
        return (
          <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'sos_alert':
        return (
          <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'status_update':
        return (
          <div className="flex-shrink-0 h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActivityContent = (activity) => {
    switch (activity.type) {
      case 'user_registered':
        return (
          <div className="ml-3">
            <p className="text-sm text-gray-800">New user registered <span className="font-medium">{activity.user}</span></p>
            <p className="text-xs text-gray-500">{getTimeElapsed(activity.timestamp)}</p>
          </div>
        );
      case 'incident_resolved':
        return (
          <div className="ml-3">
            <p className="text-sm text-gray-800">Incident <span className="font-medium">#{activity.incidentId}</span> marked as resolved</p>
            <p className="text-xs text-gray-500">{getTimeElapsed(activity.timestamp)}</p>
          </div>
        );
      case 'sos_alert':
        return (
          <div className="ml-3">
            <p className="text-sm text-gray-800">New SOS alert from <span className="font-medium">{activity.user}</span></p>
            <p className="text-xs text-gray-500">{getTimeElapsed(activity.timestamp)}</p>
          </div>
        );
      default:
        return (
          <div className="ml-3">
            <p className="text-sm text-gray-800">Activity recorded</p>
            <p className="text-xs text-gray-500">{getTimeElapsed(activity.timestamp)}</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">VithU Dashboard</h1>
        <p className="text-gray-600">Overview and real-time monitoring</p>
        {error && (
          <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
            Warning: Some data could not be loaded ({error}). Showing partial results.
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">{stats.activeAlerts}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/incidents?status=active" className="text-sm text-red-600 hover:underline">View all active alerts</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/incidents?status=pending" className="text-sm text-yellow-600 hover:underline">View pending reports</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved Cases</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolvedCases}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/incidents?status=resolved" className="text-sm text-green-600 hover:underline">View all resolved cases</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Registered Users</p>
              <p className="text-2xl font-bold text-blue-600">{stats.registeredUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/users" className="text-sm text-blue-600 hover:underline">View all users</Link>
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Recent Incidents</h2>
          <Link href="/incidents" className="text-sm text-blue-600 hover:underline">View all incidents</Link>
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
              {recentIncidents.length > 0 ? (
                recentIncidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-full flex items-center justify-center text-red-700">
                          {incident.userID.charAt(0).toUpperCase()}
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
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No recent incidents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map and Activity Log sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Heatmap */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Incident Heatmap</h2>
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
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start">
                  {getActivityIcon(activity.type)}
                  {getActivityContent(activity)}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No recent activity recorded</p>
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link href="/activity-log" className="text-sm text-blue-600 hover:underline">View all activity</Link>
          </div>
        </div>
      </div>
    </div>
  );
}