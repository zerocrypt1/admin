// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Components
import Login from './components/Login';
import Desktop1 from './components/Desktop1/Desktop1';
import Desktop2 from './components/Desktop2/Desktop2';
import Desktop3 from './components/Desktop2/Desktop3';
import Location from './components/Desktop1/Location';
import ViewApplicant from './components/Desktop2/ViewApplicant';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/desktop2" replace />} />
            <Route path="/desktop1" element={<Desktop1 />} />
            <Route path="/desktop2" element={<Desktop2 />} />
            <Route path="/desktop3" element={<Desktop3 />} />
            <Route path="/location" element={<Location />} />
            <Route path="/view/:id" element={<ViewApplicant />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
