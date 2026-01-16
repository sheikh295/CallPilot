import { Controller, Post, Body, Logger, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CallsService } from '../calls/calls.service';
import { VapiService } from '../../services/vapi/vapi.service';
import {
  VapiWebhookDto,
  VapiStatusUpdateMessage,
  VapiEndOfCallReportMessage,
  VapiTranscriptMessage,
} from '../calls/dto/call.dto';

@ApiTags('webhooks')
@Controller({ path: 'webhooks', version: '1' })
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly callsService: CallsService,
    private readonly vapiService: VapiService,
  ) {}

  @Post('vapi')
  @ApiOperation({ summary: 'Handle Vapi webhook callbacks' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid webhook data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid API key',
  })
  async handleVapiWebhook(
    @Body() webhookData: VapiWebhookDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Verify API key for security
      const isValidApiKey = this.vapiService.verifyWebhookApiKey(apiKey);

      if (!isValidApiKey) {
        this.logger.warn('Invalid API key for webhook request');
        throw new UnauthorizedException('Invalid API key');
      }

      // Extract the message object
      const message = webhookData.message;

      if (!message) {
        this.logger.warn('Webhook received without message object', { webhookData });
        return { success: false, message: 'No message object in webhook' };
      }

      // Get call ID from message.call or root level
      const vapiCallId = message.call?.id || webhookData.call?.id;

      if (!vapiCallId) {
        this.logger.warn('Webhook received without call ID', { message: message.type });
        return { success: false, message: 'No call ID in webhook' };
      }

      this.logger.log(`Received Vapi webhook: ${message.type} for call ${vapiCallId}`);

      // Route to appropriate handler based on message type
      switch (message.type) {
        case 'status-update':
          await this.handleStatusUpdate(message as VapiStatusUpdateMessage, vapiCallId);
          break;

        case 'end-of-call-report':
          await this.handleEndOfCallReport(message as VapiEndOfCallReportMessage, vapiCallId);
          break;

        case 'transcript':
          await this.handleTranscript(message as VapiTranscriptMessage, vapiCallId);
          break;

        case 'conversation-update':
          // Log but don't process - we get full conversation in end-of-call-report
          this.logger.debug(`Conversation update received for call ${vapiCallId}`);
          break;

        case 'hang':
          // Log hang events for monitoring purposes
          this.logger.log(`Hang event received for call ${vapiCallId}`);
          break;

        case 'speech-update':
          // Log but don't process - not critical for our use case
          this.logger.debug(`Speech update received for call ${vapiCallId}`);
          break;

        default:
          this.logger.warn(`Unknown webhook message type: ${message.type}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to process Vapi webhook: ${error.message}`, error.stack);

      // Re-throw UnauthorizedException to return 401 status
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // For other errors, still return 200 to acknowledge receipt
      // This prevents Vapi from retrying the webhook
      return { success: false, message: error.message };
    }
  }

  /**
   * Handle status-update events
   */
  private async handleStatusUpdate(
    message: VapiStatusUpdateMessage,
    vapiCallId: string,
  ): Promise<void> {
    try {
      await this.callsService.handleStatusUpdate(
        vapiCallId,
        message.status,
        message.endedReason,
      );

      this.logger.log(
        `Status updated for call ${vapiCallId}: ${message.status}${
          message.endedReason ? ` (${message.endedReason})` : ''
        }`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle status update for call ${vapiCallId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle end-of-call-report events
   */
  private async handleEndOfCallReport(
    message: VapiEndOfCallReportMessage,
    vapiCallId: string,
  ): Promise<void> {
    try {
      await this.callsService.handleEndOfCallReport(
        vapiCallId,
        message.endedReason,
        message.artifact?.transcript,
        message.artifact?.summary,
        message.structuredData,
        message.artifact?.recordingUrl,
      );

      this.logger.log(
        `End of call report processed for call ${vapiCallId}${
          message.endedReason ? ` (${message.endedReason})` : ''
        }`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle end of call report for call ${vapiCallId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle transcript events
   */
  private async handleTranscript(
    message: VapiTranscriptMessage,
    vapiCallId: string,
  ): Promise<void> {
    try {
      // Only process final transcripts
      if (message.transcriptType === 'final' && message.transcript) {
        await this.callsService.handleTranscript(vapiCallId, message.transcript);
        this.logger.log(`Final transcript received for call ${vapiCallId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle transcript for call ${vapiCallId}`,
        error.stack,
      );
      // Don't throw - transcript failures shouldn't break the webhook
    }
  }
}