# Employee Registration Form Backend

A RESTful API backend for handling employee registration forms, built with Express.js and MongoDB.

## Features

- Complete employee registration form data handling
- Phone number verification with OTP
- Comprehensive form data validation
- MongoDB data persistence
- CORS support for frontend integration
- Error handling and logging

## Prerequisites

- Node.js (v14.x or higher)
- MongoDB Atlas account or local MongoDB installation
- (Optional) SMS gateway service for production OTP delivery

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd employee-registration-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   PORT=5050
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Forms

| Method | Endpoint     | Description                   |
|--------|--------------|-------------------------------|
| GET    | /forms       | Get all forms                 |
| GET    | /forms/:id   | Get a specific form by ID     |
| POST   | /forms       | Create a new form             |
| PUT    | /forms/:id   | Update an existing form       |
| DELETE | /forms/:id   | Delete a form                 |

### OTP Verification

| Method | Endpoint      | Description                   |
|--------|---------------|-------------------------------|
| POST   | /send-otp     | Send OTP to a phone number    |
| POST   | /verify-otp   | Verify OTP for a phone number |

### Utility

| Method | Endpoint | Description      |
|--------|----------|------------------|
| GET    | /health  | Server health check |

## Data Model

### Form Data Schema

```javascript
{
  name: String,             // required
  occupation: String,       // required
  phoneNumber: String,      // required
  identityProof: String,    
  landmarks: String,        
  age: Number,              // required
  state: String,            
  address: String,          
  otpCode: String,          
  timming: [String],        // array of time slots
  altPhoneNumber: String,   
  idProofNumber: String,    
  blueTicket: Boolean,      
  pinCode: String,          
  city: String,             
  coordinates: {            // geo coordinates
    lat: Number,
    lng: Number
  },
  createdAt: Date           // automatically set
}
```

## API Usage Examples

### Create a Form

**Request:**
```bash
POST /forms
Content-Type: application/json

{
  "name": "John Doe",
  "occupation": "Software Developer",
  "phoneNumber": "9876543210",
  "age": 30,
  "state": "Karnataka",
  "city": "Bangalore",
  "timming": ["9 AM - 10 AM", "2 PM - 3 PM"],
  "coordinates": {
    "lat": 12.9716,
    "lng": 77.5946
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form data saved successfully",
  "data": {
    "_id": "60f8a9e0f1c9b83a4c3e8b72",
    "name": "John Doe",
    "occupation": "Software Developer",
    "phoneNumber": "9876543210",
    "age": 30,
    "state": "Karnataka",
    "city": "Bangalore",
    "timming": ["9 AM - 10 AM", "2 PM - 3 PM"],
    "coordinates": {
      "lat": 12.9716,
      "lng": 77.5946
    },
    "blueTicket": false,
    "createdAt": "2025-04-26T12:34:56.789Z"
  }
}
```

### Send OTP

**Request:**
```bash
POST /send-otp
Content-Type: application/json

{
  "phoneNumber": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### Verify OTP

**Request:**
```bash
POST /verify-otp
Content-Type: application/json

{
  "phoneNumber": "9876543210",
  "enteredOtp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

## Error Handling

The API returns consistent error responses with appropriate HTTP status codes:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field1": "Validation error message",
    "field2": "Validation error message"
  }
}
```

## Development

### Environment Variables

- `PORT`: Server port (default: 5050)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)

### Running in Development Mode

```bash
npm run dev
```

### Running in Production

```bash
npm run start
```

## Security Considerations

- In production, implement proper authentication and authorization
- Configure rate limiting to prevent abuse
- Use HTTPS in production
- Consider using a more secure OTP storage mechanism (Redis/Database)
- Implement input sanitization for all user inputs

## Future Improvements

- Add user authentication and authorization
- Implement request rate limiting
- Add API documentation with Swagger
- Set up unit and integration tests
- Add logging with Winston/Morgan

## License

[MIT](LICENSE)