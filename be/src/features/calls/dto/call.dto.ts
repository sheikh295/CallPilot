import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import type { CallStatus } from '../../../entities/call.entity';

export class CreateCallDto {
  @ApiProperty({
    description: 'Contact ID to call',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  contactId: string;

  @ApiProperty({
    description: 'Agent prompt for the AI call',
    example: 'You are calling to discuss our new product offering...',
  })
  @IsString()
  @IsNotEmpty()
  agentPrompt: string;

  @ApiProperty({
    description: 'Goals for this call',
    example: 'Determine interest level, identify objections, schedule callback if needed',
  })
  @IsString()
  @IsNotEmpty()
  callGoals: string;
}

export class LaunchCallDto {
  @ApiProperty({
    description: 'Optional custom prompt override',
    required: false,
  })
  @IsString()
  @IsOptional()
  customPrompt?: string;
}

export class CallResponseDto {
  @ApiProperty({
    description: 'Call unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Contact ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  contactId: string;

  @ApiProperty({
    description: 'Contact information',
    type: 'object',
    properties: {
      id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      name: { type: 'string', example: 'John Doe' },
      phoneNumber: { type: 'string', example: '5551234567' },
      formattedPhoneNumber: { type: 'string', example: '(555) 123-4567' },
    },
  })
  contact: {
    id: string;
    name: string;
    phoneNumber: string;
    formattedPhoneNumber: string;
  };

  @ApiProperty({
    description: 'Call status',
    enum: ['queued', 'in_progress', 'completed', 'failed', 'no_answer'],
    example: 'completed',
  })
  status: CallStatus;

  @ApiProperty({
    description: 'Call outcome',
    example: 'Interested - High',
    nullable: true,
  })
  outcome: string | null;

  @ApiProperty({
    description: 'Call transcript',
    example: 'Agent: Hello, this is... Contact: Hi, how can I help...',
    nullable: true,
  })
  transcript: string | null;

  @ApiProperty({
    description: 'Call summary',
    example: 'Contact showed high interest in the product...',
    nullable: true,
  })
  summary: string | null;

  @ApiProperty({
    description: 'Structured output from AI',
    example: { interested: true, interestLevel: 'high', objections: [] },
    nullable: true,
  })
  structuredOutput: any | null;

  @ApiProperty({
    description: 'Agent prompt used',
    example: 'You are calling to discuss our new product offering...',
    nullable: true,
  })
  agentPrompt: string | null;

  @ApiProperty({
    description: 'Call goals',
    example: 'Determine interest level, identify objections...',
    nullable: true,
  })
  callGoals: string | null;

  @ApiProperty({
    description: 'Call creation timestamp',
    example: '2026-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Call last update timestamp',
    example: '2026-01-15T10:35:00Z',
  })
  updatedAt: Date;
}

export class CallsListResponseDto {
  @ApiProperty({
    description: 'Array of calls',
    type: [CallResponseDto],
  })
  calls: CallResponseDto[];

  @ApiProperty({
    description: 'Total number of calls',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;
}

// Vapi webhook event types
export type VapiMessageType =
  | 'status-update'
  | 'end-of-call-report'
  | 'transcript'
  | 'conversation-update'
  | 'hang'
  | 'speech-update';

export type VapiCallStatus = 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';

export type VapiEndedReason =
  | 'assistant-ended-call'
  | 'assistant-forwarded-call'
  | 'assistant-error'
  | 'customer-ended-call'
  | 'customer-did-not-answer'
  | 'customer-did-not-give-microphone-permission'
  | 'voicemail'
  | 'pipeline-error-openai-voice-failed'
  | 'pipeline-error-cartesia-voice-failed'
  | 'pipeline-error-deepgram-transcriber-failed'
  | 'pipeline-error-eleven-labs-voice-failed'
  | 'pipeline-error-playht-voice-failed'
  | 'pipeline-error-lmnt-voice-failed'
  | 'pipeline-error-azure-voice-failed'
  | 'pipeline-error-rime-ai-voice-failed'
  | 'pipeline-error-neets-voice-failed'
  | 'assistant-not-found'
  | 'assistant-not-invalid'
  | 'assistant-not-provided'
  | 'assistant-request-returned-error'
  | 'assistant-request-returned-unspeakable-error'
  | 'assistant-request-returned-invalid-assistant'
  | 'assistant-request-returned-no-assistant'
  | 'assistant-request-timed-out'
  | 'db-error'
  | 'no-server-available'
  | 'phone-call-provider-closed-websocket'
  | 'pipeline-error-extra-function-failed'
  | 'pipeline-error-first-message-failed'
  | 'pipeline-no-available-model'
  | 'server-shutdown'
  | 'twilio-failed-to-connect-call'
  | 'unknown-error'
  | 'vonage-disconnected'
  | 'vonage-failed-to-connect-call';

// Base Vapi Call object that comes with all webhook events
export class VapiCallObject {
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  orgId?: string;

  @IsString()
  @IsOptional()
  assistantId?: string;

  @IsString()
  @IsOptional()
  status?: VapiCallStatus;

  @IsString()
  @IsOptional()
  endedReason?: VapiEndedReason;

  @IsOptional()
  customer?: {
    number?: string;
    name?: string;
  };

  @IsOptional()
  costs?: any;

  @IsString()
  @IsOptional()
  createdAt?: string;

  @IsString()
  @IsOptional()
  updatedAt?: string;

  @IsString()
  @IsOptional()
  startedAt?: string;

  @IsString()
  @IsOptional()
  endedAt?: string;
}

// Status Update Event
export class VapiStatusUpdateMessage {
  @IsString()
  type: 'status-update';

  @IsString()
  status: VapiCallStatus;

  @IsString()
  @IsOptional()
  endedReason?: VapiEndedReason;

  @IsOptional()
  call?: VapiCallObject;
}

// End of Call Report Event
export class VapiEndOfCallReportMessage {
  @IsString()
  type: 'end-of-call-report';

  @IsString()
  @IsOptional()
  endedReason?: VapiEndedReason;

  @IsOptional()
  call?: VapiCallObject;

  @IsOptional()
  artifact?: {
    messages?: any[];
    messagesOpenAIFormatted?: any[];
    recordingUrl?: string;
    stereoRecordingUrl?: string;
    transcript?: string;
    summary?: string;
  };

  @IsOptional()
  analysis?: any;

  @IsOptional()
  structuredData?: any;
}

// Transcript Event
export class VapiTranscriptMessage {
  @IsString()
  type: 'transcript';

  @IsString()
  @IsOptional()
  role?: 'assistant' | 'user';

  @IsString()
  @IsOptional()
  transcriptType?: 'partial' | 'final';

  @IsString()
  @IsOptional()
  transcript?: string;

  @IsOptional()
  call?: VapiCallObject;
}

// Conversation Update Event
export class VapiConversationUpdateMessage {
  @IsString()
  type: 'conversation-update';

  @IsOptional()
  conversation?: any[];

  @IsOptional()
  call?: VapiCallObject;
}

// Hang Event
export class VapiHangMessage {
  @IsString()
  type: 'hang';

  @IsOptional()
  call?: VapiCallObject;
}

// Speech Update Event
export class VapiSpeechUpdateMessage {
  @IsString()
  type: 'speech-update';

  @IsString()
  @IsOptional()
  status?: 'started' | 'stopped';

  @IsString()
  @IsOptional()
  role?: 'assistant' | 'user';

  @IsOptional()
  call?: VapiCallObject;
}

// Main Vapi Webhook DTO - wraps all message types
export class VapiWebhookDto {
  @ApiProperty({
    description: 'Webhook message object',
    example: { type: 'status-update', status: 'ended' },
  })
  @IsOptional()
  message?:
    | VapiStatusUpdateMessage
    | VapiEndOfCallReportMessage
    | VapiTranscriptMessage
    | VapiConversationUpdateMessage
    | VapiHangMessage
    | VapiSpeechUpdateMessage;

  @ApiProperty({
    description: 'Call object (may be at root level in some events)',
    required: false,
  })
  @IsOptional()
  call?: VapiCallObject;

  // For backward compatibility
  @IsString()
  @IsOptional()
  callId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}