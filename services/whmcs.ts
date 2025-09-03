import axios from 'axios';
import { WHMCSApiResponse } from '@/types';

class WHMCSService {
  private apiUrl: string;
  private apiIdentifier: string;
  private apiSecret: string;
  private apiAccessKey: string;

  constructor() {
    this.apiUrl = process.env.WHMCS_API_URL || '';
    this.apiIdentifier = process.env.WHMCS_API_IDENTIFIER || '';
    this.apiSecret = process.env.WHMCS_API_SECRET || '';
    this.apiAccessKey = process.env.WHMCS_API_ACCESS_KEY || '';
  }

  private async makeRequest(action: string, params: Record<string, any> = {}): Promise<WHMCSApiResponse> {
    try {
      const queryParams = new URLSearchParams({
        action,
        identifier: this.apiIdentifier,
        secret: this.apiSecret,
        accesskey: this.apiAccessKey,
        responsetype: 'json',
        ...params,
      });

      const response = await axios.get(`${this.apiUrl}?${queryParams.toString()}`);

      return response.data;
    } catch (error) {
      console.error('WHMCS API Error:', error);
      return {
        result: 'error',
        message: 'Failed to connect to WHMCS API',
      };
    }
  }


  async getPopularTLDs(): Promise<string[]> {
    // Return popular TLDs for suggestions
    return ['.com', '.net', '.org', '.ng', '.com.ng', '.co.uk', '.info', '.biz'];
  }

  async getDomainSuggestions(baseDomain: string): Promise<string[]> {
    const tlds = await this.getPopularTLDs();
    return tlds.map(tld => `${baseDomain}${tld}`);
  }
}

export const whmcsService = new WHMCSService();

