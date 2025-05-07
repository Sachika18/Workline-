import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeePage from '../EmployeePage';
import EmployeeService from '../services/EmployeeService';

// Mock the EmployeeService
jest.mock('../services/EmployeeService');

describe('EmployeePage Component', () => {
  const mockEmployees = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      position: 'Frontend Developer',
      department: 'Tech',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      status: 'online',
      employeeId: '1A002',
      joinDate: '2022-01-15',
      address: '123 Main St, City',
      skills: ['JavaScript', 'React', 'CSS']
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      position: 'HR Manager',
      department: 'HR',
      email: 'jane.smith@example.com',
      phone: '987-654-3210',
      status: 'away',
      employeeId: '1A003',
      joinDate: '2021-06-10',
      address: '456 Oak Ave, Town',
      skills: ['Recruiting', 'Employee Relations', 'Training']
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the getAllEmployees method
    EmployeeService.getAllEmployees.mockResolvedValue(mockEmployees);
  });

  test('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <EmployeePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/loading employees/i)).toBeInTheDocument();
  });

  test('renders employee list after loading', async () => {
    render(
      <BrowserRouter>
        <EmployeePage />
      </BrowserRouter>
    );
    
    // Wait for the employees to load
    await waitFor(() => {
      expect(screen.getByText('Employee Directory')).toBeInTheDocument();
    });
    
    // Check if both employees are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('filters employees by search term', async () => {
    render(
      <BrowserRouter>
        <EmployeePage />
      </BrowserRouter>
    );
    
    // Wait for the employees to load
    await waitFor(() => {
      expect(screen.getByText('Employee Directory')).toBeInTheDocument();
    });
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Check if only John is visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  test('shows employee details when an employee is clicked', async () => {
    render(
      <BrowserRouter>
        <EmployeePage />
      </BrowserRouter>
    );
    
    // Wait for the employees to load
    await waitFor(() => {
      expect(screen.getByText('Employee Directory')).toBeInTheDocument();
    });
    
    // Click on an employee
    fireEvent.click(screen.getByText('John Doe'));
    
    // Check if the detail view is shown
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Job Information')).toBeInTheDocument();
    expect(screen.getByText('Skills & Expertise')).toBeInTheDocument();
  });
});