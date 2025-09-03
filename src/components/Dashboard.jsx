import { Calendar, Users, BookOpen, TrendingUp, Clock, Star, DollarSign, MessageCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { userAPI, tutorAPI, bookingAPI } from '../services/api';
import { useApi } from '../hooks/useApi';

const Dashboard = ({ currentUser, onNavigate }) => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingLessons: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalStudents: 0,
    hoursCompleted: 0,
    completedLessons: 0,
    totalSpent: 0,
    hoursLearned: 0
  });

  const [earningsReport, setEarningsReport] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    totalSessions: 0,
    avgSessionEarnings: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { execute } = useApi();
  const earningsRef = useRef(null);
  const upcomingRef = useRef(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch dashboard data from API
        let dashboardResponse;
        if (currentUser.type === 'tutor') {
          dashboardResponse = await execute(() => tutorAPI.getDashboardStats());

          // Fetch earnings report for tutors
          try {
            const earningsResponse = await execute(() => tutorAPI.getEarningsReport());
            setEarningsReport(earningsResponse.data || {
              totalEarnings: 0,
              thisMonth: 0,
              lastMonth: 0,
              totalSessions: 0,
              avgSessionEarnings: 0
            });

            // Show warning if using fallback data
            if (earningsResponse.fallback) {
              console.warn('Using fallback earnings data - endpoint may not be available');
            }
          } catch (earningsError) {
            console.error('Failed to load earnings report:', earningsError);
            // Use fallback data on error
            setEarningsReport({
              totalEarnings: 0,
              thisMonth: 0,
              lastMonth: 0,
              totalSessions: 0,
              avgSessionEarnings: 0
            });
          }
        } else {
          dashboardResponse = await execute(() => userAPI.getDashboardStats());
        }
        const data = dashboardResponse.data || {};

        // Show warning if using fallback data
        if (dashboardResponse.fallback) {
          console.warn('Using fallback dashboard data - API may not be returning data properly');
        }

        // Stats - handle both nested (data.stats.*) and direct (data.*) structures
        const statsData = data.stats || data;
        const favTutorsCount = typeof statsData.favoriteTutorsCount === 'number'
          ? statsData.favoriteTutorsCount
          : Array.isArray(data.favoriteTutors) ? data.favoriteTutors.length : 0;
        setStats({
          totalBookings: Number(statsData.totalBookings) || 0,
          completedLessons: Number(statsData.completedLessons) || 0,
          totalSpent: Number(statsData.totalSpent) || 0,
          hoursLearned: Number(statsData.hoursLearned ?? statsData.totalHoursLearned) || 0,
          totalStudents: Number(statsData.totalStudents ?? favTutorsCount) || 0,
          totalEarnings: Number(statsData.totalEarnings) || 0,
          averageRating: Number(statsData.averageRating) || 0,
          hoursCompleted: Number(statsData.hoursCompleted) || 0,
        });

        // Fetch Recent Activity separately for tutors
        if (currentUser.type === 'tutor') {
          try {
            const activityResponse = await execute(() => tutorAPI.getRecentActivity());
            const activityData = activityResponse.data || [];
            const mappedActivity = Array.isArray(activityData)
              ? activityData.map(a => ({
                  id: a.date || a.id || a._id || Math.random(),
                  message: a.action || a.message || a.description || 'Activity',
                  time: a.date ? new Date(a.date).toLocaleString() : '',
                  icon: 'Calendar',
                  status: a.status === 'pending' ? 'upcoming' : a.status
                }))
              : [];
            setRecentActivity(mappedActivity);
          } catch (activityError) {
            console.error('Failed to load recent activity:', activityError);
            setRecentActivity([]);
          }

          // Use pending bookings as upcoming lessons for tutors
          try {
            const bookingsRes = await execute(() => tutorAPI.getBookings(), { silent: true });
            const bookings = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
            const pending = bookings.filter(b => b.status === 'pending' || b.status === 'upcoming');
            const mappedLessons = pending.map(b => ({
              id: b._id || b.id || Math.random(),
              otherParty: b.studentId?.fullName || b.student?.fullName || 'Unknown Student',
              tutor: b.studentId?.fullName || b.student?.fullName || 'Unknown Student',
              subject: b.subject || '',
              duration: b.duration ? `${b.duration}h` : '',
              time: b.scheduledDate ? new Date(b.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              status: b.status === 'pending' ? 'upcoming' : b.status,
              totalCost: b.totalAmount || b.hourlyRate || 0,
            }));
            setUpcomingLessons(mappedLessons);
          } catch (lessonsError) {
            console.error('Failed to load upcoming lessons (bookings):', lessonsError);
            setUpcomingLessons([]);
          }
        } else {
          // For students, use the existing logic from the main dashboard call
          const activityData = data.recentActivity || [];
          const mappedActivity = Array.isArray(activityData)
            ? activityData.map(a => ({
                id: a.date || a.id || Math.random(),
                message: a.action || a.message || 'Activity',
                time: a.date ? new Date(a.date).toLocaleString() : '',
                icon: a.type === 'rating' ? 'Star' : a.type === 'booking' ? 'Calendar' : 'BookOpen',
                status: a.status === 'pending' ? 'upcoming' : a.status
              }))
            : [];
          setRecentActivity(mappedActivity);

          const lessonsData = data.upcomingLessons || [];
          const mappedLessons = Array.isArray(lessonsData)
            ? lessonsData.map(l => ({
                id: l._id || l.id || l.date || Math.random(),
                // For students, show tutor info
                otherParty: l.tutorId?.fullName || l.tutor?.fullName || 'Unknown Tutor',
                tutor: l.tutorId?.fullName || l.tutor?.fullName || 'Unknown Tutor',
                subject: l.subject || '',
                duration: l.duration ? `${l.duration}h` : '',
                time: l.scheduledDate ? new Date(l.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                status: l.status === 'pending' ? 'upcoming' : l.status,
                totalCost: l.totalAmount || l.hourlyRate || 0,
              }))
            : [];
          setUpcomingLessons(mappedLessons);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setIsLoading(false);
      }
    };

    loadDashboardData();

    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [currentUser.type, execute]);

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );


  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {currentUser.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Here's what's happening with your {currentUser.type} account.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentUser.type === 'tutor' ? (
          <>
            <StatCard
              title="Total Bookings"
              value={stats.totalBookings}
              icon={Calendar}
              color="bg-primary-500"
            />
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              color="bg-accent-500"
            />
            <StatCard
              title="Total Earnings"
              value={`$${earningsReport.totalEarnings || stats.totalEarnings}`}
              icon={DollarSign}
              color="bg-secondary-500"
            />
            <StatCard
              title="Average Rating"
              value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'No ratings yet'}
              icon={Star}
              color="bg-yellow-500"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Bookings"
              value={stats.totalBookings}
              icon={Calendar}
              color="bg-primary-500"
            />
            <StatCard
              title="Completed Lessons"
              value={stats.completedLessons}
              icon={BookOpen}
              color="bg-accent-500"
            />
            <StatCard
              title="Hours Learned"
              value={`${Math.round(stats.hoursLearned)}h`}
              icon={Clock}
              color="bg-secondary-500"
            />
            <StatCard
              title="Total Spent"
              value={`$${stats.totalSpent}`}
              icon={DollarSign}
              color="bg-yellow-500"
            />
          </>
        )}
      </div>

      {/* Earnings Report for Tutors */}
      {currentUser.type === 'tutor' && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Earnings Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">This Month</h4>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">${earningsReport.thisMonth}</p>
            </div>
            <div className="card p-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Last Month</h4>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">${earningsReport.lastMonth}</p>
            </div>
            <div className="card p-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Sessions</h4>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{earningsReport.totalSessions}</p>
            </div>
            <div className="card p-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg per Session</h4>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">${earningsReport.avgSessionEarnings}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => {
                const IconComponent = activity.icon === 'Calendar' ? Calendar : 
                                   activity.icon === 'MessageCircle' ? MessageCircle :
                                   activity.icon === 'Star' ? Star : BookOpen;
                return (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <IconComponent className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{activity.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Upcoming Lessons */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Lessons</h3>
          <div className="space-y-4">
            {upcomingLessons.length > 0 ? (
              upcomingLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{lesson.tutor}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{lesson.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lesson.time}</p>
                    <button className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming lessons</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentUser.type === 'tutor' ? (
            <>
              <button className="card p-4 text-left hover:shadow-md transition-shadow">
                <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Manage Schedule</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Update your availability</p>
              </button>
              <button className="card p-4 text-left hover:shadow-md transition-shadow">
                <Users className="h-6 w-6 text-accent-600 dark:text-accent-400 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">View Students</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">See all your students</p>
              </button>
              <button className="card p-4 text-left hover:shadow-md transition-shadow">
                <TrendingUp className="h-6 w-6 text-secondary-600 dark:text-secondary-400 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Earnings Report</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">View detailed earnings</p>
              </button>
            </>
          ) : (
            <>
              <button className="card p-4 text-left hover:shadow-md transition-shadow">
                <Users className="h-6 w-6 text-primary-600 dark:text-primary-400 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Find Tutors</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Browse available tutors</p>
              </button>
              <button className="card p-4 text-left hover:shadow-md transition-shadow">
                <BookOpen className="h-6 w-6 text-accent-600 dark:text-accent-400 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">My Lessons</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">View lesson history</p>
              </button>
              <button className="card p-4 text-left hover:shadow-md transition-shadow">
                <Star className="h-6 w-6 text-secondary-600 dark:text-secondary-400 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Leave Reviews</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rate your tutors</p>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
