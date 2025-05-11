import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ViewApplicant.css';

function ViewApplicant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApplicant = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5050/forms/${id}`);
      if (response.data.success) {
        setApplicant(response.data.data);
      } else {
        setError('Unable to retrieve applicant information.');
      }
    } catch (error) {
      console.error('Error fetching applicant:', error);
      setError('An error occurred while retrieving applicant data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicant();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const formatFieldName = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const renderFieldValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="viewapplicant-empty-value">Not provided</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      return (
        <pre className="viewapplicant-object-value">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    
    return value;
  };

  if (isLoading) {
    return (
      <div className="viewapplicant-loading-container">
        <div className="viewapplicant-loading">
          <div className="viewapplicant-spinner"></div>
          <p>Loading applicant data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viewapplicant-error-container">
        <div className="viewapplicant-error">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="viewapplicant-button" onClick={fetchApplicant}>
            Retry
          </button>
          <button className="viewapplicant-button secondary" onClick={handleBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="viewapplicant-empty-container">
        <div className="viewapplicant-empty">
          <h3>No Applicant Found</h3>
          <p>The requested applicant could not be found.</p>
          <button className="viewapplicant-button" onClick={handleBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const hiddenFields = ['_id', '__v'];

  return (
    <div className="viewapplicant-container">
      <div className="viewapplicant-header">
        <button className="viewapplicant-back-button" onClick={handleBack}>
          ← Back to List
        </button>
        <h1 className="viewapplicant-title">Applicant Information</h1>
      </div>

      <div className="viewapplicant-card">
        {applicant.name && (
          <div className="viewapplicant-applicant-name">
            {applicant.name}
          </div>
        )}

        <div className="viewapplicant-content">
          {Object.entries(applicant)
            .filter(([key]) => !hiddenFields.includes(key))
            .map(([key, value]) => (
              <div className="viewapplicant-field" key={key}>
                <div className="viewapplicant-field-label">
                  {formatFieldName(key)}
                </div>
                <div className="viewapplicant-field-value">
                  {renderFieldValue(value)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default ViewApplicant;