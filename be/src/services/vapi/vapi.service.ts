import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
   * Verify webhook API key for security
   * @param apiKey - API key from webhook headers (e.g., x-api-key)
   * @returns true if API key is valid, false otherwise
   */
  verifyWebhookApiKey(apiKey: string): boolean {
    try {
      const webhookApiKey = this.configService.get<string>('VAPI_WEBHOOK_API_KEY');

      if (!webhookApiKey) {
        this.logger.warn('VAPI_WEBHOOK_API_KEY not configured. Webhook verification disabled.');
        return true; // Allow webhooks in development if API key not configured
      }

      if (!apiKey) {
        this.logger.warn('No API key provided in webhook request');
        return false;
      }

      // Simple string comparison
      const isValid = apiKey === webhookApiKey;

      if (!isValid) {
        this.logger.warn('Webhook API key verification failed');
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying webhook API key: ${error.message}`, error.stack);
      return false;
    }
  }
}
