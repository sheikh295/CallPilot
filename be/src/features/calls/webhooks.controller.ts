import { Controller, Post, Body, Logger, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CallsService } from '../calls/calls.service';
import { VapiService } from '../../services/vapi/vapi.service';
import { VapiWebhookDto } from '../calls/dto/call.dto';

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
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Received Vapi webhook for call ${webhookData.callId}`);

      // Verify API key for security
      const isValidApiKey = this.vapiService.verifyWebhookApiKey(apiKey);

      if (!isValidApiKey) {
        this.logger.warn(`Invalid API key for webhook call ${webhookData.callId}`);
        throw new UnauthorizedException('Invalid API key');
      }

      // Map Vapi callId to our internal call ID
      const call = await this.callsService.findByVapiCallId(webhookData.callId);

      await this.callsService.updateCallStatus(
        call.id,
        webhookData.status,
        webhookData.outcome,
        webhookData.transcript,
        webhookData.summary,
        webhookData.structuredOutput,
      );

      this.logger.log(`Successfully processed webhook for Vapi call ${webhookData.callId} (internal ID: ${call.id})`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to process Vapi webhook: ${error.message}`, error.stack);

      // Re-throw UnauthorizedException to return 401 status
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // For other errors, still return 200 to acknowledge receipt, but log the error
      return { success: false };
    }
  }
}