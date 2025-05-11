// Desktop2.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";
import Fuse from 'fuse.js';
import { useContext } from 'react';
import AuthContext, { useAuth } from '../AuthContext';

// Import CSS
import './Desktop2.css';

// Import images
import Directory from "../../assets/Directory.png";
import form from "../../assets/form.png";
import menu from "../../assets/menu.png";
import profile from "../../assets/profile.png";
import search from "../../assets/search.png";
import logoutIcon from "../../assets/logout.png"; // You'll need to add this icon

function Desktop2() {
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const fetchForms = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://admin-f12a.onrender.com/forms');
      if (response.data.success) {
        setForms(response.data.data);
        setFilteredForms(response.data.data);
        toast.success('Directory loaded successfully!');
      } else {
        toast.error('Failed to load directory.');
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to load directory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [location.key]);

  const fuseOptions = {
    keys: ['name', 'occupation', 'phoneNumber', 'address', 'city', 'state'],
    includeScore: true,
    threshold: 0.3,
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query === '') {
      setFilteredForms(forms);
    } else {
      const fuse = new Fuse(forms, fuseOptions);
      const results = fuse.search(query);
      setFilteredForms(results.map(result => result.item));
    }
  };

  const handleRefresh = () => {
    fetchForms();
  };

  const handleAddNew = () => {
    navigate('/desktop1');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    // Redirect is handled by the logout function in AuthContext
  };

  const editForm = (form) => {
    const formData = {
      ...form,
      timming: encodeURIComponent(JSON.stringify(form.timming || [])),
      coordinates: encodeURIComponent(JSON.stringify(form.coordinates || {}))
    };
    const queryString = new URLSearchParams(formData).toString();
    navigate(`/desktop3?${queryString}`);
  };

  const viewForm = (formId) => {
    navigate(`/view/${formId}`);
  };

  const deleteForm = async (formId) => {
    const confirmed = window.confirm("Are you sure you want to delete this form?");
    if (!confirmed) return;

    try {
      await axios.delete(`https://admin-f12a.onrender.com/forms/${formId}`);
      toast.success('Form deleted successfully!');
      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form.');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarActive(!isSidebarActive);
  };

  return (
    <div className="desktop2-container">
      <Toaster toastOptions={{ duration: 4000 }} />
      
      <aside className={`desktop2-sidebar ${isSidebarActive ? 'active' : ''}`}>
        <div className="desktop2-sidebar-item">
          <Link to="/desktop2">
            <img src={Directory} alt="Directory" />
            <span>Directory</span>
          </Link>
        </div>
        <div className="desktop2-sidebar-item">
          <Link to="/desktop1">
            <img src={form} alt="Forms" />
            <span>Form</span>
          </Link>
        </div>
        <div className="desktop2-sidebar-item desktop2-logout-item">
          <div onClick={handleLogout} className="desktop2-logout-button">
            <img src={logoutIcon} alt="Logout" />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      <div className="desktop2-main-content">
        <header className="desktop2-topbar">
          <img 
            src={menu} 
            alt="Menu" 
            className="desktop2-hamburger-icon" 
            onClick={toggleSidebar}
          />
          <div className="desktop2-search-bar">
            <img src={search} alt="Search" className="desktop2-search-icon" />
            <input
              type="text"
              placeholder="Search by name, occupation, phone..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button 
              className="desktop2-add-button" 
              onClick={handleAddNew}
              title="Add New Employee"
            >
              +
            </button>
          </div>
          <div className="desktop2-user-info">
            {user && (
              <>
                <span className="desktop2-username">{user.username}</span>
               
              </>
            )}
          </div>
        </header>

        <div className="desktop2-content">
          <div className="desktop2-header-container">
            <h2 className="desktop2-header">Directory</h2>
            <div className="desktop2-header-actions">
              <button 
                className="desktop2-refresh-button" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? <CgSpinner size={16} className="animate-spin" /> : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="desktop2-directory">
            {isLoading ? (
              <div className="desktop2-loading">
                <CgSpinner size={32} className="animate-spin" />
                <p>Loading directory...</p>
              </div>
            ) : filteredForms.length > 0 ? (
              filteredForms.map((form) => (
                <div className="desktop2-card" key={form._id}>
                  <div className="desktop2-card-header">
                    <h3 
                      onClick={() => viewForm(form._id)}
                      title="View details"
                    >
                      {form.name}
                      {form.blueTicket && <span className="desktop2-verified-badge">✓</span>}
                    </h3>
                    <div className="desktop2-card-buttons">
                      <button 
                        className="desktop2-edit-button" 
                        onClick={() => editForm(form)}
                        title="Edit form"
                      >
                        Edit
                      </button>
                      <button 
                        className="desktop2-delete-button" 
                        onClick={() => deleteForm(form._id)}
                        title="Delete form"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="desktop2-card-details">
                    <div className="desktop2-card-detail">
                      <span className="desktop2-detail-label">Occupation:</span>
                      <span className="desktop2-detail-value">{form.occupation}</span>
                    </div>
                    
                    <div className="desktop2-card-detail">
                      <span className="desktop2-detail-label">Phone:</span>
                      <span className="desktop2-detail-value">{form.phoneNumber}</span>
                    </div>
                    
                    {form.age && (
                      <div className="desktop2-card-detail">
                        <span className="desktop2-detail-label">Age:</span>
                        <span className="desktop2-detail-value">{form.age}</span>
                      </div>
                    )}
                    
                    {form.city && (
                      <div className="desktop2-card-detail">
                        <span className="desktop2-detail-label">Location:</span>
                        <span className="desktop2-detail-value">
                          {form.city}{form.state ? `, ${form.state}` : ''}
                        </span>
                      </div>
                    )}
                    
                    {form.timming && Array.isArray(form.timming) && form.timming.length > 0 && (
                      <div className="desktop2-card-detail desktop2-time-slots">
                        <span className="desktop2-detail-label">Available:</span>
                        <div className="desktop2-time-slots-container">
                          {form.timming.slice(0, 2).map((slot, index) => (
                            <span key={index} className="desktop2-time-slot">{slot}</span>
                          ))}
                          {form.timming.length > 2 && (
                            <span className="desktop2-time-slot desktop2-more-slots">
                              +{form.timming.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="desktop2-no-results">
                {searchQuery ? (
                  <>
                    <p>No results found for "{searchQuery}"</p>
                    <button onClick={() => setSearchQuery('')} className="desktop2-clear-search">
                      Clear Search
                    </button>
                  </>
                ) : (
                  <p>No forms available. Click the + button to add a new employee.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Desktop2;
