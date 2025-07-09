import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5002',
  timeout: 10000,
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Handle API errors
    const message = error.response.data?.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api; 