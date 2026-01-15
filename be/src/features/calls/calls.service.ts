import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallStatus } from '../../entities/call.entity';
import { Contact } from '../../entities/contact.entity';
import { LoggerService } from '../../services/logger/logger.service';
import { CreateCallDto, LaunchCallDto } from './dto/call.dto';

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly logger: LoggerService,
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

  async launch(id: string, launchCallDto: LaunchCallDto, userId: string): Promise<Call> {
    try {
      const call = await this.findOne(id, userId);

      if (call.status !== 'queued') {
        throw new BadRequestException('Call can only be launched when in queued status');
      }

      // Update status to in_progress
      call.status = 'in_progress';
      call.updatedAt = new Date();

      // Override prompt if provided
      if (launchCallDto.customPrompt) {
        call.agentPrompt = launchCallDto.customPrompt;
      }

      const updatedCall = await this.callRepository.save(call);

      // TODO: Integrate with Vapi to actually launch the call
      // For now, we'll simulate the call launch
      await this.simulateCallLaunch(updatedCall);

      await this.logger.info('Call launched successfully', {
        callId: id,
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

  // Temporary simulation method - replace with actual Vapi integration
  private async simulateCallLaunch(call: Call): Promise<void> {
    // Simulate call completion after a delay
    setTimeout(async () => {
      try {
        await this.updateCallStatus(
          call.id,
          'completed',
          'Interested - High',
          'Agent: Hello, this is an AI assistant calling about our new product.\nContact: Hi, I\'m interested in learning more.\nAgent: Great! Let me tell you about our features...',
          'Contact showed high interest in the product offering. They requested more information about pricing and implementation timeline.',
          {
            interested: true,
            interestLevel: 'high',
            objections: [],
            callbackRequested: false,
            decisionMaker: true,
            budgetConfirmed: false,
            timeline: 'Q1 2026',
          }
        );
      } catch (error) {
        await this.logger.error('Failed to simulate call completion', {
          error: error.message,
          callId: call.id,
        });
      }
    }, 5000); // 5 second delay
  }
}