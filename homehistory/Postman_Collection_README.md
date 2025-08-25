# 🚀 HomeHistory API Postman Collection

## 📋 Overview

This Postman collection contains **all HomeHistory API endpoints** organized by functionality. It includes authentication, property management, AI services, scoring, search, documents, maintenance, reports, notifications, users, and health checks.

## 🎯 Collection Features

- ✅ **Complete API Coverage**: All 80+ endpoints included
- ✅ **Authentication Flow**: Automatic token management
- ✅ **Environment Variables**: Dynamic data handling
- ✅ **Test Scripts**: Automated response validation
- ✅ **Organized Structure**: Logical grouping by functionality
- ✅ **Ready to Import**: Direct import into Postman

## 📦 What's Included

### 🔐 **Authentication (5 endpoints)**

- Register User
- Login User
- Get Profile
- Refresh Token
- Forgot Password

### 🏠 **Properties (6 endpoints)**

- Create Property
- Get All Properties
- Get Property by ID
- Update Property
- Delete Property
- Get Property Statistics

### 🤖 **AI Services (3 endpoints)**

- Analyze Property
- Generate Embedding
- Natural Language Search

### 📊 **Scoring (3 endpoints)**

- Get Property Score
- Calculate Property Score
- Get Score Breakdown

### 🔍 **Search (3 endpoints)**

- Search with Filters
- Get Search Suggestions
- Find Similar Properties

### 📄 **Documents (2 endpoints)**

- Upload Document
- Get Documents

### 🔧 **Maintenance (2 endpoints)**

- Create Maintenance Record
- Get Maintenance Records

### 📈 **Reports (2 endpoints)**

- Generate Report
- Get Report

### 🔔 **Notifications (2 endpoints)**

- Get Notifications
- Get Unread Count

### 👥 **Users (2 endpoints)**

- Get All Users
- Get User by ID

### ❤️ **Health (2 endpoints)**

- Health Check
- AI Health Check

## 🛠️ Setup Instructions

### **1. Import Collection**

1. Open Postman
2. Click **"Import"** button
3. Select **"HomeHistory_API_Collection.json"**
4. Click **"Import"**

### **2. Set Up Environment**

1. Click **"Environments"** in the left sidebar
2. Click **"+"** to create new environment
3. Name it **"HomeHistory Local"**
4. Add these variables:

| Variable      | Initial Value               | Current Value               |
| ------------- | --------------------------- | --------------------------- |
| `base_url`    | `http://localhost:3000/api` | `http://localhost:3000/api` |
| `auth_token`  | (leave empty)               | (will be set automatically) |
| `property_id` | (leave empty)               | (will be set automatically) |
| `user_id`     | (leave empty)               | (will be set automatically) |

### **3. Select Environment**

1. In the top-right corner, select **"HomeHistory Local"**
2. This enables variable substitution in requests

## 🚀 Testing Workflow

### **Step 1: Start Your Servers**

```bash
# Terminal 1 - Backend API
cd homehistory
pnpm --filter @homehistory/api dev

# Terminal 2 - Frontend (optional)
pnpm --filter @homehistory/web dev
```

### **Step 2: Test Authentication**

1. **Register User** - Creates a new account
2. **Login User** - Gets authentication token (automatically sets `auth_token`)
3. **Get Profile** - Verifies authentication works

### **Step 3: Test Core Features**

1. **Create Property** - Creates a test property (automatically sets `property_id`)
2. **Get All Properties** - Lists user's properties
3. **Get Property by ID** - Views specific property details

### **Step 4: Test AI Features**

1. **Analyze Property** - Runs AI analysis on property
2. **Generate Embedding** - Creates vector embeddings
3. **Natural Language Search** - Tests AI-powered search

### **Step 5: Test Advanced Features**

1. **Calculate Property Score** - Generates HomeHistory Score™
2. **Search with Filters** - Tests advanced search
3. **Upload Document** - Tests file upload
4. **Generate Report** - Creates AI-powered reports

## 📝 Request Examples

### **Register User**

```json
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Password123!",
  "role": "USER"
}
```

### **Create Property**

```json
POST {{base_url}}/properties
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "US",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "yearBuilt": 2020,
  "squareFeet": 2000,
  "lotSize": 0.25,
  "bedrooms": 3,
  "bathrooms": 2.5,
  "propertyType": "SINGLE_FAMILY",
  "price": 500000
}
```

### **AI Property Analysis**

```json
POST {{base_url}}/ai/analyze/property
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "propertyId": "{{property_id}}"
}
```

## 🔧 Environment Variables

### **Automatic Variables**

These are set automatically by test scripts:

- `auth_token` - JWT token from login
- `user_id` - User ID from registration/login
- `property_id` - Property ID from property creation

### **Manual Variables**

These you can set manually:

- `base_url` - API base URL (default: `http://localhost:3000/api`)
- `report_id` - Report ID for report-specific endpoints

## 🧪 Test Scripts

### **Authentication Tests**

```javascript
// Login test script
pm.test('Status code is 200', function () {
  pm.response.to.have.status(200);
});

pm.test('Login successful', function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('data');
  pm.expect(jsonData.data).to.have.property('token');
  pm.environment.set('auth_token', jsonData.data.token);
  pm.environment.set('user_id', jsonData.data.user.id);
});
```

### **Property Creation Tests**

```javascript
// Property creation test script
pm.test('Status code is 201', function () {
  pm.response.to.have.status(201);
});

pm.test('Property created', function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('data');
  pm.environment.set('property_id', jsonData.data.id);
});
```

## 🎯 Testing Scenarios

### **Scenario 1: New User Journey**

1. Register User
2. Login User
3. Create Property
4. Analyze Property
5. Calculate Property Score
6. Generate Report

### **Scenario 2: Property Management**

1. Create Property
2. Update Property
3. Upload Document
4. Create Maintenance Record
5. Get Property Statistics

### **Scenario 3: AI Features**

1. Analyze Property
2. Generate Embedding
3. Natural Language Search
4. Find Similar Properties
5. Get AI Health Status

### **Scenario 4: Search & Discovery**

1. Search with Filters
2. Get Search Suggestions
3. Find Similar Properties
4. Natural Language Search

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Connection Refused**

- Ensure backend is running on `http://localhost:3000`
- Check if port 3000 is available

#### **2. Authentication Errors**

- Run "Login User" first to get valid token
- Check if token is expired (run "Refresh Token")

#### **3. Missing Property ID**

- Run "Create Property" first to get property ID
- Check if `property_id` variable is set

#### **4. File Upload Issues**

- Ensure file exists in your system
- Check file size limits
- Verify file format is supported

### **Debug Steps**

1. Check **Console** for error messages
2. Verify **Environment Variables** are set
3. Test **Health Check** endpoint first
4. Check **Network** tab for request/response details

## 📊 Expected Responses

### **Success Response Format**

```json
{
  "data": {
    // Response data here
  },
  "message": "Success message",
  "success": true
}
```

### **Error Response Format**

```json
{
  "message": "Error description",
  "statusCode": 400,
  "error": "Bad Request"
}
```

## 🔗 Related Resources

- **API Documentation**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/health`
- **Frontend**: `http://localhost:5173`

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Ensure both frontend and backend are running
4. Check the API documentation for endpoint details

---

**Happy Testing! 🎉**

This collection provides comprehensive coverage of all HomeHistory API endpoints, making it easy to test and validate the entire platform functionality.
