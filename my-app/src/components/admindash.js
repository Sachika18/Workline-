import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './AdminDash.css'; // Make sure to create this CSS file
import defaultAvatar from '../assets/avatar.png';
import MobileMenu from './MobileMenu';

const AdminDash = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({
    hr: { headcount: 12, attendance: 96, tasks: 24 },
    tech: { headcount: 38, attendance: 94, tasks: 56 },
    finance: { headcount: 8, attendance: 98, tasks: 18 },
    marketing: { headcount: 15, attendance: 92, tasks: 32 }
  });
  const [systemStats, setSystemStats] = useState({
    totalEmployees: 73,
    activeNow: 52,
    pendingApprovals: 7,
    openPositions: 5
  });
  const [recentActivity, setRecentActivity] = useState([
    { 
      id: 1, 
      type: 'checkin', 
      user: 'John Doe', 
      timestamp: new Date(new Date().setHours(new Date().getHours() - 1)),
      details: 'Checked in at 8:30 AM'
    },
    { 
      id: 2, 
      type: 'request', 
      user: 'Sarah Smith', 
      timestamp: new Date(new Date().setHours(new Date().getHours() - 2)),
      details: 'Requested time off for next week'
    },
    { 
      id: 3, 
      type: 'task', 
      user: 'Mike Johnson', 
      timestamp: new Date(new Date().setHours(new Date().getHours() - 3)),
      details: 'Completed Q1 Report review'
    },
    { 
      id: 4, 
      type: 'alert', 
      user: 'Emily Davis', 
      timestamp: new Date(new Date().setHours(new Date().getHours() - 4)),
      details: 'Exceeded overtime limit this week'
    }
  ]);

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

  // Update the current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch admin info from the backend
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token ? token.substring(0, 20) + '...' : 'No token'); // Only log part of the token for security

        const response = await fetch('http://localhost:8080/api/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          // Log detailed error information
          const errorData = await response.text();
          console.error('Server response:', response.status, errorData);
          
          if (response.status === 500) {
            setError('Internal server error. Please try again later.');
          } else if (response.status === 403) {
            localStorage.removeItem('token');
            navigate('/login');
          } else {
            setError(`Error: ${response.status}`);
          }
          return;
        }

        const data = await response.json();
        setAdmin(data);
        
        // Keep your existing mock data for now
        setEmployees([
          { id: 1, name: 'John Doe', position: 'Frontend Developer', department: 'Tech', status: 'online' },
          { id: 2, name: 'Sarah Smith', position: 'HR Manager', department: 'HR', status: 'online' },
          { id: 3, name: 'Mike Johnson', position: 'UI/UX Designer', department: 'Tech', status: 'away' },
          { id: 4, name: 'Emily Davis', position: 'Product Manager', department: 'Marketing', status: 'offline' },
          { id: 5, name: 'David Wilson', position: 'Accountant', department: 'Finance', status: 'online' }
        ]);
        
      } catch (error) {
        console.error('Error details:', error);
        setError('Unable to connect to the server. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
    
    // In a real app, you would fetch all these data from your API
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
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

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar - with mobile toggle class */}
      <aside className={`sidebar admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <h2>HRSystem</h2>
          <span className="admin-badge">Admin</span>
        </div>
        <nav>
          <ul>
            <li className={location.pathname === '/admin' ? 'active' : ''}>
              <span className="menu-icon">🏠</span> Dashboard
            </li>
            <li>
              <Link to="/admin/employees" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">👥</span> Employees
              </Link>
            </li>
            <li>
              <Link to="/admin/departments" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">🏢</span> Departments
              </Link>
            </li>
            <li>
              <Link to="/admin/attendance" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">📅</span> Attendance
              </Link>
            </li>
            <li>
              <Link to="/admintask" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">✓</span> Tasks
              </Link>
            </li>
            <li>
              <Link to="/admin/reports" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">📊</span> Reports
              </Link>
            </li>
            <li>
              <Link to="/admin/settings" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
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
      <main className="main-content admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="current-time">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <div className="date-display">
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div className="search-bar">
            <input type="text" placeholder="Search employees, departments..." />
            <button className="search-button">🔍</button>
          </div>
          
          <div className="user-profile">
            <Link to="/admin/notifications" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="notification-bell">
                <span className="notification-icon">🔔</span>
                <span className="notification-badge">7</span>
              </div>
            </Link>
            <div className="user-info">
              <span>{admin?.name || 'Admin User'}</span>
              <span className="role-badge admin-role">Administrator</span>
            </div>
            <img 
              onClick={() => navigate('/admin/profile')}
              src={admin?.avatar || defaultAvatar} 
              alt="Admin avatar" 
              className="avatar" 
            />
          </div>
        </header>

        {/* Welcome Section */}
        <section className="welcome-section admin-welcome">
          <div className="welcome-text">
            <h1>Welcome back, {admin?.name || 'Admin'}!</h1>
            <p>Here's your administrative overview for today.</p>
          </div>
          
          <div className="admin-actions">
            <button className="admin-action-button">
              <span className="action-icon">➕</span>
              Add Employee
            </button>
            <button className="admin-action-button">
              <span className="action-icon">📊</span>
              Generate Report
            </button>
            <button className="admin-action-button">
              <span className="action-icon">✉️</span>
              Send Announcement
            </button>
          </div>
        </section>

        {/* System Stats */}
        <section className="stats-section">
          <div className="section-header">
            <h2>System Overview</h2>
            <button>View Details</button>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeftColor: '#05CD99' }}>
              <span className="stat-icon" role="img" aria-label="Employees">👥</span>
              <h3>Total Employees</h3>
              <p>{systemStats.totalEmployees}</p>
            </div>
            
            <div className="stat-card" style={{ borderLeftColor: '#4318FF' }}>
              <span className="stat-icon" role="img" aria-label="Active">🟢</span>
              <h3>Active Now</h3>
              <p>{systemStats.activeNow}</p>
            </div>
            
            <div className="stat-card" style={{ borderLeftColor: '#FFB547' }}>
              <span className="stat-icon" role="img" aria-label="Approvals">✓</span>
              <h3>Pending Approvals</h3>
              <p>{systemStats.pendingApprovals}</p>
            </div>
            
            <div className="stat-card" style={{ borderLeftColor: '#FF5252' }}>
              <span className="stat-icon" role="img" aria-label="Positions">🔍</span>
              <h3>Open Positions</h3>
              <p>{systemStats.openPositions}</p>
            </div>
          </div>
        </section>

        {/* Department Stats */}
        <section className="department-stats-section">
          <div className="section-header">
            <h2>Department Statistics</h2>
            <button>View All</button>
          </div>
          
          <div className="department-stats-grid">
            <div className="department-card">
              <div className="department-header">
                <h3>HR Department</h3>
                <span className="department-icon">👤</span>
              </div>
              <div className="department-stats">
                <div className="dept-stat">
                  <p>Headcount</p>
                  <h4>{departmentStats.hr.headcount}</h4>
                </div>
                <div className="dept-stat">
                  <p>Attendance</p>
                  <h4>{departmentStats.hr.attendance}%</h4>
                </div>
                <div className="dept-stat">
                  <p>Tasks</p>
                  <h4>{departmentStats.hr.tasks}</h4>
                </div>
              </div>
              <button className="view-dept-btn">Manage</button>
            </div>
            
            <div className="department-card">
              <div className="department-header">
                <h3>Tech Department</h3>
                <span className="department-icon">💻</span>
              </div>
              <div className="department-stats">
                <div className="dept-stat">
                  <p>Headcount</p>
                  <h4>{departmentStats.tech.headcount}</h4>
                </div>
                <div className="dept-stat">
                  <p>Attendance</p>
                  <h4>{departmentStats.tech.attendance}%</h4>
                </div>
                <div className="dept-stat">
                  <p>Tasks</p>
                  <h4>{departmentStats.tech.tasks}</h4>
                </div>
              </div>
              <button className="view-dept-btn">Manage</button>
            </div>
            
            <div className="department-card">
              <div className="department-header">
                <h3>Finance Department</h3>
                <span className="department-icon">💰</span>
              </div>
              <div className="department-stats">
                <div className="dept-stat">
                  <p>Headcount</p>
                  <h4>{departmentStats.finance.headcount}</h4>
                </div>
                <div className="dept-stat">
                  <p>Attendance</p>
                  <h4>{departmentStats.finance.attendance}%</h4>
                </div>
                <div className="dept-stat">
                  <p>Tasks</p>
                  <h4>{departmentStats.finance.tasks}</h4>
                </div>
              </div>
              <button className="view-dept-btn">Manage</button>
            </div>
            
            <div className="department-card">
              <div className="department-header">
                <h3>Marketing Department</h3>
                <span className="department-icon">📈</span>
              </div>
              <div className="department-stats">
                <div className="dept-stat">
                  <p>Headcount</p>
                  <h4>{departmentStats.marketing.headcount}</h4>
                </div>
                <div className="dept-stat">
                  <p>Attendance</p>
                  <h4>{departmentStats.marketing.attendance}%</h4>
                </div>
                <div className="dept-stat">
                  <p>Tasks</p>
                  <h4>{departmentStats.marketing.tasks}</h4>
                </div>
              </div>
              <button className="view-dept-btn">Manage</button>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="recent-activity-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <button>View All</button>
          </div>
          
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className={`activity-item ${activity.type}`}>
                <div className="activity-icon">
                  {activity.type === 'checkin' && '🕒'}
                  {activity.type === 'request' && '📩'}
                  {activity.type === 'task' && '✅'}
                  {activity.type === 'alert' && '⚠️'}
                </div>
                <div className="activity-content">
                  <h4>{activity.user}</h4>
                  <p>{activity.details}</p>
                  <span className="activity-time">
                    {activity.timestamp.toLocaleString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
                <div className="activity-actions">
                  <button className="view-details">View</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="admin-quick-actions">
          <div className="section-header">
            <h2>Administrative Actions</h2>
          </div>
          
          <div className="admin-actions-grid">
            <div className="admin-action-card">
              <span className="action-icon">📝</span>
              <h3>Approve Time Off</h3>
              <p>5 pending requests</p>
            </div>
            
            <div className="admin-action-card">
              <span className="action-icon">📊</span>
              <h3>Generate Reports</h3>
              <p>Attendance, Performance</p>
            </div>
            
            <div className="admin-action-card">
              <span className="action-icon">📅</span>
              <h3>Schedule Events</h3>
              <p>Create company events</p>
            </div>
            
            <div className="admin-action-card">
              <span className="action-icon">📢</span>
              <h3>Send Announcements</h3>
              <p>Notify all employees</p>
            </div>
          </div>
        </section>
      </main>

      {/* Right Sidebar */}
      <aside className="right-sidebar admin-sidebar-right">
        {/* Admin Profile Summary */}
        <div className="profile-summary">
          <div className="user-profile" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <img 
              src={admin?.avatar || defaultAvatar} 
              alt="Admin avatar" 
              className="avatar" 
              style={{ width: '80px', height: '80px' }}
            />
          </div>
          
          <div className="profile-details" style={{ textAlign: 'center' }}>
            <h3>{admin?.name || 'Admin User'}</h3>
            <p className="admin-role">System Administrator</p>
            <p>{admin?.email || 'admin@example.com'}</p>
            <p>Access Level: Full</p>
          </div>
          
          <button
            className="view-profile-btn"
            onClick={() => navigate('/admin/profile')}
          >
            Admin Settings
          </button>
        </div>

        {/* Employee Quick View */}
        <div className="employee-quick-view">
          <h3>Employee Quick View</h3>
          
          <div className="employee-search">
            <input type="text" placeholder="Search employees..." />
          </div>
          
          <div className="employee-list">
            {employees.map(employee => (
              <div key={employee.id} className="employee-item">
                <div className={`employee-avatar ${employee.status}`}>
                  <img src={defaultAvatar} alt={employee.name} className="member-avatar" />
                </div>
                <div className="employee-details">
                  <h4>{employee.name}</h4>
                  <p>{employee.position}</p>
                  <small>{employee.department}</small>
                </div>
                <button className="employee-action">...</button>
              </div>
            ))}
          </div>
          
          <button className="view-all-employees">View All Employees</button>
        </div>

        {/* Today's Summary */}
        <div className="todays-summary">
          <h3>Today's Summary</h3>
          
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="summary-icon">👥</span>
              <div>
                <h4>52/73</h4>
                <p>Checked In</p>
              </div>
            </div>
            
            <div className="summary-stat">
              <span className="summary-icon">🕒</span>
              <div>
                <h4>3</h4>
                <p>Late Arrivals</p>
              </div>
            </div>
            
            <div className="summary-stat">
              <span className="summary-icon">🏠</span>
              <div>
                <h4>12</h4>
                <p>Remote Today</p>
              </div>
            </div>
            
            <div className="summary-stat">
              <span className="summary-icon">📝</span>
              <div>
                <h4>5</h4>
                <p>New Requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        <div className="quick-notes admin-notes">
          <h3>Admin Notes</h3>
          <textarea 
            className="notes-area" 
            placeholder="Write important notes here..."
          ></textarea>
          <button className="save-note-btn">Save Note</button>
        </div>
      </aside>
    </div>
  );
};

export default AdminDash;