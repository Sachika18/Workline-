import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';
import signup from '../assets/signup.png';

const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        retypePassword: '',
        position: 'Admin',
        department: 'HR Department'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // API URL - you can easily change this if needed
    const API_URL = 'http://localhost:8080/api/auth/signup';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Validate passwords match
        if (formData.password !== formData.retypePassword) {
            setError("Passwords don't match!");
            setIsSubmitting(false);
            return;
        }

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'password'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                setError(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
                setIsSubmitting(false);
                return;
            }
        }

        const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            position: formData.position,
            ...(formData.position === 'Staff' && { department: formData.department })
        };

        console.log('Attempting to send registration to:', API_URL);
        console.log('Payload:', payload);

        try {
            // Test if the server is reachable first
            try {
                const testResponse = await fetch(API_URL, { 
                    method: 'OPTIONS',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                console.log('Server test response:', testResponse);
            } catch (connectionError) {
                console.error('Server connection test failed:', connectionError);
                throw new Error('Cannot connect to the server. Please make sure the backend is running on port 8080.');
            }

            // Proceed with actual registration
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Store the token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                position: data.position,
                department: data.department || ''
            }));

            // Redirect based on role
if (data.position === 'Admin') {
    navigate('/admindash');
} else if (data.position === 'Staff') {
    navigate('/dashboard');
} else {
    navigate('/');
}

        } catch (err) {
            console.error('Registration error details:', {
                message: err.message,
                name: err.name,
                stack: err.stack
            });
            setError(err.message || 'Failed to register. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="registration-container">
            <div className="left-section">
                <h1>Hello,</h1>
                <p>Hello designer, welcome to the registration page. Please fill out the form on the side to get more complete features.</p>
                
                <div className="illustration">
                    <img 
                        src={signup} 
                        alt="Registration Illustration" 
                        className="illustration-image"
                    />
                </div>
            </div>
            <div className="right-section">
                <div className="registration-form-wrapper">
                    <h2>SIGN UP</h2>
                    
                    {error && (
                        <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="registration-form">
                        <div className="name-row">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Position</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="position"
                                        value="Admin"
                                        checked={formData.position === 'Admin'}
                                        onChange={handleChange}
                                    />
                                    Admin
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="position"
                                        value="Staff"
                                        checked={formData.position === 'Staff'}
                                        onChange={handleChange}
                                    />
                                    Staff
                                </label>
                            </div>
                        </div>
                        
                        {formData.position === 'Staff' && (
                            <div className="form-group">
                                <label>Department</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="department-select"
                                >
                                    <option value="HR Department">HR Department</option>
                                    <option value="Tech Department">Tech Department</option>
                                    <option value="Finance Department">Finance Department</option>
                                    <option value="Marketing Department">Marketing Department</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Enter Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Retype Password</label>
                            <input
                                type="password"
                                name="retypePassword"
                                value={formData.retypePassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button className="button" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Registering...' : 'Register'}
                            <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;