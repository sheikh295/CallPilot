# Contacts Feature

The Contacts feature provides a complete CRUD API for managing contact information in the CallPilot system. All endpoints are protected by JWT authentication and include comprehensive logging.

## Features

- ✅ Create, read, update, delete contacts
- ✅ Bulk insert contacts from CSV file
- ✅ Phone number validation and formatting
- ✅ JWT authentication protection
- ✅ Comprehensive request/response logging
- ✅ Pagination support
- ✅ Swagger API documentation
- ✅ Input validation with class-validator

## API Endpoints

### Authentication Required
All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 1. Create Contact
```http
POST /v1/contacts
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Doe",
  "phoneNumber": "5551234567"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "phoneNumber": "5551234567",
  "formattedPhoneNumber": "(555) 123-4567",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

#### 2. Bulk Insert Contacts
```http
POST /v1/contacts/bulk
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <CSV file>
```

**CSV Format:**
```csv
Name,PhoneNumber
John Doe,5551234567
Jane Smith,5559876543
```

**Response (201):**
```json
{
  "successCount": 2,
  "errors": []
}
```

**Response with Errors (201):**
```json
{
  "successCount": 1,
  "errors": [
    {
      "row": 3,
      "error": "PhoneNumber must be a valid phone number"
    }
  ]
}
```

#### 3. Get All Contacts
```http
GET /v1/contacts?page=1&limit=10
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phoneNumber": "5551234567",
      "formattedPhoneNumber": "(555) 123-4567",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### 4. Get Contact by ID
```http
GET /v1/contacts/{id}
Authorization: Bearer <token>
```

#### 5. Update Contact
```http
PATCH /v1/contacts/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Jane Doe",
  "phoneNumber": "5559876543"
}
```

#### 6. Delete Contact
```http
DELETE /v1/contacts/{id}
Authorization: Bearer <token>
```

## Data Model

### Contact Entity
```typescript
{
  id: string (UUID)
  name: string (max 255 chars)
  phoneNumber: string (cleaned, 10 digits)
  createdAt: Date
  formattedPhoneNumber: string (virtual, formatted display)
}
```

## Validation Rules

- **Name**: Required, non-empty string
- **Phone Number**: Required, valid US phone number format
  - Accepts: `5551234567`, `(555) 123-4567`, `555-123-4567`, etc.
  - Stores: `5551234567` (cleaned)
  - Returns: `(555) 123-4567` (formatted)

## Security

- All endpoints protected by `JwtAuthGuard`
- User context attached to all operations
- Comprehensive audit logging for all operations
- Input sanitization and validation

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "phoneNumber must be a valid phone number"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Contact not found"
}
```

## Usage Examples

### Creating a Contact
```typescript
const response = await fetch('/v1/contacts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'John Doe',
    phoneNumber: '5551234567'
  })
});
```

### Fetching Contacts with Pagination
```typescript
const response = await fetch('/v1/contacts?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Future Enhancements

- Bulk operations
- Contact search and filtering
- Contact groups/categories
- Duplicate detection
- Contact verification