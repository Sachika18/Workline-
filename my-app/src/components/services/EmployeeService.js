import fetchApi from '../../utils/fetchApi';

class EmployeeService {
  // Get all employees/users
  async getAllEmployees() {
    try {
      const employees = await fetchApi.get('/users');
      
      // Store in localStorage for offline access
      if (employees && Array.isArray(employees)) {
        try {
          localStorage.setItem('workline_employees', JSON.stringify(employees));
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
          return JSON.parse(storedEmployees);
        }
      } catch (storageError) {
        console.error('Error reading employees from localStorage:', storageError);
      }
      
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
}

export default new EmployeeService();