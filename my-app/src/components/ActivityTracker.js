import { useEffect, useState } from 'react';
import EmployeeService from './services/EmployeeService';
import socketManager, { connectSocket, authenticateUser, updateUserActivity } from '../utils/socket';

// This component doesn't render anything, it just tracks user activity
const ActivityTracker = ({ userId }) => {
  const [status, setStatus] = useState('online');
  
  useEffect(() => {
    if (!userId) return;
    
    console.log(`ActivityTracker: Initializing for user ${userId}`);
    
    // Connect to socket
    connectSocket();
    
    // Authenticate user
    authenticateUser(userId);
    
    // Set initial status to online
    updateUserActivity(userId, 'online');
    EmployeeService.updateUserActivity(userId, 'online');
    setStatus('online');
    
    // Subscribe to status changes
    const statusSubscription = socketManager.subscribeToUserStatus((data) => {
      if (data.userId === userId) {
        console.log(`ActivityTracker: Received status update for user ${userId}: ${data.status}`);
        setStatus(data.status);
      }
    });
    
    // Track user activity events - debounced to avoid too many updates
    let activityTimeout;
    const trackActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        if (status !== 'online') {
          console.log(`ActivityTracker: User ${userId} is now online`);
          updateUserActivity(userId, 'online');
          EmployeeService.updateUserActivity(userId, 'online');
          setStatus('online');
        }
      }, 300);
    };
    
    // Track when user becomes inactive
    let inactivityTimer;
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log(`ActivityTracker: User ${userId} is now away due to inactivity`);
        updateUserActivity(userId, 'away');
        EmployeeService.updateUserActivity(userId, 'away');
        setStatus('away');
      }, 2 * 60 * 1000); // 2 minutes of inactivity = away status
    };
    
    // Track when user leaves the page
    const handleBeforeUnload = () => {
      console.log(`ActivityTracker: User ${userId} is going offline (page unload)`);
      updateUserActivity(userId, 'offline');
      EmployeeService.updateUserActivity(userId, 'offline');
    };
    
    // Track visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log(`ActivityTracker: User ${userId} is now online (tab visible)`);
        updateUserActivity(userId, 'online');
        EmployeeService.updateUserActivity(userId, 'online');
        setStatus('online');
        resetInactivityTimer();
      } else {
        console.log(`ActivityTracker: User ${userId} is now away (tab hidden)`);
        updateUserActivity(userId, 'away');
        EmployeeService.updateUserActivity(userId, 'away');
        setStatus('away');
      }
    };
    
    // Add event listeners for various user activities
    window.addEventListener('mousemove', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('click', trackActivity);
    window.addEventListener('scroll', trackActivity);
    window.addEventListener('touchstart', trackActivity);
    
    // Add event listeners for inactivity tracking
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);
    
    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start the inactivity timer
    resetInactivityTimer();
    
    // Set up a heartbeat to keep the status updated
    const heartbeatInterval = setInterval(() => {
      if (status === 'online') {
        console.log(`ActivityTracker: Heartbeat for user ${userId} (online)`);
        updateUserActivity(userId, 'online');
        EmployeeService.updateUserActivity(userId, 'online');
      }
    }, 30 * 1000); // Every 30 seconds
    
    // Clean up event listeners on unmount
    return () => {
      // Unsubscribe from status changes
      statusSubscription.unsubscribe();
      
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      window.removeEventListener('touchstart', trackActivity);
      
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('click', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
      window.removeEventListener('touchstart', resetInactivityTimer);
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      clearTimeout(inactivityTimer);
      clearTimeout(activityTimeout);
      clearInterval(heartbeatInterval);
      
      // Set status to offline when component unmounts
      console.log(`ActivityTracker: User ${userId} is now offline (component unmount)`);
      updateUserActivity(userId, 'offline');
      EmployeeService.updateUserActivity(userId, 'offline');
    };
  }, [userId, status]);
  
  // This component doesn't render anything
  return null;
};

export default ActivityTracker;