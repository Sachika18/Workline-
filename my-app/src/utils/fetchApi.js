// A fetch-based API utility to replace axios

const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to handle common fetch options
const createFetchOptions = (method, data = null) => {
  const token = localStorage.getItem('token');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  // Add authorization header if token exists
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add body for POST, PUT, PATCH requests
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = JSON.stringify(data);
  }
  
  return options;
};

// Helper function to handle response
const handleResponse = async (response) => {
  console.log(`Response status: ${response.status} for ${response.url}`);
  
  // Check if the response is ok (status in the range 200-299)
  if (!response.ok) {
    console.error(`Error response for ${response.url}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()])
    });
    
    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      console.error('Authentication error detected');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // For 400 errors, provide more context
    if (response.status === 400) {
      console.error('Bad request error. This might be due to missing or invalid parameters.');
    }
    
    // For 500 errors, provide more context
    if (response.status === 500) {
      console.error('Server error occurred. This might be due to a database connection issue or an unhandled exception on the server.');
    }
    
    // Try to parse error response
    let errorData;
    try {
      const text = await response.text();
      console.log('Error response text:', text);
      try {
        errorData = text ? JSON.parse(text) : { message: response.statusText };
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        errorData = { message: text || response.statusText };
      }
    } catch (e) {
      console.error('Error reading response text:', e);
      errorData = { message: response.statusText };
    }
    
    console.error('Error data:', errorData);
    
    // Create an error object with additional information
    const error = new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  
  // For empty responses (like 204 No Content)
  if (response.status === 204) {
    return null;
  }
  
  // Parse JSON response
  return await response.json();
};

// API methods
const fetchApi = {
  // GET request
  get: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('GET');
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  },
  
  // POST request
  post: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('POST', data);
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },
  
  // PUT request
  put: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('PUT', data);
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`PUT ${endpoint} error:`, error);
      throw error;
    }
  },
  
  // PATCH request
  patch: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('PATCH', data);
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`PATCH ${endpoint} error:`, error);
      throw error;
    }
  },
  
  // DELETE request
  delete: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('DELETE');
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  }
};

export default fetchApi;