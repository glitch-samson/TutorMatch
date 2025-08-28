// API Client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    // Validate endpoint
    if (!endpoint) {
      throw new Error('API endpoint is required');
    }

    // Check for undefined values in the endpoint
    if (endpoint.includes('undefined')) {
      console.error('Endpoint contains undefined value:', endpoint);
      throw new Error(`Invalid endpoint: ${endpoint} contains undefined values`);
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    console.log('Making API request:', {
      method: config.method || 'GET',
      url,
      headers: { ...config.headers, Authorization: config.headers.Authorization ? '[HIDDEN]' : 'None' },
      body: config.body ? 'Present' : 'None'
    });

    try {
      const response = await fetch(url, config);

      if (!response) {
        throw new Error('No response received from server');
      }

      console.log('API response status:', response.status, response.statusText);

      // Read the response body safely - only once
      let data;
      let responseText = '';

      try {
        // Check if response has already been consumed
        if (response.bodyUsed) {
          console.warn('Response body already consumed');
          data = {
            message: `Response body already consumed (status: ${response.status})`,
            status: response.ok ? 'success' : 'error'
          };
        } else {
          // Read the response body only once
          responseText = await response.text();

          if (responseText) {
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('Failed to parse response as JSON:', parseError);
              data = {
                message: responseText,
                status: 'error'
              };
            }
          } else {
            data = {
              message: `Empty response from server (status: ${response.status})`,
              status: response.ok ? 'success' : 'error'
            };
          }
        }
      } catch (readError) {
        console.error('Failed to read response body:', readError);
        // Don't try to read the response again if it failed
        data = {
          message: `Failed to read response: ${readError.message}`,
          status: 'error'
        };
      }

      console.log('API response data:', data);

      if (!response.ok) {
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText,
          url,
          data,
          responseText: responseText.substring(0, 500) // Log first 500 chars for debugging
        });

        // Provide more specific error messages
        let errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;

        if (response.status === 404) {
          errorMessage = data.message || `Endpoint not found: ${endpoint}`;
        } else if (response.status === 500) {
          errorMessage = data.message || 'Internal server error';
        } else if (response.status === 401) {
          errorMessage = data.message || 'Unauthorized - please log in again';
        } else if (response.status === 403) {
          errorMessage = data.message || 'Access forbidden';
        }

        throw new Error(errorMessage);
      }

      // Ensure data is always an object
      return data || { status: 'success', data: null };
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);

      // Enhance error with more context
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check if the backend server is running on http://localhost:1999');
      }

      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
