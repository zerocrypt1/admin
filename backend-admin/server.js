const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Optional: Uncomment if using environment variables
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;


// Initialize Express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://admin-hp6u.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));


// MongoDB Connection
const mongoURI = 'mongodb+srv://shivansh:shivansh@cluster0.ge6innb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Monitor MongoDB connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Create initial admin user
const createInitialAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      const admin = new User({ username: 'admin', password: hashedPassword, role: 'admin' });
      await admin.save();
      console.log('✅ Initial admin user created');
    }
  } catch (error) {
    console.error('❌ Error creating initial admin:', error);
  }
};
mongoose.connection.once('open', () => createInitialAdmin());

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Please provide username and password' });
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const payload = { user: { id: user.id, username: user.username, role: user.role } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' }, (err, token) => {
      if (err) throw err;
      res.json({ success: true, message: 'Login successful', token, user: payload.user });
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

app.get('/api/auth/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/create-user', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized to create users' });
    const { username, password, role } = req.body;
    if (await User.findOne({ username })) return res.status(400).json({ success: false, message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role: role || 'user' });
    await user.save();
    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});
// Form Schema Definition
const formSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required']
  },
  occupation: { 
    type: String, 
    required: [true, 'Occupation is required']
  },
  phoneNumber: { 
    type: String, 
    required: [true, 'Phone number is required'],
    unique: true, // Add unique constraint
    validate: {
      validator: function(v) {
        return /\d/.test(v); // Basic validation - contains at least one digit
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  identityProof: String,
  landmarks: String,
  age: { 
    type: Number, 
    required: [true, 'Age is required'],
    min: [0, 'Age cannot be negative']
  },
  state: String,
  address: String,
  otpCode: String,
  timming: {
    type: [String],
    default: []
  },
  altPhoneNumber: String,
  idProofNumber: String,
  blueTicket: {
    type: Boolean,
    default: false
  },
  pinCode: String,
  city: String,
  coordinates: {
    type: mongoose.Schema.Types.Mixed,
    default: { lat: 0, lng: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create mongoose model
const FormData = mongoose.model('FormData', formSchema);

// Create a unique index on phoneNumber field
FormData.collection.createIndex({ phoneNumber: 1 }, { unique: true });

// OTP Management
// Simple in-memory store (use Redis or DB in production)
const otpStore = {};

// Generate a random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Server is running',
    mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Send OTP endpoint
app.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const otp = generateOtp();
    otpStore[phoneNumber] = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60000) // OTP valid for 10 minutes
    };

    // In production, send the OTP via SMS service
    // Here we just log it for development purposes
    console.log(`📱 Generated OTP for ${phoneNumber}: ${otp}`);
    
    res.status(200).json({ 
      success: true,
      message: 'OTP sent successfully (check server logs)',
      // Include the OTP in development mode only
      otp: process.env.NODE_ENV === 'production' ? undefined : otp
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP',
      error: error.message 
    });
  }
});

// Verify OTP endpoint
app.post('/verify-otp', (req, res) => {
  try {
    const { phoneNumber, enteredOtp } = req.body;
    
    if (!phoneNumber || !enteredOtp) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and OTP are required' 
      });
    }

    const otpData = otpStore[phoneNumber];

    if (!otpData) {
      return res.status(400).json({ 
        success: false,
        message: 'No OTP was sent to this number or OTP has expired' 
      });
    }

    if (new Date() > otpData.expiresAt) {
      delete otpStore[phoneNumber];
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired' 
      });
    }

    if (otpData.code === enteredOtp) {
      // Clear the OTP after successful verification
      delete otpStore[phoneNumber];
      
      return res.status(200).json({ 
        success: true,
        message: 'OTP verified successfully' 
      });
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP' 
      });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying OTP',
      error: error.message 
    });
  }
});

// Get all forms
app.get('/forms', async (req, res) => {
  try {
    const forms = await FormData.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: forms.length,
      data: forms
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forms',
      error: error.message
    });
  }
});

// Get single form by ID
app.get('/forms/:id', async (req, res) => {
  try {
    const form = await FormData.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    
    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch form',
      error: error.message
    });
  }
});

// Create new form
app.post('/forms', async (req, res) => {
  try {
    console.log('📝 Received form data:', req.body);
    
    // Check if phone number already exists before attempting to save
    const existingUser = await FormData.findOne({ phoneNumber: req.body.phoneNumber });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Registration failed',
        error: 'This phone number is already registered. Each phone number can only be used once.'
      });
    }
    
    // Prepare data for saving
    const formData = {
      ...req.body,
      // Ensure required arrays exist
      timming: req.body.timming || [],
      // Ensure coordinates are properly formatted
      coordinates: req.body.coordinates && Object.keys(req.body.coordinates).length > 0 
        ? req.body.coordinates 
        : { lat: 0, lng: 0 }
    };
    
    // Create and save new form
    const newForm = new FormData(formData);
    const savedForm = await newForm.save();
    
    console.log('✅ Form saved successfully:', savedForm._id);
    
    res.status(201).json({
      success: true,
      message: 'Form data saved successfully',
      data: savedForm
    });
  } catch (error) {
    console.error('❌ Error saving form data:', error);
    
    // Handle duplicate key error (MongoDB error code 11000)
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Registration failed',
        error: 'This phone number is already registered. Each phone number can only be used once.'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      // Extract validation error messages
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to save form data',
      error: error.message
    });
  }
});

// Update form - Modified to handle potential phone number changes
app.put('/forms/:id', async (req, res) => {
  try {
    console.log(`📝 Updating form ${req.params.id}:`, req.body);
    
    // If phone number is being updated, check if the new one already exists (except for this record)
    if (req.body.phoneNumber) {
      const existingUserWithPhone = await FormData.findOne({ 
        phoneNumber: req.body.phoneNumber,
        _id: { $ne: req.params.id } // Exclude current document
      });
      
      if (existingUserWithPhone) {
        return res.status(409).json({
          success: false,
          message: 'Update failed',
          error: 'This phone number is already registered to another user. Each phone number can only be used once.'
        });
      }
    }
    
    const updatedForm = await FormData.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true,
        runValidators: true // Run schema validators on update
      }
    );
    
    if (!updatedForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    
    console.log('✅ Form updated successfully');
    
    res.json({
      success: true,
      message: 'Form updated successfully',
      data: updatedForm
    });
  } catch (error) {
    console.error('❌ Error updating form:', error);
    
    // Handle duplicate key error (MongoDB error code 11000)
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Update failed',
        error: 'This phone number is already registered to another user. Each phone number can only be used once.'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update form',
      error: error.message
    });
  }
});

// Delete form
app.delete('/forms/:id', async (req, res) => {
  try {
    const deletedForm = await FormData.findByIdAndDelete(req.params.id);
    
    if (!deletedForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    
    console.log(`✅ Form ${req.params.id} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Form deleted successfully',
      data: deletedForm
    });
  } catch (error) {
    console.error('❌ Error deleting form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete form',
      error: error.message
    });
  }
});

// Add endpoint to check if phone number exists before form submission
app.post('/check-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const existingUser = await FormData.findOne({ phoneNumber });
    
    res.json({
      success: true,
      exists: !!existingUser
    });
  } catch (error) {
    console.error('Error checking phone number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check phone number',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start the server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle server shutdown gracefully
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
