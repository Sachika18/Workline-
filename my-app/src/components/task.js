import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './task.css'; // You'll need to create this CSS file

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fetch tasks assigned to the current user
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // First get the current user's ID
        const userResponse = await axios.get('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const userId = userResponse.data.id;
        
        // Then fetch tasks assigned to this user
        const tasksResponse = await axios.get(`/api/tasks/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTasks(tasksResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again later.');
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.patch(`/api/tasks/${taskId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update the task in the local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      // Close task details if open
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
      
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'ONGOING': return 'status-ongoing';
      case 'COMPLETED': return 'status-completed';
      default: return '';
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // View task details
  const viewTaskDetails = (task) => {
    setSelectedTask(task);
  };

  // Close task details
  const closeTaskDetails = () => {
    setSelectedTask(null);
  };

  if (loading) {
    return <div className="loading">Loading your tasks...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="task-page-container">
      <h1>My Tasks</h1>
      
      {tasks.length === 0 ? (
        <div className="no-tasks-message">
          <p>You don't have any assigned tasks yet.</p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`task-card ${getStatusBadgeClass(task.status)}`}
              onClick={() => viewTaskDetails(task)}
            >
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className={`status-badge ${getStatusBadgeClass(task.status)}`}>
                  {formatStatus(task.status)}
                </span>
              </div>
              <p className="task-description">{task.description.substring(0, 100)}...</p>
              <div className="task-footer">
                <span className="due-date">Due: {formatDate(task.dueDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Task Details Modal */}
      {selectedTask && (
        <div className="task-modal-overlay">
          <div className="task-modal">
            <button className="close-modal" onClick={closeTaskDetails}>×</button>
            
            <div className="task-modal-header">
              <h2>{selectedTask.title}</h2>
              <span className={`status-badge ${getStatusBadgeClass(selectedTask.status)}`}>
                {formatStatus(selectedTask.status)}
              </span>
            </div>
            
            <div className="task-modal-body">
              <p className="task-full-description">{selectedTask.description}</p>
              
              <div className="task-details">
                <div className="detail-item">
                  <span className="detail-label">Due Date:</span>
                  <span className="detail-value">{formatDate(selectedTask.dueDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created On:</span>
                  <span className="detail-value">{formatDate(selectedTask.createdAt)}</span>
                </div>
              </div>
              
              <div className="task-actions">
                {selectedTask.status === 'PENDING' && (
                  <button 
                    className="action-button start-button"
                    onClick={() => updateTaskStatus(selectedTask.id, 'ONGOING')}
                  >
                    Start Task
                  </button>
                )}
                
                {selectedTask.status === 'ONGOING' && (
                  <button 
                    className="action-button complete-button"
                    onClick={() => updateTaskStatus(selectedTask.id, 'COMPLETED')}
                  >
                    Mark as Completed
                  </button>
                )}
                
                {selectedTask.status === 'COMPLETED' && (
                  <div className="completion-message">
                    Task completed! 🎉
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPage;