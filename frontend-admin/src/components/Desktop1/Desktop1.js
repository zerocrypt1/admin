import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from 'react-phone-input-2';
import OtpInput from "otp-input-react";
import { CgSpinner } from "react-icons/cg";
import { auth } from "./firebase.config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { toast, Toaster } from "react-hot-toast";
import "react-phone-input-2/lib/style.css";
import Select from 'react-select';
// Import the GoogleMapAPI component
import GoogleMapAPI from './GoogleMapAPI';

// Import CSS
import './Desktop1.css';

// Import images
import Directory from "../../assets/Directory.png";
import form from "../../assets/form.png";
import menu from "../../assets/menu.png";
import profile from "../../assets/profile.png";
import search from "../../assets/search.png";

function Desktop1() {
  const [formData, setFormData] = useState({
    name: '',
    occupation: [], // Still an array in the state
    phoneNumber: '',
    identityProof: '', // Type of ID document
    landmarks: '',
    age: '',
    state: '',
    address: '',
    otpCode: '',
    timming: [],
    altPhoneNumber: '',
    idProofNumber: '', // Actual ID number
    blueTicket: false,
    pinCode: '',
    city: '',
    coordinates: {},
  });
  
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [showMap, setShowMap] = useState(false); // State to control map visibility
  const [idNumberError, setIdNumberError] = useState(''); // To display ID format errors
  
  // Create ref for reCAPTCHA container
  const recaptchaContainerRef = useRef(null);
  
  const occupationOptions = [
    { value: "Backend Developer", label: "Backend Developer" },
    { value: "Web Developer", label: "Web Developer" },
    { value: "Frontend Developer", label: "Frontend Developer" }, 
    { value: "Full Stack Developer", label: "Full Stack Developer" },
    { value: "Mobile App Developer", label: "Mobile App Developer" },
    { value: "UI/UX Designer", label: "UI/UX Designer" },
    { value: "DevOps Engineer", label: "DevOps Engineer" },
    { value: "Data Scientist", label: "Data Scientist" },
    { value: "Machine Learning Engineer", label: "Machine Learning Engineer" },
    { value: "Cloud Engineer", label: "Cloud Engineer" },
    { value: "Other", label: "Other" }
  ];

  // ID proof options
  const idProofOptions = [
    { value: "aadhaar", label: "Aadhaar Card" },
    { value: "pan", label: "PAN Card" },
    { value: "voter", label: "Voter ID" },
    { value: "driving", label: "Driving License" },
    { value: "passport", label: "Passport" },
  ];

  useEffect(() => {
    return () => {
      // Clean up reCAPTCHA if it exists
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, [otpVerified]);

  // Function to validate ID proof number based on selected ID type
  const validateIdProofNumber = (idType, idNumber) => {
    if (!idNumber) return true; // Empty is allowed
    
    switch (idType) {
      case 'aadhaar':
        // Aadhaar is 12 digits
        return /^\d{12}$/.test(idNumber);
      case 'pan':
        // PAN is 10 alphanumeric (5 letters, 4 digits, 1 letter)
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNumber);
      case 'voter':
        // Voter ID format (alphanumeric, typically 10 chars)
        return /^[A-Z]{3}[0-9]{7}$/.test(idNumber);
      case 'driving':
        // Driving License (varies by state, using general format)
        return /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/.test(idNumber);
      case 'passport':
        // Passport (1 letter followed by 7 digits)
        return /^[A-Z]{1}[0-9]{7}$/.test(idNumber);
      default:
        return true;
    }
  };

  // Function to get format hint based on ID type
  const getIdProofFormatHint = (idType) => {
    switch (idType) {
      case 'aadhaar':
        return "Format: 12 digits (e.g., 123456789012)";
      case 'pan':
        return "Format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)";
      case 'voter':
        return "Format: 3 letters followed by 7 digits (e.g., ABC1234567)";
      case 'driving':
        return "Format: 2 letters, 2 digits, 2 letters, 4 digits (e.g., DL01AB1234)";
      case 'passport':
        return "Format: 1 letter followed by 7 digits (e.g., A1234567)";
      default:
        return "";
    }
  };

  function onCaptchVerify() {
    // Clear any existing reCAPTCHA instances
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    
    // Create new verifier on the dedicated container
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      recaptchaContainerRef.current, // Use the ref directly
      {
        size: "normal", // Changed from invisible to normal for better debugging
        callback: () => {
          // Callback when reCAPTCHA is solved
          toast.success("reCAPTCHA verified!");
        },
        "expired-callback": () => {
          toast.error("reCAPTCHA expired. Please verify again.");
        },
      }
    );
    
    // Render the reCAPTCHA
    window.recaptchaVerifier.render().then((widgetId) => {
      window.recaptchaWidgetId = widgetId;
    });
  }

  const onSignup = (e) => {
    e.preventDefault();
    
    // Don't proceed if already loading
    if (loading) return;
    
    setLoading(true);
    
    try {
      // Check if reCAPTCHA exists, if not initialize it
      if (!window.recaptchaVerifier) {
        onCaptchVerify();
        // Early return to allow reCAPTCHA to initialize
        setLoading(false);
        return;
      }
      
      const appVerifier = window.recaptchaVerifier;
      const formatPh = "+" + formData.phoneNumber;
      
      // Proceed with phone authentication
      signInWithPhoneNumber(auth, formatPh, appVerifier)
        .then((confirmationResult) => {
          window.confirmationResult = confirmationResult;
          setLoading(false);
          toast.success("OTP sent successfully!");
          
          // Reset reCAPTCHA for next use
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        })
        .catch((error) => {
          console.log("Error sending OTP:", error);
          setLoading(false);
          toast.error(error.message || "Failed to send OTP. Please try again.");
          
          // Reset reCAPTCHA on error
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        });
    } catch (error) {
      console.log("Captcha error:", error);
      setLoading(false);
      toast.error("Error setting up verification. Please refresh and try again.");
    }
  }

  const onOTPVerify = (e) => {
    e.preventDefault();
    
    if (!window.confirmationResult) {
      toast.error("Please send OTP first");
      return;
    }
    
    if (!enteredOtp || enteredOtp.length < 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    
    setLoading(true);
    window.confirmationResult
      .confirm(enteredOtp)
      .then(async (res) => {
        setOtpVerified(true);
        setLoading(false);
        toast.success("Phone number verified successfully!");
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        toast.error("Invalid OTP. Please try again.");
      });
  }

  const handleTimingChange = (event) => {
    const timeSlot = event.target.value;

    setFormData((prevFormData) => {
      const { timming } = prevFormData;
      if (timming.includes(timeSlot)) {
        return {
          ...prevFormData,
          timming: timming.filter((slot) => slot !== timeSlot),
        };
      } else {
        return {
          ...prevFormData,
          timming: [...timming, timeSlot],
        };
      }
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for ID proof number to validate format
    if (name === 'idProofNumber') {
      // Check if the format is valid
      const isValid = validateIdProofNumber(formData.identityProof, value);
      if (!isValid && value) {
        setIdNumberError('Invalid format for the selected ID type');
      } else {
        setIdNumberError('');
      }
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle ID proof type selection
  const handleIdProofChange = (selectedOption) => {
    setFormData({
      ...formData,
      identityProof: selectedOption ? selectedOption.value : '',
      idProofNumber: '' // Reset ID number when type changes
    });
    setIdNumberError(''); // Clear any previous errors
  };

  const handleOccupationChange = (selectedOptions) => {
    setFormData({
      ...formData,
      occupation: selectedOptions ? selectedOptions.map(option => option.value) : []
    });
  };

  const handlePhoneChange = (value) => {
    setFormData({
      ...formData,
      phoneNumber: value,
    });
  };

  const searchLandmarks = () => {
    if (!formData.landmarks) {
      toast.error("Please enter a landmark to search");
      return;
    }
    
    setSearchingLocations(true);
    setLocationResults([]);
    
    // Use the Google Maps Geocoding API with more accurate parameters
    axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.landmarks)}&sensor=true&key=${"AIzaSyAqYM_LPakaBotYeIb7m_spZf3m0ZQU2KI"}`)
      .then((res) => {
        if (res.data.results && res.data.results.length > 0) {
          // Sort results by relevance (Google already does this, but we can enhance)
          const sortedResults = res.data.results;
          setLocationResults(sortedResults);
          toast.success(`Found ${sortedResults.length} locations!`);
        } else {
          toast.error("No locations found. Please try a different landmark.");
        }
        setSearchingLocations(false);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error finding locations.");
        setSearchingLocations(false);
      });
  };
  
  const selectLocation = (location) => {
    setFormData({
      ...formData,
      coordinates: location.geometry.location,
      landmarks: location.formatted_address,
    });
    toast.success("Location selected!");
    setShowManualCoordinates(false);
  };
  
  // Function to toggle map visibility
  const toggleMapVisibility = () => {
    setShowMap(!showMap);
  };
  
  // Complete handleLocationSelect function
  const handleLocationSelect = (locationData) => {
    console.log("Location selected:", locationData);
    
    // Update formData with location information
    setFormData(prevFormData => ({
      ...prevFormData,
      coordinates: locationData.coordinates,
      landmarks: locationData.landmarks,
    }));
    
    // Try to extract city, state, and pincode from the address
    if (locationData.place_details && locationData.place_details.address_components) {
      const addressComponents = locationData.place_details.address_components;
      
      // Extract city
      const cityComponent = addressComponents.find(
        component => component.types.includes('locality') || 
                   component.types.includes('administrative_area_level_2')
      );
      if (cityComponent) {
        setFormData(prevFormData => ({
          ...prevFormData,
          city: cityComponent.long_name
        }));
      }
      
      // Extract state
      const stateComponent = addressComponents.find(
        component => component.types.includes('administrative_area_level_1')
      );
      if (stateComponent) {
        setFormData(prevFormData => ({
          ...prevFormData,
          state: stateComponent.long_name
        }));
      }
      
      // Extract pincode/postal code
      const pincodeComponent = addressComponents.find(
        component => component.types.includes('postal_code')
      );
      if (pincodeComponent) {
        setFormData(prevFormData => ({
          ...prevFormData,
          pinCode: pincodeComponent.long_name
        }));
      }
      
      // Extract full address if available
      if (locationData.place_details.formatted_address) {
        setFormData(prevFormData => ({
          ...prevFormData,
          address: locationData.place_details.formatted_address
        }));
      }
    }
    
    // Hide the map after selection
    setShowMap(false);
    
    // Show success message
    toast.success("Location selected successfully!");
  };
  
  const toggleManualCoordinates = () => {
    setShowManualCoordinates(!showManualCoordinates);
  };
  
  const handleManualLatChange = (e) => {
    setManualLat(e.target.value);
  };
  
  const handleManualLngChange = (e) => {
    setManualLng(e.target.value);
  };
  
  const addManualLocation = () => {
    if (!manualLat || !manualLng || isNaN(manualLat) || isNaN(manualLng)) {
      toast.error("Please enter valid coordinates");
      return;
    }
    
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    // Validate coordinates range
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Coordinates out of valid range");
      return;
    }
    
    setFormData({
      ...formData,
      coordinates: {
        lat: lat,
        lng: lng
      }
    });
    
    // Try to get address from coordinates (reverse geocoding)
    axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${"AIzaSyAqYM_LPakaBotYeIb7m_spZf3m0ZQU2KI"}`)
      .then((res) => {
        if (res.data.results && res.data.results.length > 0) {
          setFormData(prevData => ({
            ...prevData,
            landmarks: res.data.results[0].formatted_address
          }));
        }
      })
      .catch(err => {
        console.log("Reverse geocoding error:", err);
      });
    
    toast.success("Manual coordinates added!");
  };

  // Update handleSubmit function to validate ID proof format before submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || formData.occupation.length === 0 || !formData.phoneNumber || !formData.age || formData.timming.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }
    
    // Validate ID proof number if both ID type and number are provided
    if (formData.identityProof && formData.idProofNumber) {
      const isValid = validateIdProofNumber(formData.identityProof, formData.idProofNumber);
      if (!isValid) {
        toast.error(`Invalid ${formData.identityProof} format. Please check and try again.`);
        return;
      }
    }
    
    // Create a modified copy of the form data for submission
    const submissionData = {
      ...formData,
      // Convert the occupation array to a string for the backend
      occupation: formData.occupation.join(', ')
    };
    
    // Log the actual data being sent for debugging
    console.log("Submitting form data:", submissionData);
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5050/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();

      if (!response.ok) {
        // If there's a duplicate phone number error (409 status code)
        if (response.status === 409) {
          toast.error(data.error || 'This phone number is already registered');
        } else {
          toast.error(data.error || `Error: ${response.status} ${response.statusText}`);
        }
        console.error("Server error response:", data);
        setLoading(false);
        return;
      }

      console.log('Form submitted successfully:', data);
      toast.success('Information stored successfully!');
      
      // Optional: Reset the form after successful submission
      setFormData({
        name: '',
        occupation: [],
        phoneNumber: '',
        identityProof: '',
        landmarks: '',
        age: '',
        state: '',
        address: '',
        otpCode: '',
        timming: [],
        altPhoneNumber: '',
        idProofNumber: '',
        blueTicket: false,
        pinCode: '',
        city: '',
        coordinates: {},
      });
      setOtpVerified(false);
      setEnteredOtp("");
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarActive(!isSidebarActive);
  };

  const toggleTimeDropdown = () => {
    setIsTimeDropdownOpen(!isTimeDropdownOpen);
  };

  const removeTimeSlot = (slot) => {
    setFormData({
      ...formData,
      timming: formData.timming.filter(item => item !== slot)
    });
  };

  return (
    <div className="desktop1-container">
      <Toaster toastOptions={{ duration: 4000 }} />
      
      <aside className={`desktop1-sidebar ${isSidebarActive ? 'active' : ''}`}>
        <div className="desktop1-sidebar-item">
          <Link to="/desktop2">
            <img src={Directory} alt="Directory" />
            <span>Directory</span>
          </Link>
        </div>
        <div className="desktop1-sidebar-item">
          <Link to="/desktop1">
            <img src={form} alt="Forms" />
            <span>Form</span>
          </Link>
        </div>
      </aside>

      <div className="desktop1-main-content">
       

        <div className="desktop1-form-section">
          <h2 style={{ marginBottom: '20px', color: '#1a237e' }}>Employee Registration Form</h2>
          
          <form className="desktop1-user-form" onSubmit={handleSubmit}>
            <div className="desktop1-left-column">
              <div className="desktop1-form-group">
                <label>Name <span className="desktop1-required">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Enter Name" 
                  required 
                />
              </div>

              <div className="desktop1-form-group">
                <label>Occupation <span className="desktop1-required">*</span></label>
                <Select 
                  isMulti
                  name="occupation"
                  options={occupationOptions}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  onChange={handleOccupationChange}
                  placeholder="Select Occupations"
                />
              </div>

              {/* New ID Card Type and Number Section */}
              <div className="desktop1-form-group">
                <label>ID Card Type</label>
                <Select
                  name="identityProof"
                  options={idProofOptions}
                  className="basic-select" 
                  classNamePrefix="select"
                  onChange={handleIdProofChange}
                  placeholder="Select ID Type"
                  value={formData.identityProof ? idProofOptions.find(option => option.value === formData.identityProof) : null}
                />
              </div>

              {formData.identityProof && (
                <div className="desktop1-form-group">
                  <label>ID Number</label>
                  <input
                    type="text"
                    name="idProofNumber"
                    value={formData.idProofNumber}
                    onChange={handleChange}
                    placeholder={`Enter ${idProofOptions.find(option => option.value === formData.identityProof)?.label} Number`}
                  />
                  {idNumberError && (
                    <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                      {idNumberError}
                    </div>
                  )}
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
                    {getIdProofFormatHint(formData.identityProof)}
                  </div>
                </div>
              )}

              <div className="desktop1-form-group">
                <label>Phone Number <span className="desktop1-required">*</span></label>
                <PhoneInput 
                  country={"in"} 
                  value={formData.phoneNumber} 
                  onChange={(value) => handlePhoneChange(value)} 
                  inputProps={{
                    name: "phoneNumber",
                    required: true,
                  }}
                />
                {/* Create a specific div for reCAPTCHA that stays visible */}
                <div ref={recaptchaContainerRef} id="recaptcha-container" style={{marginTop: '10px'}}></div>
                
                <button
                  onClick={onSignup}
                  type="button"
                  style={{ backgroundColor: '#3949ab', color: 'white', marginTop: '10px', width: '100%' }}
                  disabled={!formData.phoneNumber || loading}
                >
                  {loading ? (
                    <CgSpinner size={20} className="animate-spin" />
                  ) : null}
                  <span>Send code via SMS</span>
                </button>
              </div>

              <div className="desktop1-form-group">
                <label>OTP Verification</label>
                <OtpInput
                  value={enteredOtp}
                  onChange={setEnteredOtp}
                  OTPLength={6}
                  otpType="number"
                  disabled={false}
                  autoFocus
                  className="opt-container"
                />
                <button
                  onClick={onOTPVerify}
                  type="button"
                  style={{ backgroundColor: '#3949ab', color: 'white', marginTop: '10px', width: '100%' }}
                  disabled={!enteredOtp || enteredOtp.length < 6 || loading}
                >
                  {loading ? (
                    <CgSpinner size={20} className="animate-spin" />
                  ) : null}
                  <span>Verify OTP</span>
                </button>
                {otpVerified && (
                  <div style={{ color: 'green', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '18px' }}>✓</span> Phone number verified
                  </div>
                )}
              </div>

              <div className="desktop1-form-group">
                <label>Age <span className="desktop1-required">*</span></label>
                <input 
                  type="number" 
                  name="age" 
                  value={formData.age} 
                  onChange={handleChange} 
                  placeholder="Enter employee age" 
                  min="18"
                  max="80"
                  required 
                />
              </div>
            </div>

            <div className="desktop1-right-column">
              <div className="desktop1-form-group desktop1-landmark-group">
                <label>Landmarks <span className="desktop1-required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    name="landmarks" 
                    value={formData.landmarks} 
                    onChange={handleChange} 
                    placeholder="Search landmarks employees want to work in" 
                    required
                  />
                  <img 
                    src={search} 
                    alt="Search" 
                    className="desktop1-search-icon" 
                    onClick={searchLandmarks} 
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                  <button 
                    type="button" 
                    onClick={searchLandmarks}
                    style={{ padding: '5px 10px', background: '#3949ab', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                    disabled={searchingLocations}
                  >
                    {searchingLocations ? 'Searching...' : 'Search Locations'}
                  </button>
                  <button 
                    type="button" 
                    onClick={toggleManualCoordinates}
                    style={{ padding: '5px 10px', background: '#607d8b', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                  >
                    {showManualCoordinates ? 'Hide Manual Entry' : 'Enter Precise Coordinates'}
                  </button>
                  <button 
                    type="button" 
                    onClick={toggleMapVisibility}
                    style={{ padding: '5px 10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                  >
                    {showMap ? 'Hide Map' : 'Select on Map'}
                  </button>
                </div>
                
                {/* Google Map Component */}
                {showMap && (
                  <div style={{ marginTop: '15px', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Select Location on Map</h4>
                    <GoogleMapAPI onLocationSelect={handleLocationSelect} />
                  </div>
                )}
                
                {/* Manual coordinates input */}
                {showManualCoordinates && (
                  <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Enter Precise GPS Coordinates</h4>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px' }}>Latitude</label>
                        <input 
                          type="text" 
                          value={manualLat} 
                          onChange={handleManualLatChange}
                          placeholder="e.g. 28.6139" 
                          style={{ width: '100%', padding: '5px', fontSize: '14px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px' }}>Longitude</label>
                        <input 
                          type="text" 
                          value={manualLng} 
                          onChange={handleManualLngChange}
                          placeholder="e.g. 77.2090" 
                          
                          style={{ width: '100%', padding: '5px', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={addManualLocation}
                      style={{ width: '100%', padding: '5px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                    >
                      Set Precise Location
                    </button>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                      *For exact location accuracy, enter coordinates in decimal degrees format
                    </div>
                  </div>
                )}
                
                {/* Display search results */}
                {locationResults.length > 0 && (
                  <div className="location-results" style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <h4 style={{ padding: '8px', margin: 0, background: '#f5f5f5', fontSize: '14px' }}>Search Results</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {locationResults.map((location, index) => (
                        <li 
                          key={index} 
                          style={{ 
                            padding: '8px', 
                            borderBottom: index !== locationResults.length - 1 ? '1px solid #ddd' : 'none',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                          onClick={() => selectLocation(location)}
                        >
                          <div><strong>{location.formatted_address}</strong></div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Lat: {location.geometry.location.lat.toFixed(6)}, Lng: {location.geometry.location.lng.toFixed(6)}
                          </div>
                          {location.types && (
                            <div style={{ fontSize: '11px', color: '#999' }}>
                              Type: {location.types.join(', ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {formData.coordinates.lat && (
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#666', backgroundColor: '#e3f2fd', padding: '8px', borderRadius: '4px' }}>
                    <strong>Selected Location:</strong><br/>
                    <div style={{ marginTop: '3px' }}>{formData.landmarks}</div>
                    <div style={{ marginTop: '3px', fontWeight: 'bold' }}>
                      Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>

              <div className="desktop1-form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  placeholder="Enter address" 
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="desktop1-form-group" style={{ flex: 1 }}>
                  <label>Pin Code</label>
                  <input 
                    type="text" 
                    name="pinCode" 
                    value={formData.pinCode} 
                    onChange={handleChange} 
                    placeholder="Enter pin code" 
                  />
                </div>

                <div className="desktop1-form-group" style={{ flex: 1 }}>
                  <label>City</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange} 
                    placeholder="Enter city" 
                  />
                </div>
              </div>

              <div className="desktop1-form-group">
                <label>State</label>
                <input 
                  type="text" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleChange} 
                  placeholder="Enter state" 
                />
              </div>

              <div className="desktop1-form-group">
                <label>Timing <span className="desktop1-required">*</span></label>
                <div className="dropup">
                  <button 
                    type="button" 
                    className="dropdown-toggle" 
                    onClick={toggleTimeDropdown}
                  >
                    Select Time Slots
                  </button>
                  <ul className={`dropdown-menu ${isTimeDropdownOpen ? 'show' : ''}`}>
                    {[...Array(24)].map((_, i) => {
                      const hour = i;
                      const nextHour = (i + 1) % 24;
                      const timeFormat = hour => hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
                      const timeSlot = `${timeFormat(hour)} - ${timeFormat(nextHour)}`;
                      
                      return (
                        <li key={i}>
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id={`slot${i}`} 
                              value={timeSlot} 
                              onChange={handleTimingChange}
                              checked={formData.timming.includes(timeSlot)}
                            />
                            <label className="form-check-label" htmlFor={`slot${i}`}>
                              {timeSlot}
                            </label>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                
                {formData.timming.length > 0 && (
                  <div className="selected-slots">
                    {formData.timming.map((slot, index) => (
                      <div key={index} className="time-slot-tag">
                        {slot}
                        <button 
                          type="button" 
                          className="remove-slot" 
                          onClick={() => removeTimeSlot(slot)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="desktop1-form-group">
                <label>Verification Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label className="desktop1-toggle-switch">
                    <input 
                      type="checkbox" 
                      name="blueTicket" 
                      checked={formData.blueTicket} 
                      onChange={handleChange}
                      disabled={!otpVerified}
                    />
                    <span className="desktop1-slider"></span>
                  </label>
                  <span>{formData.blueTicket ? 'Verified' : 'Not verified'}</span>
                  {otpVerified && !formData.blueTicket && (
                    <span style={{ fontSize: '12px', color: '#3949ab' }}>
                      (Phone verified, click to enable blue tick)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="desktop1-form-buttons">
              <button 
                type="submit" 
                className="desktop1-save-btn"
                disabled={loading}
              >
                {loading ? (
                  <CgSpinner size={20} className="animate-spin" />
                ) : null}
                Save Information
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Desktop1;