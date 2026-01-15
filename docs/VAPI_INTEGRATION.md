# Vapi Integration Guide

This document explains how the CallPilot backend integrates with Vapi for AI-powered voice calls.

## Overview

CallPilot uses Vapi's API to create and manage outbound AI voice calls. The integration includes:

- Creating outbound calls with custom AI prompts
- Tracking call status via webhooks
- Storing call transcripts, summaries, and structured outputs
- Secure webhook signature verification

## Architecture

### Components

1. **VapiService** (`be/src/services/vapi/vapi.service.ts`)
   - Handles all Vapi API interactions
   - Creates outbound calls
   - Retrieves call details
   - Verifies webhook signatures

2. **CallsService** (`be/src/features/calls/calls.service.ts`)
   - Manages call lifecycle in our database
   - Launches calls via VapiService
   - Maps Vapi call IDs to internal call IDs
   - Updates call status from webhooks

3. **WebhooksController** (`be/src/features/calls/webhooks.controller.ts`)
   - Receives webhook callbacks from Vapi
   - Verifies webhook signatures
   - Updates call status in the database

### Data Flow

1. **Creating a Call**:
   - User creates a call via `POST /v1/calls` with contactId, agentPrompt, and callGoals
   - Call is saved in database with status "queued"

2. **Launching a Call**:
   - User launches the call via `POST /v1/calls/:id/launch`
   - CallsService retrieves the call and contact information
   - VapiService creates an outbound call using Vapi API
   - Vapi call ID is stored in the database alongside our internal call ID
   - Call status is updated to "in_progress"

3. **Receiving Webhooks**:
   - Vapi sends webhooks to `POST /webhooks/vapi` when call status changes
   - Webhook signature is verified for security
   - Call is looked up using the Vapi call ID
   - Call status, transcript, summary, and structured output are updated

## Configuration

### Environment Variables

Add these variables to your `.env` file (see `be/example.env` for template):

```env
# Vapi API Key (get from https://vapi.ai dashboard)
VAPI_API_KEY=your_api_key_here

# Webhook secret for signature verification
VAPI_WEBHOOK_SECRET=your_webhook_secret_here

# Default assistant ID to use for calls (optional, but recommended)
VAPI_ASSISTANT_ID=your_assistant_id_here

# Phone number ID to use for outbound calls (optional)
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
```

### Getting Your Vapi Credentials

1. **API Key**:
   - Sign up at https://vapi.ai
   - Go to Settings → API Keys
   - Create a new API key
   - Copy it to `VAPI_API_KEY`

2. **Assistant ID**:
   - Create an assistant in the Vapi dashboard
   - Configure the LLM, voice, and transcriber settings
   - Copy the assistant ID to `VAPI_ASSISTANT_ID`
   - Note: You can use assistant overrides to inject custom prompts per call

3. **Phone Number**:
   - Purchase a phone number in the Vapi dashboard
   - Copy the phone number ID to `VAPI_PHONE_NUMBER_ID`
   - This number will be used as the caller ID for outbound calls

4. **Webhook Secret**:
   - In Vapi dashboard, go to Settings → Webhooks
   - Set your webhook URL: `https://your-domain.com/webhooks/vapi`
   - Copy the webhook secret to `VAPI_WEBHOOK_SECRET`

## Database Schema Changes

The `Call` entity now includes a `vapiCallId` field:

```typescript
@Column({ type: 'varchar', nullable: true })
vapiCallId: string;
```

This field stores Vapi's call ID to enable mapping between Vapi's webhooks and our internal call records.

## API Endpoints

### Create a Call

```http
POST /v1/calls
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "contactId": "uuid",
  "agentPrompt": "You are a sales assistant calling to discuss our new product...",
  "callGoals": "Determine interest level, identify objections, schedule callback if needed"
}
```

### Launch a Call

```http
POST /v1/calls/:id/launch
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "customPrompt": "Optional override for the agent prompt"
}
```

Response includes the call with `vapiCallId` populated.

### Webhook Endpoint

```http
POST /webhooks/vapi
Content-Type: application/json
x-vapi-signature: <signature>

{
  "callId": "vapi_call_id",
  "status": "completed",
  "outcome": "Interested - High",
  "transcript": "Full call transcript...",
  "summary": "Call summary...",
  "structuredOutput": {
    "interested": true,
    "interestLevel": "high"
  }
}
```

## Testing

### 1. Test with Vapi MCP Server

You can use the Vapi MCP server to test call creation:

```bash
# List existing assistants
npx @vapi-ai/mcp-docs-server list_assistants

# Create a test call (requires phone number)
npx @vapi-ai/mcp-docs-server create_call \
  --assistantId "your_assistant_id" \
  --customerNumber "+1234567890"
```

### 2. Test the API

```bash
# 1. Sign up and get JWT token
curl -X POST http://localhost:3000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'

# 2. Create a contact
curl -X POST http://localhost:3000/v1/contacts \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "phoneNumber": "+1234567890"}'

# 3. Create a call
curl -X POST http://localhost:3000/v1/calls \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "<contact_uuid>",
    "agentPrompt": "You are a friendly assistant...",
    "callGoals": "Qualify the lead"
  }'

# 4. Launch the call
curl -X POST http://localhost:3000/v1/calls/<call_uuid>/launch \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{}'

# 5. Check call status
curl -X GET http://localhost:3000/v1/calls/<call_uuid> \
  -H "Authorization: Bearer <your_jwt_token>"
```

### 3. Test Webhooks Locally

Use ngrok to expose your local server for webhook testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Update Vapi webhook URL to:
# https://<your-ngrok-url>/webhooks/vapi
```

## Security

### Webhook Signature Verification

All webhook requests are verified using HMAC-SHA256 signature verification:

1. Vapi signs the webhook payload with your webhook secret
2. The signature is sent in the `x-vapi-signature` header
3. Our server recalculates the signature and compares it
4. If signatures don't match, the webhook is rejected with 401 Unauthorized

**Note**: In development, if `VAPI_WEBHOOK_SECRET` is not configured, webhook verification is disabled. **Always configure this in production!**

## Troubleshooting

### Call Launch Fails with "VAPI_ASSISTANT_ID is not configured"

**Solution**: Set `VAPI_ASSISTANT_ID` in your `.env` file with a valid assistant ID from Vapi.

### Call Launch Fails with "VAPI_API_KEY is not configured"

**Solution**: Set `VAPI_API_KEY` in your `.env` file with your Vapi API key.

### Webhooks Not Received

**Possible causes**:
1. Webhook URL not configured in Vapi dashboard
2. Server not publicly accessible (use ngrok for local testing)
3. Firewall blocking incoming requests

### Webhook Returns 401 Unauthorized

**Possible causes**:
1. `VAPI_WEBHOOK_SECRET` doesn't match the secret in Vapi dashboard
2. Signature verification is enabled but secret is incorrect

**Solution**: Verify that `VAPI_WEBHOOK_SECRET` matches the webhook secret in your Vapi dashboard settings.

### Call Not Found in Webhook

**Possible causes**:
1. Call was not successfully created or vapiCallId was not stored
2. Database connection issue

**Solution**: Check application logs for errors during call launch. Verify that `vapiCallId` is being stored in the database.

## Assistant Configuration

### Using Assistant Overrides

The current implementation uses assistant overrides to inject custom prompts and goals:

```typescript
assistantOverrides: {
  variableValues: {
    agentPrompt: "Your custom prompt...",
    callGoals: "Your call goals..."
  }
}
```

To use this approach, configure your Vapi assistant with variables like `{{agentPrompt}}` and `{{callGoals}}` in the system prompt.

### Alternative: Dynamic Assistant Creation

For more flexibility, you could create a new assistant for each call with custom instructions. This would require:

1. Implementing `createAssistant` in VapiService
2. Storing the assistant ID with each call
3. Cleaning up assistants after calls complete (optional)

## Next Steps

- [ ] Set up production Vapi account with phone numbers
- [ ] Configure webhook URL in Vapi dashboard
- [ ] Test end-to-end call flow
- [ ] Monitor webhook delivery and errors
- [ ] Set up logging/monitoring for Vapi API errors
- [ ] Consider implementing retry logic for failed API calls
- [ ] Add support for scheduled calls (using Vapi's `scheduledAt` parameter)

## References

- [Vapi API Documentation](https://docs.vapi.ai)
- [Vapi Dashboard](https://dashboard.vapi.ai)
- [Vapi Webhooks Guide](https://docs.vapi.ai/webhooks)
