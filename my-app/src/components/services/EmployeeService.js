import fetchApi from '../../utils/fetchApi';

class EmployeeService {
  // Get all employees/users
  async getAllEmployees() {
    try {
      return await fetchApi.get('/users');
    } catch (error) {
      console.error('Error fetching all employees:', error);
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
}

export default new EmployeeService();