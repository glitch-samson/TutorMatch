import { apiClient } from '../lib/apiClient';

// Auth API
export const authAPI = {
  async login(credentials, userType = 'user') {
    const { email, password } = credentials;
    
    console.log(`Attempting login for ${userType}:`, email);
    
    try {
      const endpoint = userType === 'tutor' ? '/tutors/signin' : '/users/signin';
      const response = await apiClient.post(endpoint, { email, password });

      if (response.status === 'success' && response.data.token) {
        // Set the token for future requests
        apiClient.setToken(response.data.token);
        
        console.log('Login successful');
        
        // Extract user/tutor data and token separately
        const { token, ...userData } = response.data;
        const userKey = userType === 'tutor' ? 'tutor' : 'user';
        
        return {
          success: true,
          data: userData[userKey] || userData,
          token: token,
          message: response.message
        };
      }

      throw new Error('Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Invalid email or password');
    }
  },

  async register(userData) {
    const { userType, ...data } = userData;
    
    console.log(`Attempting registration for ${userType}:`, data.email);
    
    try {
      const endpoint = userType === 'tutor' ? '/tutors/signup' : '/users/signup';
      
      // Prepare registration data based on user type
      const registrationData = {
        fullName: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        location: data.location || '',
      };

      // Add tutor-specific fields
      if (userType === 'tutor') {
        registrationData.bio = data.bio || '';
        registrationData.education = data.education || '';
        registrationData.experience = parseInt(data.experience) || 0;
        registrationData.hourlyRate = parseInt(data.hourlyRate) || 0;
        registrationData.subjects = data.subjects || [];
        registrationData.languages = data.languages || ['English'];
      }

      console.log('Sending registration request to:', endpoint);
      console.log('Registration data:', { ...registrationData, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' });

      const response = await apiClient.post(endpoint, registrationData);
      
      console.log('Registration response:', response);

      if (response.status === 'success' && response.data.token) {
        // Set the token for future requests
        apiClient.setToken(response.data.token);
        
        console.log('Registration successful');
        
        // Extract user/tutor data and token separately
        const { token, ...userData } = response.data;
        const userKey = userType === 'tutor' ? 'tutor' : 'user';
        
        return {
          success: true,
          data: userData[userKey] || userData,
          token: token,
          message: response.message
        };
      }

      console.error('Registration failed - invalid response:', response);
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Registration failed';
        throw new Error(errorMessage);
      } else if (error.request) {
        // Network error
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Other error
        throw new Error(error.message || 'Registration failed');
      }
    }
  },

  async logout() {
    console.log('Logging out...');
    apiClient.setToken(null);
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }
};

// User API
export const userAPI = {
  async getProfile() {
    try {
      console.log('Fetching user profile...');
      const response = await apiClient.get('/users/me');
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data
        };
      }
      
      throw new Error('Failed to fetch profile');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async updateProfile(updates) {
    try {
      console.log('Updating user profile...');
      const response = await apiClient.put('/users/profile', updates);
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: 'Profile updated successfully'
        };
      }
      
      throw new Error('Failed to update profile');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async getDashboardStats() {
    try {
      console.log('Fetching user dashboard stats...');
      const response = await apiClient.get('/users/dashboard');
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: true,
        data: {
          totalBookings: 0,
          upcomingLessons: 0,
          completedLessons: 0,
          totalSpent: '0.00',
          hoursLearned: 0
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: true,
        data: {
          totalBookings: 0,
          upcomingLessons: 0,
          completedLessons: 0,
          totalSpent: '0.00',
          hoursLearned: 0
        }
      };
    }
  },

  async getRecentActivity() {
    try {
      console.log('Fetching user recent activity...');
      const response = await apiClient.get('/users/dashboard');
      
      if (response.status === 'success' && response.data.recentActivity) {
        return {
          success: true,
          data: response.data.recentActivity
        };
      }
      
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return {
        success: true,
        data: []
      };
    }
  },

  async getUpcomingLessons() {
    try {
      console.log('Fetching upcoming lessons...');
      const response = await apiClient.get('/users/dashboard');
      
      if (response.status === 'success' && response.data.upcomingLessons) {
        return {
          success: true,
          data: response.data.upcomingLessons
        };
      }
      
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error fetching upcoming lessons:', error);
      return {
        success: true,
        data: []
      };
    }
  }
};

// Tutor API
export const tutorAPI = {
  async getProfile() {
    try {
      console.log('Fetching tutor profile...');
      const response = await apiClient.get('/tutors/profile/me');
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data
        };
      }
      
      throw new Error('Failed to fetch tutor profile');
    } catch (error) {
      console.error('Error fetching tutor profile:', error);
      throw error;
    }
  },

  async updateProfile(updates) {
    try {
      console.log('Updating tutor profile...');
      const response = await apiClient.put('/tutors/profile', updates);
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: 'Profile updated successfully'
        };
      }
      
      throw new Error('Failed to update profile');
    } catch (error) {
      console.error('Error updating tutor profile:', error);
      throw error;
    }
  },

  async getDashboardStats() {
    try {
      console.log('Fetching tutor dashboard stats...');
      const response = await apiClient.get('/tutors/dashboard/stats');
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: true,
        data: {
          totalBookings: 0,
          upcomingLessons: 0,
          totalEarnings: '0.00',
          averageRating: 0,
          totalStudents: 0,
          hoursCompleted: 0
        }
      };
    } catch (error) {
      console.error('Error fetching tutor dashboard stats:', error);
      return {
        success: true,
        data: {
          totalBookings: 0,
          upcomingLessons: 0,
          totalEarnings: '0.00',
          averageRating: 0,
          totalStudents: 0,
          hoursCompleted: 0
        }
      };
    }
  },

  async getRecentActivity() {
    try {
      console.log('Fetching tutor recent activity...');
      const response = await apiClient.get('/tutors/dashboard/activity');
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error fetching tutor recent activity:', error);
      return {
        success: true,
        data: []
      };
    }
  },

  async getUpcomingLessons() {
    try {
      console.log('Fetching tutor upcoming lessons...');
      const response = await apiClient.get('/tutors/dashboard/upcoming');

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data || []
        };
      }

      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error fetching tutor upcoming lessons:', error);
      return {
        success: true,
        data: []
      };
    }
  },

  async getBookings() {
    try {
      console.log('Fetching tutor bookings...');
      const response = await apiClient.get('/tutors/bookings/all');

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data?.bookings || [],
          pagination: {
            totalPages: response.data?.totalPages || 1,
            currentPage: response.data?.currentPage || 1,
            total: response.data?.total || 0
          }
        };
      }

      return {
        success: true,
        data: [],
        pagination: {
          totalPages: 1,
          currentPage: 1,
          total: 0
        }
      };
    } catch (error) {
      console.error('Error fetching tutor bookings:', error);
      return {
        success: true,
        data: [],
        error: error.message,
        pagination: {
          totalPages: 1,
          currentPage: 1,
          total: 0
        }
      };
    }
  },

  async markLessonAsCompleted(lessonId) {
    try {
      console.log('Marking booking as completed:', lessonId);
      const response = await apiClient.post(`/tutors/lessons/${lessonId}/complete`);

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: 'Booking marked as completed successfully'
        };
      }

      throw new Error('Failed to mark booking as completed');
    } catch (error) {
      console.error('Error marking booking as completed:', error);
      throw error;
    }
  },

  async getEarningsReport() {
    try {
      console.log('Fetching tutor earnings report...');
      const response = await apiClient.get('/tutors/report/earnings');

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: true,
        data: {
          totalEarnings: 0,
          thisMonth: 0,
          lastMonth: 0,
          totalSessions: 0,
          avgSessionEarnings: 0
        }
      };
    } catch (error) {
      console.error('Error fetching earnings report:', error);

      // Check if it's a 404 (endpoint doesn't exist) or other error
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.warn('Earnings report endpoint not available, using fallback data');
      }

      return {
        success: true,
        data: {
          totalEarnings: 0,
          thisMonth: 0,
          lastMonth: 0,
          totalSessions: 0,
          avgSessionEarnings: 0
        },
        fallback: true
      };
    }
  }
};

// Booking API
export const bookingAPI = {
 // services/api.js (inside bookingAPI)
async getBookings() {
    try {
      console.log('Fetching user bookings...');
      const response = await apiClient.get('/users/bookings');

      console.log('Bookings API response:', response);

      // Handle different response structures
      if (response && (response.status === 'success' || response.data)) {
        // Extract bookings array properly
        const bookings = Array.isArray(response.data?.bookings)
          ? response.data.bookings
          : Array.isArray(response.data)
          ? response.data
          : [];

        return {
          success: true,
          data: bookings,
          pagination: {
            totalPages: response.data?.totalPages || 1,
            currentPage: response.data?.currentPage || 1,
            total: response.data?.total || bookings.length
          }
        };
      }

      console.warn('Unexpected response structure:', response);
      return {
        success: true,
        data: [],
        pagination: {
          totalPages: 1,
          currentPage: 1,
          total: 0
        }
      };
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });

      // Return empty state instead of failing
      return {
        success: true,
        data: [],
        error: error.message,
        pagination: {
          totalPages: 1,
          currentPage: 1,
          total: 0
        }
      };
    }
  },



  async createBooking(bookingData) {
    try {
      console.log('Creating booking:', bookingData);
      
      const response = await apiClient.post('/users/bookings', {
        tutorId: bookingData.tutorId,
        subject: bookingData.subject,
        scheduledDate: new Date(`${bookingData.date}T${bookingData.time}`).toISOString(),
        duration: bookingData.duration,
        notes: bookingData.message,
        meetingPreference: 'zoom'
      });

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: 'Booking created successfully'
        };
      }
      
      throw new Error('Failed to create booking');
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  async cancelBooking(bookingId) {
    try {
      console.log('Cancelling booking:', bookingId);
      const response = await apiClient.put(`/users/bookings/${bookingId}/cancel`);
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: 'Booking cancelled successfully'
        };
      }
      
      throw new Error('Failed to cancel booking');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }
};

// Tutors API (for searching and viewing tutors)
export const tutorsAPI = {
  async getTutors(filters = {}) {
    try {
      console.log('Fetching tutors with filters:', filters);
      
      const params = {
        page: 1,
        limit: 20,
        ...(filters.subject && { subject: filters.subject }),
        ...(filters.location && { location: filters.location }),
        ...(filters.priceRange && this.parsePriceRange(filters.priceRange)),
        ...(filters.rating && { minRating: filters.rating }),
        sortBy: 'rating',
        sortOrder: 'desc'
      };

      console.log('API params:', params);
      const response = await apiClient.get('/users/search-tutors', params);
      console.log('Raw API response:', response);
      
      if (response.status === 'success') {
        // The API returns { tutors: [...], totalPages: 1, currentPage: 1, total: 4 }
        const tutorsArray = response.data.tutors || response.data;
        console.log('Tutors data:', tutorsArray);
        return {
          success: true,
          data: Array.isArray(tutorsArray) ? tutorsArray : []
        };
      }
      
      console.log('API response not successful, returning empty array');
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error fetching tutors:', error);
      return {
        success: true,
        data: []
      };
    }
  },

  async getTutor(tutorId) {
    try {
      console.log('Fetching tutor:', tutorId);
      const response = await apiClient.get(`/tutors/${tutorId}`);
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data
        };
      }
      
      throw new Error('Tutor not found');
    } catch (error) {
      console.error('Error fetching tutor:', error);
      throw error;
    }
  },

  parsePriceRange(priceRange) {
    const [min, max] = priceRange.split('-');
    const result = {};
    
    if (min) result.minRate = parseInt(min);
    if (max && max !== '+') result.maxRate = parseInt(max);
    
    return result;
  }
};

// Reviews API
export const reviewsAPI = {
  async createReview(reviewData) {
    try {
      console.log('Creating review:', reviewData);
      
      const response = await apiClient.post(`/users/tutor/${reviewData.tutorId}/rate`, {
        rating: reviewData.rating,
        comment: reviewData.comment,
        bookingId: reviewData.bookingId
      });

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: 'Review submitted successfully'
        };
      }
      
      throw new Error('Failed to create review');
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }
};

// Wishlist API
export const wishlistAPI = {
  async getWishlist() {
    try {
      console.log('Fetching wishlist...');
      const response = await apiClient.get('/users/wishlist');

      if (response.status === 'success') {
        return {
          success: true,
          data: Array.isArray(response.data) ? response.data : (response.data?.wishlist || [])
        };
      }

      throw new Error('Failed to fetch wishlist');
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  },

  async addToWishlist(tutorId) {
    try {
      console.log('Adding to wishlist:', tutorId);
      const response = await apiClient.post(`/users/wishlist/${tutorId}`, {});

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Added to wishlist'
        };
      }

      throw new Error(response.message || 'Failed to add to wishlist');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  async removeFromWishlist(tutorId) {
    try {
      console.log('Removing from wishlist:', tutorId);
      const response = await apiClient.delete(`/users/wishlist/${tutorId}`);

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Removed from wishlist'
        };
      }

      throw new Error(response.message || 'Failed to remove from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }
};

// Settings API (using profile endpoints)
export const settingsAPI = {
  async getSettings() {
    try {
      // Settings are part of user profile
      const response = await userAPI.getProfile();
      return {
        success: true,
        data: response.data.settings || {}
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {
        success: true,
        data: {}
      };
    }
  },

  async updateSettings(settings) {
    try {
      const response = await userAPI.updateProfile({ settings });
      return {
        success: true,
        data: settings,
        message: 'Settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};
