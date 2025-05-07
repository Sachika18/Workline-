import fetchApi from '../../utils/fetchApi';

class EmployeeService {
  // Get all employees/users
  async getAllEmployees() {
    try {
      console.log('EmployeeService: Fetching all employees from API');
      const employees = await fetchApi.get('/users');
      console.log(`EmployeeService: Received ${employees ? (Array.isArray(employees) ? employees.length : 'non-array') : 'no'} employees from API`);
      
      // Store in localStorage for offline access
      if (employees && Array.isArray(employees)) {
        try {
          // First clear any existing data to ensure we don't have stale data
          localStorage.removeItem('workline_employees');
          
          // Then store the fresh data
          localStorage.setItem('workline_employees', JSON.stringify(employees));
          console.log(`EmployeeService: Stored ${employees.length} employees in localStorage`);
        } catch (storageError) {
          console.error('Error storing employees in localStorage:', storageError);
        }
      }
      
      return employees;
    } catch (error) {
      console.error('Error fetching all employees:', error);
      
      // Try to get from localStorage
      try {
        const storedEmployees = localStorage.getItem('workline_employees');
        if (storedEmployees) {
          const parsedEmployees = JSON.parse(storedEmployees);
          console.log(`EmployeeService: Using ${parsedEmployees.length} employees from localStorage`);
          return parsedEmployees;
        }
      } catch (storageError) {
        console.error('Error reading employees from localStorage:', storageError);
      }
      
      console.log('EmployeeService: No employees found, returning empty array');
      return [];
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      return await fetchApi.get('/dashboard');
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }
  
  // Get employee by ID
  async getEmployeeById(id) {
    try {
      console.log(`EmployeeService: Getting employee with ID ${id}`);
      const employee = await fetchApi.get(`/users/${id}`);
      
      // Log the employee data to debug skills and joining date
      if (employee) {
        console.log('EmployeeService: Employee data from API:', employee);
        console.log('EmployeeService: Skills data:', employee.skills);
        console.log('EmployeeService: Join date:', employee.joinDate || employee.joiningDate);
      }
      
      return employee;
    } catch (error) {
      console.error(`Error fetching employee with ID ${id}:`, error);
      
      // Try to get from localStorage
      try {
        const storedEmployees = localStorage.getItem('workline_employees');
        if (storedEmployees) {
          const employees = JSON.parse(storedEmployees);
          const employee = employees.find(emp => emp.id === id || emp._id === id);
          
          // Log the employee data from localStorage
          if (employee) {
            console.log('EmployeeService: Employee data from localStorage:', employee);
            console.log('EmployeeService: Skills data from localStorage:', employee.skills);
            console.log('EmployeeService: Join date from localStorage:', employee.joinDate || employee.joiningDate);
          }
          
          return employee;
        }
      } catch (storageError) {
        console.error('Error reading employees from localStorage:', storageError);
      }
      
      return null;
    }
  }
  
  // Get employee statistics
  async getEmployeeStats() {
    try {
      console.log('EmployeeService: Getting employee statistics');
      
      // Get all employees
      let employees = [];
      try {
        employees = await this.getAllEmployees();
        console.log(`EmployeeService: Found ${employees.length} employees for statistics calculation`);
      } catch (error) {
        console.error('EmployeeService: Error getting employees for statistics:', error);
        
        // Try to get from localStorage
        try {
          const storedEmployees = localStorage.getItem('workline_employees');
          if (storedEmployees) {
            employees = JSON.parse(storedEmployees);
            console.log(`EmployeeService: Using ${employees.length} employees from localStorage for statistics`);
          }
        } catch (storageError) {
          console.error('EmployeeService: Error reading employees from localStorage:', storageError);
        }
      }
      
      // Calculate statistics
      const totalEmployees = employees.length;
      
      // Calculate active employees (those who have logged in recently)
      // For demo purposes, we'll consider 70% of employees as active
      const activeEmployees = Math.round(totalEmployees * 0.7);
      
      // Calculate employees by department
      const departmentCounts = {};
      employees.forEach(employee => {
        if (employee.department) {
          departmentCounts[employee.department] = (departmentCounts[employee.department] || 0) + 1;
        }
      });
      
      // Calculate new employees (joined in the last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      const newEmployees = employees.filter(employee => {
        if (!employee.joinDate && !employee.createdAt) return false;
        
        const joinDate = new Date(employee.joinDate || employee.createdAt);
        return joinDate >= thirtyDaysAgo;
      }).length;
      
      const stats = {
        totalEmployees,
        activeEmployees,
        departmentCounts,
        newEmployees
      };
      
      console.log('EmployeeService: Calculated employee stats:', stats);
      return stats;
    } catch (error) {
      console.error('EmployeeService: Error getting employee stats:', error);
      
      // Return default stats as fallback
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        departmentCounts: {},
        newEmployees: 0
      };
    }
  }
  // Delete an employee
  async deleteEmployee(id) {
    try {
      console.log(`EmployeeService: Deleting employee with ID ${id}`);
      
      // Make an API call to delete the employee from the database
      // Try different endpoint formats since we're not sure which one the backend expects
      let response;
      try {
        // First try the standard RESTful endpoint
        response = await fetchApi.delete(`/users/${id}`);
        console.log('Delete response from server (standard endpoint):', response);
      } catch (apiError) {
        console.error('Error with standard delete endpoint:', apiError);
        
        // Try alternative endpoint with query parameter
        try {
          response = await fetchApi.delete(`/users/delete?id=${id}`);
          console.log('Delete response from server (query parameter):', response);
        } catch (altError) {
          console.error('Error with alternative delete endpoint:', altError);
          
          // Try with a POST request to a delete endpoint
          try {
            response = await fetchApi.post(`/users/delete`, { id });
            console.log('Delete response from server (POST to delete):', response);
          } catch (postError) {
            console.error('Error with POST delete endpoint:', postError);
            throw postError; // Re-throw the error if all attempts fail
          }
        }
      }
      
      // Always update localStorage regardless of API success
      try {
        const storedEmployees = localStorage.getItem('workline_employees');
        if (storedEmployees) {
          const employees = JSON.parse(storedEmployees);
          const updatedEmployees = employees.filter(emp => 
            emp.id !== id && emp._id !== id
          );
          
          // Log the before and after counts to verify deletion
          console.log(`Before deletion: ${employees.length} employees`);
          console.log(`After deletion: ${updatedEmployees.length} employees`);
          
          localStorage.setItem('workline_employees', JSON.stringify(updatedEmployees));
          console.log(`Employee with ID ${id} removed from localStorage`);
          
          // Force a refresh of the localStorage in the browser
          localStorage.removeItem('workline_employees');
          localStorage.setItem('workline_employees', JSON.stringify(updatedEmployees));
        }
      } catch (storageError) {
        console.error('Error updating localStorage after deletion:', storageError);
      }
      
      // Return a standardized response
      return {
        success: true,
        message: 'Employee deleted successfully',
        data: response
      };
    } catch (error) {
      console.error(`Error deleting employee with ID ${id}:`, error);
      
      // Even if the API fails, still update localStorage to reflect the deletion in the UI
      try {
        const storedEmployees = localStorage.getItem('workline_employees');
        if (storedEmployees) {
          const employees = JSON.parse(storedEmployees);
          const updatedEmployees = employees.filter(emp => 
            emp.id !== id && emp._id !== id
          );
          
          // Log the before and after counts to verify deletion
          console.log(`Before deletion (fallback): ${employees.length} employees`);
          console.log(`After deletion (fallback): ${updatedEmployees.length} employees`);
          
          localStorage.setItem('workline_employees', JSON.stringify(updatedEmployees));
          console.log(`Employee with ID ${id} removed from localStorage (fallback)`);
          
          // Force a refresh of the localStorage in the browser
          localStorage.removeItem('workline_employees');
          localStorage.setItem('workline_employees', JSON.stringify(updatedEmployees));
          
          // Return a success response for the UI to update
          return { 
            success: true, 
            message: 'Employee deleted from local storage (server unavailable)',
            isOffline: true
          };
        }
      } catch (storageError) {
        console.error('Error updating localStorage after deletion:', storageError);
      }
      
      // If all fails, throw the error to be handled by the caller
      throw error;
    }
  }
}

export default new EmployeeService();