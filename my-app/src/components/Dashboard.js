import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Dashboard.css'; // Import the CSS file here
import defaultAvatar from '../assets/avatar.png';
import AttendanceSummary from './AttendanceSummary';
import AnnouncementsList from './AnnouncementsList';
import QuickActions from './QuickActions';
import MobileMenu from './MobileMenu';
import profile from './Profile';
import enhancedNotifications from './EnhancedNotifications';

// Rest of your component remains the same

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [totalHours, setTotalHours] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState({
    attendanceRate: 98,
    completedTasks: 12,
    pendingRequests: 3,
    upcomingEvents: 2
  });

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on route change or screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Fetch user info and attendance data from the backend
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found: Redirecting to login');
          navigate('/login');
          return;
        }

        // Fetch user data
        const response = await fetch('http://localhost:8080/api/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            console.error('Forbidden: Redirecting to login');
            console.log('Token being sent:', token);
            navigate('/login');
          } else {
            setError('Failed to fetch user info');
            console.error('Failed to fetch user info');
          }
          return;
        }

        const data = await response.json();
        setUser(data);
        
        // Fetch today's attendance status
        const todayDate = new Date().toISOString().split('T')[0];
        const attendanceResponse = await fetch(`http://localhost:8080/api/attendance/today`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setTodayAttendance(attendanceData);
          
          // If user has checked in today
          if (attendanceData && attendanceData.checkInTime) {
            setIsCheckedIn(true);
            setCheckInTime(new Date(attendanceData.checkInTime));
            
            // If user has also checked out
            if (attendanceData.checkOutTime) {
              setIsCheckedIn(false);
              setCheckOutTime(new Date(attendanceData.checkOutTime));
              
              // Calculate hours worked
              const checkIn = new Date(attendanceData.checkInTime);
              const checkOut = new Date(attendanceData.checkOutTime);
              const hours = (checkOut - checkIn) / (1000 * 60 * 60);
              setTotalHours(hours);
            } else {
              // User is still checked in, calculate ongoing hours
              const now = new Date();
              const checkIn = new Date(attendanceData.checkInTime);
              const hours = (now - checkIn) / (1000 * 60 * 60);
              setTotalHours(hours);
            }
          }
        }
        
        // Fetch attendance history
        const historyResponse = await fetch(`http://localhost:8080/api/attendance/history`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setAttendanceHistory(historyData);
          
          // Update attendance rate in stats if we have history data
          if (historyData && historyData.length > 0) {
            const presentDays = historyData.filter(entry => entry.checkInTime).length;
            const totalWorkingDays = 21; // This could be calculated more accurately
            const rate = Math.round((presentDays / totalWorkingDays) * 100);
            setStats(prevStats => ({
              ...prevStats,
              attendanceRate: rate
            }));
          }
        }
        
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleCheckInOut = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (!isCheckedIn) {
        // Handle check-in
        const checkInResponse = await fetch(`http://localhost:8080/api/attendance/checkin`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkInTime: new Date().toISOString()
          })
        });

        if (!checkInResponse.ok) {
          throw new Error('Failed to check in');
        }

        const checkInData = await checkInResponse.json();
        
        // Update state with check-in information
        setIsCheckedIn(true);
        setCheckInTime(new Date());
        setTodayAttendance(checkInData);
        
        // Show success notification
        alert('Successfully checked in!');
      } else {
        // Handle check-out
        const checkOutResponse = await fetch(`http://localhost:8080/api/attendance/checkout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attendanceId: todayAttendance.id, // Send the ID of today's attendance record
            checkOutTime: new Date().toISOString()
          })
        });

        if (!checkOutResponse.ok) {
          throw new Error('Failed to check out');
        }

        const checkOutData = await checkOutResponse.json();
        
        // Update state with check-out information
        const endTime = new Date();
        setCheckOutTime(endTime);
        setIsCheckedIn(false);
        setTodayAttendance(checkOutData);
        
        // Calculate and update total hours
        const hours = (endTime - checkInTime) / (1000 * 60 * 60);
        setTotalHours(hours);
        
        // Show success notification
        alert('Successfully checked out!');
        
        // Refresh attendance history
        const historyResponse = await fetch(`http://localhost:8080/api/attendance/history`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setAttendanceHistory(historyData);
        }
      }
    } catch (error) {
      console.error(`Error during ${isCheckedIn ? 'checkout' : 'checkin'}:`, error);
      setError(`Unable to ${isCheckedIn ? 'check out' : 'check in'} at this time`);
      alert(`Error: ${error.message}`);
    }
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Update the current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate time since check-in if checked in
  useEffect(() => {
    let timer;
    if (isCheckedIn && checkInTime) {
      timer = setInterval(() => {
        const now = new Date();
        const hours = (now - checkInTime) / (1000 * 60 * 60);
        setTotalHours(hours);
      }, 60000); // Update every minute
    }
    return () => clearInterval(timer);
  }, [isCheckedIn, checkInTime]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    );
  }

  if (!user) {
    return <div>No user data available. Please login again.</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar - with mobile toggle class */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <h2>HRSystem</h2>
        </div>
        <nav>
          <ul>
            <li className={location.pathname === '/dashboard' ? 'active' : ''}>
              <span className="menu-icon">🏠</span> Dashboard
            </li>
            <li>
              <Link to="/attendance" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">📅</span> Attendance
              </Link>
            </li>
            <li>
              <Link to="/tasks" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">📝</span> Tasks
              </Link>
            </li>
            <li>
              <Link to="/calendar" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">🗓️</span> Calendar
              </Link>
            </li>
            <li>
              <Link to="/documents" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">📑</span> Documents
              </Link>
            </li>
            <li>
              <Link to="/notifications" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">🔔</span> Notifications
              </Link>
            </li>
            <li>
              <Link to="/settings" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">⚙️</span> Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }}>
            <span className="menu-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Mobile menu toggle button - only visible on mobile */}
      <MobileMenu toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="current-time">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <div className="date-display">
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
            <button className="search-button">🔍</button>
          </div>
          
          <div className="user-profile">
            <Link to="/enhancednotifications" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="notification-bell">
                <span className="notification-icon">🔔</span>
                <span className="notification-badge">3</span>
              </div>
            </Link>
            <div className="user-info">
              <span>{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}</span>
              <span className="role-badge">{user.position || 'Employee'}</span>
            </div>
            <img 
              onClick={() => navigate('/profile')}
              src={user.avatar || defaultAvatar} 
              alt="User avatar" 
              className="avatar" 
            />
          </div>
        </header>

        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-text">
            <h1>Welcome back, {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}!</h1>
            <p>Let's make today productive and amazing.</p>
          </div>
          
          <div className="check-in-section">
            <button 
              className={`check-in-button ${isCheckedIn ? 'checked-in' : ''}`}
              onClick={handleCheckInOut}
            >
              {isCheckedIn ? 'Check Out' : 'Check In'}
            </button>
            
            <div className="check-in-info">
              {isCheckedIn ? (
                <>
                  <p>Checked in: {formatTime(checkInTime)}</p>
                  <p>Duration: {totalHours.toFixed(2)} hours</p>
                </>
              ) : checkInTime && checkOutTime ? (
                <>
                  <p>Today's Record:</p>
                  <p>In: {formatTime(checkInTime)} | Out: {formatTime(checkOutTime)}</p>
                  <p>Total: {totalHours.toFixed(2)} hours</p>
                </>
              ) : (
                <p>Not checked in today</p>
              )}
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <div className="section-header">
            <h2>Quick Stats</h2>
            <button onClick={() => navigate('/attendance')}>View Reports</button>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeftColor: '#05CD99' }}>
              <span className="stat-icon" role="img" aria-label="Attendance">📊</span>
              <h3>Attendance Rate</h3>
              <p>{stats.attendanceRate}%</p>
            </div>
            
            <div className="stat-card" style={{ borderLeftColor: '#4318FF' }}>
              <span className="stat-icon" role="img" aria-label="Tasks">✅</span>
              <h3>Completed Tasks</h3>
              <p>{stats.completedTasks}</p>
            </div>
            
            <div className="stat-card" style={{ borderLeftColor: '#FFB547' }}>
              <span className="stat-icon" role="img" aria-label="Requests">📩</span>
              <h3>Pending Requests</h3>
              <p>{stats.pendingRequests}</p>
            </div>
            
            <div className="stat-card" style={{ borderLeftColor: '#FF5252' }}>
              <span className="stat-icon" role="img" aria-label="Events">🗓️</span>
              <h3>Upcoming Events</h3>
              <p>{stats.upcomingEvents}</p>
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section className="announcements-section">
          <div className="section-header">
            <h2>Announcements</h2>
            <button>Create New</button>
          </div>
          
          <AnnouncementsList />
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          
          <QuickActions />
        </section>
      </main>

      {/* Right Sidebar */}
      <aside className="right-sidebar">
        {/* Profile Summary */}
        <div className="profile-summary">
          <div className="user-profile" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <img 
              src={user.avatar || defaultAvatar} 
              alt="User avatar" 
              className="avatar" 
              style={{ width: '80px', height: '80px' }}
            />
          </div>
          
          <div className="profile-details" style={{ textAlign: 'center' }}>
            <h3>{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}</h3>
            <p>{user.position || 'Employee'}</p>
            <p>{user.email || 'user@example.com'}</p>
            <p>ID: {user.employeeId || 'EMP001'}</p>
          </div>
          
          <button
            className="view-profile-btn"
            onClick={() => navigate('/profile')}
          >
            View Full Profile
          </button>
        </div>

        {/* Upcoming Events */}
        <div className="upcoming-events">
          <h3>Upcoming Events</h3>
          
          <div className="events-list">
            <div className="event-item">
              <span className="event-icon">📅</span>
              <div className="event-details">
                <h4>Team Meeting</h4>
                <p>Today, 2:00 PM</p>
              </div>
            </div>
            
            <div className="event-item">
              <span className="event-icon">🎂</span>
              <div className="event-details">
                <h4>Sarah's Birthday</h4>
                <p>Tomorrow</p>
              </div>
            </div>
            
            <div className="event-item">
              <span className="event-icon">🚀</span>
              <div className="event-details">
                <h4>Project Deadline</h4>
                <p>Friday, 5:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Status */}
        <div className="team-status">
          <h3>Team Status</h3>
          
          <div className="team-members">
            <div className="member-item">
              <div className="member-avatar online">
                <img src={defaultAvatar} alt="Team member" className="member-avatar" />
              </div>
              <div>
                <h4>John Doe</h4>
                <p style={{ color: '#05CD99', fontSize: '0.8rem' }}>Online</p>
              </div>
            </div>
            
            <div className="member-item">
              <div className="member-avatar">
                <img src={defaultAvatar} alt="Team member" className="member-avatar" />
              </div>
              <div>
                <h4>Jane Smith</h4>
                <p style={{ color: '#707EAE', fontSize: '0.8rem' }}>Away</p>
              </div>
            </div>
            
            <div className="member-item">
              <div className="member-avatar online">
                <img src={defaultAvatar} alt="Team member" className="member-avatar" />
              </div>
              <div>
                <h4>Mike Johnson</h4>
                <p style={{ color: '#05CD99', fontSize: '0.8rem' }}>Online</p>
              </div>
            </div>
            
            <div className="member-item">
              <div className="member-avatar">
                <img src={defaultAvatar} alt="Team member" className="member-avatar" />
              </div>
              <div>
                <h4>Emily Davis</h4>
                <p style={{ color: '#707EAE', fontSize: '0.8rem' }}>Offline</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Notes */}
        <div className="quick-notes">
          <h3>Quick Notes</h3>
          <textarea 
            className="notes-area" 
            placeholder="Write your notes here..."
          ></textarea>
          <button className="save-note-btn">Save Note</button>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;