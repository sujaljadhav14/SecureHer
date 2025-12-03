import axios from 'axios';
import { API_BASE_URL } from '@env';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add auth token (placeholder for now)
api.interceptors.request.use(
    async (config) => {
        // TODO: Get token from AsyncStorage and add to headers
        // const token = await AsyncStorage.getItem('userToken');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
