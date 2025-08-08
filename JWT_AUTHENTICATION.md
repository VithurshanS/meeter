# JWT Authentication for Jitsi Classroom Connect

## Overview
This project now includes dynamic JWT token generation for Jitsi meetings, allowing for secure authentication and proper role-based access control.

## Features

### 1. Dynamic JWT Token Generation
- **Library**: Uses `jose` library for secure JWT generation
- **Secret Key**: Configurable secret key for token signing
- **Expiration**: Tokens expire after 10 hours
- **Room-specific**: Each token is generated for a specific room

### 2. Authentication Methods

#### Method 1: Direct Token Generation
- Creates tokens based on user data (username, email, role)
- Automatically assigns moderator privileges to teachers
- Fallback option when no credentials are provided

#### Method 2: Credential-based Authentication
- Mock authentication system (replace with real API in production)
- Demo credentials:
  - **Tutor**: `tutor@example.com` / `tutor123`
  - **Student**: `student@example.com` / `student123`
- Validates credentials before generating tokens

### 3. UI Integration
- Optional authentication checkbox in join form
- Users can choose to authenticate or use direct token generation
- Automatic fallback to hardcoded token if JWT generation fails

## Configuration

### JWT Service Settings
```typescript
private static readonly APP_ID = 'mydeploy1';
private static readonly APP_SECRET = 'wEoG/Y5keRbH4yrjMe7UxWiBzqO8a8VRqY8cVR4oXro=';
private static readonly DOMAIN = 'jit.shancloudservice.com';
```

### Token Structure
```json
{
  "aud": "jitsi",
  "iss": "mydeploy1",
  "sub": "jit.shancloudservice.com",
  "room": "actual-room-name",
  "moderator": true/false,
  "exp": timestamp,
  "context": {
    "user": {
      "name": "User Name",
      "email": "user@example.com"
    }
  }
}
```

## Usage

### 1. Basic Usage (No Authentication)
- Users enter username and room name
- System generates JWT with user data
- Role determines moderator status

### 2. Authenticated Usage
- Users check "Use authentication" checkbox
- Enter credentials (email/password)
- System validates and generates appropriate JWT
- Role from credentials overrides UI selection

### 3. Fallback Behavior
- If JWT generation fails, uses hardcoded fallback token
- Displays warning toast to user
- Meeting still functions with limited authentication

## Production Deployment

### Required Changes
1. **Replace Mock Authentication**: 
   - Update `authenticateUser()` method in `JWTService`
   - Connect to your actual authentication API

2. **Secure Secret Management**:
   - Move `APP_SECRET` to environment variables
   - Use proper secret rotation practices

3. **Error Handling**:
   - Implement proper error logging
   - Add retry mechanisms for token generation

4. **Security Enhancements**:
   - Add rate limiting for authentication attempts
   - Implement proper session management
   - Add CSRF protection

## File Structure
```
src/
├── lib/
│   └── jwt-service.ts          # JWT token generation service
├── components/
│   ├── JoinForm.tsx           # Updated with auth options
│   └── MeetingRoom.tsx        # Updated to use dynamic JWT
└── pages/
    └── Index.tsx              # Updated state management
```

## Dependencies
- `jose`: JWT token generation and signing
- Existing React/TypeScript dependencies

## Testing
- Build successfully completes: ✅
- JWT service properly integrated: ✅
- Authentication flow functional: ✅
- Fallback mechanisms working: ✅
