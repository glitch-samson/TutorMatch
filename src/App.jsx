import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import FAQ from './components/FAQ';
import SearchFilters from './components/SearchFilters';
import TutorList from './components/TutorList';
import TutorProfile from './components/TutorProfile';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import AuthGuard from './components/AuthGuard';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import MyBookings from './components/MyBookings';
import Wishlist from './components/Wishlist';
import Settings from './components/Settings';
import { AlertManager, showAlert } from './components/CustomAlert';
import { ThemeProvider } from './components/ThemeProvider';
import { authAPI, userAPI, tutorAPI, bookingAPI, tutorsAPI } from './services/api';
import { useApi } from './hooks/useApi';
import { apiClient } from './lib/apiClient';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tutorsList, setTutorsList] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    priceRange: '',
    rating: '',
    verified: false,
    availableNow: false
  });

  const { execute: executeAuth } = useApi();
  const { execute: executeUser } = useApi();
  const { execute: executeTutor } = useApi();
  const { execute: executeBooking } = useApi();
  const { execute: executeTutors } = useApi();

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          console.log('Found stored auth data');
          apiClient.setToken(token);
          
          try {
            const parsedUser = JSON.parse(userData);
            await loadUserProfile(parsedUser);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setCurrentView('home');
          }
        } else {
          console.log('No stored auth data found');
          setCurrentView('home');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        showAlert('error', 'Failed to initialize authentication');
        setCurrentView('home');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Load user profile from backend
  const loadUserProfile = async (userData) => {
    try {
      console.log('Loading user profile for:', userData.email);
      
      let profileResponse;
      if (userData.type === 'tutor') {
        profileResponse = await executeTutor(() => tutorAPI.getProfile());
      } else {
        profileResponse = await executeUser(() => userAPI.getProfile());
      }
      
      if (profileResponse.data) {
        const fullUserData = {
          ...userData,
          ...profileResponse.data,
          type: userData.type || 'user'
        };

        setCurrentUser(fullUserData);
        setCurrentView('dashboard');
        
        // Store updated user data
        localStorage.setItem('userData', JSON.stringify(fullUserData));
        
        console.log('User profile loaded successfully');
      } else {
        // Use basic user data if profile fetch fails
        setCurrentUser(userData);
        setCurrentView('dashboard');
        console.log('Using basic user data');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Still set user with basic data
      setCurrentUser(userData);
      setCurrentView('dashboard');
    }
  };

  // Load tutors from backend
  useEffect(() => {
    const loadTutors = async () => {
      try {
        console.log('Loading tutors with filters:', filters);
        const response = await executeTutors(() => tutorsAPI.getTutors(filters));
        console.log('Tutors API response:', response);
        const tutorsData = Array.isArray(response.data) ? response.data : [];
        console.log('Setting tutors list:', tutorsData);
        setTutorsList(tutorsData);
      } catch (error) {
        console.error('Failed to load tutors:', error);
        showAlert('error', 'Failed to load tutors');
        setTutorsList([]);
      }
    };

    loadTutors();
  }, [filters, currentView, executeTutors]);

  // Filter tutors based on search criteria (client-side filtering for additional refinement)
  const filteredTutors = useMemo(() => {
    if (!tutorsList.length) return [];
    
    return tutorsList.filter(tutor => {
      // Search filter (additional client-side filtering)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = tutor.fullName?.toLowerCase().includes(searchTerm) || 
                           tutor.name?.toLowerCase().includes(searchTerm);
        const matchesSubject = tutor.subjects?.some(subject => 
          subject.toLowerCase().includes(searchTerm)
        );
        const matchesBio = tutor.bio?.toLowerCase().includes(searchTerm);
        if (!matchesName && !matchesSubject && !matchesBio) return false;
      }

      // Verified filter (client-side)
      if (filters.verified && !tutor.verified) {
        return false;
      }

      return true;
    });
  }, [tutorsList, filters]);

  const handleAuth = async (userData, isSignUp = false) => {
    try {
      console.log('Attempting authentication:', { isSignUp, email: userData.email, userType: userData.userType });
      
      let response;
      if (isSignUp) {
        console.log('Calling register API...');
        response = await executeAuth(() => authAPI.register(userData));
      } else {
        console.log('Calling login API...');
        response = await executeAuth(() => authAPI.login(userData, userData.userType));
      }

      console.log('Auth API response:', response);

      if (response.data && response.token) {
        const userWithType = {
          ...response.data,
          type: userData.userType || 'user'
        };

        console.log('Setting user data and token...');
        // Store auth data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(userWithType));
        
        setCurrentUser(userWithType);
        setCurrentView('dashboard');
        setShowAuthModal(false);
        
        showAlert('success', response.message || `Welcome ${isSignUp ? 'to TutorMatch' : 'back'}!`);
        console.log('Authentication successful');
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Auth failed:', error);
      showAlert('error', error.message || 'Authentication failed. Please try again.');
      throw error; // Re-throw to let AuthModal handle loading state
    }
  };

  const handleSignOut = async () => {
    try {
      await executeAuth(() => authAPI.logout());
      
      // Clear stored data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      setCurrentUser(null);
      setCurrentView('home');
      
      showAlert('success', 'Successfully signed out');
    } catch (error) {
      console.error('Sign out failed:', error);
      showAlert('error', 'Failed to sign out');
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      let response;
      if (currentUser.type === 'tutor') {
        response = await executeTutor(() => tutorAPI.updateProfile(updatedUser));
      } else {
        response = await executeUser(() => userAPI.updateProfile(updatedUser));
      }

      // Update current user state with new data
      const newUserData = { ...currentUser, ...response.data };
      setCurrentUser(newUserData);
      
      // Update stored user data
      localStorage.setItem('userData', JSON.stringify(newUserData));
      
      showAlert('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      showAlert('error', 'Failed to update profile');
    }
  };

  const handleGetStarted = (userType) => {
    if (!currentUser) {
      setShowAuthModal(true);
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleSelectTutor = async (tutor) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Get tutorId - handle both id and _id properties
      const tutorId = tutor.id || tutor._id;
      if (!tutorId) {
        console.warn('No tutor ID found, using tutor object directly');
        setSelectedTutor(tutor);
        setCurrentView('tutor-profile');
        return;
      }

      // Load full tutor profile from backend
      const response = await executeTutors(() => tutorsAPI.getTutor(tutorId));
      setSelectedTutor(response.data || tutor);
      setCurrentView('tutor-profile');
    } catch (error) {
      console.error('Failed to load tutor profile:', error);
      setSelectedTutor(tutor);
      setCurrentView('tutor-profile');
    }
  };

  const handleBooking = (tutor) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setSelectedTutor(tutor);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (bookingData) => {
    try {
      await executeBooking(() => bookingAPI.createBooking({
        ...bookingData,
        tutorId: bookingData.tutor.id
      }));

      setShowBookingModal(false);
      setCurrentView('bookings');
      
      showAlert('success', `Booking confirmed with ${bookingData.tutor.name || bookingData.tutor.fullName} for ${bookingData.date} at ${bookingData.time}!`);
    } catch (error) {
      console.error('Booking failed:', error);
      showAlert('error', 'Failed to create booking');
    }
  };

  const handleContactTutor = (tutor) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    
    showAlert('info', `Opening message interface with ${tutor.name || tutor.fullName}`, {
      title: 'Message',
      duration: 3000
    });
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  // Show simple loading while initializing
  if (isInitializing) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-4">
              TutorMatch
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Initializing...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Protected route check
  const protectedViews = ['dashboard', 'search', 'tutor-profile', 'profile', 'bookings', 'wishlist', 'settings'];
  const isProtectedRoute = protectedViews.includes(currentView);
  const shouldShowAuthGuard = isProtectedRoute && !currentUser;

  const renderCurrentView = () => {
    if (shouldShowAuthGuard) {
      return <AuthGuard onShowAuth={handleShowAuth} />;
    }

    // Redirect tutors from student-only views
    if (currentUser?.type === 'tutor' && (currentView === 'search' || currentView === 'wishlist')) {
      setCurrentView('dashboard');
      return <Dashboard currentUser={currentUser} onNavigate={handleNavigate} />;
    }

    switch (currentView) {
      case 'home':
        return <Hero onGetStarted={handleGetStarted} onNavigate={handleNavigate} />;
      
      case 'about':
        return <AboutUs />;
      
      case 'contact':
        return <ContactUs />;
      
      case 'faq':
        return <FAQ />;
      
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onNavigate={handleNavigate} />;
      
      case 'search':
        return (
          <>
            <SearchFilters filters={filters} onFiltersChange={setFilters} />
            <TutorList
              tutors={tutorsList}
              onSelectTutor={handleSelectTutor}
              onContactTutor={handleContactTutor}
            />
          </>
        );
      
      case 'tutor-profile':
        return selectedTutor ? (
          <TutorProfile
            tutor={selectedTutor}
            onBack={() => setCurrentView('search')}
            onBooking={handleBooking}
          />
        ) : null;
      
      case 'profile':
        return (
          <UserProfile
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      
      case 'bookings':
        return <MyBookings currentUser={currentUser} />;

      case 'wishlist':
        return (
          <Wishlist
            onSelectTutor={handleSelectTutor}
            onContactTutor={handleContactTutor}
          />
        );

      case 'settings':
        return (
          <Settings
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
          />
        );
      
      default:
        return <Hero onGetStarted={handleGetStarted} onNavigate={handleNavigate} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Header 
          currentUser={currentUser} 
          onAuthChange={handleSignOut}
          onShowAuth={handleShowAuth}
          currentView={currentView}
          onNavigate={handleNavigate}
        />
        
        <main>
          {['home', 'about', 'contact', 'faq'].includes(currentView) ? (
            renderCurrentView()
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderCurrentView()}
            </div>
          )}
        </main>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />

        {/* Booking Modal */}
        {showBookingModal && selectedTutor && currentUser && (
          <BookingModal
            tutor={selectedTutor}
            onClose={() => setShowBookingModal(false)}
            onConfirm={handleConfirmBooking}
          />
        )}

        {/* Custom Alert System */}
        <AlertManager />
      </div>
    </ThemeProvider>
  );
}

export default App;
