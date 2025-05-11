import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from "react-hot-toast";

// Import the same sidebar icons
import Directory from "../../assets/Directory.png";
import form from "../../assets/form.png";
import menu from "../../assets/menu.png";
import profile from "../../assets/profile.png";
import search from "../../assets/search.png";

// Google Maps API key - use the same one as in your original code
const API_KEY = "AIzaSyAqYM_LPakaBotYeIb7m_spZf3m0ZQU2KI";

// Styles similar to your original component but with additional map-specific styling
const styles = {
  container: `
    .location-container {
      display: flex;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
      background-color: #f5f7fa;
    }

    /* Sidebar Styles - same as original */
    .location-sidebar {
      width: 250px;
      background: #1a237e;
      color: white;
      transition: all 0.3s ease;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
      position: fixed;
      height: 100vh;
      z-index: 100;
      overflow-y: auto;
    }

    .location-sidebar-item {
      padding: 15px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      transition: background-color 0.2s;
    }

    .location-sidebar-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .location-sidebar-item a {
      color: white;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .location-sidebar-item img {
      width: 24px;
      height: 24px;
      filter: brightness(0) invert(1);
    }

    /* Main Content Styles */
    .location-main-content {
      flex: 1;
      padding: 20px;
      margin-left: 250px;
      transition: all 0.3s ease;
    }

    /* Topbar Styles */
    .location-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: white;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      margin-bottom: 20px;
    }

    .location-hamburger-icon {
      width: 24px;
      height: 24px;
      cursor: pointer;
      display: none;
    }

    .location-profile-icon img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
    }

    /* Location Section Styles */
    .location-section {
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      padding: 30px;
      animation: fadeIn 0.5s ease;
    }

    /* Search Input Styles */
    .location-search-container {
      position: relative;
      margin-bottom: 20px;
    }

    .location-search-input {
      width: 100%;
      padding: 12px 15px;
      padding-right: 40px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s;
      background-color: #f9f9f9;
    }

    .location-search-input:focus {
      border-color: #1a237e;
      outline: none;
      box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
    }

    .location-search-icon {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    /* Location Suggestions Styles */
    .location-suggestions {
      margin-top: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      background-color: white;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      position: absolute;
      width: 100%;
      z-index: 10;
    }

    .suggestion-item {
      padding: 10px 15px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
    }

    .suggestion-item:hover {
      background-color: #f5f7fa;
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    /* Map Container Styles */
    .map-container {
      width: 100%;
      height: 400px;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 20px;
      border: 1px solid #e0e0e0;
    }

    .selected-location-info {
      margin-top: 20px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 8px;
      border-left: 4px solid #1a237e;
    }

    .location-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .location-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .save-location-btn {
      background-color: #1a237e;
      color: white;
    }

    .clear-location-btn {
      background-color: #f5f5f5;
      color: #333;
    }

    .location-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #1a237e;
      margin-bottom: 15px;
      text-decoration: none;
      font-weight: 500;
    }

    /* Animation */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsive Styles */
    @media (max-width: 992px) {
      .location-sidebar {
        width: 60px;
        transform: translateX(0);
      }
      
      .location-sidebar-item span {
        display: none;
      }
      
      .location-main-content {
        margin-left: 60px;
      }
    }

    @media (max-width: 768px) {
      .location-sidebar {
        transform: translateX(-100%);
        width: 250px;
      }
      
      .location-sidebar.active {
        transform: translateX(0);
      }
      
      .location-sidebar-item span {
        display: inline;
      }
      
      .location-main-content {
        margin-left: 0;
      }
      
      .location-hamburger-icon {
        display: block;
      }
      
      .map-container {
        height: 300px;
      }
    }

    @media (max-width: 480px) {
      .location-topbar {
        padding: 10px 15px;
      }
      
      .location-buttons {
        flex-direction: column;
      }
    }
  `
};

function Location() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const marker = useRef(null);

  // Initialize Google Maps
  useEffect(() => {
    // Create a script element to load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);

    // Add style tag to document
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles.container;
    document.head.appendChild(styleTag);

    return () => {
      document.head.removeChild(styleTag);
      // Remove the Google Maps script if component unmounts
      const mapScript = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js?key=${API_KEY}"]`);
      if (mapScript) document.head.removeChild(mapScript);
    };
  }, []);

  // Initialize the map
  const initMap = () => {
    if (!mapRef.current) return;

    // Default center at India
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 5,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 3) {
      fetchLocationSuggestions(query);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Fetch location suggestions from Google Places API
  const fetchLocationSuggestions = async (query) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${API_KEY}`
      );
      
      // Due to CORS restrictions, this direct approach won't work in a browser
      // In a real application, you would need a backend proxy or use the Google Maps Places API through their JavaScript library
      
      // For this demo, we'll create some mock suggestions based on the query
      const mockSuggestions = [
        { description: `${query} Park, Delhi, India`, place_id: 'place_1' },
        { description: `${query} Market, Mumbai, India`, place_id: 'place_2' },
        { description: `${query} Square, Bangalore, India`, place_id: 'place_3' }
      ];
      
      setSuggestions(mockSuggestions);
      
      // In a production environment, you would use the Places service like this:
      // if (window.google && window.google.maps) {
      //   const service = new window.google.maps.places.AutocompleteService();
      //   service.getPlacePredictions({ input: query }, handlePlacePredictions);
      // }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      toast.error('Failed to fetch location suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle when we have Place predictions
  const handlePlacePredictions = (predictions, status) => {
    if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
      setSuggestions(predictions);
    } else {
      setSuggestions([]);
    }
  };

  // Handle selecting a location suggestion
  const handleSelectLocation = (suggestion) => {
    setSearchQuery(suggestion.description);
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
    
    // In a real application, you would fetch the place details
    // For demonstration, we'll simulate it with random coordinates near India
    const lat = 20.5937 + (Math.random() * 10 - 5);
    const lng = 78.9629 + (Math.random() * 10 - 5);
    
    // Update the map
    if (mapInstance.current) {
      const location = { lat, lng };
      
      // Set the map center and zoom
      mapInstance.current.setCenter(location);
      mapInstance.current.setZoom(14);
      
      // Remove existing marker if any
      if (marker.current) {
        marker.current.setMap(null);
      }
      
      // Add a new marker
      marker.current = new window.google.maps.Marker({
        position: location,
        map: mapInstance.current,
        title: suggestion.description,
        animation: window.google.maps.Animation.DROP
      });
      
      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div><strong>${suggestion.description}</strong></div>`
      });
      
      marker.current.addListener('click', () => {
        infoWindow.open(mapInstance.current, marker.current);
      });
      
      // Open info window by default
      infoWindow.open(mapInstance.current, marker.current);
    }
    
    // In a real implementation, you would do:
    // const placesService = new window.google.maps.places.PlacesService(mapInstance.current);
    // placesService.getDetails({ placeId: suggestion.place_id }, handlePlaceDetails);
    
    toast.success('Location selected!');
  };

  // Function to handle place details results
  const handlePlaceDetails = (place, status) => {
    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      
      // Update map and marker
      // Same code as above...
    }
  };

  // Search for a location
  const searchLocation = () => {
    if (searchQuery.trim() === '') {
      toast.error('Please enter a location to search');
      return;
    }
    
    setLoading(true);
    
    // Simulate a geocode request
    setTimeout(() => {
      // Create a fake result
      const lat = 20.5937 + (Math.random() * 10 - 5);
      const lng = 78.9629 + (Math.random() * 10 - 5);
      
      const mockResult = {
        description: searchQuery,
        place_id: 'custom_place',
        geometry: {
          location: { lat, lng }
        }
      };
      
      setSelectedLocation(mockResult);
      
      // Update map
      if (mapInstance.current) {
        const location = { lat, lng };
        
        mapInstance.current.setCenter(location);
        mapInstance.current.setZoom(14);
        
        if (marker.current) {
          marker.current.setMap(null);
        }
        
        marker.current = new window.google.maps.Marker({
          position: location,
          map: mapInstance.current,
          title: searchQuery,
          animation: window.google.maps.Animation.DROP
        });
      }
      
      setLoading(false);
      toast.success('Location found!');
    }, 1000);
    
    // In a real application, you would use:
    // const geocoder = new window.google.maps.Geocoder();
    // geocoder.geocode({ address: searchQuery }, handleGeocodeResult);
  };

  // Handle geocode results
  const handleGeocodeResult = (results, status) => {
    if (status === "OK" && results[0]) {
      const location = {
        lat: results[0].geometry.location.lat(),
        lng: results[0].geometry.location.lng()
      };
      
      // Update map and marker
      // Same code as above...
    } else {
      toast.error('Location not found');
    }
    setLoading(false);
  };

  // Clear the selected location
  const clearLocation = () => {
    setSearchQuery('');
    setSelectedLocation(null);
    setSuggestions([]);
    
    if (marker.current) {
      marker.current.setMap(null);
      marker.current = null;
    }
    
    if (mapInstance.current) {
      // Reset to default view
      mapInstance.current.setCenter({ lat: 20.5937, lng: 78.9629 });
      mapInstance.current.setZoom(5);
    }
    
    toast.success('Location cleared');
  };

  // Save the selected location
  const saveLocation = () => {
    if (!selectedLocation) {
      toast.error('Please select a location first');
      return;
    }
    
    // Here you would integrate with your form or state management system
    // For this example, we'll just show a success message
    toast.success('Location saved successfully!');
    
    // In a real application, you might redirect back to the form
    // or pass this location data back to the parent component
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarActive(!isSidebarActive);
  };

  return (
    <div className="location-container">
      <Toaster toastOptions={{ duration: 4000 }} />
      
      <aside className={`location-sidebar ${isSidebarActive ? 'active' : ''}`}>
        <div className="location-sidebar-item">
          <Link to="/desktop2">
            <img src={Directory} alt="Directory" />
            <span>Directory</span>
          </Link>
        </div>
        <div className="location-sidebar-item">
          <Link to="/desktop1">
            <img src={form} alt="Forms" />
            <span>Form</span>
          </Link>
        </div>
        <div className="location-sidebar-item">
          <Link to="/location">
            <img src={search} alt="Location" />
            <span>Location</span>
          </Link>
        </div>
      </aside>

      <div className="location-main-content">
        <header className="location-topbar">
          <img 
            src={menu} 
            alt="Menu" 
            className="location-hamburger-icon" 
            onClick={toggleSidebar}
          />
          <div className="location-profile-icon">
            <img src={profile} alt="Profile" />
          </div>
        </header>

        <div className="location-section">
          <Link to="/desktop1" className="back-btn">
            ← Back to Form
          </Link>
          
          <h2 style={{ marginBottom: '20px', color: '#1a237e' }}>Location Finder</h2>
          
          <div className="location-search-container">
            <input 
              type="text"
              className="location-search-input"
              placeholder="Search for a landmark or location..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            <img 
              src={search} 
              alt="Search" 
              className="location-search-icon" 
              onClick={searchLocation}
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="location-suggestions">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => handleSelectLocation(suggestion)}
                  >
                    {suggestion.description}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Google Map Container */}
          <div 
            ref={mapRef} 
            className="map-container"
          ></div>
          
          {selectedLocation && (
            <div className="selected-location-info">
              <h3>Selected Location</h3>
              <p><strong>Address:</strong> {selectedLocation.description}</p>
              {selectedLocation.geometry && (
                <p>
                  <strong>Coordinates:</strong> 
                  Lat: {typeof selectedLocation.geometry.location.lat === 'function' 
                    ? selectedLocation.geometry.location.lat().toFixed(6) 
                    : selectedLocation.geometry.location.lat.toFixed(6)}, 
                  Lng: {typeof selectedLocation.geometry.location.lng === 'function' 
                    ? selectedLocation.geometry.location.lng().toFixed(6) 
                    : selectedLocation.geometry.location.lng.toFixed(6)}
                </p>
              )}
            </div>
          )}
          
          <div className="location-buttons">
            <button 
              className="location-btn save-location-btn"
              onClick={saveLocation}
              disabled={!selectedLocation || loading}
            >
              {loading ? "Processing..." : "Save Location"}
            </button>
            <button 
              className="location-btn clear-location-btn"
              onClick={clearLocation}
              disabled={!searchQuery && !selectedLocation}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Location;