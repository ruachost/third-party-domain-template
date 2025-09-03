import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

async function makeWhmcsRequest(action: string, params: Record<string, any> = {}): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/whmcs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, params })
    });

    if (!response.ok) {
      throw new Error(`WHMCS API request failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'WHMCS API error');
    }

    return result.data;
  } catch (error) {
    console.error('WHMCS API Error:', error);
    throw error;
  }
}

async function getDomainRenewalPricing(domain: string): Promise<{ price: number; currency: string }> {
  try {
    const response = await makeWhmcsRequest('GetTLDPricing');
    
    // Extract TLD from domain
    const tld = '.' + domain.split('.').slice(1).join('.');
    
    if (response.pricing && response.pricing[tld]) {
      const pricing = response.pricing[tld];
      const renewalPrice = pricing.renew?.['1'] || pricing.renew?.['2'] || '0';
      
      return {
        price: parseFloat(renewalPrice),
        currency: response.currency?.code || 'NGN'
      };
    }

    return { price: 0, currency: 'NGN' };
  } catch (error) {
    console.error('Failed to get renewal pricing:', error);
    return { price: 0, currency: 'NGN' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({
        success: false,
        error: 'Domain name is required'
      } as ApiResponse, { status: 400 });
    }

    const result = await getDomainRenewalPricing(domain);

    return NextResponse.json({
      success: true,
      data: result
    } as ApiResponse);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse, { status: 500 });
  }
}
