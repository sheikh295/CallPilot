# Calls Feature

The Calls feature provides a complete API for managing outbound voice calls using AI agents. It integrates with Vapi for voice AI capabilities and includes comprehensive call lifecycle management, outcome tracking, and webhook handling.

## Features

- ✅ Create call configurations with AI prompts and goals
- ✅ Launch outbound calls via Vapi integration
- ✅ Track call status lifecycle (queued → in_progress → completed/failed/no_answer)
- ✅ Store call transcripts, summaries, and structured AI outputs
- ✅ Search calls by contact name, phone, or outcome
- ✅ JWT authentication protection
- ✅ Comprehensive request/response logging
- ✅ Pagination support with maximum limit (100 per page)
- ✅ Vapi webhook integration for real-time updates
- ✅ Swagger API documentation

## Call Status Flow

```
queued → in_progress → completed/failed/no_answer
```

### Status Definitions
- **queued**: Call created, waiting to be launched
- **in_progress**: Call is actively happening via Vapi
- **completed**: Call finished successfully with outcome data
- **failed**: Call encountered an error during execution
- **no_answer**: Contact didn't answer the call

## API Endpoints

### Authentication Required
All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 1. Create Call
```http
POST /v1/calls
Content-Type: application/json
Authorization: Bearer <token>

{
  "contactId": "123e4567-e89b-12d3-a456-426614174000",
  "agentPrompt": "You are calling to discuss our new product offering...",
  "callGoals": "Determine interest level, identify objections, schedule callback if needed"
}
```

**Response (201):**
```json
{
  "id": "call-uuid",
  "contactId": "contact-uuid",
  "contact": {
    "id": "contact-uuid",
    "name": "John Doe",
    "phoneNumber": "5551234567",
    "formattedPhoneNumber": "(555) 123-4567"
  },
  "status": "queued",
  "outcome": null,
  "transcript": null,
  "summary": null,
  "structuredOutput": null,
  "agentPrompt": "You are calling to discuss our new product offering...",
  "callGoals": "Determine interest level, identify objections...",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

#### 2. Get All Calls
```http
GET /v1/calls?page=1&limit=10&search=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10, maximum 100
- `search` (optional): Search term for contact name, phone, or outcome

**Response (200):**
```json
{
  "calls": [
    {
      "id": "call-uuid",
      "contactId": "contact-uuid",
      "contact": {
        "id": "contact-uuid",
        "name": "John Doe",
        "phoneNumber": "5551234567",
        "formattedPhoneNumber": "(555) 123-4567"
      },
      "status": "completed",
      "outcome": "Interested - High",
      "transcript": "Agent: Hello... Contact: Hi...",
      "summary": "Contact showed high interest...",
      "structuredOutput": {
        "interested": true,
        "interestLevel": "high",
        "objections": [],
        "callbackRequested": false
      },
      "agentPrompt": "You are calling to discuss...",
      "callGoals": "Determine interest level...",
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-15T10:35:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### 3. Get Call by ID
```http
GET /v1/calls/{id}
Authorization: Bearer <token>
```

#### 4. Launch Call
```http
POST /v1/calls/{id}/launch
Content-Type: application/json
Authorization: Bearer <token>

{
  "customPrompt": "Optional custom prompt override"
}
```

**Response (200):**
```json
{
  "id": "call-uuid",
  "status": "in_progress",
  "updatedAt": "2026-01-15T10:30:05Z",
  ...
}
```

#### 5. Vapi Webhook
```http
POST /webhooks/vapi
Content-Type: application/json

{
  "callId": "internal-call-id",
  "status": "completed",
  "outcome": "Interested - High",
  "transcript": "Agent: Hello...",
  "summary": "Contact showed high interest...",
  "structuredOutput": {
    "interested": true,
    "interestLevel": "high"
  }
}
```

## Data Model

### Call Entity
```typescript
{
  id: string (uuid)
  contactId: string (foreign key to contacts)
  contact: Contact (relation)
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'no_answer'
  outcome: string (nullable)
  transcript: text (nullable)
  summary: text (nullable)
  structuredOutput: json (nullable)
  agentPrompt: text (nullable)
  callGoals: text (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

## AI Agent Prompt Structure

### Recommended Prompt Components:
1. **Context**: Company/product introduction
2. **Objectives**: Clear call goals and success criteria
3. **Data Collection**: Specific information to gather
4. **Structured Output**: JSON format requirements

### Example Prompt:
```
You are an AI sales assistant calling on behalf of TechCorp Solutions.

Call Objective: Qualify leads for our SaaS product and schedule demos for interested prospects.

Key Information to Collect:
- Current pain points and challenges
- Budget range and timeline
- Decision-making authority
- Preferred contact method for follow-up

At the end of the call, provide a structured summary in JSON format with:
- Interest level (high/medium/low)
- Objections or concerns
- Callback preferences
- Qualification status
```

## Vapi Integration

### Current Implementation:
- **Launch Call**: Updates status to `in_progress` and triggers Vapi
- **Webhook Handling**: Receives call completion data from Vapi
- **Status Updates**: Automatically updates call records with outcomes

### Future Vapi Integration:
- Real Vapi API calls for outbound dialing
- Webhook signature verification
- Call recording and analysis
- Real-time call monitoring

## Security

- All endpoints protected by `JwtAuthGuard`
- Webhook endpoints are public (consider IP restrictions for production)
- Input sanitization and validation
- Comprehensive audit logging

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "contactId must be a valid UUID",
    "agentPrompt should not be empty"
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
  "message": "Call not found"
}
```

## Usage Examples

### Creating a Call
```typescript
const response = await fetch('/v1/calls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    contactId: 'contact-uuid',
    agentPrompt: 'You are calling to discuss our product...',
    callGoals: 'Qualify the lead and schedule a demo'
  })
});
```

### Launching a Call
```typescript
const response = await fetch(`/v1/calls/${callId}/launch`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    customPrompt: 'Optional override prompt'
  })
});
```

## Future Enhancements

- Real Vapi API integration
- Webhook signature verification
- Call analytics and reporting
- Bulk call operations
- Call retry logic for failed calls
- Real-time call monitoring
- Call recording storage
- Advanced AI prompt templates
- Multi-language support