import React, { useState } from 'react';
import './Tasks.css';
import Navbar from './Navbar';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Normal',
    status: 'Pending',
  });

  const handleChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const addTask = (e) => {
    e.preventDefault();
    if (newTask.title.trim() === '') return;
    setTasks([...tasks, newTask]);
    setNewTask({ title: '', description: '', dueDate: '', priority: 'Normal', status: 'Pending' });
  };

  const markCompleted = (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].status = 'Completed';
    setTasks(updatedTasks);
  };

  return (  
    <div>
    <Navbar />
    <div className="tasks-container">
      <h2 className="section-title">Manage Tasks</h2>
      
      <form className="task-form" onSubmit={addTask}>
        <input
          type="text"
          name="title"
          placeholder="Task Title"
          value={newTask.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Task Description"
          value={newTask.description}
          onChange={handleChange}
        />
        <input
          type="date"
          name="dueDate"
          value={newTask.dueDate}
          onChange={handleChange}
        />
        <select name="priority" value={newTask.priority} onChange={handleChange}>
          <option value="Low">Low</option>
          <option value="Normal">Normal</option>
          <option value="High">High</option>
        </select>
        <button type="submit" className="add-btn">Add Task</button>
      </form>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p className="no-tasks">No tasks added yet.</p>
        ) : (
          tasks.map((task, index) => (
            <div key={index} className={`task-card ${task.status.toLowerCase()}`}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <p><strong>Due:</strong> {task.dueDate || 'No deadline'}</p>
              <p><strong>Priority:</strong> {task.priority}</p>
              <p><strong>Status:</strong> {task.status}</p>
              {task.status === 'Pending' && (
                <button onClick={() => markCompleted(index)} className="complete-btn">
                  Mark Completed
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
};

export default Tasks;
