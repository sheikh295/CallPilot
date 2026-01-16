import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Call, CallStatus } from '../../entities/call.entity';
import { Contact } from '../../entities/contact.entity';
import { LoggerService } from '../../services/logger/logger.service';
import { VapiService } from '../../services/vapi/vapi.service';
import {
  CreateCallDto,
  LaunchCallDto,
  VapiEndedReason,
  VapiCallStatus,
} from './dto/call.dto';

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

  /**
   * Map Vapi status and endedReason to our internal CallStatus
   */
  private mapVapiStatusToCallStatus(
    vapiStatus: VapiCallStatus,
    endedReason?: VapiEndedReason,
  ): CallStatus {
    // If call is ended, map based on endedReason
    if (vapiStatus === 'ended' && endedReason) {
      switch (endedReason) {
        case 'customer-did-not-answer':
        case 'customer-did-not-give-microphone-permission':
          return 'no_answer';

        case 'voicemail':
          return 'no_answer'; // Can be tracked separately if needed

        case 'assistant-ended-call':
        case 'customer-ended-call':
          return 'completed';

        // All error/failure reasons
        case 'assistant-error':
        case 'assistant-forwarded-call':
        case 'assistant-not-found':
        case 'assistant-not-invalid':
        case 'assistant-not-provided':
        case 'assistant-request-returned-error':
        case 'assistant-request-returned-unspeakable-error':
        case 'assistant-request-returned-invalid-assistant':
        case 'assistant-request-returned-no-assistant':
        case 'assistant-request-timed-out':
        case 'db-error':
        case 'no-server-available':
        case 'phone-call-provider-closed-websocket':
        case 'pipeline-error-openai-voice-failed':
        case 'pipeline-error-cartesia-voice-failed':
        case 'pipeline-error-deepgram-transcriber-failed':
        case 'pipeline-error-eleven-labs-voice-failed':
        case 'pipeline-error-playht-voice-failed':
        case 'pipeline-error-lmnt-voice-failed':
        case 'pipeline-error-azure-voice-failed':
        case 'pipeline-error-rime-ai-voice-failed':
        case 'pipeline-error-neets-voice-failed':
        case 'pipeline-error-extra-function-failed':
        case 'pipeline-error-first-message-failed':
        case 'pipeline-no-available-model':
        case 'server-shutdown':
        case 'twilio-failed-to-connect-call':
        case 'vonage-disconnected':
        case 'vonage-failed-to-connect-call':
        case 'unknown-error':
          return 'failed';

        default:
          return 'failed';
      }
    }

    // Map based on Vapi status
    switch (vapiStatus) {
      case 'queued':
        return 'queued';
      case 'ringing':
      case 'in-progress':
      case 'forwarding':
        return 'in_progress';
      case 'ended':
        return 'completed'; // Default to completed if no endedReason
      default:
        return 'in_progress';
    }
  }

  /**
   * Handle status-update webhook event
   */
  async handleStatusUpdate(
    vapiCallId: string,
    vapiStatus: VapiCallStatus,
    endedReason?: VapiEndedReason,
  ): Promise<Call> {
    try {
      const call = await this.findByVapiCallId(vapiCallId);

      const newStatus = this.mapVapiStatusToCallStatus(vapiStatus, endedReason);

      // Only update if status actually changed
      if (call.status !== newStatus) {
        call.status = newStatus;
        call.updatedAt = new Date();

        // Store the endedReason as outcome if provided
        if (endedReason && vapiStatus === 'ended') {
          call.outcome = endedReason;
        }

        const updatedCall = await this.callRepository.save(call);

        await this.logger.info('Call status updated from webhook', {
          callId: call.id,
          vapiCallId,
          vapiStatus,
          endedReason,
          newStatus,
        });

        return updatedCall;
      }

      return call;
    } catch (error) {
      await this.logger.error('Failed to handle status update', {
        error: error.message,
        vapiCallId,
        vapiStatus,
        endedReason,
      });
      throw error;
    }
  }

  /**
   * Handle end-of-call-report webhook event
   */
  async handleEndOfCallReport(
    vapiCallId: string,
    endedReason?: VapiEndedReason,
    transcript?: string,
    summary?: string,
    structuredData?: any,
    recordingUrl?: string,
  ): Promise<Call> {
    try {
      const call = await this.findByVapiCallId(vapiCallId);

      // Determine final status
      const finalStatus = this.mapVapiStatusToCallStatus('ended', endedReason);

      call.status = finalStatus;
      call.updatedAt = new Date();

      // Update all available data
      if (endedReason) {
        call.outcome = endedReason;
      }

      if (transcript) {
        call.transcript = transcript;
      }

      if (summary) {
        call.summary = summary;
      }

      if (structuredData) {
        call.structuredOutput = structuredData;
      }

      // Note: You might want to add a recordingUrl field to your Call entity
      // if (recordingUrl) {
      //   call.recordingUrl = recordingUrl;
      // }

      const updatedCall = await this.callRepository.save(call);

      await this.logger.info('End of call report processed', {
        callId: call.id,
        vapiCallId,
        endedReason,
        finalStatus,
        hasTranscript: !!transcript,
        hasSummary: !!summary,
        hasStructuredData: !!structuredData,
      });

      return updatedCall;
    } catch (error) {
      await this.logger.error('Failed to handle end of call report', {
        error: error.message,
        vapiCallId,
        endedReason,
      });
      throw error;
    }
  }

  /**
   * Handle transcript webhook event (final transcript)
   */
  async handleTranscript(
    vapiCallId: string,
    transcript: string,
  ): Promise<Call> {
    try {
      const call = await this.findByVapiCallId(vapiCallId);

      // Only update if we don't already have a transcript
      // (end-of-call-report should be the primary source)
      if (!call.transcript && transcript) {
        call.transcript = transcript;
        call.updatedAt = new Date();

        const updatedCall = await this.callRepository.save(call);

        await this.logger.info('Transcript updated from webhook', {
          callId: call.id,
          vapiCallId,
        });

        return updatedCall;
      }

      return call;
    } catch (error) {
      await this.logger.error('Failed to handle transcript', {
        error: error.message,
        vapiCallId,
      });
      throw error;
    }
  }

}