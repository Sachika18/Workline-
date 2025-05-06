import api from '../../utils/api';

// This service handles document-related operations
// It currently uses localStorage for persistence, but is structured to easily
// transition to a backend API when available

import fetchApi from '../../utils/fetchApi';

class DocumentService {
  // Get all documents (for admin)
  getAllDocuments() {
    try {
      // In a real implementation, this would be an API call:
      // return api.get('/documents');
      
      const documents = localStorage.getItem('admin_documents');
      return Promise.resolve({
        data: documents ? JSON.parse(documents) : []
      });
    } catch (error) {
      console.error('Error getting documents:', error);
      return Promise.reject(error);
    }
  }

  // Get user documents
  getUserDocuments(userId = null) {
    try {
      // In a real implementation, this would be an API call:
      // return api.get('/documents/user');
      
      const documents = localStorage.getItem('user_documents');
      const parsedDocs = documents ? JSON.parse(documents) : [];
      
      // If userId is provided, filter documents for that user
      const filteredDocs = userId 
        ? parsedDocs.filter(doc => doc.forUserId === userId || doc.forUser === 'All Employees')
        : parsedDocs;
      
      return Promise.resolve({
        data: filteredDocs
      });
    } catch (error) {
      console.error('Error getting user documents:', error);
      return Promise.reject(error);
    }
  }

  // Upload a document
  uploadDocument(documentData, forRequestId = null) {
    try {
      // In a real implementation, this would be an API call:
      // return api.post('/documents', documentData);
      
      // Add request ID if provided
      const docWithRequestId = forRequestId 
        ? { ...documentData, forRequestId } 
        : documentData;
      
      // Ensure the document has a unique ID
      if (!docWithRequestId.id) {
        docWithRequestId.id = Date.now() + Math.random();
      }
      
      // For admin uploads - always add to admin documents
      let adminDocuments = localStorage.getItem('admin_documents');
      adminDocuments = adminDocuments ? JSON.parse(adminDocuments) : [];
      
      // Check if document already exists (by ID)
      const existingAdminDocIndex = adminDocuments.findIndex(doc => doc.id === docWithRequestId.id);
      if (existingAdminDocIndex >= 0) {
        // Update existing document
        adminDocuments[existingAdminDocIndex] = docWithRequestId;
      } else {
        // Add new document
        adminDocuments = [docWithRequestId, ...adminDocuments];
      }
      
      localStorage.setItem('admin_documents', JSON.stringify(adminDocuments));
      
      // Always add to user documents as well for consistency
      let userDocuments = localStorage.getItem('user_documents');
      userDocuments = userDocuments ? JSON.parse(userDocuments) : [];
      
      // Check if document already exists (by ID)
      const existingUserDocIndex = userDocuments.findIndex(doc => doc.id === docWithRequestId.id);
      if (existingUserDocIndex >= 0) {
        // Update existing document
        userDocuments[existingUserDocIndex] = docWithRequestId;
      } else {
        // Add new document
        userDocuments = [docWithRequestId, ...userDocuments];
      }
      
      localStorage.setItem('user_documents', JSON.stringify(userDocuments));
      
      // If this is for a request, update the request status
      if (forRequestId) {
        this.updateDocumentRequest(forRequestId, {
          status: 'Completed',
          completedDate: new Date().toISOString().split('T')[0],
          documentId: docWithRequestId.id
        });
      }
      
      return Promise.resolve({
        data: docWithRequestId
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      return Promise.reject(error);
    }
  }

  // Delete a document
  deleteDocument(documentId) {
    try {
      // In a real implementation, this would be an API call:
      // return api.delete(`/documents/${documentId}`);
      
      // Remove from admin documents
      let adminDocuments = localStorage.getItem('admin_documents');
      adminDocuments = adminDocuments ? JSON.parse(adminDocuments) : [];
      adminDocuments = adminDocuments.filter(doc => doc.id !== documentId);
      localStorage.setItem('admin_documents', JSON.stringify(adminDocuments));
      
      // Remove from user documents
      let userDocuments = localStorage.getItem('user_documents');
      userDocuments = userDocuments ? JSON.parse(userDocuments) : [];
      userDocuments = userDocuments.filter(doc => doc.id !== documentId);
      localStorage.setItem('user_documents', JSON.stringify(userDocuments));
      
      // Check if this document was for a request and update the request status
      let requests = localStorage.getItem('document_requests');
      if (requests) {
        requests = JSON.parse(requests);
        const relatedRequest = requests.find(req => req.documentId === documentId);
        
        if (relatedRequest) {
          this.updateDocumentRequest(relatedRequest.id, {
            status: 'Pending',
            completedDate: null,
            documentId: null
          });
        }
      }
      
      return Promise.resolve({
        data: { id: documentId }
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      return Promise.reject(error);
    }
  }

  // Get all document requests
  getAllDocumentRequests() {
    try {
      // In a real implementation, this would be an API call:
      // return api.get('/document-requests');
      
      const requests = localStorage.getItem('document_requests');
      return Promise.resolve({
        data: requests ? JSON.parse(requests) : []
      });
    } catch (error) {
      console.error('Error getting document requests:', error);
      return Promise.reject(error);
    }
  }

  // Get user document requests (requests made by the user)
  getUserDocumentRequests(userId = null) {
    try {
      // In a real implementation, this would be an API call:
      // return api.get('/document-requests/user');
      
      // Try to get current user from localStorage
      let currentUserId = userId;
      
      if (!currentUserId) {
        const token = localStorage.getItem('token');
        if (token) {
          const currentUser = localStorage.getItem('currentUser');
          if (currentUser) {
            try {
              const parsedUser = JSON.parse(currentUser);
              currentUserId = parsedUser.id;
            } catch (error) {
              console.error('Error parsing current user from localStorage:', error);
            }
          }
        }
        
        // Fallback for demo
        if (!currentUserId) {
          currentUserId = 'user123';
        }
      }
      
      const requests = localStorage.getItem('document_requests');
      const allRequests = requests ? JSON.parse(requests) : [];
      const userRequests = allRequests.filter(req => req.userId === currentUserId);
      
      return Promise.resolve({
        data: userRequests
      });
    } catch (error) {
      console.error('Error getting user document requests:', error);
      return Promise.reject(error);
    }
  }
  
  // Get requests for a user (requests made for the user)
  getRequestsForUser(userId = null) {
    try {
      // In a real implementation, this would be an API call:
      // return api.get('/document-requests/for-user');
      
      // Try to get current user from localStorage
      let currentUserId = userId;
      
      if (!currentUserId) {
        const token = localStorage.getItem('token');
        if (token) {
          const currentUser = localStorage.getItem('currentUser');
          if (currentUser) {
            try {
              const parsedUser = JSON.parse(currentUser);
              currentUserId = parsedUser.id;
            } catch (error) {
              console.error('Error parsing current user from localStorage:', error);
            }
          }
        }
        
        // Fallback for demo
        if (!currentUserId) {
          currentUserId = 'user123';
        }
      }
      
      const requests = localStorage.getItem('document_requests');
      const allRequests = requests ? JSON.parse(requests) : [];
      const requestsForUser = allRequests.filter(req => req.forUserId === currentUserId);
      
      return Promise.resolve({
        data: requestsForUser
      });
    } catch (error) {
      console.error('Error getting requests for user:', error);
      return Promise.reject(error);
    }
  }

  // Create a document request
  createDocumentRequest(requestData) {
    try {
      // In a real implementation, this would be an API call:
      // return api.post('/document-requests', requestData);
      
      let requests = localStorage.getItem('document_requests');
      requests = requests ? JSON.parse(requests) : [];
      
      // Add the new request
      const newRequest = {
        id: Date.now(),
        ...requestData,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
      };
      
      requests = [newRequest, ...requests];
      localStorage.setItem('document_requests', JSON.stringify(requests));
      
      return Promise.resolve({
        data: newRequest
      });
    } catch (error) {
      console.error('Error creating document request:', error);
      return Promise.reject(error);
    }
  }

  // Update a document request
  updateDocumentRequest(requestId, updateData) {
    try {
      // In a real implementation, this would be an API call:
      // return api.put(`/document-requests/${requestId}`, updateData);
      
      let requests = localStorage.getItem('document_requests');
      requests = requests ? JSON.parse(requests) : [];
      
      // Update the request
      requests = requests.map(req => 
        req.id === requestId ? { ...req, ...updateData } : req
      );
      
      localStorage.setItem('document_requests', JSON.stringify(requests));
      
      return Promise.resolve({
        data: requests.find(req => req.id === requestId)
      });
    } catch (error) {
      console.error('Error updating document request:', error);
      return Promise.reject(error);
    }
  }

  // Add activity
  addActivity(activityData) {
    try {
      // In a real implementation, this would be an API call:
      // return api.post('/document-activities', activityData);
      
      let activities = localStorage.getItem('document_activities');
      activities = activities ? JSON.parse(activities) : [];
      
      // Add the new activity
      const newActivity = {
        id: Date.now(),
        ...activityData,
        timestamp: new Date().toISOString()
      };
      
      activities = [newActivity, ...activities];
      localStorage.setItem('document_activities', JSON.stringify(activities));
      
      return Promise.resolve({
        data: newActivity
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      return Promise.reject(error);
    }
  }

  // Get all activities
  getAllActivities() {
    try {
      // In a real implementation, this would be an API call:
      // return api.get('/document-activities');
      
      const activities = localStorage.getItem('document_activities');
      return Promise.resolve({
        data: activities ? JSON.parse(activities) : []
      });
    } catch (error) {
      console.error('Error getting activities:', error);
      return Promise.reject(error);
    }
  }
  
  // Get users from API with fallback to mock data
  async getUsers() {
    try {
      // Try to get token
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, using mock data');
        return this.getMockUsers();
      }
      
      try {
        // First try to get current user from dashboard
        const dashboardResponse = await fetchApi.get('/dashboard');
        console.log('Dashboard response:', dashboardResponse);
        
        try {
          // Then try to get all users
          const usersResponse = await fetchApi.get('/users');
          console.log('Users response:', usersResponse);
          
          if (Array.isArray(usersResponse) && usersResponse.length > 0) {
            // Format users to ensure they have name property
            const formattedUsers = usersResponse.map(user => ({
              ...user,
              // If user doesn't have a name property, create one from firstName and lastName
              name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email
            }));
            
            // Save to localStorage for offline use
            localStorage.setItem('users', JSON.stringify(formattedUsers));
            
            return Promise.resolve({
              data: formattedUsers
            });
          } else {
            // If users endpoint returns empty or invalid data, use current user + mock data
            return this.combineCurrentUserWithMockUsers(dashboardResponse);
          }
        } catch (usersErr) {
          console.error('Error fetching all users:', usersErr);
          // Use current user + mock data
          return this.combineCurrentUserWithMockUsers(dashboardResponse);
        }
      } catch (dashboardErr) {
        console.error('Error fetching dashboard data:', dashboardErr);
        
        // Try users endpoint directly
        try {
          const usersResponse = await fetchApi.get('/users');
          if (Array.isArray(usersResponse) && usersResponse.length > 0) {
            // Format users to ensure they have name property
            const formattedUsers = usersResponse.map(user => ({
              ...user,
              name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email
            }));
            
            localStorage.setItem('users', JSON.stringify(formattedUsers));
            
            return Promise.resolve({
              data: formattedUsers
            });
          } else {
            return this.getMockUsers();
          }
        } catch (finalUsersErr) {
          console.error('Final attempt to fetch users failed:', finalUsersErr);
          return this.getMockUsers();
        }
      }
    } catch (error) {
      console.error('Unexpected error in getUsers:', error);
      return this.getMockUsers();
    }
  }
  
  // Helper method to get mock users
  getMockUsers() {
    // Check if users exist in localStorage
    let users = localStorage.getItem('users');
    
    if (users) {
      users = JSON.parse(users);
    } else {
      // Sample users for demo
      users = [
        { id: 'user123', name: 'John Doe', email: 'john.doe@example.com', department: 'Engineering', position: 'Software Developer' },
        { id: 'user456', name: 'Jane Smith', email: 'jane.smith@example.com', department: 'HR', position: 'HR Manager' },
        { id: 'user789', name: 'Bob Johnson', email: 'bob.johnson@example.com', department: 'Finance', position: 'Accountant' },
        { id: 'user101', name: 'Alice Williams', email: 'alice.williams@example.com', department: 'Marketing', position: 'Marketing Specialist' },
        { id: 'user102', name: 'Michael Brown', email: 'michael.brown@example.com', department: 'Engineering', position: 'QA Engineer' },
        { id: 'user103', name: 'Emily Davis', email: 'emily.davis@example.com', department: 'Sales', position: 'Sales Representative' },
        { id: 'user104', name: 'David Wilson', email: 'david.wilson@example.com', department: 'IT', position: 'System Administrator' },
        { id: 'user105', name: 'Sarah Martinez', email: 'sarah.martinez@example.com', department: 'Customer Support', position: 'Support Specialist' },
        { id: 'user106', name: 'James Taylor', email: 'james.taylor@example.com', department: 'Product', position: 'Product Manager' },
        { id: 'user107', name: 'Jennifer Anderson', email: 'jennifer.anderson@example.com', department: 'Legal', position: 'Legal Advisor' }
      ];
      
      // Save to localStorage
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    return Promise.resolve({
      data: users
    });
  }
  
  // Helper method to combine current user with mock users
  combineCurrentUserWithMockUsers(currentUser) {
    if (currentUser && currentUser.id) {
      // Format current user to ensure it has name property
      const formattedCurrentUser = {
        ...currentUser,
        name: currentUser.name || 
              `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 
              currentUser.username || 
              currentUser.email
      };
      
      // Get mock users
      const mockUsersResponse = this.getMockUsers();
      const mockUsers = mockUsersResponse.data;
      
      // Combine current user with mock users (excluding duplicates)
      const combinedUsers = [
        formattedCurrentUser,
        ...mockUsers.filter(user => user.id !== formattedCurrentUser.id)
      ];
      
      return Promise.resolve({
        data: combinedUsers
      });
    } else {
      return this.getMockUsers();
    }
  }
  
  // Add a new user (for demo purposes)
  addUser(userData) {
    try {
      // In a real implementation, this would be an API call:
      // return api.post('/users', userData);
      
      let users = localStorage.getItem('users');
      users = users ? JSON.parse(users) : [];
      
      // Generate a unique ID
      const newUser = {
        id: 'user' + Date.now(),
        ...userData
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      return Promise.resolve({
        data: newUser
      });
    } catch (error) {
      console.error('Error adding user:', error);
      return Promise.reject(error);
    }
  }
}

export default new DocumentService();