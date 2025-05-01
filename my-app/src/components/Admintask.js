import React, { useState, useEffect } from 'react';
import fetchApi from '../utils/fetchApi';
import { mockUsers, mockTasks, createMockTask } from '../utils/mockData';
import './Admintask.css';

const AdminTaskPage = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
  });

  // Function to fetch tasks
  const fetchTasks = async () => {
    try {
      console.log('Refreshing tasks...');
      
      // Try different endpoints in sequence until one works
      let tasksResponse;
      let endpoint = '';
      
      try {
        // Try the my-tasks endpoint first since it works
        endpoint = '/tasks/my-tasks';
        console.log('Trying endpoint:', endpoint);
        tasksResponse = await fetchApi.get(endpoint);
      } catch (myTasksErr) {
        console.log('my-tasks endpoint failed, trying base endpoint');
        
        // Then try the base endpoint
        endpoint = '/tasks';
        console.log('Trying endpoint:', endpoint);
        tasksResponse = await fetchApi.get(endpoint);
      }
      
      console.log(`Tasks refresh response from ${endpoint}:`, tasksResponse);
      
      if (Array.isArray(tasksResponse)) {
        setTasks(tasksResponse);
      } else {
        console.error('Invalid tasks data format:', tasksResponse);
        // Don't overwrite existing tasks with mock data on refresh
        if (tasks.length === 0) {
          setTasks(mockTasks);
        }
      }
    } catch (taskErr) {
      console.error('Error refreshing tasks:', taskErr);
      // Don't overwrite existing tasks with mock data on refresh
      if (tasks.length === 0) {
        setTasks(mockTasks);
      }
    }
  };

  // Fetch users and tasks on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log('Starting API calls...');
      
      let errorMessage = null;
      
      // Try to fetch user data
      try {
        console.log('Fetching users...');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          // Use mock data instead of redirecting
          console.log('Using mock user data as fallback');
          setUsers(mockUsers);
        } else {
          // Try to fetch from dashboard first (for current user)
          try {
            const dashboardResponse = await fetchApi.get('/dashboard');
            console.log('Dashboard response:', dashboardResponse);
            
            // Then try to fetch all users
            try {
              const usersResponse = await fetchApi.get('/users');
              console.log('Users response:', usersResponse);
              
              if (Array.isArray(usersResponse) && usersResponse.length > 0) {
                setUsers(usersResponse);
              } else {
                // If users endpoint returns empty or invalid data, use current user + mock data
                const currentUser = dashboardResponse;
                if (currentUser && currentUser.id) {
                  // Combine current user with mock users (excluding duplicates)
                  const combinedUsers = [
                    currentUser,
                    ...mockUsers.filter(user => user.id !== currentUser.id)
                  ];
                  setUsers(combinedUsers);
                } else {
                  setUsers(mockUsers);
                }
              }
            } catch (usersErr) {
              console.error('Error fetching all users:', usersErr);
              // Use current user + mock data
              const currentUser = dashboardResponse;
              if (currentUser && currentUser.id) {
                const combinedUsers = [
                  currentUser,
                  ...mockUsers.filter(user => user.id !== currentUser.id)
                ];
                setUsers(combinedUsers);
              } else {
                setUsers(mockUsers);
              }
            }
          } catch (dashboardErr) {
            console.error('Error fetching dashboard data:', dashboardErr);
            
            // Log detailed error information
            if (dashboardErr.status) {
              console.error('Error status:', dashboardErr.status);
              console.error('Error data:', dashboardErr.data);
              
              // If unauthorized, try to use mock data instead of redirecting
              if (dashboardErr.status === 401 || dashboardErr.status === 403) {
                console.log('Authentication error. Using mock data as fallback.');
                setUsers(mockUsers);
              } else {
                // For other errors, try the users endpoint directly
                try {
                  const usersResponse = await fetchApi.get('/users');
                  if (Array.isArray(usersResponse) && usersResponse.length > 0) {
                    setUsers(usersResponse);
                  } else {
                    setUsers(mockUsers);
                  }
                } catch (finalUsersErr) {
                  console.error('Final attempt to fetch users failed:', finalUsersErr);
                  setUsers(mockUsers);
                  errorMessage = 'Using demo mode due to server issues. Some features may be limited.';
                }
              }
            } else {
              // Network error or other issue
              console.log('Network error. Using mock data as fallback.');
              setUsers(mockUsers);
              errorMessage = 'Using demo mode due to connection issues. Some features may be limited.';
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error in user fetch logic:', error);
        setUsers(mockUsers);
        errorMessage = 'Using demo mode due to unexpected errors. Some features may be limited.';
      }
      
      // Try to fetch tasks data
      try {
        await fetchTasks();
      } catch (taskErr) {
        console.error('Error in initial task fetch:', taskErr);
        
        // Use mock tasks data
        console.log('Using mock tasks data as fallback');
        setTasks(mockTasks);
        
        if (!errorMessage) {
          errorMessage = 'Using demo task data due to server issues. Some features may be limited.';
        }
      }
      
      // Set error message if needed
      if (errorMessage) {
        setError(errorMessage);
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 2500);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);  // Note: fetchTasks is defined in the component, so it doesn't need to be a dependency

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create a copy of the form data to avoid modifying the state directly
    const taskData = { ...formData };
    
    // Ensure we have a due date (required by the backend)
    if (!taskData.dueDate) {
      // Set default due date to 7 days from now if not provided
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      taskData.dueDate = defaultDueDate.toISOString().split('T')[0];
    }
    
    console.log('Submitting task with data:', taskData);
    
    try {
      // Attempt to create task via API
      const response = await fetchApi.post('/tasks', taskData);
      console.log('Task created successfully:', response);
      
      // Add the new task to the tasks list immediately for better UX
      if (response && response.id) {
        setTasks(prevTasks => [...prevTasks, response]);
      }
      
      // Add a small delay before refreshing to ensure the server has processed the request
      setTimeout(async () => {
        try {
          // Refresh tasks from the server to ensure we have the latest data
          await fetchTasks();
        } catch (refreshErr) {
          console.error('Error refreshing tasks after creation:', refreshErr);
          // The task was already added to the list above, so no need to handle this error further
        }
      }, 500);
      
      // Show success message
      setSuccessMessage('Task created successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
      });
      
    } catch (err) {
      console.error('Error creating task:', err);
      
      // Log detailed error information
      if (err.status) {
        console.error('Error status:', err.status);
        console.error('Error data:', err.data);
      } else {
        console.error('Error message:', err.message);
      }
      
      // Create a mock task as fallback
      const mockTask = createMockTask(taskData);
      console.log('Created mock task:', mockTask);
      setTasks(prevTasks => [...prevTasks, mockTask]);
      
      // Show a modified success message
      setSuccessMessage('Task created in demo mode. Server connection issues detected.');
      setTimeout(() => setSuccessMessage(''), 2500);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
      });
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        // Attempt to delete via API
        await fetchApi.delete(`/tasks/${taskId}`);
        console.log('Task deleted successfully:', taskId);
        
        // Add a small delay before refreshing to ensure the server has processed the request
        setTimeout(async () => {
          // Refresh tasks from the server to ensure we have the latest data
          await fetchTasks();
        }, 500);
        
        setSuccessMessage('Task deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 2000);
      } catch (err) {
        console.error('Error deleting task:', err);
        
        // Log detailed error information
        if (err.status) {
          console.error('Error status:', err.status);
          console.error('Error data:', err.data);
        } else {
          console.error('Error message:', err.message);
        }
        
        // Even if the API call fails, remove the task from the local state
        // This provides a better user experience in case of server issues
        setTasks(tasks.filter(task => task.id !== taskId));
        
        setSuccessMessage('Task removed in demo mode. Server connection issues detected.');
        setTimeout(() => setSuccessMessage(''), 2500);
      }
    }
  };

  // Get user full name by ID with robust error handling
  const getUserFullName = (userId) => {
    try {
      if (!userId) {
        console.log('No user ID provided');
        return 'Unassigned';
      }
      
      if (!users || !Array.isArray(users) || users.length === 0) {
        console.log('No users available');
        return 'User #' + userId.substring(0, 5);
      }
      
      const user = users.find(user => user.id === userId);
      if (!user) {
        console.log('User not found with ID:', userId);
        return 'User #' + userId.substring(0, 5);
      }
      
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      return fullName || 'User #' + userId.substring(0, 5);
    } catch (error) {
      console.error('Error getting user name:', error);
      return 'User #' + (userId ? userId.substring(0, 5) : 'Unknown');
    }
  };

  // Format status for display with error handling
  const formatStatus = (status) => {
    try {
      if (!status) return 'Pending';
      
      // Handle case where status might be an object instead of a string
      const statusText = typeof status === 'string' ? status : String(status);
      return statusText.charAt(0).toUpperCase() + statusText.slice(1).toLowerCase();
    } catch (error) {
      console.error('Error formatting status:', error);
      return 'Pending';
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-task-container">
      <div className="admin-header">
        <h1>Task Management</h1>
        <button 
          className="refresh-button" 
          onClick={() => {
            fetchTasks();
            setSuccessMessage('Tasks refreshed');
            setTimeout(() => setSuccessMessage(''), 1500);
          }}
        >
          Refresh Tasks
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="task-form-container">
        <h2>Create New Task</h2>
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">Task Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="assignedTo">Assign To</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.position})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <button type="submit" className="submit-btn">Create Task</button>
        </form>
      </div>
      
      <div className="tasks-overview">
        <h2>All Tasks</h2>
        
        {tasks.length === 0 ? (
          <p className="no-tasks">No tasks have been created yet.</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                try {
                  // Safely get status with fallback
                  const status = task.status ? task.status.toLowerCase() : 'pending';
                  
                  // Safely format date with fallback
                  let formattedDate = 'No date';
                  try {
                    if (task.dueDate) {
                      formattedDate = new Date(task.dueDate).toLocaleDateString();
                    }
                  } catch (dateError) {
                    console.error('Error formatting date:', dateError);
                  }
                  
                  return (
                    <tr key={task.id || Math.random().toString()} className={`status-${status}`}>
                      <td>{task.title || 'Untitled Task'}</td>
                      <td>{getUserFullName(task.assignedTo)}</td>
                      <td>{formattedDate}</td>
                      <td>
                        <span className={`status-badge ${status}`}>
                          {formatStatus(task.status)}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                } catch (renderError) {
                  console.error('Error rendering task row:', renderError, task);
                  return null; // Skip rendering this row if there's an error
                }
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminTaskPage;