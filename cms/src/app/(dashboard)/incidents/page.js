"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function IncidentsPage() {
  // Existing state values
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // Add states for handling status and priority updates
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  // Fetch incidents from API
  useEffect(() => {
    const fetchIncidents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://womensafety-1-5znp.onrender.com/admin/getAllIncidents');
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        setIncidents(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching incidents:", error);
        setError("Failed to load incidents. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date and time together
  const formatDateTime = (dateString) => {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  // Get time elapsed since incident
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
    switch (status?.toLowerCase()) {
      case "open":
      case "active":
        return "bg-red-100 text-red-800";
      case "in progress":
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color class
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Sort incidents based on sortConfig
  const sortedIncidents = [...incidents].sort((a, b) => {
    // Handle special case for createdAt or any date field
    if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
      const dateA = new Date(a[sortConfig.key]);
      const dateB = new Date(b[sortConfig.key]);
      
      if (sortConfig.direction === "asc") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    }
    
    // Handle nested properties like reportedBy.name
    if (sortConfig.key === 'reportedByName') {
      const valueA = a['reportedByName'] || (a.reportedBy && a.reportedBy.name) || '';
      const valueB = b['reportedByName'] || (b.reportedBy && b.reportedBy.name) || '';
      
      if (valueA < valueB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    }
    
    // General case
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Filter incidents based on search term and filters
  const filteredIncidents = sortedIncidents.filter(incident => {
    const reportedByName = incident.reportedByName || (incident.reportedBy && incident.reportedBy.name) || '';
    
    const matchesSearch = 
      reportedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.incidentId && incident.incidentId.toString().includes(searchTerm.toLowerCase())) ||
      (incident.type && incident.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (incident.location && incident.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
      (incident.status && incident.status.toLowerCase() === statusFilter.toLowerCase());
    
    const matchesType = typeFilter === "all" || 
      (incident.type && incident.type.toLowerCase() === typeFilter.toLowerCase());
    
    const matchesPriority = priorityFilter === "all" || 
      (incident.priority && incident.priority.toLowerCase() === priorityFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  // Get unique types from incidents
  const incidentTypes = [...new Set(incidents.map(incident => incident.type))].filter(Boolean);
  
  // Get unique statuses from incidents
  const incidentStatuses = [...new Set(incidents.map(incident => incident.status))].filter(Boolean);
  
  // Get unique priorities from incidents
  const incidentPriorities = [...new Set(incidents.map(incident => incident.priority))].filter(Boolean);

  // Handle sorting
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // Handle opening incident detail modal
  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setIsDetailModalOpen(true);
  };

  // Handle updating incident status
  const updateIncidentStatus = async (incidentId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await fetch(`https://womensafety-1-5znp.onrender.com/admin/updateIncidentStatus/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      // Refresh the incidents list after update
      const refreshResponse = await fetch('https://womensafety-1-5znp.onrender.com/admin/getAllIncidents');
      if (refreshResponse.ok) {
        const newData = await refreshResponse.json();
        setIncidents(newData);
        
        // Update the selected incident to show the changes in the modal
        const updatedIncident = newData.find(inc => inc._id === incidentId);
        if (updatedIncident) {
          setSelectedIncident(updatedIncident);
        }
      }
      
    } catch (error) {
      console.error("Error updating incident status:", error);
      setError("Failed to update incident status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle updating incident priority
  const updateIncidentPriority = async (incidentId, newPriority) => {
    try {
      setUpdatingPriority(true);
      const response = await fetch(`https://womensafety-1-5znp.onrender.com/admin/updateIncidentPriority/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: newPriority }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update priority: ${response.status}`);
      }
      
      // Refresh the incidents list after update
      const refreshResponse = await fetch('https://womensafety-1-5znp.onrender.com/admin/getAllIncidents');
      if (refreshResponse.ok) {
        const newData = await refreshResponse.json();
        setIncidents(newData);
        
        // Update the selected incident to show the changes in the modal
        const updatedIncident = newData.find(inc => inc._id === incidentId);
        if (updatedIncident) {
          setSelectedIncident(updatedIncident);
        }
      }
      
    } catch (error) {
      console.error("Error updating incident priority:", error);
      setError("Failed to update incident priority. Please try again.");
    } finally {
      setUpdatingPriority(false);
    }
  };

  // Get incident type icon
  const getIncidentTypeIcon = (type) => {
    // Default icon for any type
    const defaultIcon = (
      <div className="bg-gray-500 p-2 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
    );

    // Match common types with appropriate icons
    if (!type) return defaultIcon;
    
    switch (type.toLowerCase()) {
      case "sos":
        return (
          <div className="bg-red-500 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "harassment":
        return (
          <div className="bg-orange-500 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v5a7 7 0 11-14 0V9a1 1 0 012 0v2.5a.5.5 0 001 0V4a1 1 0 012 0v4.5a.5.5 0 001 0V3z" />
            </svg>
          </div>
        );
      case "stalking":
        return (
          <div className="bg-purple-500 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "fire hazard":
        return (
          <div className="bg-red-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "unsafe area":
        return (
          <div className="bg-blue-500 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return defaultIcon;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Incident Management</h1>
          <p className="text-gray-600">Track and manage reported safety incidents</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Incident
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {incidentStatuses.map(status => (
                <option key={status} value={status.toLowerCase()}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {incidentTypes.map(type => (
                <option key={type} value={type.toLowerCase()}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {incidentPriorities.map(priority => (
                <option key={priority} value={priority.toLowerCase()}>{priority}</option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex-1">
              <div className="flex justify-center items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                <span>Filters</span>
              </div>
            </button>
            <button 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
                setPriorityFilter("all");
              }}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Incidents</p>
              <p className="text-2xl font-bold text-gray-800">{incidents.filter(i => i.status?.toLowerCase() === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-gray-800">{incidents.filter(i => i.status?.toLowerCase() === 'in progress').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Resolved Incidents</p>
              <p className="text-2xl font-bold text-gray-800">{incidents.filter(i => i.status?.toLowerCase() === 'resolved').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Incidents</p>
              <p className="text-2xl font-bold text-gray-800">{incidents.length}</p>
            </div>
          </div>
        </div>
      </div>

     {/* Incidents Table */}
<div className="bg-white rounded-lg shadow overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th 
          scope="col" 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          onClick={() => requestSort("incidentId")}
        >
          <div className="flex items-center">
            Incident ID {getSortDirectionIndicator("incidentId")}
          </div>
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Type
        </th>
        <th 
          scope="col" 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          onClick={() => requestSort("reportedByName")}
        >
          <div className="flex items-center">
            Reported By {getSortDirectionIndicator("reportedByName")}
          </div>
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Location
        </th>
        <th 
          scope="col" 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          onClick={() => requestSort("createdAt")}
        >
          <div className="flex items-center">
            Time {getSortDirectionIndicator("createdAt")}
          </div>
        </th>
        <th 
          scope="col" 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          onClick={() => requestSort("status")}
        >
          <div className="flex items-center">
            Status {getSortDirectionIndicator("status")}
          </div>
        </th>
        <th 
          scope="col" 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          onClick={() => requestSort("priority")}
        >
          <div className="flex items-center">
            Priority {getSortDirectionIndicator("priority")}
          </div>
        </th>
        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredIncidents.length > 0 ? (
        filteredIncidents.map((incident) => (
          <tr key={incident._id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">#{incident.incidentId}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                {getIncidentTypeIcon(incident.type)}
                <span className="ml-2 text-sm font-medium text-gray-900">{incident.type}</span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-medium">
                  {incident.reportedByName ? incident.reportedByName.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{incident.reportedByName || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{incident.reportedBy?._id || ''}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{incident.location || 'Unknown location'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{incident.time || formatTime(incident.createdAt)}</div>
              <div className="text-xs text-gray-500">{getTimeElapsed(incident.createdAt)}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                {incident.status || 'Unknown'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(incident.priority)}`}>
                {incident.priority || 'Unknown'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <div className="flex justify-center space-x-2">
                <button 
                  onClick={() => handleViewIncident(incident)}
                  className="text-blue-600 hover:text-blue-900"
                  title="View Details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button 
                  className="text-yellow-600 hover:text-yellow-900"
                  title="Edit Incident"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  className="text-red-600 hover:text-red-900"
                  title="Delete Incident"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
            {incidents.length > 0 ? 'No incidents match your filters' : 'No incidents found'}
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
{/* Incident Detail Modal */}
{isDetailModalOpen && selectedIncident && (
  <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-75 flex items-center justify-center">
    <div className="relative bg-white rounded-lg max-w-4xl w-full mx-4 shadow-xl">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Incident #{selectedIncident.incidentId} Details</h3>
        <button
          onClick={() => setIsDetailModalOpen(false)}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6 overflow-y-auto max-h-[80vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Incident ID</h4>
              <p className="text-base font-medium">#{selectedIncident.incidentId}</p>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Reported By</h4>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-medium">
                  {selectedIncident.reportedByName ? selectedIncident.reportedByName.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium">{selectedIncident.reportedByName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedIncident.reportedBy?._id || ''}</p>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Type</h4>
              <div className="flex items-center">
                {getIncidentTypeIcon(selectedIncident.type)}
                <span className="ml-2 font-medium">{selectedIncident.type || 'Unknown'}</span>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Date & Time</h4>
              <p className="text-base font-medium">{selectedIncident.time || formatDateTime(selectedIncident.createdAt)}</p>
              <p className="text-sm text-gray-500">{getTimeElapsed(selectedIncident.createdAt)}</p>
            </div>
          </div>
          
          <div>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
              <div className="flex items-center">
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(selectedIncident.status)}`}>
                  {selectedIncident.status || 'Unknown'}
                </span>
                {updatingStatus && (
                  <span className="ml-2">
                    <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                  </span>
                )}
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Priority</h4>
              <div className="flex items-center">
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getPriorityColor(selectedIncident.priority)}`}>
                  {selectedIncident.priority || 'Unknown'}
                </span>
                {updatingPriority && (
                  <span className="ml-2">
                    <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                  </span>
                )}
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
              <p className="text-base font-medium">{selectedIncident.location || 'Unknown location'}</p>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
              <p className="text-base">{selectedIncident.description || 'No description provided'}</p>
            </div>
          </div>
        </div>
        
        {/* Evidence Section */}
        <div className="border-t pt-6 mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Evidence</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Evidence */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-gray-500 mb-2">Image Evidence</h5>
              {selectedIncident.imageUrl ? (
                <div className="mb-2">
                  <div className="relative h-64 w-full">
                    <img 
                      src={selectedIncident.imageUrl} 
                      alt="Incident evidence" 
                      className="h-full w-full object-contain rounded-md border border-gray-200"
                    />
                  </div>
                  <a 
                    href={selectedIncident.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center mt-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View full image
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 text-gray-400 rounded-md">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No image evidence available</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Audio Evidence */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-gray-500 mb-2">Voice Statement</h5>
              {selectedIncident.audioUrl ? (
                <div className="mb-4">
                  <audio 
                    controls 
                    className="w-full"
                    src={selectedIncident.audioUrl}
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <a 
                    href={selectedIncident.audioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center mt-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Download audio
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-100 text-gray-400 rounded-md">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p>No voice statement available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 flex justify-end space-x-3 mt-4">
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          
          {selectedIncident.status?.toLowerCase() !== "resolved" && (
            <>
              <div className="relative group">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Update Status
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                  <div className="py-1">
                    <button 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      onClick={() => updateIncidentStatus(selectedIncident._id, "Active")}
                    >
                      Mark as Active
                    </button>
                    <button 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      onClick={() => updateIncidentStatus(selectedIncident._id, "In Progress")}
                    >
                      Mark as In Progress
                    </button>
                    <button 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      onClick={() => updateIncidentStatus(selectedIncident._id, "Resolved")}
                    >
                      Mark as Resolved
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <button className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
                  Update Priority
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                  <div className="py-1">
                    <button 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      onClick={() => updateIncidentPriority(selectedIncident._id, "High")}
                    >
                      Set High Priority
                    </button>
                    <button 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      onClick={() => updateIncidentPriority(selectedIncident._id, "Medium")}
                    >
                      Set Medium Priority
                    </button>
                    <button 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      onClick={() => updateIncidentPriority(selectedIncident._id, "Low")}
                    >
                      Set Low Priority
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
)}
</div>
  )};