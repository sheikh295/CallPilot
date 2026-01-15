import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
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

export class VapiWebhookDto {
  @ApiProperty({
    description: 'Vapi call ID',
    example: 'call_123456789',
  })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({
    description: 'Call status',
    enum: ['queued', 'in_progress', 'completed', 'failed', 'no_answer'],
    example: 'completed',
  })
  @IsEnum(['queued', 'in_progress', 'completed', 'failed', 'no_answer'])
  status: CallStatus;

  @ApiProperty({
    description: 'Call outcome',
    example: 'Interested - High',
    required: false,
  })
  @IsString()
  @IsOptional()
  outcome?: string;

  @ApiProperty({
    description: 'Call transcript',
    example: 'Agent: Hello...',
    required: false,
  })
  @IsString()
  @IsOptional()
  transcript?: string;

  @ApiProperty({
    description: 'Call summary',
    example: 'Contact showed high interest...',
    required: false,
  })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({
    description: 'Structured output from AI',
    example: { interested: true, interestLevel: 'high' },
    required: false,
  })
  @IsOptional()
  structuredOutput?: any;
}