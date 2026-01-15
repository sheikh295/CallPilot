import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  Version,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, ContactResponseDto, ContactsListResponseDto, BulkInsertResponseDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../guards/jwt-auth.guard';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({
    status: 201,
    description: 'Contact created successfully',
    type: ContactResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Body() createContactDto: CreateContactDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ContactResponseDto> {
    const contact = await this.contactsService.create(createContactDto, req.user.sub);
    return {
      id: contact.id,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      formattedPhoneNumber: contact.formattedPhoneNumber,
      createdAt: contact.createdAt,
    };
  }

  @Post('bulk')
  @Version('1')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk insert contacts from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file with contacts. Expected format: Name,PhoneNumber headers.',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing contacts data',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk insertion completed',
    type: BulkInsertResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file or CSV format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async bulkInsert(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest,
  ): Promise<BulkInsertResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV file');
    }
    return this.contactsService.bulkCreate(file.buffer.toString(), req.user.sub);
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Get all contacts with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name or phone number' })
  @ApiResponse({
    status: 200,
    description: 'Contacts retrieved successfully',
    type: ContactsListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ContactsListResponseDto> {
    const result = await this.contactsService.findAll(req.user.sub, page, limit, search);

    return {
      contacts: result.contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        formattedPhoneNumber: contact.formattedPhoneNumber,
        createdAt: contact.createdAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get a contact by ID' })
  @ApiResponse({
    status: 200,
    description: 'Contact retrieved successfully',
    type: ContactResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Contact not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ContactResponseDto> {
    const contact = await this.contactsService.findOne(id, req.user.sub);
    return {
      id: contact.id,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      formattedPhoneNumber: contact.formattedPhoneNumber,
      createdAt: contact.createdAt,
    };
  }

  @Patch(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({
    status: 200,
    description: 'Contact updated successfully',
    type: ContactResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Contact not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ContactResponseDto> {
    const contact = await this.contactsService.update(id, updateContactDto, req.user.sub);
    return {
      id: contact.id,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      formattedPhoneNumber: contact.formattedPhoneNumber,
      createdAt: contact.createdAt,
    };
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiResponse({
    status: 204,
    description: 'Contact deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Contact not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.contactsService.remove(id, req.user.sub);
  }
}