import { useState } from 'react';
import { Search, Bell, Settings, CheckCircle, Calendar, Mail, FileText, AlertTriangle, Clock, X, Filter, ArrowDown, Inbox, Archive, Trash2, PlusCircle, ChevronDown, Pin, MoreVertical, Home, User, ChevronLeft } from 'lucide-react';
import './EnhancedNotifications.css';
import Navbar from './Navbar';  
export default function EnhancedNotifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Sample notification data
  const notifications = [
    {
      id: 1,
      title: 'Team Meeting Scheduled',
      description: 'The weekly team meeting has been scheduled for tomorrow at 10:00 AM.',
      time: '10 min ago',
      type: 'event',
      priority: 'high',
      isUnread: true,
      isPinned: true,
      actions: ['View Details', 'Add to Calendar']
    },
    {
      id: 2,
      title: 'Project Deadline Reminder',
      description: 'The UX Design project deadline is this Friday. Please ensure all deliverables are submitted by 5:00 PM.',
      time: '1 hour ago',
      type: 'document',
      priority: 'high',
      isUnread: true,
      isPinned: false,
      actions: ['View Project', 'Request Extension']
    },
    {
      id: 3,
      title: 'New Task Assignment',
      description: 'You have been assigned a new task: "Update the notification component UI".',
      time: '3 hours ago',
      type: 'message',
      priority: 'medium',
      isUnread: false,
      isPinned: false,
      actions: ['View Task', 'Mark Complete']
    },
    {
      id: 4,
      title: 'Leave Request Approved',
      description: 'Your leave request for May 15-16 has been approved by HR.',
      time: 'Yesterday',
      type: 'leave',
      priority: 'medium',
      isUnread: false,
      isPinned: false,
      actions: ['View Details']
    },
    {
      id: 5,
      title: 'System Maintenance',
      description: 'The HR system will be undergoing maintenance on Saturday from 10:00 PM to 2:00 AM.',
      time: 'Yesterday',
      type: 'system',
      priority: 'medium',
      isUnread: false,
      isPinned: false,
      actions: ['Set Reminder']
    }
  ];

  // Filter notifications based on active tab and search query
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notification.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'unread') return notification.isUnread && matchesSearch;
    if (activeTab === 'pinned') return notification.isPinned && matchesSearch;
    
    return matchesSearch;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <Mail size={16} />;
      case 'event':
        return <Calendar size={16} />;
      case 'leave':
        return <CheckCircle size={16} />;
      case 'document':
        return <FileText size={16} />;
      case 'system':
        return <AlertTriangle size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  // Get notification icon class based on type
  const getNotificationIconClass = (type) => {
    switch (type) {
      case 'message':
        return 'message-icon';
      case 'event':
        return 'event-icon';
      case 'leave':
        return 'leave-icon';
      case 'document':
        return 'document-icon';
      case 'system':
        return 'system-icon';
      default:
        return '';
    }
  };

  

  return (
    <div>
    <Navbar />
    <div className="w-full">
      

      {/* Main Content */}
      <div className="enhanced-notifications-container w-full px-4 py-6">
        <div className="notifications-header">
          <div className="notifications-title">
            <h2>
              <Bell size={18} />
              Notifications
              <span className="notification-count">3</span>
            </h2>
            <div className="notifications-actions">
              <button className="action-btn" onClick={() => setShowSettings(!showSettings)}>
                <Settings size={16} />
              </button>
            </div>
          </div>
          
          <div className="notifications-tabs">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} 
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`} 
              onClick={() => setActiveTab('unread')}
            >
              Unread
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pinned' ? 'active' : ''}`} 
              onClick={() => setActiveTab('pinned')}
            >
              Pinned
            </button>
          </div>

          <div className="notifications-actions">
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search notifications..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="filter-dropdown">
              <button className="filter-btn">
                <Filter size={14} />
                Filter
                <ChevronDown size={14} />
              </button>
              <div className="filter-dropdown-content">
                <button>All Types</button>
                <button>Messages</button>
                <button>Events</button>
                <button>Documents</button>
                <button>System</button>
              </div>
            </div>
            <button className="action-btn mark-read">
              <Inbox size={16} />
            </button>
            <button className="action-btn">
              <Archive size={16} />
            </button>
            <button className="action-btn clear-all">
              <Trash2 size={16} />
            </button>
            <button className="action-btn add-demo">
              <PlusCircle size={16} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-header">
              <h3>Notification Settings</h3>
              <button className="close-settings" onClick={() => setShowSettings(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="settings-options">
              <div className="setting-option">
                <label>Email notifications</label>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="setting-option">
                <label>Desktop notifications</label>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="setting-option">
                <label>Sound alerts</label>
                <input type="checkbox" />
              </div>
              <div className="setting-option">
                <label>Show priority badges</label>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>
        )}

        <div className="date-separator">
          <span>Today</span>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-card ${notification.isUnread ? 'unread' : ''} ${notification.isPinned ? 'pinned' : ''} ${notification.priority === 'high' ? 'high-priority' : notification.priority === 'medium' ? 'medium-priority' : ''}`}
              >
                {notification.isUnread && <div className="unread-indicator"></div>}
                <div className="notification-content">
                  <div className="notification-icon-container">
                    <div className={`notification-icon ${getNotificationIconClass(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="notification-details">
                    <div className="notification-header">
                      <h3>{notification.title}</h3>
                      <div className="notification-metadata">
                        {notification.priority === 'high' && (
                          <span className="priority-badge high">High</span>
                        )}
                        {notification.priority === 'medium' && (
                          <span className="priority-badge medium">Medium</span>
                        )}
                        <div className="notification-time">
                          <Clock size={12} />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <p className="notification-description">{notification.description}</p>
                    <div className="notification-actions">
                      {notification.actions.map((action, index) => (
                        <button key={index} className="notification-action-btn">
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="notification-controls">
                  <button className={`control-btn pin-btn ${notification.isPinned ? 'active' : ''}`}>
                    <Pin size={14} />
                  </button>
                  <button className="control-btn archive-btn">
                    <Archive size={14} />
                  </button>
                  <button className="control-btn delete-btn">
                    <Trash2 size={14} />
                  </button>
                  <button className="control-btn">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-notifications">
              <Bell size={48} />
              <h3>No notifications found</h3>
              <p>There are no notifications matching your current filters.</p>
              <button className="reset-filter-btn" onClick={() => {setActiveTab('all'); setSearchQuery('');}}>
                Reset Filters
              </button>
            </div>
          )}
        </div>

        <button className="view-more-btn">
          View More
        </button>
      </div>
    </div>
    </div>
  );
}