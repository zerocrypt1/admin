// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Set auth header
        axios.defaults.headers.common['x-auth-token'] = token;
        
        try {
          // Verify token validity
          const res = await axios.get('https://admin-f12a.onrender.com/api/auth/user');
          
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            // Clear invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['x-auth-token'];
          }
        } catch (err) {
          console.error('Auth check error:', err);
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['x-auth-token'];
        }
      } else {
        // Try to get user from localStorage as fallback
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      
      setLoading(false);
      setInitialized(true);
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['x-auth-token'] = token;
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
    navigate('/login');
  };

  // Auth context value
  const value = {
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
