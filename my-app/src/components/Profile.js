import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import defaultAvatar from '../assets/avatar.png';
import Navbar from './Navbar';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    address: '',
    bio: '',
    employeeId: '',
    avatar: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({
    message: '',
    isError: false,
    show: false
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Updated endpoint to match the backend
        const response = await fetch('http://localhost:8080/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUser(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          department: data.department || '',
          position: data.position || '',
          address: data.address || '',
          bio: data.bio || '',
          employeeId: data.employeeId || '',
          avatar: null
        });
        setPreviewImage(data.avatar || defaultAvatar);
      } catch (error) {
        console.error('Error fetching profile:', error);
        showStatusMessage('Failed to load profile data', true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showStatusMessage('Image size should be less than 5MB', true);
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showStatusMessage('Only JPG, PNG, and GIF images are allowed', true);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const showStatusMessage = (message, isError = false) => {
    setSubmitStatus({
      message,
      isError,
      show: true
    });
    
    // Hide message after 5 seconds
    setTimeout(() => {
      setSubmitStatus(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Append all form data to FormData object
      Object.keys(formData).forEach(key => {
        if (key === 'avatar' && formData[key] instanceof File) {
          formDataToSend.append('avatar', formData[key]);
        } else if (formData[key] !== null && formData[key] !== undefined && key !== 'email') {
          // Skip email as it shouldn't be updated
          formDataToSend.append(key, formData[key]);
        }
      });

      // Updated endpoint to match the backend
      const response = await fetch('http://localhost:8080/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedData = await response.json();
      setUser(updatedData);
      setIsEditing(false);
      showStatusMessage('Profile updated successfully!');

      // Update form data with new values
      setFormData({
        firstName: updatedData.firstName || '',
        lastName: updatedData.lastName || '',
        email: updatedData.email || '',
        phone: updatedData.phone || '',
        department: updatedData.department || '',
        position: updatedData.position || '',
        address: updatedData.address || '',
        bio: updatedData.bio || '',
        employeeId: updatedData.employeeId || '',
        avatar: null
      });
      
      // Update preview image
      if (updatedData.avatar) {
        setPreviewImage(updatedData.avatar);
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showStatusMessage(error.message || 'Failed to update profile', true);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
        address: user.address || '',
        bio: user.bio || '',
        employeeId: user.employeeId || '',
        avatar: null
      });
      setPreviewImage(user.avatar || defaultAvatar);
    }
    setIsEditing(false);
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div>
    <Navbar />
    <div className="profile-container">
      {submitStatus.show && (
        <div className={`status-message ${submitStatus.isError ? 'error' : 'success'}`}>
          {submitStatus.message}
        </div>
      )}
      
      <div className="profile-header">
        <h1>My Profile</h1>
        <button 
          className={`edit-button ${isEditing ? 'cancel' : 'edit'}`}
          onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-image-section">
          <div className="profile-image-container">
            <img 
              src={previewImage} 
              alt="Profile" 
              className="profile-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultAvatar;
              }}
            />
            {isEditing && (
              <div className="image-upload-overlay">
                <label htmlFor="avatar-upload" className="upload-button">
                  Change Photo
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
          {!isEditing && (
            <div className="employee-id">
              <span>Employee ID: {formData.employeeId || 'Not assigned'}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your first name"
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={true} // Email should not be editable
              placeholder="Your email address"
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Your phone number"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your department"
              />
            </div>

            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your job position"
              />
            </div>
          </div>

          {isEditing && (
            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                disabled={true} // Usually, employee ID shouldn't be editable
                placeholder="Your employee ID"
              />
            </div>
          )}

          <div className="form-group address">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Your address"
            />
          </div>

          <div className="form-group bio">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Tell us about yourself"
              rows="4"
            />
          </div>

          {isEditing && (
            <div className="form-actions">
              <button type="submit" className="save-button">
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
    </div>
  );
};

export default Profile;