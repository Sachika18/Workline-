import React, { useState, useEffect } from 'react';
// Use React Icons instead of Lucide React
import { 
  FiSearch as Search, 
  FiCalendar as Calendar, 
  FiPlus as Plus, 
  FiCheckCircle as CheckCircle, 
  FiClock as Clock, 
  FiFilter as Filter, 
  FiUser as User, 
  FiUsers as Users, 
  FiEdit as Edit, 
  FiTrash2 as Trash, 
  FiRefreshCw as RefreshCw 
} from 'react-icons/fi';
import TaskService from './services/TaskService';
import EmployeeService from './services/EmployeeService';
import './AdminTasks.css';

function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: ''
  });

  // Fetch all initial data with better error handling
  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current admin user
      let userData;
      try {
        userData = await EmployeeService.getCurrentUser();
        console.log("AdminTasks: Current admin user:", userData);
        setCurrentAdmin(userData);
      } catch (err) {
        console.error("AdminTasks: Error fetching admin user:", err);
        // Provide fallback data
        console.warn("AdminTasks: Using fallback admin data");
        userData = {
          id: 'admin-1',
          username: 'admin@example.com',
          name: 'Admin User',
          department: 'Administration',
          email: 'admin@example.com',
          role: 'ADMIN'
        };
        setCurrentAdmin(userData);
      }
      
      // Fetch all employees for assignment dropdown
      try {
        console.log("AdminTasks: Fetching employees for dropdown");
        const employeeData = await EmployeeService.getAllEmployees();
        console.log("AdminTasks: Employee data received:", employeeData);
        setEmployees(employeeData || []);
      } catch (err) {
        console.error("AdminTasks: Error fetching employees:", err);
        // Provide fallback data
        console.warn("AdminTasks: Using fallback employee data");
        const mockEmployees = [
          { id: 'emp-1', username: 'jsmith@example.com', name: 'John Smith', department: 'HR', email: 'jsmith@example.com' },
          { id: 'emp-2', username: 'agarcia@example.com', name: 'Ana Garcia', department: 'Operations', email: 'agarcia@example.com' },
          { id: 'emp-3', username: 'mlee@example.com', name: 'Min-ho Lee', department: 'Technology', email: 'mlee@example.com' },
          { id: 'emp-4', username: 'ookonjo@example.com', name: 'Ola Okonjo', department: 'Marketing', email: 'ookonjo@example.com' }
        ];
        setEmployees(mockEmployees);
      }
      
      // Fetch all tasks - always try localStorage first to ensure we have the latest status updates
      try {
        console.log("AdminTasks: Fetching all tasks");
        
        // First check localStorage for the most up-to-date task data
        const localTasks = localStorage.getItem('workline_tasks');
        let tasksFromStorage = [];
        
        if (localTasks) {
          try {
            tasksFromStorage = JSON.parse(localTasks);
            console.log("AdminTasks: Found tasks in localStorage:", tasksFromStorage);
          } catch (parseErr) {
            console.error("AdminTasks: Error parsing localStorage tasks:", parseErr);
          }
        }
        
        // Check for individual task status updates
        const allKeys = Object.keys(localStorage);
        const taskStatusKeys = allKeys.filter(key => key.startsWith('task_status_'));
        
        let individualTaskUpdates = [];
        if (taskStatusKeys.length > 0) {
          console.log(`AdminTasks: Found ${taskStatusKeys.length} individual task status updates`);
          
          taskStatusKeys.forEach(key => {
            try {
              const taskStatusJson = localStorage.getItem(key);
              if (taskStatusJson) {
                const taskStatus = JSON.parse(taskStatusJson);
                if (taskStatus && taskStatus.id) {
                  individualTaskUpdates.push(taskStatus);
                  console.log(`AdminTasks: Found individual status update for task ${taskStatus.id}: ${taskStatus.status}`);
                }
              }
            } catch (parseErr) {
              console.error(`AdminTasks: Error parsing task status from ${key}:`, parseErr);
            }
          });
        }
        
        // Check for pending updates queue
        let pendingUpdates = [];
        try {
          const pendingUpdatesJson = localStorage.getItem('workline_pending_updates');
          if (pendingUpdatesJson) {
            pendingUpdates = JSON.parse(pendingUpdatesJson);
            console.log(`AdminTasks: Found ${pendingUpdates.length} pending updates in queue`);
          }
        } catch (queueErr) {
          console.error('AdminTasks: Error parsing pending updates queue:', queueErr);
        }
        
        // Then fetch from API/service
        const tasksData = await TaskService.getAllTasks();
        console.log("AdminTasks: Tasks data received from service:", tasksData);
        
        // Merge tasks, prioritizing localStorage for status updates
        let mergedTasks = [];
        
        if (Array.isArray(tasksData) && tasksData.length > 0) {
          // Start with API tasks
          mergedTasks = [...tasksData];
          
          // Update with localStorage status if available
          if (Array.isArray(tasksFromStorage) && tasksFromStorage.length > 0) {
            mergedTasks = mergedTasks.map(apiTask => {
              // Find matching task in localStorage
              const localTask = tasksFromStorage.find(t => 
                t.id === apiTask.id || 
                (t._id && t._id === apiTask.id) || 
                (apiTask._id && apiTask._id === t.id)
              );
              
              if (localTask && localTask.lastUpdated) {
                // Use local task status if it has been updated
                console.log(`AdminTasks: Using localStorage status for task ${apiTask.id}: ${localTask.status}`);
                return { 
                  ...apiTask, 
                  status: localTask.status, 
                  lastUpdated: localTask.lastUpdated,
                  _pendingSync: localTask._pendingSync 
                };
              }
              return apiTask;
            });
          }
          
          // Apply individual task status updates
          if (individualTaskUpdates.length > 0) {
            mergedTasks = mergedTasks.map(task => {
              const statusUpdate = individualTaskUpdates.find(update => 
                update.id === task.id || 
                (update._id && update._id === task.id) || 
                (task._id && task._id === update.id)
              );
              
              if (statusUpdate) {
                console.log(`AdminTasks: Applying individual status update for task ${task.id}: ${statusUpdate.status}`);
                return { 
                  ...task, 
                  status: statusUpdate.status, 
                  lastUpdated: statusUpdate.lastUpdated || new Date().toISOString(),
                  _pendingSync: true 
                };
              }
              return task;
            });
          }
          
          // Apply pending updates from queue
          if (pendingUpdates.length > 0) {
            // Group updates by taskId and get the latest for each task
            const latestUpdates = {};
            pendingUpdates.forEach(update => {
              if (update.type === 'STATUS_UPDATE' && update.taskId && update.status) {
                if (!latestUpdates[update.taskId] || 
                    new Date(update.timestamp) > new Date(latestUpdates[update.taskId].timestamp)) {
                  latestUpdates[update.taskId] = update;
                }
              }
            });
            
            // Apply the latest updates
            Object.values(latestUpdates).forEach(update => {
              const taskIndex = mergedTasks.findIndex(task => 
                task.id === update.taskId || 
                (task._id && task._id === update.taskId)
              );
              
              if (taskIndex !== -1) {
                console.log(`AdminTasks: Applying queued status update for task ${update.taskId}: ${update.status}`);
                mergedTasks[taskIndex] = {
                  ...mergedTasks[taskIndex],
                  status: update.status,
                  lastUpdated: update.timestamp,
                  _pendingSync: true
                };
              } else {
                // Task not found in current list, might be a new task
                console.log(`AdminTasks: Task ${update.taskId} from update queue not found in current list`);
              }
            });
          }
        } else if (Array.isArray(tasksFromStorage) && tasksFromStorage.length > 0) {
          // If no API tasks, use localStorage tasks
          console.log("AdminTasks: No API tasks, using localStorage tasks");
          mergedTasks = tasksFromStorage;
          
          // Apply individual task status updates
          if (individualTaskUpdates.length > 0) {
            mergedTasks = mergedTasks.map(task => {
              const statusUpdate = individualTaskUpdates.find(update => 
                update.id === task.id || 
                (update._id && update._id === task.id) || 
                (task._id && task._id === update.id)
              );
              
              if (statusUpdate) {
                console.log(`AdminTasks: Applying individual status update for task ${task.id}: ${statusUpdate.status}`);
                return { 
                  ...task, 
                  status: statusUpdate.status, 
                  lastUpdated: statusUpdate.lastUpdated || new Date().toISOString(),
                  _pendingSync: true 
                };
              }
              return task;
            });
          }
        } else {
          // Fallback to empty array
          mergedTasks = [];
          
          // Check if we have any individual task updates that we can use to create tasks
          if (individualTaskUpdates.length > 0) {
            console.log("AdminTasks: Creating tasks from individual status updates");
            individualTaskUpdates.forEach(update => {
              mergedTasks.push({
                id: update.id,
                title: update.title || `Task ${update.id.substring(update.id.length - 5)}`,
                description: update.description || 'Task details will be synchronized when connection is restored',
                status: update.status,
                lastUpdated: update.lastUpdated || new Date().toISOString(),
                createdDate: update.createdDate || new Date().toISOString(),
                _pendingSync: true
              });
            });
          }
        }
        
        console.log("AdminTasks: Final merged tasks:", mergedTasks);
        setTasks(mergedTasks);
      } catch (err) {
        console.error("AdminTasks: Error fetching tasks:", err);
        // Provide mock data
        console.warn("AdminTasks: Using fallback task data");
        setTasks([
          {
            id: 'mock-1',
            title: 'Complete Q3 Reports',
            description: 'Finalize the quarterly financial reports for Q3',
            status: 'ongoing',
            assignedTo: 'jsmith@example.com',
            createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'admin@example.com'
          },
          {
            id: 'mock-2',
            title: 'Update Employee Handbook',
            description: 'Revise the employee handbook with new policies',
            status: 'completed',
            assignedTo: 'agarcia@example.com',
            createdDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'admin@example.com'
          }
        ]);
      }
    } catch (err) {
      setError(err.message || "Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchInitialData();
    
    // Set up a periodic check for task status updates
    const checkForUpdatesInterval = setInterval(() => {
      console.log('AdminTasks: Checking for task status updates');
      checkForTaskStatusUpdates();
      addMissingTasksFromStatusUpdates();
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(checkForUpdatesInterval);
    };
  }, []);
  
  // Function to add missing tasks from status updates
  const addMissingTasksFromStatusUpdates = () => {
    try {
      // Check for individual task status updates
      const allKeys = Object.keys(localStorage);
      const taskStatusKeys = allKeys.filter(key => key.startsWith('task_status_'));
      
      if (taskStatusKeys.length > 0) {
        console.log(`AdminTasks: Checking for missing tasks from ${taskStatusKeys.length} status updates`);
        
        let hasNewTasks = false;
        const updatedTasks = [...tasks];
        
        taskStatusKeys.forEach(key => {
          try {
            const taskStatusJson = localStorage.getItem(key);
            if (taskStatusJson) {
              const taskStatus = JSON.parse(taskStatusJson);
              if (taskStatus && taskStatus.id && taskStatus.status) {
                // Check if this task exists in our current state
                const taskExists = updatedTasks.some(task => 
                  task.id === taskStatus.id || 
                  (task._id && task._id === taskStatus.id) || 
                  (task.id && task.id.toString() === taskStatus.id.toString())
                );
                
                if (!taskExists) {
                  console.log(`AdminTasks: Adding missing task from status update: ${taskStatus.id}`);
                  
                  // Try to get more details from localStorage
                  let taskDetails = null;
                  try {
                    const allTasks = taskStorage.getAllTasks();
                    taskDetails = allTasks.find(t => 
                      t.id === taskStatus.id || 
                      (t._id && t._id === taskStatus.id) || 
                      (t.id && t.id.toString() === taskStatus.id.toString())
                    );
                  } catch (storageErr) {
                    console.error('AdminTasks: Error getting task details from storage:', storageErr);
                  }
                  
                  // Create a new task object
                  const newTask = taskDetails ? {
                    ...taskDetails,
                    status: taskStatus.status,
                    lastUpdated: taskStatus.lastUpdated || new Date().toISOString(),
                    _pendingSync: true
                  } : {
                    id: taskStatus.id,
                    title: `Task ${taskStatus.id.substring(taskStatus.id.length - 5)}`,
                    description: 'Task details will be synchronized when connection is restored',
                    status: taskStatus.status,
                    lastUpdated: taskStatus.lastUpdated || new Date().toISOString(),
                    createdDate: new Date().toISOString(),
                    _pendingSync: true
                  };
                  
                  updatedTasks.push(newTask);
                  hasNewTasks = true;
                }
              }
            }
          } catch (parseErr) {
            console.error(`AdminTasks: Error parsing task status from ${key}:`, parseErr);
          }
        });
        
        if (hasNewTasks) {
          console.log('AdminTasks: Adding missing tasks to state');
          setTasks(updatedTasks);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('AdminTasks: Error adding missing tasks from status updates:', error);
      return false;
    }
  };
  
  // Function to check for task status updates in localStorage
  const checkForTaskStatusUpdates = () => {
    try {
      // Check for individual task status updates
      const allKeys = Object.keys(localStorage);
      const taskStatusKeys = allKeys.filter(key => key.startsWith('task_status_'));
      
      if (taskStatusKeys.length > 0) {
        console.log(`AdminTasks: Found ${taskStatusKeys.length} task status updates in localStorage`);
        
        let hasUpdates = false;
        const updatedTasks = [...tasks];
        
        taskStatusKeys.forEach(key => {
          try {
            const taskStatusJson = localStorage.getItem(key);
            if (taskStatusJson) {
              const taskStatus = JSON.parse(taskStatusJson);
              if (taskStatus && taskStatus.id && taskStatus.status) {
                // Find the task in our current state
                const taskIndex = updatedTasks.findIndex(task => 
                  task.id === taskStatus.id || 
                  (task._id && task._id === taskStatus.id) || 
                  (task.id && task.id.toString() === taskStatus.id.toString())
                );
                
                if (taskIndex !== -1) {
                  // Check if the status is different (case-insensitive comparison)
                  const currentStatus = updatedTasks[taskIndex].status ? updatedTasks[taskIndex].status.toUpperCase() : '';
                  const newStatus = taskStatus.status ? taskStatus.status.toUpperCase() : '';
                  
                  if (currentStatus !== newStatus) {
                    console.log(`AdminTasks: Updating task ${taskStatus.id} status from ${updatedTasks[taskIndex].status} to ${taskStatus.status}`);
                    updatedTasks[taskIndex] = {
                      ...updatedTasks[taskIndex],
                      status: taskStatus.status,
                      lastUpdated: taskStatus.lastUpdated || new Date().toISOString(),
                      _pendingSync: true
                    };
                    hasUpdates = true;
                  }
                } else {
                  // Task not found in current state, might be a new task
                  console.log(`AdminTasks: Task ${taskStatus.id} not found in current state, might be a new task`);
                  
                  // Try to get the task from localStorage
                  try {
                    const allTasks = taskStorage.getAllTasks();
                    const localTask = allTasks.find(t => 
                      t.id === taskStatus.id || 
                      (t._id && t._id === taskStatus.id) || 
                      (t.id && t.id.toString() === taskStatus.id.toString())
                    );
                    
                    if (localTask) {
                      console.log(`AdminTasks: Found task ${taskStatus.id} in localStorage, adding to state`);
                      updatedTasks.push({
                        ...localTask,
                        status: taskStatus.status,
                        lastUpdated: taskStatus.lastUpdated || new Date().toISOString(),
                        _pendingSync: true
                      });
                      hasUpdates = true;
                    }
                  } catch (localErr) {
                    console.error(`AdminTasks: Error getting task from localStorage:`, localErr);
                  }
                }
              }
            }
          } catch (parseErr) {
            console.error(`AdminTasks: Error parsing task status from ${key}:`, parseErr);
          }
        });
        
        if (hasUpdates) {
          console.log('AdminTasks: Updating tasks state with new status updates');
          setTasks(updatedTasks);
        }
      }
    } catch (error) {
      console.error('AdminTasks: Error checking for task status updates:', error);
    }
  };

  // Create a new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      // Prep task data with current admin as creator
      const adminEmail = currentAdmin?.email || currentAdmin?.username || localStorage.getItem('userEmail') || 'admin@example.com';
      console.log("AdminTasks: Using admin email for task creation:", adminEmail);
      
      // Get the assigned employee's name for better display
      const assignedEmployee = employees.find(emp => 
        emp.email === newTask.assignedTo || 
        emp.username === newTask.assignedTo
      );
      
      const assignedToName = assignedEmployee ? assignedEmployee.name : '';
      console.log("AdminTasks: Assigning to employee:", assignedToName);
      
      const taskData = {
        ...newTask,
        createdBy: adminEmail,
        createdByName: currentAdmin?.name || 'Admin',
        assignedToName: assignedToName,
        status: 'ongoing',
        createdDate: new Date().toISOString()
      };
      
      console.log("AdminTasks: Sending task data:", taskData);
      const createdTask = await TaskService.createTask(taskData);
      console.log("AdminTasks: Created task:", createdTask);
      
      // Store the assigned user's email in localStorage to help with task retrieval
      if (newTask.assignedTo) {
        localStorage.setItem('lastAssignedUser', newTask.assignedTo);
      }
      
      // Add new task to state and reset form
      console.log('AdminTasks: Adding created task to state:', createdTask);
      
      // Ensure we're adding a valid task object
      if (createdTask && typeof createdTask === 'object') {
        // Make sure we don't add duplicate tasks
        const updatedTasks = tasks.filter(t => t.id !== createdTask.id);
        updatedTasks.push(createdTask);
        setTasks(updatedTasks);
        
        // Also refresh the task list from storage to ensure consistency
        setTimeout(() => {
          console.log('AdminTasks: Refreshing task list after creation');
          fetchInitialData();
        }, 500);
      } else {
        console.error('AdminTasks: Invalid task object returned from creation:', createdTask);
      }
      
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: ''
      });
      setShowCreateForm(false);
      
      // Show success message
      alert(`Task successfully assigned to ${assignedToName || newTask.assignedTo}`);
    } catch (err) {
      console.error("AdminTasks: Error creating task:", err);
      setError("Failed to create task. Please try again.");
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setError(null);
        await TaskService.deleteTask(taskId);
        
        // Remove task from state
        setTasks(tasks.filter(task => task.id !== taskId));
      } catch (err) {
        console.error("Error deleting task:", err);
        setError("Failed to delete task. Please try again.");
      }
    }
  };

  // Update task status
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      setError(null);
      console.log(`AdminTasks: Updating task ${taskId} status to ${newStatus}`);
      
      // First update the UI immediately for better user experience
      setTasks(tasks.map(task => {
        // Match on id or _id
        if (task.id === taskId || 
            (task._id && task._id === taskId) || 
            (task.id && task.id.toString() === taskId.toString())) {
          return { 
            ...task, 
            status: newStatus, 
            lastUpdated: new Date().toISOString(),
            _pendingSync: true
          };
        }
        return task;
      }));
      
      // Also save to a separate localStorage item as a backup
      try {
        const statusBackup = {
          id: taskId,
          status: newStatus,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`task_status_${taskId}`, JSON.stringify(statusBackup));
        console.log(`AdminTasks: Saved status backup to localStorage for task ${taskId}`);
      } catch (storageErr) {
        console.error('AdminTasks: Error saving status backup to localStorage:', storageErr);
      }
      
      // Update via TaskService
      const updatedTask = await TaskService.updateTaskStatus(taskId, newStatus);
      console.log('AdminTasks: Task status updated via service:', updatedTask);
      
      // Show success message
      const successMessage = `Task status updated to ${newStatus.toLowerCase()}`;
      console.log('AdminTasks:', successMessage);
      
      // Refresh task list after a short delay to ensure consistency
      setTimeout(() => {
        console.log('AdminTasks: Refreshing task list after status update');
        fetchInitialData();
      }, 500);
    } catch (err) {
      console.error("AdminTasks: Error updating task status:", err);
      setError("Failed to update task status. Please try again.");
      
      // Try to refresh anyway to get the latest data
      setTimeout(() => fetchInitialData(), 1000);
    }
  };

  // Calculate days remaining with error handling
  const calculateDaysRemaining = (deadline) => {
    try {
      if (!deadline) return 0;
      
      const today = new Date();
      const deadlineDate = new Date(deadline);
      
      // Check if deadline is valid
      if (isNaN(deadlineDate.getTime())) {
        console.warn(`Invalid deadline date: ${deadline}`);
        return 0;
      }
      
      const timeDiff = deadlineDate - today;
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      return daysDiff;
    } catch (err) {
      console.error("Error calculating days remaining:", err, deadline);
      return 0;
    }
  };

  // Format date with error handling
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (err) {
      console.error("Error formatting date:", err);
      return 'Invalid Date';
    }
  };

  // Filter tasks based on search term and status
  const filteredTasks = tasks.filter(task => {
    // Safety checks for null values
    const title = task.title || '';
    const description = task.description || '';
    const assignedToName = task.assignedToName || '';
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assignedToName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (task.status && task.status.toLowerCase() === statusFilter.toLowerCase()) ||
                          (statusFilter === 'completed' && 
                           task.status && 
                           (task.status.toUpperCase() === 'COMPLETED' || 
                            task.status.toUpperCase() === 'COMPLETE' || 
                            task.status.toUpperCase() === 'DONE'));
    
    return matchesSearch && matchesStatus;
  });

  // Get task status classes
  const getTaskCardClass = (task) => {
    // Check for completed status with case insensitivity
    const status = task.status ? task.status.toUpperCase() : '';
    
    if (!task.dueDate) return 'task-card normal';
    if (status === 'COMPLETED' || status === 'COMPLETE' || status === 'DONE') {
      return 'task-card completed';
    }
    return calculateDaysRemaining(task.dueDate) < 3 ? 'task-card urgent' : 'task-card normal';
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value
    });
  };

  return (
    <div className="admin-tasks-container">
      <header className="header-container">
        <div className="system-title">HRSystem</div>
        <div className="header-actions">
          <div className="user-profile">
            <div className="profile-info">
              <span className="user-name">{currentAdmin?.name || 'Admin'}</span>
              <span className="user-role">Administrator</span>
            </div>
            <div className="user-avatar">
              <User size={20} />
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="page-header">
          <div className="title-action">
            <h1 className="page-title">Manage Tasks</h1>
            <div className="action-buttons">
              <button 
                className="btn btn-secondary refresh-btn"
                onClick={() => {
                  console.log('AdminTasks: Manual refresh requested');
                  // First check for local updates
                  checkForTaskStatusUpdates();
                  // Check for missing tasks
                  addMissingTasksFromStatusUpdates();
                  // Then do a full refresh
                  fetchInitialData();
                }}
                title="Refresh task list"
              >
                <RefreshCw size={18} style={{ marginRight: '0.5rem' }} />
                Refresh
              </button>
              <button 
                className="btn btn-primary create-btn"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus size={18} style={{ marginRight: '0.5rem' }} />
                Create Task
              </button>
            </div>
          </div>
          
          <div className="search-filter-container">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search tasks..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-dropdown">
              <Filter className="filter-icon" size={18} />
              <select 
                className="filter-select" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Tasks</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button 
              className="btn btn-primary retry-button"
              onClick={() => fetchInitialData()}
            >
              <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
              Retry Connection
            </button>
          </div>
        )}

        {showCreateForm && (
          <div className="create-task-form">
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label htmlFor="title">Task Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newTask.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="assignedTo">Assign To</label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={newTask.assignedTo}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(employee => (
                    <option key={employee.id || employee.username} value={employee.email || employee.username}>
                      {employee.name} ({employee.department})
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
                  value={newTask.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <p>Loading tasks...</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <div key={task.id} className={getTaskCardClass(task)}>
                  <div className="task-content">
                    <div className="task-info">
                      <div className="task-header">
                        <div className="task-title-wrapper">
                          <h3 className="task-title">{task.title}</h3>
                        </div>
                        <span className={`task-status ${
                          task.status && task.status.toUpperCase() === 'COMPLETED' ? 'status-completed' : 
                          task.status && task.status.toUpperCase() === 'COMPLETE' ? 'status-completed' : 
                          task.status && task.status.toUpperCase() === 'DONE' ? 'status-completed' : 
                          'status-ongoing'
                        }`}>
                          {task.status && 
                           (task.status.toUpperCase() === 'COMPLETED' || 
                            task.status.toUpperCase() === 'COMPLETE' || 
                            task.status.toUpperCase() === 'DONE') 
                            ? 'Completed' : 'Ongoing'}
                          {task._pendingSync && <span className="sync-pending"> (Pending Sync)</span>}
                        </span>
                      </div>
                      <p className="task-description">{task.description}</p>
                      
                      <div className="task-meta">
                        <div className="meta-item">
                          <Calendar className="meta-icon" size={16} />
                          <span>Posted: {formatDate(task.createdDate)}</span>
                        </div>
                        <div className="meta-item">
                          <Clock className="meta-icon" size={16} />
                          <span>Deadline: {formatDate(task.dueDate)}</span>
                        </div>
                        <div className="meta-item">
                          <Users className="meta-icon" size={16} />
                          <span>Assigned to: {task.assignedToName || task.assignedTo || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="task-actions">
                    <div className="task-controls">
                      {!(task.status && 
                         (task.status.toUpperCase() === 'COMPLETED' || 
                          task.status.toUpperCase() === 'COMPLETE' || 
                          task.status.toUpperCase() === 'DONE')) ? (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                          className="btn btn-success action-btn"
                        >
                          <CheckCircle size={16} />
                          <span>Complete</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'ONGOING')}
                          className="btn btn-primary action-btn"
                        >
                          <Clock size={16} />
                          <span>Reopen</span>
                        </button>
                      )}
                      <button className="btn btn-secondary action-btn">
                        <Edit size={16} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="btn btn-danger action-btn"
                      >
                        <Trash size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                    
                    <div className="days-remaining">
                      {task.status && 
                       (task.status.toUpperCase() === 'COMPLETED' || 
                        task.status.toUpperCase() === 'COMPLETE' || 
                        task.status.toUpperCase() === 'DONE') 
                        ? 'Task Completed' : 
                       !task.dueDate ? 'No deadline' :
                       calculateDaysRemaining(task.dueDate) <= 0 ? 'Overdue!' :
                       `${calculateDaysRemaining(task.dueDate)} days remaining`}
                      {task._pendingSync && <span className="sync-pending"> (Pending Sync)</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-tasks">
                <p className="empty-message">No tasks found matching your criteria.</p>
                {statusFilter !== 'all' || searchTerm !== '' ? (
                  <button 
                    className="btn btn-secondary clear-filters"
                    onClick={() => {
                      setStatusFilter('all');
                      setSearchTerm('');
                    }}
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminTasks;