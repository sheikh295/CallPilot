import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CallsService } from '../calls/calls.service';
import { VapiWebhookDto } from '../calls/dto/call.dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly callsService: CallsService) {}

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
  async handleVapiWebhook(@Body() webhookData: VapiWebhookDto): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Received Vapi webhook for call ${webhookData.callId}`);

      // TODO: Map Vapi callId to our internal call ID
      // For now, we'll assume the callId in webhook matches our call ID
      const internalCallId = webhookData.callId;

      await this.callsService.updateCallStatus(
        internalCallId,
        webhookData.status,
        webhookData.outcome,
        webhookData.transcript,
        webhookData.summary,
        webhookData.structuredOutput,
      );

      this.logger.log(`Successfully processed webhook for call ${webhookData.callId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to process Vapi webhook: ${error.message}`, error.stack);
      // Still return 200 to acknowledge receipt, but log the error
      return { success: false };
    }
  }
}