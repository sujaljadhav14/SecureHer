"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SafeZonesMap from "./SafeZonesMap";

const SafeZonesPage = () => {
  const [safeZonesData, setSafeZonesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState("7");

  useEffect(() => {
    const fetchSafeZonesData = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch from the API
        const response = await fetch('/api/safety');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        // Apply date filtering if needed
        const filteredData = filterDataByDate(data, dateFilter);
        setSafeZonesData(filteredData);
        setError(null);
      } catch (err) {
        console.error("Error fetching safe zones data:", err);
        setError(err.message);
        
        // Use mock data as fallback
        const mockData = [
          {
            _id: "mock1",
            lat: "19.076",
            lon: "72.8777",
            safetyRating: "8",
            police_presence: "high",
            street_lights: "high",
            people_density: "high",
            traffic: "moderate",
            dateTime: new Date().toISOString(),
            userDateTime: new Date().toISOString()
          },
          {
            _id: "mock2",
            lat: "19.0825",
            lon: "72.8907",
            safetyRating: "5",
            police_presence: "moderate",
            street_lights: "moderate",
            people_density: "moderate",
            traffic: "high",
            dateTime: new Date().toISOString(),
            userDateTime: new Date().toISOString()
          },
          {
            _id: "mock3",
            lat: "19.0625",
            lon: "72.8657",
            safetyRating: "3",
            police_presence: "low",
            street_lights: "low",
            people_density: "low",
            traffic: "low",
            dateTime: new Date().toISOString(),
            userDateTime: new Date().toISOString()
          }
        ];
        
        // Apply date filtering to mock data as well
        const filteredMockData = filterDataByDate(mockData, dateFilter);
        setSafeZonesData(filteredMockData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSafeZonesData();
  }, [dateFilter]);
  // Helper to filter data by date range
  const filterDataByDate = (data, daysFilter) => {
    if (!daysFilter || daysFilter === "all") return data;
    
    const daysAgo = parseInt(daysFilter, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return data.filter(zone => {
      const zoneDate = new Date(zone.dateTime);
      return zoneDate >= cutoffDate;
    });
  };

  // Get stats from the data
  const getStats = () => {
    if (!safeZonesData.length) return { safe: 0, moderate: 0, unsafe: 0, total: 0 };
    
    const safe = safeZonesData.filter(zone => zone.safetyRating >= 7).length;
    const moderate = safeZonesData.filter(zone => zone.safetyRating >= 4 && zone.safetyRating < 7).length;
    const unsafe = safeZonesData.filter(zone => zone.safetyRating < 4).length;
    
    return {
      safe,
      moderate,
      unsafe,
      total: safeZonesData.length
    };
  };

  const stats = getStats();

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Safe Zones</h1>
          <p className="text-gray-600">View and manage safety data across locations</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All Time</option>
          </select>
          <button className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Safe Zone
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Safe Zones</p>
              <p className="text-2xl font-bold text-gray-800">{stats.safe}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Moderate Zones</p>
              <p className="text-2xl font-bold text-gray-800">{stats.moderate}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Unsafe Zones</p>
              <p className="text-2xl font-bold text-gray-800">{stats.unsafe}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Locations</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <SafeZonesMap 
          safeZonesData={safeZonesData} 
          loading={isLoading} 
          error={error} 
        />
      </div>
      
      {/* Recent Safe Zone Reviews */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Recent Safety Reviews</h2>
          <Link href="/safe-zones/all" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Police</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lights</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">People</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traffic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeZonesData.slice(0, 5).map((zone) => (
                <tr key={zone._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{`${zone.lat.substring(0, 6)}, ${zone.lon.substring(0, 6)}`}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      parseInt(zone.safetyRating) >= 7 
                        ? 'bg-green-100 text-green-800' 
                        : parseInt(zone.safetyRating) >= 4 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {zone.safetyRating}/10
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{zone.police_presence}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{zone.street_lights}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{zone.people_density}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{zone.traffic}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(zone.dateTime).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {safeZonesData.length === 0 && !isLoading && (
          <div className="text-center py-4 text-gray-500">
            No safety data available. Try adjusting your filters or add new data.
          </div>
        )}
        
        {safeZonesData.length > 0 && (
          <div className="flex justify-center mt-4">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafeZonesPage;