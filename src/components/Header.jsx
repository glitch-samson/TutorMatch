import { Search, User, Bell, Home, Calendar, Heart, Settings as SettingsIcon, LogOut, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';

const Header = ({ currentUser, onAuthChange, onShowAuth, currentView, onNavigate }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  const handleSignOut = () => {
    onAuthChange(null);
    setShowUserMenu(false);
  };

  const handleNavigation = (view) => {
    onNavigate(view);
    setShowUserMenu(false);
  };

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'bookings', label: 'My Bookings', icon: Calendar },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'settings', label: 'Settings', icon: SettingsIcon }
    ];

    // Add student-specific navigation items
    if (currentUser?.type !== 'tutor') {
      baseItems.splice(1, 0,
        { id: 'search', label: 'Find Tutors', icon: Search },
      );
      baseItems.splice(3, 0,
        { id: 'wishlist', label: 'Wishlist', icon: Heart }
      );
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3 lg:py-0 min-h-[64px]">
          {/* Logo */}
          <div className="flex items-center order-1">
            <button 
              onClick={() => handleNavigation('home')}
              className="flex-shrink-0"
            >
              <h1 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">TutorMatch</h1>
            </button>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 sm:space-x-4 order-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>

            {currentUser ? (
              <>
                {/* Notifications */}
                <button className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors relative rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <img
                      src={currentUser.avatar}
                      alt="Profile"
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block">
                      {currentUser.name}
                    </span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                        <span className="inline-block mt-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full capitalize">
                          {currentUser.type}
                        </span>
                      </div>

                      {/* Mobile Navigation Items */}
                      <div className="block md:hidden border-b border-gray-100 dark:border-gray-700">
                        {navigationItems.map(item => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNavigation(item.id)}
                              className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                currentView === item.id
                                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <Icon className="h-4 w-4 mr-3" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onShowAuth(true)}
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-2 sm:px-3 py-2 text-sm font-medium transition-colors hidden sm:block"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onShowAuth(true)}
                  className="btn btn-primary text-sm px-3 py-2"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Navigation - Hidden on mobile, inline for desktop */}
          {currentUser && (
            <nav className="hidden md:flex w-full order-3 lg:order-2 lg:w-auto lg:flex-1 lg:mx-8 mt-3 lg:mt-0">
              <div className="flex flex-wrap justify-center lg:justify-center gap-1 sm:gap-2">
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                        currentView === item.id
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
