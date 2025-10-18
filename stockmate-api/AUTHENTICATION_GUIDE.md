# Authentication Implementation Guide

## Overview

This warehouse management system now includes a complete authentication system with JWT tokens. Users can register, login, and access protected routes.

## User Table Schema

The `users` table includes:
- `id` (UUID, Primary Key)
- `name` (String) - Full name of the user
- `username` (String, Unique) - Username for login
- `email` (String, Unique) - Email address
- `password` (String) - Password stored as plain text ⚠️
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)

## API Endpoints

### Authentication Endpoints

#### 1. Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john.doe@example.com"
  }
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john.doe@example.com"
  }
}
```

#### 3. Get User Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "createdAt": "2025-10-18T10:00:00.000Z",
  "updatedAt": "2025-10-18T10:00:00.000Z"
}
```

### User Management Endpoints

#### 1. Create User
```http
POST /api/users
Content-Type: application/json

{
  "name": "Jane Smith",
  "username": "janesmith",
  "email": "jane.smith@example.com",
  "password": "password456"
}
```

#### 2. Get All Users
```http
GET /api/users
```

#### 3. Get User by ID
```http
GET /api/users/{id}
```

#### 4. Update User
```http
PATCH /api/users/{id}
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane.doe@example.com"
}
```

Note: Password cannot be updated through this endpoint for security reasons.

#### 5. Delete User
```http
DELETE /api/users/{id}
```

## Using Authentication

### Step 1: Register or Login

First, register a new user or login with existing credentials:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

### Step 2: Save the Access Token

Save the `access_token` from the response.

### Step 3: Use Token for Protected Routes

Include the token in the Authorization header:

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Using with Swagger UI

1. Open Swagger documentation: http://localhost:3000/api/docs
2. Register or login using the `/api/auth/register` or `/api/auth/login` endpoint
3. Copy the `access_token` from the response
4. Click the "Authorize" button at the top right of Swagger UI
5. Enter: `Bearer YOUR_ACCESS_TOKEN_HERE` (include the word "Bearer" followed by a space)
6. Click "Authorize"
7. Now you can access protected endpoints

## JWT Token Details

- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Payload**: Contains user ID, username, and email

Token payload structure:
```json
{
  "sub": "user-uuid",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "iat": 1697632800,
  "exp": 1697719200
}
```

## Environment Configuration

Add to your `.env` file:

```env
JWT_SECRET=your-secret-key-change-in-production
```

**Important**: Change the JWT_SECRET to a strong, random string in production!

## Security Considerations ⚠️

### Current Implementation

This implementation uses **plain text password storage** as requested. This means:
- Passwords are stored exactly as entered
- Authentication compares passwords directly (no hashing)
- Passwords are visible in the database

### ⚠️ NOT RECOMMENDED FOR PRODUCTION! ⚠️

For production environments, you should:

1. **Hash passwords** using bcrypt:
   ```typescript
   import * as bcrypt from 'bcrypt';
   
   // When creating user
   const hashedPassword = await bcrypt.hash(password, 10);
   
   // When verifying
   const isMatch = await bcrypt.compare(password, user.password);
   ```

2. **Use strong JWT secrets** (at least 32 characters, random)

3. **Implement refresh tokens** for better security

4. **Add rate limiting** to prevent brute force attacks

5. **Use HTTPS** in production

6. **Implement password policies**:
   - Minimum length (8+ characters)
   - Complexity requirements
   - Password history

7. **Add email verification**

8. **Implement password reset functionality**

9. **Add 2FA (Two-Factor Authentication)**

10. **Log authentication attempts**

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid username or password",
  "error": "Unauthorized"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Username already exists",
  "error": "Conflict"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User with ID xyz not found",
  "error": "Not Found"
}
```

## Testing the Authentication

### 1. Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'
```

### 3. Get profile (replace TOKEN with your actual token)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

## Integration with Other Modules

You can protect any endpoint by adding the `@UseGuards(AuthGuard)` decorator:

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';

@Get('protected-route')
@UseGuards(AuthGuard)
async protectedRoute(@Request() req) {
  // req.user contains the JWT payload
  const userId = req.user.sub;
  const username = req.user.username;
  // Your logic here
}
```

## Next Steps

1. **Install dependencies**: Run `npm install` to install `@nestjs/jwt`
2. **Set up environment**: Create `.env` file with JWT_SECRET
3. **Start the application**: Run `npm run start:dev`
4. **Test endpoints**: Use Swagger UI at http://localhost:3000/api/docs
5. **Consider security**: Plan to implement password hashing before production

---

**Note**: This authentication system is functional but simplified. For production use, please implement proper password hashing, refresh tokens, and other security best practices mentioned above.

