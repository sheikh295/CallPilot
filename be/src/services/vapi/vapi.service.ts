import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface VapiCallOptions {
  assistantId: string;
  customerPhoneNumber: string;
  phoneNumberId?: string;
  assistantOverrides?: {
    variableValues?: Record<string, any>;
  };
}

export interface VapiCallResponse {
  id: string;
  status: string;
  assistantId: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class VapiService {
  private readonly logger = new Logger(VapiService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.vapi.ai';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('VAPI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('VAPI_API_KEY not configured. Vapi integration will not work.');
    }
  }

  /**
   * Create an outbound call using Vapi API
   */
  async createOutboundCall(options: VapiCallOptions): Promise<VapiCallResponse> {
    if (!this.apiKey) {
      throw new Error('VAPI_API_KEY is not configured');
    }

    try {
      const payload: any = {
        assistantId: options.assistantId,
        customer: {
          number: options.customerPhoneNumber,
        },
      };

      // Add optional phone number ID if provided
      if (options.phoneNumberId) {
        payload.phoneNumberId = options.phoneNumberId;
      }

      // Add optional assistant overrides if provided
      if (options.assistantOverrides) {
        payload.assistantOverrides = options.assistantOverrides;
      }

      this.logger.log(`Creating outbound call to ${options.customerPhoneNumber}`);

      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Vapi API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const callData = await response.json();
      this.logger.log(`Outbound call created successfully: ${callData.id}`);

      return callData as VapiCallResponse;
    } catch (error) {
      this.logger.error(`Failed to create outbound call: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get call details from Vapi
   */
  async getCall(vapiCallId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('VAPI_API_KEY is not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/call/${vapiCallId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Vapi API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to get call details: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify webhook signature for security using HMAC-SHA256
   * @param payload - Raw webhook payload as string
   * @param signature - Signature from webhook headers (e.g., x-vapi-signature)
   * @returns true if signature is valid, false otherwise
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const webhookSecret = this.configService.get<string>('VAPI_WEBHOOK_SECRET');

      if (!webhookSecret) {
        this.logger.warn('VAPI_WEBHOOK_SECRET not configured. Webhook verification disabled.');
        return true; // Allow webhooks in development if secret not configured
      }

      if (!signature) {
        this.logger.warn('No signature provided in webhook request');
        return false;
      }

      // Generate HMAC signature using SHA256
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        this.logger.warn('Webhook signature verification failed');
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
      return false;
    }
  }
}
