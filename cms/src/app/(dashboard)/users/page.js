"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Keep MOCK_USERS as fallback, but we'll use the API when possible
const MOCK_USERS = [
  {
    _id: "67c217979e7b3f5dc5ed4142",
    email: "test2@gmail.com",
    mobileNumber: "9167787316",
    isOtpVerified: true,
    createdAt: "2025-02-28T20:07:51.819Z",
    updatedAt: "2025-02-28T20:45:25.955Z",
    __v: 0,
    dob: "1995-08-22T00:00:00.000Z",
    name: "messi",
    contacts: []
  },
  {
    _id: "67c217979e7b3f5dc5ed4143",
    email: "jane@example.com",
    mobileNumber: "9876543210",
    isOtpVerified: true,
    createdAt: "2025-03-01T10:15:20.123Z",
    updatedAt: "2025-03-20T15:30:45.789Z",
    __v: 0,
    dob: "1990-04-15T00:00:00.000Z",
    name: "Jane Doe",
    contacts: [
      { name: "Emergency Contact", relation: "Spouse", phone: "9988776655" }
    ]
  },
  {
    _id: "67c217979e7b3f5dc5ed4144",
    email: "john@example.com",
    mobileNumber: "8765432109",
    isOtpVerified: false,
    createdAt: "2025-03-10T08:20:15.456Z",
    updatedAt: "2025-03-18T12:10:25.123Z",
    __v: 0,
    dob: "1985-11-25T00:00:00.000Z",
    name: "John Smith",
    contacts: []
  }
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "updatedAt", direction: "desc" });
  const [usingMockData, setUsingMockData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  useEffect(() => {
    // Fetch users from the API
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        
        console.log("Fetching users from API...");
        // API endpoint from the Postman screenshot
        const apiUrl = "https://womensafety-1-5znp.onrender.com/admin/getAllUsers";
        
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          });
          
          console.log("API Response status:", response.status);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("API Response data:", data);
          
          // Process the data based on the API response structure
          if (Array.isArray(data)) {
            console.log("API returned direct array of users");
            setUsers(data);
            setUsingMockData(false);
          } else if (data && typeof data === 'object') {
            // Check if it's an object containing a users array
            const possibleArrayKeys = ['users', 'data', 'results', 'items', 'response'];
            
            let foundUsers = false;
            for (const key of possibleArrayKeys) {
              if (data[key] && Array.isArray(data[key])) {
                console.log(`Found users array in data.${key}`);
                setUsers(data[key]);
                setUsingMockData(false);
                foundUsers = true;
                break;
              }
            }
            
            // If no array was found but the response is an object that looks like a user
            if (!foundUsers && data._id && (data.email || data.mobileNumber)) {
              console.log("API returned a single user object, wrapping in array");
              setUsers([data]);
              setUsingMockData(false);
            } else if (!foundUsers) {
              // If it's not a recognized format, treat the whole object as the users array
              console.log("Could not identify array in response, using entire object");
              setUsers([data]);
              setUsingMockData(false);
            }
          } else {
            throw new Error("API returned unexpected data format");
          }
          
        } catch (apiError) {
          console.error("API fetch failed, using mock data:", apiError);
          setErrorMessage(`${apiError.message}. Using demo data instead.`);
          setUsers(MOCK_USERS);
          setUsingMockData(true);
        }
        
      } catch (error) {
        console.error("Error in fetch process:", error);
        setErrorMessage(`Error: ${error.message}`);
        // Final fallback to mock data
        setUsers(MOCK_USERS);
        setUsingMockData(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  // Format to calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Format time elapsed since last active
  const getTimeElapsed = (dateString) => {
    if (!dateString) return "N/A";
    
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

  // Count verified users
  const getVerifiedCount = () => {
    return users.filter(user => user.isOtpVerified).length;
  };

  // Count new users in the last 7 days
  const getNewUsersCount = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return users.filter(user => new Date(user.createdAt) >= sevenDaysAgo).length;
  };

  // Sort users based on sortConfig
  const sortedUsers = [...users].sort((a, b) => {
    if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
    if (!a[sortConfig.key]) return 1;
    if (!b[sortConfig.key]) return -1;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Filter users based on search term and status filter
  const filteredUsers = sortedUsers.filter(user => {
    const matchesSearch = 
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user._id && user._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.mobileNumber && user.mobileNumber.includes(searchTerm));
    
    // Using isOtpVerified as status since there's no direct status field
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && user.isOtpVerified) || 
      (statusFilter === "inactive" && !user.isOtpVerified);
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reload data from API
  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://womensafety-1-5znp.onrender.com/admin/getAllUsers', {
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
      
      if (Array.isArray(data)) {
        setUsers(data);
        setUsingMockData(false);
        setErrorMessage("");
      } else if (data && typeof data === 'object') {
        // Handle potential object with users array
        const possibleArrayKeys = ['users', 'data', 'results', 'items', 'response'];
        
        let foundUsers = false;
        for (const key of possibleArrayKeys) {
          if (data[key] && Array.isArray(data[key])) {
            setUsers(data[key]);
            setUsingMockData(false);
            setErrorMessage("");
            foundUsers = true;
            break;
          }
        }
        
        if (!foundUsers) {
          throw new Error("API did not return an array or object with users");
        }
      } else {
        throw new Error("API did not return an array");
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      setErrorMessage(`Failed to refresh: ${error.message}`);
      // Keep using the current data
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600">Manage registered users and their emergency contacts</p>
          {usingMockData && (
            <div className="flex items-center mt-2">
              <p className="text-sm text-amber-600">
                ⚠️ Using demo data - API connection failed. {errorMessage}
              </p>
              <button 
                onClick={handleRefreshData}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 w-full md:w-auto">
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Verified</option>
              <option value="inactive">Unverified</option>
            </select>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
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
              <p className="text-gray-500 text-sm">Verified Users</p>
              <p className="text-2xl font-bold text-gray-800">{getVerifiedCount()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">New Users (Last 7 Days)</p>
              <p className="text-2xl font-bold text-gray-800">{getNewUsersCount()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("_id")}
              >
                <div className="flex items-center">
                  User ID {getSortDirectionIndicator("_id")}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("name")}
              >
                <div className="flex items-center">
                  Name {getSortDirectionIndicator("name")}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("email")}
              >
                <div className="flex items-center">
                  Email {getSortDirectionIndicator("email")}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("mobileNumber")}
              >
                <div className="flex items-center">
                  Mobile {getSortDirectionIndicator("mobileNumber")}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("dob")}
              >
                <div className="flex items-center">
                  Age/DOB {getSortDirectionIndicator("dob")}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Emergency Contacts
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("updatedAt")}
              >
                <div className="flex items-center">
                  Last Active {getSortDirectionIndicator("updatedAt")}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("isOtpVerified")}
              >
                <div className="flex items-center">
                  Status {getSortDirectionIndicator("isOtpVerified")}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user._id.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-medium">
                          {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || "No Name"}</div>
                        <div className="text-sm text-gray-500">Registered {formatDate(user.createdAt)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.mobileNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{calculateAge(user.dob)} years</div>
                    <div className="text-sm text-gray-500">{user.dob ? formatDate(user.dob) : "Not set"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.contacts && user.contacts.length > 0 ? (
                        user.contacts.map((contact, index) => (
                          <div key={index} className="mb-1 last:mb-0">
                            <div className="font-medium text-gray-900">{contact.name}</div>
                            <div className="text-xs">{contact.relation || "Contact"} • {contact.phone}</div>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400">No emergency contacts</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getTimeElapsed(user.updatedAt)}</div>
                    <div className="text-sm text-gray-500">{user.updatedAt ? new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isOtpVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.isOtpVerified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/users/${user._id}`} className="text-blue-600 hover:text-blue-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
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
))
) : (
<tr>
  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
    No users found. Please adjust your search or filters.
  </td>
</tr>
)}
</tbody>
</table>
</div>

{/* Pagination */}
<div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
  <div className="flex-1 flex justify-between sm:hidden">
    <button 
     onClick={goToPreviousPage}
     disabled={currentPage === 1}
     className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
       currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
     }`}
   >
     Previous
   </button>
   <button 
     onClick={goToNextPage}
     disabled={currentPage === totalPages || totalPages === 0}
     className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
       currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
     }`}
   >
     Next
   </button>
  </div>
  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
    <div>
      <p className="text-sm text-gray-700">
        Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to <span className="font-medium">
          {Math.min(indexOfLastUser, filteredUsers.length)}
        </span> of{" "}
        <span className="font-medium">{filteredUsers.length}</span> results
      </p>
    </div>
    <div>
      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
            currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="sr-only">Previous</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        </nav>
        </div>
        </div>
        </div>
        </div>)}