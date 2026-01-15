import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'Contact full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Contact phone number in E.164 format (e.g., +13464582853) or 10-digit US format. Will be automatically normalized to E.164.',
    example: '+13464582853',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class UpdateContactDto {
  @ApiProperty({
    description: 'Contact full name',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'Contact phone number in E.164 format (e.g., +13464582853) or 10-digit US format. Will be automatically normalized to E.164.',
    example: '+13464582853',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;
}

export class ContactResponseDto {
  @ApiProperty({
    description: 'Contact unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Contact full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Contact phone number in E.164 format',
    example: '+13464582853',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Formatted phone number for display',
    example: '(555) 123-4567',
  })
  formattedPhoneNumber: string;

  @ApiProperty({
    description: 'Contact creation timestamp',
    example: '2026-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class ContactsListResponseDto {
  @ApiProperty({
    description: 'Array of contacts',
    type: [ContactResponseDto],
  })
  contacts: ContactResponseDto[];

  @ApiProperty({
    description: 'Total number of contacts',
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

export class BulkInsertResponseDto {
  @ApiProperty({
    description: 'Number of contacts successfully inserted',
    example: 8,
  })
  successCount: number;

  @ApiProperty({
    description: 'Array of errors for failed insertions',
    example: [
      { row: 2, error: 'Invalid phone number format' },
      { row: 5, error: 'Name is required' },
    ],
  })
  errors: { row: number; error: string }[];
}