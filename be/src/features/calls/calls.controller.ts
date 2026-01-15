import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import {
  CreateCallDto,
  LaunchCallDto,
  CallResponseDto,
  CallsListResponseDto,
  VapiWebhookDto,
} from './dto/call.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../guards/jwt-auth.guard';

@ApiTags('calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new call configuration' })
  @ApiResponse({
    status: 201,
    description: 'Call created successfully',
    type: CallResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Contact not found',
  })
  async create(
    @Body() createCallDto: CreateCallDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CallResponseDto> {
    const call = await this.callsService.create(createCallDto, req.user.sub);
    const callWithContact = await this.callsService.findOne(call.id, req.user.sub);

    return {
      id: callWithContact.id,
      contactId: callWithContact.contactId,
      contact: {
        id: callWithContact.contact.id,
        name: callWithContact.contact.name,
        phoneNumber: callWithContact.contact.phoneNumber,
        formattedPhoneNumber: callWithContact.contact.formattedPhoneNumber,
      },
      status: callWithContact.status,
      outcome: callWithContact.outcome,
      transcript: callWithContact.transcript,
      summary: callWithContact.summary,
      structuredOutput: callWithContact.structuredOutput,
      agentPrompt: callWithContact.agentPrompt,
      callGoals: callWithContact.callGoals,
      createdAt: callWithContact.createdAt,
      updatedAt: callWithContact.updatedAt,
    };
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Get all calls with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for contact name, phone, or outcome' })
  @ApiResponse({
    status: 200,
    description: 'Calls retrieved successfully',
    type: CallsListResponseDto,
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
  ): Promise<CallsListResponseDto> {
    const result = await this.callsService.findAll(req.user.sub, page, limit, search);

    return {
      calls: result.calls.map(call => ({
        id: call.id,
        contactId: call.contactId,
        contact: {
          id: call.contact.id,
          name: call.contact.name,
          phoneNumber: call.contact.phoneNumber,
          formattedPhoneNumber: call.contact.formattedPhoneNumber,
        },
        status: call.status,
        outcome: call.outcome,
        transcript: call.transcript,
        summary: call.summary,
        structuredOutput: call.structuredOutput,
        agentPrompt: call.agentPrompt,
        callGoals: call.callGoals,
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get a call by ID' })
  @ApiResponse({
    status: 200,
    description: 'Call retrieved successfully',
    type: CallResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Call not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<CallResponseDto> {
    const call = await this.callsService.findOne(id, req.user.sub);
    return {
      id: call.id,
      contactId: call.contactId,
      contact: {
        id: call.contact.id,
        name: call.contact.name,
        phoneNumber: call.contact.phoneNumber,
        formattedPhoneNumber: call.contact.formattedPhoneNumber,
      },
      status: call.status,
      outcome: call.outcome,
      transcript: call.transcript,
      summary: call.summary,
      structuredOutput: call.structuredOutput,
      agentPrompt: call.agentPrompt,
      callGoals: call.callGoals,
      createdAt: call.createdAt,
      updatedAt: call.updatedAt,
    };
  }

  @Post(':id/launch')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Launch/trigger a call' })
  @ApiResponse({
    status: 200,
    description: 'Call launched successfully',
    type: CallResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - call not in queued status',
  })
  @ApiResponse({
    status: 404,
    description: 'Call not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async launch(
    @Param('id') id: string,
    @Body() launchCallDto: LaunchCallDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CallResponseDto> {
    const call = await this.callsService.launch(id, launchCallDto, req.user.sub);
    const callWithContact = await this.callsService.findOne(call.id, req.user.sub);

    return {
      id: callWithContact.id,
      contactId: callWithContact.contactId,
      contact: {
        id: callWithContact.contact.id,
        name: callWithContact.contact.name,
        phoneNumber: callWithContact.contact.phoneNumber,
        formattedPhoneNumber: callWithContact.contact.formattedPhoneNumber,
      },
      status: callWithContact.status,
      outcome: callWithContact.outcome,
      transcript: callWithContact.transcript,
      summary: callWithContact.summary,
      structuredOutput: callWithContact.structuredOutput,
      agentPrompt: callWithContact.agentPrompt,
      callGoals: callWithContact.callGoals,
      createdAt: callWithContact.createdAt,
      updatedAt: callWithContact.updatedAt,
    };
  }
}