import React, { useState, useEffect } from 'react';
import { mockTasks } from '../utils/mockData';
import './Tasks.css';
import Navbar  from './Navbar';

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fetch tasks for the logged-in user
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No authentication token found. Using mock data.');
          setTasks(mockTasks);
          setLoading(false);
          setError('Using demo mode. Some features may be limited.');
          setTimeout(() => setError(null), 2500);
          return;
        }
        
        // Use the new endpoint that gets tasks for the current user
        try {
          const tasksResponse = await fetch('http://localhost:8080/api/tasks/my-tasks', {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!tasksResponse.ok) {
            throw new Error(`HTTP error! Status: ${tasksResponse.status}`);
          }
          
          const tasksData = await tasksResponse.json();
          
          if (Array.isArray(tasksData) && tasksData.length > 0) {
            setTasks(tasksData);
            setLoading(false);
          } else {
            // If the response is empty, try the fallback
            throw new Error('Empty response from my-tasks endpoint');
          }
        } catch (tasksErr) {
          console.error('Error fetching tasks from my-tasks endpoint:', tasksErr);
          
          // Fallback: try to get user ID first, then fetch tasks
          try {
            // Try to get user ID from dashboard endpoint
            const userResponse = await fetch('http://localhost:8080/api/dashboard', {
              method: 'GET',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!userResponse.ok) {
              throw new Error(`HTTP error! Status: ${userResponse.status}`);
            }
            
            const userData = await userResponse.json();
            const userId = userData.id;
            
            if (!userId) {
              throw new Error('User ID is undefined');
            }
            
            // Then fetch tasks assigned to this user
            const userTasksResponse = await fetch(`http://localhost:8080/api/tasks/user/${userId}`, {
              method: 'GET',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!userTasksResponse.ok) {
              throw new Error(`HTTP error! Status: ${userTasksResponse.status}`);
            }
            
            const userTasksData = await userTasksResponse.json();
            
            if (Array.isArray(userTasksData)) {
              setTasks(userTasksData);
              setLoading(false);
            } else {
              throw new Error('Invalid response from user tasks endpoint');
            }
          } catch (fallbackErr) {
            console.error('Error in fallback task fetching:', fallbackErr);
            
            // Final fallback: use mock data
            console.log('Using mock task data as fallback');
            
            // Filter mock tasks to show only those assigned to mock-user-1
            // This simulates tasks assigned to the current user
            const userMockTasks = mockTasks.filter(task => 
              task.assignedTo === 'mock-user-1' || task.assignedTo === 'mock-user-2'
            );
            
            setTasks(userMockTasks);
            setLoading(false);
            setError('Using demo mode due to server issues. Some features may be limited.');
            setTimeout(() => setError(null), 2500);
          }
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        
        // Ultimate fallback: use mock data
        console.log('Using mock task data as final fallback');
        
        // Filter mock tasks to show only those assigned to mock-user-1
        const userMockTasks = mockTasks.filter(task => 
          task.assignedTo === 'mock-user-1' || task.assignedTo === 'mock-user-2'
        );
        
        setTasks(userMockTasks);
        setLoading(false);
        setError('Using demo mode. Server connection issues detected.');
        setTimeout(() => setError(null), 2500);
      }
    };

    fetchTasks();
  }, []);

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token, just update the UI in demo mode
        updateLocalTaskStatus(taskId, newStatus);
        setError('Status updated in demo mode only.');
        setTimeout(() => setError(null), 2000);
        return;
      }
      
      try {
        // Try to update via API
        const response = await fetch(`http://localhost:8080/api/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Update local state on success
        updateLocalTaskStatus(taskId, newStatus);
      } catch (apiErr) {
        console.error('Error updating task status via API:', apiErr);
        
        // Even if API fails, update the UI for better user experience
        updateLocalTaskStatus(taskId, newStatus);
        setError('Status updated in demo mode due to server issues.');
        setTimeout(() => setError(null), 2000);
      }
    } catch (err) {
      console.error('Unexpected error updating task status:', err);
      
      // Still update the UI even if there's an error
      updateLocalTaskStatus(taskId, newStatus);
      setError('Status updated locally. Server connection issues detected.');
      setTimeout(() => setError(null), 2000);
    }
  };
  
  // Helper function to update task status in local state
  const updateLocalTaskStatus = (taskId, newStatus) => {
    // Update task in tasks array
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    
    // Update selected task if it's the one being modified
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  // Get appropriate status button color with error handling
  const getStatusColor = (status) => {
    try {
      if (!status) return 'pending';
      
      const statusUpper = typeof status === 'string' ? status.toUpperCase() : String(status).toUpperCase();
      
      switch (statusUpper) {
        case 'PENDING':
          return 'pending';
        case 'ONGOING':
          return 'ongoing';
        case 'COMPLETED':
          return 'completed';
        default:
          return 'pending';
      }
    } catch (error) {
      console.error('Error getting status color:', error);
      return 'pending';
    }
  };
  
  // Format status for display with error handling
  const formatStatus = (status) => {
    try {
      if (!status) return 'Pending';
      
      const statusString = typeof status === 'string' ? status : String(status);
      return statusString.charAt(0).toUpperCase() + statusString.slice(1).toLowerCase();
    } catch (error) {
      console.error('Error formatting status:', error);
      return 'Pending';
    }
  };
  
  // View task details
  const viewTaskDetails = (task) => {
    setSelectedTask(task);
  };
  
  // Close task details
  const closeTaskDetails = () => {
    setSelectedTask(null);
  };

  if (loading) return <div className="loading">Loading tasks...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <Navbar />
    <div className="task-container">
      <h1>My Tasks</h1>
      
      {tasks.length === 0 ? (
        <p className="no-tasks">You have no assigned tasks at the moment.</p>
      ) : (
        <div className="task-list">
          {tasks.map((task) => {
            try {
              // Safely get task properties with fallbacks
              const title = task.title || 'Untitled Task';
              
              // Safely get description with fallback
              let description = 'No description provided';
              if (task.description) {
                description = typeof task.description === 'string' 
                  ? task.description.substring(0, 100) + '...'
                  : 'Description format error';
              }
              
              // Safely format date with fallback
              let formattedDate = 'No due date';
              try {
                if (task.dueDate) {
                  formattedDate = new Date(task.dueDate).toLocaleDateString();
                }
              } catch (dateError) {
                console.error('Error formatting date:', dateError);
              }
              
              return (
                <div 
                  key={task.id || Math.random().toString()} 
                  className="task-card"
                  onClick={() => viewTaskDetails(task)}
                >
                  <h3 className="task-title">{title}</h3>
                  <p className="task-description">{description}</p>
                  <div className="task-meta">
                    <span className="task-date">Due: {formattedDate}</span>
                    <span className={`task-status ${getStatusColor(task.status)}`}>
                      {formatStatus(task.status)}
                    </span>
                  </div>
                </div>
              );
            } catch (renderError) {
              console.error('Error rendering task card:', renderError, task);
              return null; // Skip rendering this card if there's an error
            }
          })}
        </div>
      )}
      
      {/* Task Details Modal */}
      {selectedTask && (
        <div className="task-modal-overlay" onClick={closeTaskDetails}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeTaskDetails}>×</button>
            
            {(() => {
              try {
                // Safely get task properties with fallbacks
                const title = selectedTask.title || 'Untitled Task';
                const description = selectedTask.description || 'No description provided';
                const status = selectedTask.status || 'PENDING';
                
                // Safely format dates with fallbacks
                let dueDateFormatted = 'No due date';
                let createdAtFormatted = 'Unknown';
                
                try {
                  if (selectedTask.dueDate) {
                    dueDateFormatted = new Date(selectedTask.dueDate).toLocaleDateString();
                  }
                } catch (dueDateError) {
                  console.error('Error formatting due date:', dueDateError);
                }
                
                try {
                  if (selectedTask.createdAt) {
                    createdAtFormatted = new Date(selectedTask.createdAt).toLocaleDateString();
                  }
                } catch (createdAtError) {
                  console.error('Error formatting created date:', createdAtError);
                }
                
                return (
                  <>
                    <div className="task-modal-header">
                      <h2>{title}</h2>
                      <span className={`task-status ${getStatusColor(status)}`}>
                        {formatStatus(status)}
                      </span>
                    </div>
                    
                    <div className="task-modal-body">
                      <p className="task-full-description">{description}</p>
                      
                      <div className="task-details">
                        <div className="detail-item">
                          <span className="detail-label">Due Date:</span>
                          <span className="detail-value">{dueDateFormatted}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Created On:</span>
                          <span className="detail-value">{createdAtFormatted}</span>
                        </div>
                      </div>
                      
                      <div className="task-actions">
                        {status === 'PENDING' && (
                          <button 
                            className="btn ongoing-btn"
                            onClick={() => updateTaskStatus(selectedTask.id, 'ONGOING')}
                          >
                            Mark as Ongoing
                          </button>
                        )}
                        
                        {(status === 'PENDING' || status === 'ONGOING') && (
                          <button 
                            className="btn completed-btn"
                            onClick={() => updateTaskStatus(selectedTask.id, 'COMPLETED')}
                          >
                            Mark as Completed
                          </button>
                        )}
                        
                        {status === 'COMPLETED' && (
                          <div className="completion-message">
                            Task completed! 🎉
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              } catch (modalError) {
                console.error('Error rendering task modal:', modalError);
                return (
                  <div className="error-message">
                    <h3>Error displaying task details</h3>
                    <p>There was a problem loading the task details. Please try again.</p>
                    <button onClick={closeTaskDetails}>Close</button>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default TaskPage;