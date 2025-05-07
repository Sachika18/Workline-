import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeService from './services/EmployeeService';
import defaultAvatar from '../assets/avatar.png';
import socketManager from '../utils/socket';
import './EmployeePage.css';

const EmployeePage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await EmployeeService.getAllEmployees();
      
      if (data && Array.isArray(data)) {
        // Format employee data
        const formattedEmployees = data.map(emp => ({
          id: emp.id || emp._id || Math.random().toString(36).substring(2, 9),
          firstName: emp.firstName || '',
          lastName: emp.lastName || '',
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
          position: emp.position || emp.jobTitle || 'Employee',
          department: emp.department || 'General',
          email: emp.email || '',
          phone: emp.phone || emp.phoneNumber || 'N/A',
          // Use the real status from the service
          status: emp.status || 'offline',
          employeeId: emp.employeeId || emp.id || 'N/A',
          joinDate: emp.joinDate || emp.createdAt || new Date().toISOString(),
          address: emp.address || 'N/A',
          skills: emp.skills || [],
          avatar: emp.avatar || null,
          // Include all other fields from the original employee object
          ...emp
        }));
        
        setEmployees(formattedEmployees);
        
        // Extract unique departments for filtering
        const uniqueDepartments = [...new Set(formattedEmployees.map(emp => emp.department))];
        setDepartments(uniqueDepartments);
      } else {
        setError('No employee data found');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEmployees();
    
    // Set up interval to refresh employee statuses
    const refreshInterval = setInterval(() => {
      fetchEmployees();
    }, 60 * 1000); // Refresh every minute
    
    // Subscribe to WebSocket status updates
    const statusSubscription = socketManager.subscribeToUserStatus((data) => {
      const { userId, status } = data;
      
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => {
          if (emp.id === userId || emp._id === userId) {
            return { ...emp, status };
          }
          return emp;
        })
      );
    });
    
    // Also listen for local status changes (fallback)
    const handleStatusChange = (event) => {
      const { userId, status } = event.detail;
      
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => {
          if (emp.id === userId || emp._id === userId) {
            return { ...emp, status };
          }
          return emp;
        })
      );
    };
    
    // Add event listener for local status changes
    window.addEventListener('user-status-change', handleStatusChange);
    
    // Clean up
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('user-status-change', handleStatusChange);
      if (statusSubscription) {
        statusSubscription.unsubscribe();
      }
    };
  }, []);

  // Filter employees based on search term and department
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Handle employee selection
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };
  
  // Update selected employee status when employees list updates
  useEffect(() => {
    if (selectedEmployee) {
      const updatedEmployee = employees.find(emp => emp.id === selectedEmployee.id);
      if (updatedEmployee && updatedEmployee.status !== selectedEmployee.status) {
        setSelectedEmployee(prev => ({
          ...prev,
          status: updatedEmployee.status
        }));
      }
    }
  }, [employees, selectedEmployee]);

  // Handle back button click
  const handleBackClick = () => {
    setSelectedEmployee(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="employee-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading employees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-page-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/admin')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="employee-page-container">
      {!selectedEmployee ? (
        // Employee List View
        <>
          <div className="employee-page-header">
            <h1>Employee Directory</h1>
            <div className="employee-page-actions">
              <button className="add-employee-btn" onClick={() => navigate('/admin/employees/add')}>
                <span className="btn-icon">+</span> Add Employee
              </button>
            </div>
          </div>

          <div className="employee-filters">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by name, ID or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="employee-search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            
            <div className="department-filter">
              <label htmlFor="department-select">Department:</label>
              <select 
                id="department-select" 
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="department-select"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="employee-stats">
            <div className="stat-card">
              <h3>Total Employees</h3>
              <p>{employees.length}</p>
            </div>
            <div className="stat-card">
              <h3>Active Now</h3>
              <p>{employees.filter(emp => emp.status === 'online').length}</p>
            </div>
            <div className="stat-card">
              <h3>Departments</h3>
              <p>{departments.length}</p>
            </div>
          </div>

          <div className="employee-grid">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => (
                <div 
                  key={employee.id} 
                  className="employee-card"
                  onClick={() => handleEmployeeSelect(employee)}
                >
                  <div className="employee-card-header">
                    <div className={`employee-avatar ${employee.status}`}>
                      <img src={employee.avatar || defaultAvatar} alt={employee.name} />
                      <span className={`status-indicator ${employee.status}`}></span>
                    </div>
                    <div className="employee-basic-info">
                      <h3>{employee.name}</h3>
                      <p className="employee-position">{employee.position}</p>
                      <p className={`employee-status-text ${employee.status}`}>
                        {employee.status === 'online' ? 'Active now' : 
                         employee.status === 'away' ? 'Away' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="employee-card-body">
                    <div className="employee-detail">
                      <span className="detail-label">ID:</span>
                      <span className="detail-value">{employee.employeeId}</span>
                    </div>
                    <div className="employee-detail">
                      <span className="detail-label">Dept:</span>
                      <span className="detail-value">{employee.department}</span>
                    </div>
                    <div className="employee-detail">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value email">{employee.email}</span>
                    </div>
                    <div className="employee-detail">
                      <span className="detail-label">Joined:</span>
                      <span className="detail-value">{formatDate(employee.joinDate)}</span>
                    </div>
                  </div>
                  <div className="employee-card-footer">
                    <button className="view-details-btn">View Details</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-employees-found">
                <p>No employees match your search criteria</p>
                <button onClick={() => {
                  setSearchTerm('');
                  setFilterDepartment('all');
                }}>Clear Filters</button>
              </div>
            )}
          </div>
        </>
      ) : (
        // Employee Detail View
        <div className="employee-detail-container">
          <button className="back-button" onClick={handleBackClick}>
            ← Back to Employee List
          </button>
          
          <div className="employee-detail-header">
            <div className="employee-profile-header">
              <div className="employee-profile-avatar">
                <img src={selectedEmployee.avatar || defaultAvatar} alt={selectedEmployee.name} />
                <span className={`status-badge ${selectedEmployee.status}`}>
                  {selectedEmployee.status === 'online' ? 'Active Now' : 
                   selectedEmployee.status === 'away' ? 'Away' : 'Offline'}
                </span>
              </div>
              <div className="employee-profile-info">
                <h1>{selectedEmployee.name}</h1>
                <p className="employee-title">{selectedEmployee.position}</p>
                <p className="employee-department">{selectedEmployee.department}</p>
                <div className="employee-id-badge">ID: {selectedEmployee.employeeId}</div>
              </div>
              <div className="employee-actions">
                <button className="action-btn edit">Edit Profile</button>
                <button className="action-btn message">Message</button>
              </div>
            </div>
          </div>
          
          <div className="employee-detail-content">
            <div className="detail-section personal-info">
              <h2>Personal Information</h2>
              <div className="detail-grid">
                <div className="detail-item">
                  <h3>Full Name</h3>
                  <p>{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                </div>
                <div className="detail-item">
                  <h3>Email</h3>
                  <p>{selectedEmployee.email}</p>
                </div>
                <div className="detail-item">
                  <h3>Phone</h3>
                  <p>{selectedEmployee.phone}</p>
                </div>
                <div className="detail-item">
                  <h3>Address</h3>
                  <p>{selectedEmployee.address}</p>
                </div>
                <div className="detail-item">
                  <h3>Date Joined</h3>
                  <p>{formatDate(selectedEmployee.joinDate)}</p>
                </div>
                <div className="detail-item">
                  <h3>Employee ID</h3>
                  <p>{selectedEmployee.employeeId}</p>
                </div>
              </div>
            </div>
            
            <div className="detail-section job-info">
              <h2>Job Information</h2>
              <div className="detail-grid">
                <div className="detail-item">
                  <h3>Position</h3>
                  <p>{selectedEmployee.position}</p>
                </div>
                <div className="detail-item">
                  <h3>Department</h3>
                  <p>{selectedEmployee.department}</p>
                </div>
                <div className="detail-item">
                  <h3>Manager</h3>
                  <p>{selectedEmployee.manager || 'Not Assigned'}</p>
                </div>
                <div className="detail-item">
                  <h3>Work Schedule</h3>
                  <p>{selectedEmployee.workSchedule || 'Standard (9 AM - 5 PM)'}</p>
                </div>
              </div>
            </div>
            
            {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
              <div className="detail-section skills">
                <h2>Skills & Expertise</h2>
                <div className="skills-container">
                  {selectedEmployee.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="detail-section additional-info">
              <h2>Additional Information</h2>
              <div className="detail-grid">
                {Object.entries(selectedEmployee).map(([key, value]) => {
                  // Skip already displayed fields and internal fields
                  if (['id', '_id', 'firstName', 'lastName', 'name', 'position', 'department', 
                       'email', 'phone', 'status', 'employeeId', 'joinDate', 'address', 
                       'skills', 'avatar', 'manager', 'workSchedule'].includes(key) || 
                      key.startsWith('_') || 
                      typeof value === 'object' ||
                      value === null ||
                      value === undefined) {
                    return null;
                  }
                  
                  return (
                    <div key={key} className="detail-item">
                      <h3>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
                      <p>{String(value)}</p>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;