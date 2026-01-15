import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Call, CallStatus } from '../../entities/call.entity';
import { Contact } from '../../entities/contact.entity';
import { LoggerService } from '../../services/logger/logger.service';
import { VapiService } from '../../services/vapi/vapi.service';
import { CreateCallDto, LaunchCallDto } from './dto/call.dto';

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly logger: LoggerService,
    private readonly vapiService: VapiService,
    private readonly configService: ConfigService,
  ) {}

  async create(createCallDto: CreateCallDto, userId: string): Promise<Call> {
    try {
      // Verify contact exists
      const contact = await this.contactRepository.findOne({
        where: { id: createCallDto.contactId },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      const call = this.callRepository.create({
        contactId: createCallDto.contactId,
        agentPrompt: createCallDto.agentPrompt,
        callGoals: createCallDto.callGoals,
        status: 'queued' as CallStatus,
      });

      const savedCall = await this.callRepository.save(call);

      await this.logger.info('Call created successfully', {
        callId: savedCall.id,
        contactId: createCallDto.contactId,
        contactName: contact.name,
        userId,
      });

      return savedCall;
    } catch (error) {
      await this.logger.error('Failed to create call', {
        error: error.message,
        userId,
        callData: createCallDto,
      });
      throw error;
    }
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ calls: Call[]; total: number; page: number; limit: number }> {
    try {
      // Cap the limit at 100
      const maxLimit = 100;
      const actualLimit = Math.min(limit, maxLimit);

      const queryBuilder = this.callRepository
        .createQueryBuilder('call')
        .leftJoinAndSelect('call.contact', 'contact');

      // Add search functionality
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        queryBuilder.where(
          '(contact.name ILIKE :search OR contact.phoneNumber ILIKE :search OR call.outcome ILIKE :search)',
          { search: searchTerm }
        );
      }

      const [calls, total] = await queryBuilder
        .orderBy('call.createdAt', 'DESC')
        .skip((page - 1) * actualLimit)
        .take(actualLimit)
        .getManyAndCount();

      await this.logger.info('Calls retrieved successfully', {
        userId,
        totalCalls: total,
        page,
        limit: actualLimit,
        search: search || null,
      });

      return {
        calls,
        total,
        page,
        limit: actualLimit,
      };
    } catch (error) {
      await this.logger.error('Failed to retrieve calls', {
        error: error.message,
        userId,
        page,
        limit,
        search,
      });
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<Call> {
    try {
      const call = await this.callRepository.findOne({
        where: { id },
        relations: ['contact'],
      });

      if (!call) {
        await this.logger.warn('Call not found', {
          callId: id,
          userId,
        });
        throw new NotFoundException('Call not found');
      }

      await this.logger.info('Call retrieved successfully', {
        callId: id,
        contactId: call.contactId,
        userId,
      });

      return call;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.logger.error('Failed to retrieve call', {
          error: error.message,
          callId: id,
          userId,
        });
      }
      throw error;
    }
  }

  async findByVapiCallId(vapiCallId: string): Promise<Call> {
    try {
      const call = await this.callRepository.findOne({
        where: { vapiCallId },
        relations: ['contact'],
      });

      if (!call) {
        await this.logger.warn('Call not found by Vapi call ID', {
          vapiCallId,
        });
        throw new NotFoundException(`Call not found with Vapi call ID: ${vapiCallId}`);
      }

      await this.logger.info('Call retrieved by Vapi call ID', {
        callId: call.id,
        vapiCallId,
      });

      return call;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.logger.error('Failed to retrieve call by Vapi call ID', {
          error: error.message,
          vapiCallId,
        });
      }
      throw error;
    }
  }

  async launch(id: string, launchCallDto: LaunchCallDto, userId: string): Promise<Call> {
    try {
      const call = await this.findOne(id, userId);

      if (call.status !== 'queued') {
        throw new BadRequestException('Call can only be launched when in queued status');
      }

      // Override prompt if provided
      if (launchCallDto.customPrompt) {
        call.agentPrompt = launchCallDto.customPrompt;
      }

      // Get Vapi configuration from environment
      const assistantId = this.configService.get<string>('VAPI_ASSISTANT_ID');
      const phoneNumberId = this.configService.get<string>('VAPI_PHONE_NUMBER_ID');

      if (!assistantId) {
        throw new Error('VAPI_ASSISTANT_ID is not configured');
      }

      // Prepare assistant overrides to inject custom prompt and goals
      const assistantOverrides: any = {};
      if (call.agentPrompt || call.callGoals) {
        assistantOverrides.variableValues = {
          agentPrompt: call.agentPrompt || '',
          callGoals: call.callGoals || '',
        };
      }

      // Launch the call via Vapi
      const vapiResponse = await this.vapiService.createOutboundCall({
        assistantId,
        customerPhoneNumber: call.contact.phoneNumber,
        phoneNumberId: phoneNumberId || undefined,
        assistantOverrides: Object.keys(assistantOverrides).length > 0 ? assistantOverrides : undefined,
      });

      // Update call with Vapi call ID and status
      call.vapiCallId = vapiResponse.id;
      call.status = 'in_progress';
      call.updatedAt = new Date();

      const updatedCall = await this.callRepository.save(call);

      await this.logger.info('Call launched successfully via Vapi', {
        callId: id,
        vapiCallId: vapiResponse.id,
        contactId: call.contactId,
        contactName: call.contact.name,
        userId,
      });

      return updatedCall;
    } catch (error) {
      await this.logger.error('Failed to launch call', {
        error: error.message,
        callId: id,
        userId,
      });
      throw error;
    }
  }

  async updateCallStatus(
    callId: string,
    status: CallStatus,
    outcome?: string,
    transcript?: string,
    summary?: string,
    structuredOutput?: any,
  ): Promise<Call> {
    try {
      const call = await this.callRepository.findOne({
        where: { id: callId },
        relations: ['contact'],
      });

      if (!call) {
        throw new NotFoundException('Call not found');
      }

      call.status = status;
      call.updatedAt = new Date();

      if (outcome !== undefined) call.outcome = outcome;
      if (transcript !== undefined) call.transcript = transcript;
      if (summary !== undefined) call.summary = summary;
      if (structuredOutput !== undefined) call.structuredOutput = structuredOutput;

      const updatedCall = await this.callRepository.save(call);

      await this.logger.info('Call status updated', {
        callId,
        status,
        outcome,
        hasTranscript: !!transcript,
        hasSummary: !!summary,
      });

      return updatedCall;
    } catch (error) {
      await this.logger.error('Failed to update call status', {
        error: error.message,
        callId,
        status,
      });
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const call = await this.findOne(id, userId);

      // Only allow deletion of queued calls
      if (call.status !== 'queued') {
        throw new BadRequestException('Only queued calls can be deleted');
      }

      await this.callRepository.remove(call);

      await this.logger.info('Call deleted successfully', {
        callId: id,
        userId,
        contactId: call.contactId,
      });
    } catch (error) {
      await this.logger.error('Failed to delete call', {
        error: error.message,
        callId: id,
        userId,
      });
      throw error;
    }
  }

}